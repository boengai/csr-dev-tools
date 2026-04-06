/// RFC 4180 state machine CSV parser.

/// Parse CSV text into a vector of rows, each row being a vector of field strings.
pub fn parse_csv_rows(input: &str) -> Vec<Vec<String>> {
    let mut rows: Vec<Vec<String>> = Vec::new();
    let mut current_row: Vec<String> = Vec::new();
    let mut current_field = String::new();
    let mut in_quotes = false;

    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let ch = chars[i];

        if in_quotes {
            if ch == '"' {
                if i + 1 < len && chars[i + 1] == '"' {
                    current_field.push('"');
                    i += 2;
                    continue;
                }
                in_quotes = false;
                i += 1;
                continue;
            }
            current_field.push(ch);
            i += 1;
            continue;
        }

        if ch == '"' {
            if current_field.is_empty() {
                in_quotes = true;
                i += 1;
                continue;
            }
            current_field.push(ch);
            i += 1;
            continue;
        }

        if ch == ',' {
            current_row.push(std::mem::take(&mut current_field));
            i += 1;
            continue;
        }

        if ch == '\r' && i + 1 < len && chars[i + 1] == '\n' {
            current_row.push(std::mem::take(&mut current_field));
            rows.push(std::mem::take(&mut current_row));
            i += 2;
            continue;
        }

        if ch == '\n' {
            current_row.push(std::mem::take(&mut current_field));
            rows.push(std::mem::take(&mut current_row));
            i += 1;
            continue;
        }

        current_field.push(ch);
        i += 1;
    }

    current_row.push(current_field);
    if current_row.len() > 1 || !current_row[0].is_empty() {
        rows.push(current_row);
    }

    rows
}

/// Validate CSV syntax. Returns None if valid, or an error message string.
pub fn validate_csv(input: &str) -> Option<String> {
    if input.trim().is_empty() {
        return Some("Empty input".to_string());
    }

    let mut in_quotes = false;
    let mut field_start = true;

    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let ch = chars[i];
        if in_quotes {
            if ch == '"' {
                if i + 1 < len && chars[i + 1] == '"' {
                    i += 2;
                    continue;
                }
                in_quotes = false;
                field_start = false;
            }
        } else if ch == '"' && field_start {
            in_quotes = true;
            field_start = false;
        } else if ch == ',' {
            field_start = true;
        } else if ch == '\r' && i + 1 < len && chars[i + 1] == '\n' {
            field_start = true;
            i += 2;
            continue;
        } else if ch == '\n' {
            field_start = true;
        } else {
            field_start = false;
        }
        i += 1;
    }

    if in_quotes {
        return Some("Unterminated quoted field".to_string());
    }

    None
}
