/// Block-level AST nodes for markdown.
#[derive(Debug, Clone, PartialEq)]
pub enum Block {
    Heading { level: u8, content: String },
    Paragraph { content: String },
    CodeBlock { language: String, content: String },
    Blockquote { children: Vec<Block> },
    UnorderedList { items: Vec<ListItem> },
    OrderedList { start: u32, items: Vec<ListItem> },
    ThematicBreak,
    HtmlBlock { content: String },
    Table { headers: Vec<String>, rows: Vec<Vec<String>> },
}

#[derive(Debug, Clone, PartialEq)]
pub struct ListItem {
    pub checked: Option<bool>,
    pub content: String,
    pub children: Vec<Block>,
}

/// Parse markdown text into a sequence of block-level AST nodes.
pub fn parse_blocks(input: &str) -> Vec<Block> {
    let mut blocks: Vec<Block> = Vec::new();
    let lines: Vec<&str> = input.lines().collect();
    let len = lines.len();
    let mut i = 0;

    while i < len {
        let line = lines[i];

        // Blank lines — skip
        if line.trim().is_empty() {
            i += 1;
            continue;
        }

        // Fenced code block (``` or ~~~)
        if let Some(fence) = detect_fence(line) {
            let (block, next) = parse_fenced_code(&lines, i, &fence);
            blocks.push(block);
            i = next;
            continue;
        }

        // Thematic break (must check before list items since `---` could look like a list)
        if is_thematic_break(line) {
            blocks.push(Block::ThematicBreak);
            i += 1;
            continue;
        }

        // ATX heading
        if let Some(block) = parse_atx_heading(line) {
            blocks.push(block);
            i += 1;
            continue;
        }

        // Blockquote
        if line.trim_start().starts_with("> ") || line.trim_start() == ">" {
            let (block, next) = parse_blockquote(&lines, i);
            blocks.push(block);
            i = next;
            continue;
        }

        // HTML block
        if is_html_block_start(line) {
            let (block, next) = parse_html_block(&lines, i);
            blocks.push(block);
            i = next;
            continue;
        }

        // Table (check if current line + next line form a table)
        if i + 1 < len && is_table_separator(lines[i + 1]) {
            let (block, next) = parse_table(&lines, i);
            blocks.push(block);
            i = next;
            continue;
        }

        // Ordered list
        if is_ordered_list_marker(line) {
            let (block, next) = parse_ordered_list(&lines, i);
            blocks.push(block);
            i = next;
            continue;
        }

        // Unordered list
        if is_unordered_list_marker(line) {
            let (block, next) = parse_unordered_list(&lines, i);
            blocks.push(block);
            i = next;
            continue;
        }

        // Indented code block (4 spaces or 1 tab)
        if line.starts_with("    ") || line.starts_with('\t') {
            let (block, next) = parse_indented_code(&lines, i);
            blocks.push(block);
            i = next;
            continue;
        }

        // Paragraph (default)
        let (block, next) = parse_paragraph(&lines, i);
        blocks.push(block);
        i = next;
    }

    blocks
}

fn detect_fence(line: &str) -> Option<FenceInfo> {
    let trimmed = line.trim_start();
    let indent = line.len() - trimmed.len();
    if indent > 3 {
        return None;
    }
    let fence_char = trimmed.chars().next()?;
    if fence_char != '`' && fence_char != '~' {
        return None;
    }
    let fence_len = trimmed.chars().take_while(|&c| c == fence_char).count();
    if fence_len < 3 {
        return None;
    }
    let info = trimmed[fence_len..].trim().to_string();
    Some(FenceInfo {
        character: fence_char,
        count: fence_len,
        language: info,
    })
}

struct FenceInfo {
    character: char,
    count: usize,
    language: String,
}

fn parse_fenced_code(lines: &[&str], start: usize, opening: &FenceInfo) -> (Block, usize) {
    let mut content_lines: Vec<&str> = Vec::new();
    let mut i = start + 1;
    while i < lines.len() {
        let line = lines[i];
        let trimmed = line.trim_start();
        // Closing fence: same char, at least as many, no info string
        if trimmed.starts_with(&String::from(opening.character).repeat(opening.count))
            && trimmed.trim_end().chars().all(|c| c == opening.character)
        {
            i += 1;
            break;
        }
        content_lines.push(line);
        i += 1;
    }
    let content = content_lines.join("\n");
    (
        Block::CodeBlock {
            language: opening.language.clone(),
            content,
        },
        i,
    )
}

fn is_thematic_break(line: &str) -> bool {
    let trimmed = line.trim();
    if trimmed.len() < 3 {
        return false;
    }
    let first = trimmed.chars().next().unwrap();
    if first != '-' && first != '*' && first != '_' {
        return false;
    }
    trimmed.chars().all(|c| c == first || c == ' ')
        && trimmed.chars().filter(|&c| c == first).count() >= 3
}

fn parse_atx_heading(line: &str) -> Option<Block> {
    let trimmed = line.trim_start();
    if !trimmed.starts_with('#') {
        return None;
    }
    let level = trimmed.chars().take_while(|&c| c == '#').count();
    if level > 6 {
        return None;
    }
    let rest = &trimmed[level..];
    // Must be followed by a space or be empty
    if !rest.is_empty() && !rest.starts_with(' ') {
        return None;
    }
    let content = rest.trim().trim_end_matches('#').trim().to_string();
    Some(Block::Heading {
        level: level as u8,
        content,
    })
}

fn parse_blockquote(lines: &[&str], start: usize) -> (Block, usize) {
    let mut quote_lines: Vec<String> = Vec::new();
    let mut i = start;
    while i < lines.len() {
        let line = lines[i];
        let trimmed = line.trim_start();
        if trimmed.starts_with("> ") {
            quote_lines.push(trimmed[2..].to_string());
            i += 1;
        } else if trimmed == ">" {
            quote_lines.push(String::new());
            i += 1;
        } else if !trimmed.is_empty() && !quote_lines.is_empty() {
            // Lazy continuation
            quote_lines.push(trimmed.to_string());
            i += 1;
        } else {
            break;
        }
    }
    let inner = quote_lines.join("\n");
    let children = parse_blocks(&inner);
    (Block::Blockquote { children }, i)
}

fn is_html_block_start(line: &str) -> bool {
    let trimmed = line.trim_start().to_lowercase();
    let tags = [
        "<script", "<pre", "<style", "<div", "<table", "<form", "<iframe", "<object", "<svg",
        "<embed", "<base", "<meta", "<img ", "<img>", "<img/",
        "<!--",
    ];
    tags.iter().any(|tag| trimmed.starts_with(tag))
}

fn parse_html_block(lines: &[&str], start: usize) -> (Block, usize) {
    let mut html_lines: Vec<&str> = Vec::new();
    let mut i = start;
    while i < lines.len() {
        html_lines.push(lines[i]);
        i += 1;
        if i < lines.len() && lines[i].trim().is_empty() {
            break;
        }
    }
    let content = html_lines.join("\n");
    (Block::HtmlBlock { content }, i)
}

fn is_table_separator(line: &str) -> bool {
    let trimmed = line.trim();
    if !trimmed.contains('|') {
        return false;
    }
    let cells: Vec<&str> = trimmed
        .trim_matches('|')
        .split('|')
        .collect();
    cells.iter().all(|cell| {
        let c = cell.trim();
        !c.is_empty()
            && c.chars()
                .all(|ch| ch == '-' || ch == ':' || ch == ' ')
            && c.contains('-')
    })
}

fn parse_table(lines: &[&str], start: usize) -> (Block, usize) {
    // Header row
    let header_line = lines[start].trim().trim_matches('|');
    let headers: Vec<String> = header_line.split('|').map(|s| s.trim().to_string()).collect();

    // Skip separator (start + 1)
    let mut rows: Vec<Vec<String>> = Vec::new();
    let mut i = start + 2;
    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() || !line.contains('|') {
            break;
        }
        let row_line = line.trim_matches('|');
        let row: Vec<String> = row_line.split('|').map(|s| s.trim().to_string()).collect();
        rows.push(row);
        i += 1;
    }

    (Block::Table { headers, rows }, i)
}

fn is_unordered_list_marker(line: &str) -> bool {
    let trimmed = line.trim_start();
    trimmed.starts_with("- ")
        || trimmed.starts_with("* ")
        || trimmed.starts_with("+ ")
}

fn is_ordered_list_marker(line: &str) -> bool {
    let trimmed = line.trim_start();
    let dot_pos = trimmed.find(". ");
    match dot_pos {
        Some(pos) => trimmed[..pos].chars().all(|c| c.is_ascii_digit()) && pos > 0,
        None => false,
    }
}

fn strip_unordered_marker(line: &str) -> &str {
    let trimmed = line.trim_start();
    // "- ", "* ", "+ "
    &trimmed[2..]
}

fn strip_ordered_marker(line: &str) -> &str {
    let trimmed = line.trim_start();
    let dot_pos = trimmed.find(". ").unwrap();
    &trimmed[dot_pos + 2..]
}

fn parse_list_item_content(text: &str) -> ListItem {
    let checked = if text.starts_with("[x] ") || text.starts_with("[X] ") {
        Some(true)
    } else if text.starts_with("[ ] ") {
        Some(false)
    } else {
        None
    };
    let content = if checked.is_some() {
        text[4..].to_string()
    } else {
        text.to_string()
    };
    ListItem {
        checked,
        content,
        children: Vec::new(),
    }
}

fn parse_unordered_list(lines: &[&str], start: usize) -> (Block, usize) {
    let mut items: Vec<ListItem> = Vec::new();
    let mut i = start;
    while i < lines.len() {
        let line = lines[i];
        if is_unordered_list_marker(line) {
            let text = strip_unordered_marker(line);
            items.push(parse_list_item_content(text));
            i += 1;
        } else if line.trim().is_empty() {
            break;
        } else {
            break;
        }
    }
    (Block::UnorderedList { items }, i)
}

fn parse_ordered_list(lines: &[&str], start: usize) -> (Block, usize) {
    // Extract start number from first item
    let first_trimmed = lines[start].trim_start();
    let dot_pos = first_trimmed.find(". ").unwrap();
    let start_num: u32 = first_trimmed[..dot_pos].parse().unwrap_or(1);

    let mut items: Vec<ListItem> = Vec::new();
    let mut i = start;
    while i < lines.len() {
        let line = lines[i];
        if is_ordered_list_marker(line) {
            let text = strip_ordered_marker(line);
            items.push(parse_list_item_content(text));
            i += 1;
        } else if line.trim().is_empty() {
            break;
        } else {
            break;
        }
    }
    (Block::OrderedList { start: start_num, items }, i)
}

fn parse_indented_code(lines: &[&str], start: usize) -> (Block, usize) {
    let mut code_lines: Vec<&str> = Vec::new();
    let mut i = start;
    while i < lines.len() {
        let line = lines[i];
        if line.starts_with("    ") {
            code_lines.push(&line[4..]);
            i += 1;
        } else if line.starts_with('\t') {
            code_lines.push(&line[1..]);
            i += 1;
        } else if line.trim().is_empty() {
            // Blank lines within indented code
            code_lines.push("");
            i += 1;
        } else {
            break;
        }
    }
    // Trim trailing empty lines
    while code_lines.last().is_some_and(|l| l.is_empty()) {
        code_lines.pop();
    }
    let content = code_lines.join("\n");
    (
        Block::CodeBlock {
            language: String::new(),
            content,
        },
        i,
    )
}

fn parse_paragraph(lines: &[&str], start: usize) -> (Block, usize) {
    let mut para_lines: Vec<&str> = Vec::new();
    let mut i = start;
    while i < lines.len() {
        let line = lines[i];
        if line.trim().is_empty() {
            break;
        }
        // Stop if we hit another block-level element
        if i > start
            && (parse_atx_heading(line).is_some()
                || is_thematic_break(line)
                || detect_fence(line).is_some()
                || is_unordered_list_marker(line)
                || is_ordered_list_marker(line)
                || is_html_block_start(line)
                || line.trim_start().starts_with("> "))
        {
            break;
        }
        para_lines.push(line);
        i += 1;
    }
    let content = para_lines.join("\n");
    (Block::Paragraph { content }, i)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_heading() {
        let blocks = parse_blocks("# Hello");
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Heading { level, content } => {
                assert_eq!(*level, 1);
                assert_eq!(content, "Hello");
            }
            other => panic!("Expected Heading, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_paragraph() {
        let blocks = parse_blocks("This is a paragraph.");
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Paragraph { content } => {
                assert_eq!(content, "This is a paragraph.");
            }
            other => panic!("Expected Paragraph, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_fenced_code_block_with_language() {
        let input = "```rust\nfn main() {}\n```";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::CodeBlock { language, content } => {
                assert_eq!(language, "rust");
                assert_eq!(content, "fn main() {}");
            }
            other => panic!("Expected CodeBlock, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_blockquote() {
        let input = "> This is a quote";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Blockquote { children } => {
                assert!(!children.is_empty());
                match &children[0] {
                    Block::Paragraph { content } => {
                        assert_eq!(content, "This is a quote");
                    }
                    other => panic!("Expected Paragraph inside Blockquote, got {:?}", other),
                }
            }
            other => panic!("Expected Blockquote, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_unordered_list() {
        let input = "- Item 1\n- Item 2\n- Item 3";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::UnorderedList { items } => {
                assert_eq!(items.len(), 3);
                assert_eq!(items[0].content, "Item 1");
                assert_eq!(items[1].content, "Item 2");
                assert_eq!(items[2].content, "Item 3");
            }
            other => panic!("Expected UnorderedList, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_ordered_list() {
        let input = "1. First\n2. Second\n3. Third";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::OrderedList { start, items } => {
                assert_eq!(*start, 1);
                assert_eq!(items.len(), 3);
                assert_eq!(items[0].content, "First");
            }
            other => panic!("Expected OrderedList, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_thematic_break() {
        let blocks = parse_blocks("---");
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0], Block::ThematicBreak);
    }

    #[test]
    fn test_parse_table() {
        let input = "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Table { headers, rows } => {
                assert_eq!(headers, &["Name", "Age"]);
                assert_eq!(rows.len(), 2);
                assert_eq!(rows[0], vec!["Alice", "30"]);
                assert_eq!(rows[1], vec!["Bob", "25"]);
            }
            other => panic!("Expected Table, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_task_list() {
        let input = "- [ ] Unchecked\n- [x] Checked";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::UnorderedList { items } => {
                assert_eq!(items.len(), 2);
                assert_eq!(items[0].checked, Some(false));
                assert_eq!(items[0].content, "Unchecked");
                assert_eq!(items[1].checked, Some(true));
                assert_eq!(items[1].content, "Checked");
            }
            other => panic!("Expected UnorderedList, got {:?}", other),
        }
    }
}
