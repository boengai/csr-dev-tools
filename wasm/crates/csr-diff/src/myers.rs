use crate::types::DiffChange;
use std::fmt::Write;

/// Split text into lines, keeping '\n' attached to each line.
/// If text doesn't end with '\n', the last segment has no trailing newline.
pub fn split_lines(text: &str) -> Vec<&str> {
    if text.is_empty() {
        return Vec::new();
    }
    let mut lines = Vec::new();
    let mut start = 0;
    for (i, c) in text.char_indices() {
        if c == '\n' {
            lines.push(&text[start..=i]);
            start = i + 1;
        }
    }
    if start < text.len() {
        lines.push(&text[start..]);
    }
    lines
}

/// Split text into word-level tokens. Whitespace and non-whitespace runs
/// are kept as separate tokens so the original text can be reconstructed.
pub fn split_words(text: &str) -> Vec<&str> {
    if text.is_empty() {
        return Vec::new();
    }
    let mut tokens = Vec::new();
    let mut start = 0;
    let mut in_whitespace = text.starts_with(char::is_whitespace);

    for (i, c) in text.char_indices() {
        let is_ws = c.is_whitespace();
        if is_ws != in_whitespace {
            if start < i {
                tokens.push(&text[start..i]);
            }
            start = i;
            in_whitespace = is_ws;
        }
    }
    if start < text.len() {
        tokens.push(&text[start..]);
    }
    tokens
}

/// Core Myers diff algorithm operating on slices of tokens.
/// Returns a list of (equal, old_index) or (insert/delete) operations.
/// The result is a Vec of operations: 'E' (equal), 'D' (delete from old), 'I' (insert from new).
fn myers_diff_ops<T: PartialEq>(old: &[T], new: &[T]) -> Vec<(char, usize)> {
    let n = old.len();
    let m = new.len();

    if n == 0 && m == 0 {
        return Vec::new();
    }

    if n == 0 {
        return (0..m).map(|i| ('I', i)).collect();
    }

    if m == 0 {
        return (0..n).map(|i| ('D', i)).collect();
    }

    let max = n + m;
    let size = 2 * max + 1;
    // v[k + offset] stores the furthest reaching x for diagonal k
    let offset = max;
    let mut v = vec![0usize; size];
    // Store the trace for backtracking
    let mut trace: Vec<Vec<usize>> = Vec::new();

    'outer: for d in 0..=(max as isize) {
        trace.push(v.clone());
        let mut new_v = v.clone();
        let d_val = d;
        let mut k = -d_val;
        while k <= d_val {
            let idx = (k + offset as isize) as usize;
            let mut x = if k == -d_val
                || (k != d_val && v[(k - 1 + offset as isize) as usize] < v[(k + 1 + offset as isize) as usize])
            {
                v[(k + 1 + offset as isize) as usize]
            } else {
                v[(k - 1 + offset as isize) as usize] + 1
            };
            let mut y = (x as isize - k) as usize;

            // Follow diagonal (matching elements)
            while x < n && y < m && old[x] == new[y] {
                x += 1;
                y += 1;
            }

            new_v[idx] = x;

            if x >= n && y >= m {
                v = new_v;
                break 'outer;
            }
            k += 2;
        }
        #[allow(unused_assignments)]
        {
            v = new_v;
        }
    }

    // Backtrack to find the actual edit script
    let mut ops = Vec::new();
    let mut x = n;
    let mut y = m;

    for d in (0..trace.len()).rev() {
        let v_prev = &trace[d];
        let k = x as isize - y as isize;

        if d == 0 {
            // d=0: all remaining moves are diagonal (equal)
            while x > 0 && y > 0 {
                x -= 1;
                y -= 1;
                ops.push(('E', x));
            }
            break;
        }

        let d_val = d as isize;

        let prev_k = if k == -d_val
            || (k != d_val && v_prev[(k - 1 + offset as isize) as usize] < v_prev[(k + 1 + offset as isize) as usize])
        {
            k + 1
        } else {
            k - 1
        };

        let prev_x = v_prev[(prev_k + offset as isize) as usize];
        let prev_y = (prev_x as isize - prev_k) as usize;

        // Diagonal moves (equals)
        while x > prev_x && y > prev_y {
            x -= 1;
            y -= 1;
            ops.push(('E', x));
        }

        if x > prev_x {
            // Delete
            x -= 1;
            ops.push(('D', x));
        } else if y > prev_y {
            // Insert
            y -= 1;
            ops.push(('I', y));
        }
    }

    ops.reverse();
    ops
}

/// Compute line-level diff between two texts.
/// Returns a Vec of DiffChange, where each entry is a contiguous run of
/// added, removed, or unchanged lines.
pub fn diff(old_text: &str, new_text: &str) -> Vec<DiffChange> {
    let old_lines = split_lines(old_text);
    let new_lines = split_lines(new_text);

    let ops = myers_diff_ops(&old_lines, &new_lines);

    if ops.is_empty() {
        return Vec::new();
    }

    // Merge consecutive same-type operations into DiffChange entries
    let mut changes: Vec<DiffChange> = Vec::new();

    for &(op, idx) in &ops {
        match op {
            'E' => {
                let value = old_lines[idx];
                if let Some(last) = changes.last_mut() {
                    if !last.added && !last.removed {
                        last.value.push_str(value);
                        continue;
                    }
                }
                changes.push(DiffChange {
                    added: false,
                    removed: false,
                    value: value.to_string(),
                });
            }
            'D' => {
                let value = old_lines[idx];
                if let Some(last) = changes.last_mut() {
                    if last.removed {
                        last.value.push_str(value);
                        continue;
                    }
                }
                changes.push(DiffChange {
                    added: false,
                    removed: true,
                    value: value.to_string(),
                });
            }
            'I' => {
                let value = new_lines[idx];
                if let Some(last) = changes.last_mut() {
                    if last.added {
                        last.value.push_str(value);
                        continue;
                    }
                }
                changes.push(DiffChange {
                    added: true,
                    removed: false,
                    value: value.to_string(),
                });
            }
            _ => unreachable!(),
        }
    }

    changes
}

/// Compute word-level diff between two strings.
/// Returns a Vec of DiffChange at word granularity.
pub fn diff_words_fn(old_text: &str, new_text: &str) -> Vec<DiffChange> {
    let old_tokens = split_words(old_text);
    let new_tokens = split_words(new_text);

    let ops = myers_diff_ops(&old_tokens, &new_tokens);

    if ops.is_empty() {
        return Vec::new();
    }

    let mut changes: Vec<DiffChange> = Vec::new();

    for &(op, idx) in &ops {
        match op {
            'E' => {
                let value = old_tokens[idx];
                if let Some(last) = changes.last_mut() {
                    if !last.added && !last.removed {
                        last.value.push_str(value);
                        continue;
                    }
                }
                changes.push(DiffChange {
                    added: false,
                    removed: false,
                    value: value.to_string(),
                });
            }
            'D' => {
                let value = old_tokens[idx];
                if let Some(last) = changes.last_mut() {
                    if last.removed {
                        last.value.push_str(value);
                        continue;
                    }
                }
                changes.push(DiffChange {
                    added: false,
                    removed: true,
                    value: value.to_string(),
                });
            }
            'I' => {
                let value = new_tokens[idx];
                if let Some(last) = changes.last_mut() {
                    if last.added {
                        last.value.push_str(value);
                        continue;
                    }
                }
                changes.push(DiffChange {
                    added: true,
                    removed: false,
                    value: value.to_string(),
                });
            }
            _ => unreachable!(),
        }
    }

    changes
}

/// Create a unified diff string with context lines.
pub fn create_unified_diff(old_text: &str, new_text: &str, context: u32) -> String {
    let old_lines = split_lines(old_text);
    let new_lines = split_lines(new_text);

    let ops = myers_diff_ops(&old_lines, &new_lines);

    if ops.is_empty() {
        return String::new();
    }

    // Check if there are any actual changes
    let has_changes = ops.iter().any(|&(op, _)| op != 'E');
    if !has_changes {
        // Identical texts - produce header but no hunks
        return "--- text\n+++ text\n".to_string();
    }

    // Build per-line operations with indices
    struct LineOp<'a> {
        op: char,
        old_idx: Option<usize>, // 0-based line number in old
        new_idx: Option<usize>, // 0-based line number in new
        text: &'a str,
    }

    let mut line_ops: Vec<LineOp> = Vec::new();
    let mut old_i = 0usize;
    let mut new_i = 0usize;

    for &(op, _idx) in &ops {
        match op {
            'E' => {
                line_ops.push(LineOp {
                    op: 'E',
                    old_idx: Some(old_i),
                    new_idx: Some(new_i),
                    text: old_lines[old_i],
                });
                old_i += 1;
                new_i += 1;
            }
            'D' => {
                line_ops.push(LineOp {
                    op: 'D',
                    old_idx: Some(old_i),
                    new_idx: None,
                    text: old_lines[old_i],
                });
                old_i += 1;
            }
            'I' => {
                line_ops.push(LineOp {
                    op: 'I',
                    old_idx: None,
                    new_idx: Some(new_i),
                    text: new_lines[new_i],
                });
                new_i += 1;
            }
            _ => unreachable!(),
        }
    }

    // Group into hunks with context
    let ctx = context as usize;
    let mut hunks: Vec<(usize, usize)> = Vec::new(); // (start, end) indices into line_ops

    // Find change regions
    let mut i = 0;
    while i < line_ops.len() {
        if line_ops[i].op != 'E' {
            let change_start = i;
            while i < line_ops.len() && line_ops[i].op != 'E' {
                i += 1;
            }
            let change_end = i;

            let hunk_start = change_start.saturating_sub(ctx);
            let hunk_end = (change_end + ctx).min(line_ops.len());

            if let Some(last) = hunks.last_mut() {
                if hunk_start <= last.1 {
                    last.1 = hunk_end;
                } else {
                    hunks.push((hunk_start, hunk_end));
                }
            } else {
                hunks.push((hunk_start, hunk_end));
            }
        }
        i += 1;
    }

    let mut output = String::new();
    output.push_str("--- text\n+++ text\n");

    for (start, end) in &hunks {
        // Calculate line numbers for the hunk header
        let mut old_start = 0usize;
        let mut old_count = 0usize;
        let mut new_start = 0usize;
        let mut new_count = 0usize;
        let mut found_old_start = false;
        let mut found_new_start = false;

        for op in &line_ops[*start..*end] {
            match op.op {
                'E' => {
                    if !found_old_start {
                        if let Some(idx) = op.old_idx {
                            old_start = idx + 1;
                            found_old_start = true;
                        }
                    }
                    if !found_new_start {
                        if let Some(idx) = op.new_idx {
                            new_start = idx + 1;
                            found_new_start = true;
                        }
                    }
                    old_count += 1;
                    new_count += 1;
                }
                'D' => {
                    if !found_old_start {
                        if let Some(idx) = op.old_idx {
                            old_start = idx + 1;
                            found_old_start = true;
                        }
                    }
                    if !found_new_start {
                        // For a delete at the start, new_start should be set to the current new position
                        new_start = if let Some(prev_idx) = line_ops[..*start]
                            .iter()
                            .rev()
                            .find_map(|o| o.new_idx)
                        {
                            prev_idx + 2
                        } else {
                            1
                        };
                        found_new_start = true;
                    }
                    old_count += 1;
                }
                'I' => {
                    if !found_new_start {
                        if let Some(idx) = op.new_idx {
                            new_start = idx + 1;
                            found_new_start = true;
                        }
                    }
                    if !found_old_start {
                        old_start = if let Some(prev_idx) = line_ops[..*start]
                            .iter()
                            .rev()
                            .find_map(|o| o.old_idx)
                        {
                            prev_idx + 2
                        } else {
                            1
                        };
                        found_old_start = true;
                    }
                    new_count += 1;
                }
                _ => {}
            }
        }

        if !found_old_start {
            old_start = 1;
        }
        if !found_new_start {
            new_start = 1;
        }

        let _ = write!(
            output,
            "@@ -{},{} +{},{} @@\n",
            old_start, old_count, new_start, new_count
        );

        for op in &line_ops[*start..*end] {
            let text = op.text;
            let has_newline = text.ends_with('\n');
            let line_content = if has_newline {
                &text[..text.len() - 1]
            } else {
                text
            };

            match op.op {
                'E' => {
                    let _ = write!(output, " {}\n", line_content);
                }
                'D' => {
                    let _ = write!(output, "-{}\n", line_content);
                }
                'I' => {
                    let _ = write!(output, "+{}\n", line_content);
                }
                _ => {}
            }
            if !has_newline {
                output.push_str("\\ No newline at end of file\n");
            }
        }
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_lines_basic() {
        let lines = split_lines("hello\nworld\n");
        assert_eq!(lines, vec!["hello\n", "world\n"]);
    }

    #[test]
    fn test_split_lines_no_trailing_newline() {
        let lines = split_lines("hello\nworld");
        assert_eq!(lines, vec!["hello\n", "world"]);
    }

    #[test]
    fn test_split_lines_empty() {
        let lines = split_lines("");
        assert!(lines.is_empty());
    }

    #[test]
    fn test_split_lines_single() {
        let lines = split_lines("hello\n");
        assert_eq!(lines, vec!["hello\n"]);
    }

    #[test]
    fn test_split_words_basic() {
        let words = split_words("hello world");
        assert_eq!(words, vec!["hello", " ", "world"]);
    }

    #[test]
    fn test_split_words_empty() {
        let words = split_words("");
        assert!(words.is_empty());
    }

    #[test]
    fn test_split_words_multiple_spaces() {
        let words = split_words("hello  world");
        assert_eq!(words, vec!["hello", "  ", "world"]);
    }

    #[test]
    fn test_diff_identical() {
        let result = diff("hello\nworld\n", "hello\nworld\n");
        assert_eq!(result.len(), 1);
        assert!(!result[0].added);
        assert!(!result[0].removed);
        assert_eq!(result[0].value, "hello\nworld\n");
    }

    #[test]
    fn test_diff_completely_different() {
        let result = diff("alpha\nbeta\n", "gamma\ndelta\n");
        assert!(result.iter().any(|c| c.removed));
        assert!(result.iter().any(|c| c.added));
    }

    #[test]
    fn test_diff_added_lines() {
        let result = diff("line1\n", "line1\nline2\n");
        let added: Vec<_> = result.iter().filter(|c| c.added).collect();
        assert!(!added.is_empty());
        assert!(added[0].value.contains("line2"));
    }

    #[test]
    fn test_diff_removed_lines() {
        let result = diff("line1\nline2\n", "line1\n");
        let removed: Vec<_> = result.iter().filter(|c| c.removed).collect();
        assert!(!removed.is_empty());
        assert!(removed[0].value.contains("line2"));
    }

    #[test]
    fn test_diff_mixed() {
        let result = diff("a\nb\nc\n", "a\nx\nc\n");
        assert!(result.iter().any(|c| c.added));
        assert!(result.iter().any(|c| c.removed));
        assert!(result.iter().any(|c| !c.added && !c.removed));
    }

    #[test]
    fn test_diff_empty_original() {
        let result = diff("", "new line\n");
        assert!(result.iter().any(|c| c.added));
        assert!(result.iter().all(|c| !c.removed));
    }

    #[test]
    fn test_diff_empty_modified() {
        let result = diff("old line\n", "");
        assert!(result.iter().any(|c| c.removed));
        assert!(result.iter().all(|c| !c.added));
    }

    #[test]
    fn test_diff_both_empty() {
        let result = diff("", "");
        assert!(result.is_empty());
    }

    #[test]
    fn test_diff_unicode() {
        let result = diff("hello 🌍\n", "hello 🌍\nnew 日本語\n");
        let added: Vec<_> = result.iter().filter(|c| c.added).collect();
        assert!(!added.is_empty());
        assert!(added[0].value.contains("日本語"));
    }

    #[test]
    fn test_diff_large() {
        let lines: Vec<String> = (0..1000).map(|i| format!("line {}", i)).collect();
        let original = lines.join("\n") + "\n";
        let modified_lines: Vec<String> = lines
            .iter()
            .enumerate()
            .map(|(i, l)| {
                if i == 500 {
                    "changed".to_string()
                } else {
                    l.clone()
                }
            })
            .collect();
        let modified = modified_lines.join("\n") + "\n";
        let result = diff(&original, &modified);
        assert!(!result.is_empty());
    }

    #[test]
    fn test_diff_trailing_newline_difference() {
        let result = diff("hello\n", "hello");
        assert!(result.len() > 0);
    }

    #[test]
    fn test_diff_words_basic() {
        let result = diff_words_fn("hello world", "hello earth");
        assert!(result.iter().any(|c| c.removed));
        assert!(result.iter().any(|c| c.added));
        assert!(result.iter().any(|c| !c.added && !c.removed));
    }

    #[test]
    fn test_diff_words_identical() {
        let result = diff_words_fn("hello world", "hello world");
        assert_eq!(result.len(), 1);
        assert!(!result[0].added);
        assert!(!result[0].removed);
    }

    #[test]
    fn test_diff_words_empty() {
        let result = diff_words_fn("", "");
        assert!(result.is_empty());
    }

    #[test]
    fn test_unified_diff_basic() {
        let result = create_unified_diff("hello\n", "world\n", 3);
        assert!(result.contains("---"));
        assert!(result.contains("+++"));
        assert!(result.contains("@@"));
        assert!(result.contains("-hello"));
        assert!(result.contains("+world"));
    }

    #[test]
    fn test_unified_diff_identical() {
        let result = create_unified_diff("same\n", "same\n", 3);
        assert!(!result.contains("@@"));
    }

    #[test]
    fn test_unified_diff_added() {
        let result = create_unified_diff("a\n", "a\nb\n", 3);
        assert!(result.contains("+b"));
    }

    #[test]
    fn test_unified_diff_removed() {
        let result = create_unified_diff("a\nb\n", "a\n", 3);
        assert!(result.contains("-b"));
    }

    #[test]
    fn test_unified_diff_both_empty() {
        let result = create_unified_diff("", "", 3);
        assert!(!result.contains("@@"));
    }
}
