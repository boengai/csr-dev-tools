/// SQL keywords shared across all dialects
const MAJOR_CLAUSES: &[&str] = &[
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "INSERT INTO",
    "UPDATE",
    "SET",
    "DELETE FROM",
    "VALUES",
    "UNION ALL",
    "UNION",
    "EXCEPT",
    "INTERSECT",
    "INNER JOIN",
    "LEFT OUTER JOIN",
    "RIGHT OUTER JOIN",
    "FULL OUTER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "CROSS JOIN",
    "NATURAL JOIN",
    "JOIN",
    "ON",
    "AND",
    "OR",
    "RETURNING",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "WITH",
];

const SQL_KEYWORDS: &[&str] = &[
    "ABORT", "ACTION", "ADD", "AFTER", "ALL", "ALTER", "ALWAYS", "ANALYZE", "AND", "AS", "ASC",
    "ATTACH", "AUTOINCREMENT", "BEFORE", "BEGIN", "BETWEEN", "BY", "CASCADE", "CASE", "CAST",
    "CHECK", "COLLATE", "COLUMN", "COMMIT", "CONFLICT", "CONSTRAINT", "CREATE", "CROSS",
    "CURRENT", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP", "DATABASE", "DEFAULT",
    "DEFERRABLE", "DEFERRED", "DELETE", "DESC", "DETACH", "DISTINCT", "DO", "DROP", "EACH",
    "ELSE", "END", "ESCAPE", "EXCEPT", "EXCLUDE", "EXCLUSIVE", "EXISTS", "EXPLAIN", "FAIL",
    "FILTER", "FIRST", "FOLLOWING", "FOR", "FOREIGN", "FROM", "FULL", "GENERATED", "GLOB",
    "GROUP", "GROUPS", "HAVING", "IF", "IGNORE", "IMMEDIATE", "IN", "INDEX", "INDEXED",
    "INITIALLY", "INNER", "INSERT", "INSTEAD", "INTERSECT", "INTO", "IS", "ISNULL", "JOIN",
    "KEY", "LAST", "LEFT", "LIKE", "LIMIT", "MATCH", "MATERIALIZED", "NATURAL", "NO", "NOT",
    "NOTHING", "NOTNULL", "NULL", "NULLS", "OF", "OFFSET", "ON", "OR", "ORDER", "OUTER",
    "OVER", "PARTITION", "PLAN", "PRAGMA", "PRECEDING", "PRIMARY", "QUERY", "RAISE", "RANGE",
    "RECURSIVE", "REFERENCES", "REGEXP", "REINDEX", "RELEASE", "RENAME", "REPLACE", "RESTRICT",
    "RETURNING", "RIGHT", "ROLLBACK", "ROW", "ROWS", "SAVEPOINT", "SELECT", "SET", "TABLE",
    "TEMP", "TEMPORARY", "THEN", "TIES", "TO", "TRANSACTION", "TRIGGER", "UNBOUNDED", "UNION",
    "UNIQUE", "UPDATE", "USING", "VACUUM", "VALUES", "VIEW", "VIRTUAL", "WHEN", "WHERE",
    "WINDOW", "WITH", "WITHOUT", "TRUE", "FALSE", "BOOLEAN", "INT", "INTEGER", "BIGINT",
    "SMALLINT", "FLOAT", "DOUBLE", "DECIMAL", "NUMERIC", "REAL", "VARCHAR", "CHAR", "TEXT",
    "BLOB", "DATE", "TIME", "TIMESTAMP", "DATETIME", "INTERVAL", "SERIAL", "BIGSERIAL",
    "SMALLSERIAL", "MONEY", "BYTEA", "JSON", "JSONB", "UUID", "XML", "ARRAY", "ENUM", "BOOLEAN",
    "BIT", "VARBIT", "INET", "CIDR", "MACADDR", "TSVECTOR", "TSQUERY", "REGCLASS", "REGTYPE",
    "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "GREATEST", "LEAST", "ABS",
    "CEIL", "FLOOR", "ROUND", "TRUNC", "SIGN", "SQRT", "POWER", "MOD", "RANDOM", "LENGTH",
    "UPPER", "LOWER", "TRIM", "LTRIM", "RTRIM", "SUBSTRING", "CONCAT", "POSITION", "OVERLAY",
    "EXTRACT", "NOW", "AGE", "DATE_TRUNC", "DATE_PART", "TO_CHAR", "TO_DATE", "TO_TIMESTAMP",
    "TO_NUMBER", "STRING_AGG", "ARRAY_AGG", "BOOL_AND", "BOOL_OR", "BIT_AND", "BIT_OR",
    "EVERY", "RANK", "DENSE_RANK", "ROW_NUMBER", "NTILE", "LAG", "LEAD", "FIRST_VALUE",
    "LAST_VALUE", "NTH_VALUE", "CUME_DIST", "PERCENT_RANK", "FETCH", "NEXT", "ONLY", "LATERAL",
    "TABLESAMPLE", "ORDINALITY", "WITHIN", "GROUPING", "SETS", "CUBE", "ROLLUP", "ILIKE",
    "SIMILAR", "ANY", "SOME", "ASC", "DESC", "NULLS", "FIRST", "LAST", "CASE", "WHEN", "THEN",
    "ELSE", "END", "CAST", "BETWEEN", "LIKE", "IN", "IS", "NOT", "NULL", "TRUE", "FALSE",
    "AND", "OR", "XOR", "DIV", "MOD", "REGEXP", "RLIKE", "SOUNDS", "BINARY", "COLLATE",
    "SEPARATOR", "AUTO_INCREMENT", "ENGINE", "CHARSET", "CHARACTER", "UNSIGNED", "SIGNED",
    "ZEROFILL", "TINYINT", "MEDIUMINT", "TINYTEXT", "MEDIUMTEXT", "LONGTEXT", "TINYBLOB",
    "MEDIUMBLOB", "LONGBLOB", "YEAR", "GEOMETRY", "POINT", "LINESTRING", "POLYGON",
    "MULTIPOINT", "MULTILINESTRING", "MULTIPOLYGON", "GEOMETRYCOLLECTION", "STRUCT",
    "UNNEST", "SAFE_CAST", "IFNULL", "COUNTIF", "SAFE_DIVIDE", "FORMAT", "PARSE_DATE",
    "PARSE_TIMESTAMP", "GENERATE_ARRAY", "GENERATE_DATE_ARRAY", "FARM_FINGERPRINT",
    "APPROX_COUNT_DISTINCT", "CURRENT_DATETIME", "DATETIME_TRUNC", "TIMESTAMP_TRUNC",
    "DATE_ADD", "DATE_SUB", "DATETIME_ADD", "DATETIME_SUB", "TIMESTAMP_ADD", "TIMESTAMP_SUB",
    "STRING", "BYTES", "INT64", "FLOAT64", "NUMERIC", "BIGNUMERIC", "BOOL", "GEOGRAPHY",
    "DECLARE", "LOOP", "WHILE", "REPEAT", "ITERATE", "LEAVE", "CALL", "RETURNS", "RETURN",
    "DETERMINISTIC", "READS", "SQL", "DATA", "MODIFIES", "CONTAINS", "HANDLER", "CONTINUE",
    "EXIT", "UNDO", "CONDITION", "CURSOR", "OPEN", "CLOSE", "FETCH", "SIGNAL", "RESIGNAL",
    "GET", "DIAGNOSTICS", "STACKED", "TEMPORARY", "TEMP", "UNLOGGED", "CONCURRENTLY",
    "CASCADE", "RESTRICT", "INHERITS", "TABLESPACE", "OWNER", "GRANTED", "PRIVILEGES",
    "SCHEMA", "EXTENSION", "FUNCTION", "PROCEDURE", "LANGUAGE", "PLPGSQL", "VOLATILE",
    "STABLE", "IMMUTABLE", "SECURITY", "DEFINER", "INVOKER", "PARALLEL", "SAFE", "UNSAFE",
    "COST", "SUPPORT",
];

fn is_keyword(word: &str) -> bool {
    let upper = word.to_uppercase();
    SQL_KEYWORDS.iter().any(|kw| *kw == upper)
}

#[derive(Debug, Clone, PartialEq)]
enum Token {
    Keyword(String),
    Identifier(String),
    StringLiteral(String),
    Number(String),
    Operator(String),
    Comma,
    OpenParen,
    CloseParen,
    Semicolon,
    Whitespace(String),
    LineComment(String),
    BlockComment(String),
    Dot,
    Wildcard,
}

fn tokenize(input: &str) -> Vec<Token> {
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut tokens = Vec::new();
    let mut i = 0;

    while i < len {
        let c = chars[i];

        // Whitespace
        if c.is_whitespace() {
            let start = i;
            while i < len && chars[i].is_whitespace() {
                i += 1;
            }
            tokens.push(Token::Whitespace(chars[start..i].iter().collect()));
            continue;
        }

        // Line comment --
        if c == '-' && i + 1 < len && chars[i + 1] == '-' {
            let start = i;
            while i < len && chars[i] != '\n' {
                i += 1;
            }
            tokens.push(Token::LineComment(chars[start..i].iter().collect()));
            continue;
        }

        // Block comment /* */
        if c == '/' && i + 1 < len && chars[i + 1] == '*' {
            let start = i;
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < len {
                i += 2;
            }
            tokens.push(Token::BlockComment(chars[start..i].iter().collect()));
            continue;
        }

        // String literal (single-quoted)
        if c == '\'' {
            let start = i;
            i += 1;
            while i < len {
                if chars[i] == '\'' {
                    if i + 1 < len && chars[i + 1] == '\'' {
                        i += 2; // escaped quote
                    } else {
                        i += 1;
                        break;
                    }
                } else {
                    i += 1;
                }
            }
            tokens.push(Token::StringLiteral(chars[start..i].iter().collect()));
            continue;
        }

        // Double-quoted identifier
        if c == '"' {
            let start = i;
            i += 1;
            while i < len && chars[i] != '"' {
                i += 1;
            }
            if i < len {
                i += 1;
            }
            tokens.push(Token::Identifier(chars[start..i].iter().collect()));
            continue;
        }

        // Backtick-quoted identifier (MySQL)
        if c == '`' {
            let start = i;
            i += 1;
            while i < len && chars[i] != '`' {
                i += 1;
            }
            if i < len {
                i += 1;
            }
            tokens.push(Token::Identifier(chars[start..i].iter().collect()));
            continue;
        }

        // Numbers
        if c.is_ascii_digit() || (c == '.' && i + 1 < len && chars[i + 1].is_ascii_digit()) {
            let start = i;
            while i < len && (chars[i].is_ascii_digit() || chars[i] == '.') {
                i += 1;
            }
            tokens.push(Token::Number(chars[start..i].iter().collect()));
            continue;
        }

        // Comma
        if c == ',' {
            tokens.push(Token::Comma);
            i += 1;
            continue;
        }

        // Parentheses
        if c == '(' {
            tokens.push(Token::OpenParen);
            i += 1;
            continue;
        }
        if c == ')' {
            tokens.push(Token::CloseParen);
            i += 1;
            continue;
        }

        // Semicolon
        if c == ';' {
            tokens.push(Token::Semicolon);
            i += 1;
            continue;
        }

        // Dot
        if c == '.' {
            tokens.push(Token::Dot);
            i += 1;
            continue;
        }

        // Star/wildcard
        if c == '*' {
            tokens.push(Token::Wildcard);
            i += 1;
            continue;
        }

        // Multi-char operators
        if (c == '<' || c == '>' || c == '!' || c == '=')
            && i + 1 < len
            && chars[i + 1] == '='
        {
            tokens.push(Token::Operator(chars[i..i + 2].iter().collect()));
            i += 2;
            continue;
        }
        if c == '<' && i + 1 < len && chars[i + 1] == '>' {
            tokens.push(Token::Operator("<>".to_string()));
            i += 2;
            continue;
        }
        if c == '|' && i + 1 < len && chars[i + 1] == '|' {
            tokens.push(Token::Operator("||".to_string()));
            i += 2;
            continue;
        }

        // Single-char operators
        if "+-/<>=|&^~%".contains(c) {
            tokens.push(Token::Operator(c.to_string()));
            i += 1;
            continue;
        }

        // Words (keywords or identifiers)
        if c.is_alphanumeric() || c == '_' || c == '@' || c == '#' || c == '$' {
            let start = i;
            while i < len
                && (chars[i].is_alphanumeric() || chars[i] == '_' || chars[i] == '@' || chars[i] == '#' || chars[i] == '$')
            {
                i += 1;
            }
            let word: String = chars[start..i].iter().collect();
            if is_keyword(&word) {
                tokens.push(Token::Keyword(word.to_uppercase()));
            } else {
                tokens.push(Token::Identifier(word));
            }
            continue;
        }

        // Anything else: treat as operator
        tokens.push(Token::Operator(c.to_string()));
        i += 1;
    }

    tokens
}

/// Check if token sequence starting at `idx` matches a multi-word clause.
/// Returns (clause_string, number_of_keyword_tokens_consumed) or None.
fn match_clause(tokens: &[Token], idx: usize) -> Option<(&'static str, usize)> {
    // Try multi-word clauses first (longest match)
    let multi_word: &[(&str, &[&str])] = &[
        ("INSERT INTO", &["INSERT", "INTO"]),
        ("DELETE FROM", &["DELETE", "FROM"]),
        ("GROUP BY", &["GROUP", "BY"]),
        ("ORDER BY", &["ORDER", "BY"]),
        ("LEFT OUTER JOIN", &["LEFT", "OUTER", "JOIN"]),
        ("RIGHT OUTER JOIN", &["RIGHT", "OUTER", "JOIN"]),
        ("FULL OUTER JOIN", &["FULL", "OUTER", "JOIN"]),
        ("INNER JOIN", &["INNER", "JOIN"]),
        ("LEFT JOIN", &["LEFT", "JOIN"]),
        ("RIGHT JOIN", &["RIGHT", "JOIN"]),
        ("FULL JOIN", &["FULL", "JOIN"]),
        ("CROSS JOIN", &["CROSS", "JOIN"]),
        ("NATURAL JOIN", &["NATURAL", "JOIN"]),
        ("UNION ALL", &["UNION", "ALL"]),
        ("CREATE TABLE", &["CREATE", "TABLE"]),
        ("ALTER TABLE", &["ALTER", "TABLE"]),
        ("DROP TABLE", &["DROP", "TABLE"]),
    ];

    for (clause, words) in multi_word {
        let mut ti = idx;
        let mut matched = 0usize;
        let mut kw_count = 0usize;
        for &w in *words {
            // skip whitespace
            while ti < tokens.len() {
                if let Token::Whitespace(_) = &tokens[ti] {
                    ti += 1;
                } else {
                    break;
                }
            }
            if ti >= tokens.len() {
                break;
            }
            if let Token::Keyword(ref kw) = tokens[ti] {
                if kw == w {
                    matched += 1;
                    kw_count += 1;
                    ti += 1;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        if matched == words.len() {
            return Some((clause, kw_count));
        }
    }

    // Single-word clauses
    if let Token::Keyword(ref kw) = tokens[idx] {
        let single: &[&str] = &[
            "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET", "SET", "VALUES",
            "UNION", "EXCEPT", "INTERSECT", "JOIN", "ON", "AND", "OR", "RETURNING", "WITH",
            "UPDATE",
        ];
        for &s in single {
            if kw == s {
                return Some((s, 1));
            }
        }
    }

    None
}

pub fn format(input: &str, _dialect: &str, indent: u32) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let tokens = tokenize(input);
    let indent_str: String = " ".repeat(indent as usize);
    let mut result = String::new();
    let mut i = 0;
    let mut paren_depth: i32 = 0;
    let mut is_first_clause = true;
    // Track whether we're right after a clause keyword (to know whether to indent items)
    let mut after_clause = false;
    // Track if we're in a select-like clause (items separated by commas)
    let mut in_select = false;

    while i < tokens.len() {
        // Skip whitespace tokens (we control our own whitespace)
        if let Token::Whitespace(_) = &tokens[i] {
            i += 1;
            continue;
        }

        // Try to match a major clause at top level
        if paren_depth == 0 {
            if let Some((clause, kw_consumed)) = match_clause(&tokens, i) {
                // AND/OR get newline + indent
                if clause == "AND" || clause == "OR" {
                    result.push('\n');
                    result.push_str(&indent_str);
                    result.push_str(clause);
                    after_clause = true;
                    in_select = false;
                    // consume keyword tokens + whitespace between them
                    let mut consumed = 0;
                    while consumed < kw_consumed {
                        if let Token::Keyword(_) = &tokens[i] {
                            consumed += 1;
                        }
                        i += 1;
                    }
                    continue;
                }

                // Major clause: newline before (unless first), then clause on its own line
                if !is_first_clause {
                    result.push('\n');
                }
                is_first_clause = false;
                result.push_str(clause);
                after_clause = true;
                in_select = clause == "SELECT";

                // consume keyword tokens + whitespace between them
                let mut consumed = 0;
                while consumed < kw_consumed {
                    if let Token::Keyword(_) = &tokens[i] {
                        consumed += 1;
                    }
                    i += 1;
                }
                continue;
            }
        }

        match &tokens[i] {
            Token::OpenParen => {
                paren_depth += 1;
                if after_clause {
                    result.push('\n');
                    result.push_str(&indent_str);
                    after_clause = false;
                } else {
                    // If preceded by space-needing context, no extra space needed typically
                }
                result.push('(');
                i += 1;
            }
            Token::CloseParen => {
                paren_depth -= 1;
                if paren_depth < 0 {
                    paren_depth = 0;
                }
                result.push(')');
                i += 1;
            }
            Token::Comma => {
                result.push(',');
                if paren_depth == 0 && in_select {
                    // After comma in SELECT list, put next item on new indented line
                    result.push('\n');
                    result.push_str(&indent_str);
                    after_clause = false;
                } else {
                    result.push(' ');
                }
                i += 1;
            }
            Token::Semicolon => {
                result.push(';');
                i += 1;
                is_first_clause = true;
                after_clause = false;
                in_select = false;
            }
            _ => {
                // Regular token
                if after_clause {
                    result.push('\n');
                    result.push_str(&indent_str);
                    after_clause = false;
                } else if !result.is_empty() && !result.ends_with('\n') && !result.ends_with(' ') && !result.ends_with('(') {
                    // Add space between tokens, but not after opening paren or newline
                    let last_char = result.chars().last().unwrap_or(' ');
                    if last_char != '.' {
                        // Check current token isn't a dot
                        if let Token::Dot = &tokens[i] {
                            // no space before dot
                        } else {
                            result.push(' ');
                        }
                    }
                }

                match &tokens[i] {
                    Token::Keyword(kw) => result.push_str(kw),
                    Token::Identifier(id) => result.push_str(id),
                    Token::StringLiteral(s) => result.push_str(s),
                    Token::Number(n) => result.push_str(n),
                    Token::Operator(op) => result.push_str(op),
                    Token::Dot => result.push('.'),
                    Token::Wildcard => result.push('*'),
                    Token::LineComment(c) => result.push_str(c),
                    Token::BlockComment(c) => result.push_str(c),
                    _ => {}
                }
                i += 1;
            }
        }
    }

    result.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_select_format() {
        let result = format("select id, name from users where id = 1", "sql", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"), "should contain SELECT");
        assert!(result.contains("FROM"), "should contain FROM");
        assert!(result.contains("WHERE"), "should contain WHERE");
    }

    #[test]
    fn test_mysql_dialect() {
        let result = format("select * from users limit 10", "mysql", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"), "should contain SELECT");
    }

    #[test]
    fn test_empty_input() {
        let result = format("", "sql", 2);
        assert_eq!(result, "");
    }

    #[test]
    fn test_whitespace_only_input() {
        let result = format("   \n\t  ", "sql", 2);
        assert_eq!(result, "");
    }

    #[test]
    fn test_keywords_uppercased() {
        let result = format("select id from users where active = true", "sql", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"));
        assert!(result.contains("FROM"));
        assert!(result.contains("WHERE"));
        assert!(result.contains("TRUE"));
    }

    #[test]
    fn test_major_clauses_on_own_line() {
        let result = format("select id, name from users where id = 1", "sql", 2);
        let lines: Vec<&str> = result.lines().collect();
        println!("Lines: {:?}", lines);
        assert_eq!(lines[0], "SELECT");
        assert!(lines.iter().any(|l| l.trim() == "FROM"), "FROM should be on its own line");
        assert!(lines.iter().any(|l| l.trim() == "WHERE"), "WHERE should be on its own line");
    }

    #[test]
    fn test_select_items_indented() {
        let result = format("select id, name from users", "sql", 2);
        let lines: Vec<&str> = result.lines().collect();
        println!("Lines: {:?}", lines);
        // Items after SELECT should be indented
        assert!(lines[1].starts_with("  "), "first select item should be indented");
    }

    #[test]
    fn test_join_clause() {
        let result = format(
            "select u.id, o.total from users u inner join orders o on u.id = o.user_id",
            "sql",
            2,
        );
        println!("Result:\n{}", result);
        assert!(result.contains("INNER JOIN"));
        assert!(result.contains("ON"));
    }

    #[test]
    fn test_group_by_order_by() {
        let result = format(
            "select status, count(*) from orders group by status order by status",
            "sql",
            2,
        );
        println!("Result:\n{}", result);
        assert!(result.contains("GROUP BY"));
        assert!(result.contains("ORDER BY"));
    }

    #[test]
    fn test_string_literals_preserved() {
        let result = format("select * from users where name = 'John Doe'", "sql", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("'John Doe'"));
    }

    #[test]
    fn test_postgresql_dialect() {
        let result = format("select id from users returning id", "postgresql", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"));
        assert!(result.contains("RETURNING"));
    }

    #[test]
    fn test_bigquery_dialect() {
        let result = format("select * from `project.dataset.table` limit 10", "bigquery", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"));
        assert!(result.contains("LIMIT"));
    }

    #[test]
    fn test_sqlite_dialect() {
        let result = format("select * from users limit 10", "sqlite", 2);
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"));
    }

    #[test]
    fn test_subquery_in_parens() {
        let result = format(
            "select * from users where id in (select user_id from orders)",
            "sql",
            2,
        );
        println!("Result:\n{}", result);
        assert!(result.contains("SELECT"));
        assert!(result.contains("("));
        assert!(result.contains(")"));
    }

    #[test]
    fn test_and_or_indented() {
        let result = format(
            "select * from users where id = 1 and name = 'test' or active = true",
            "sql",
            2,
        );
        println!("Result:\n{}", result);
        assert!(result.contains("AND"));
        assert!(result.contains("OR"));
    }
}
