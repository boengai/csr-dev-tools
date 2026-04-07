#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Keywords
    Syntax,
    Package,
    Message,
    Enum,
    Oneof,
    Map,
    Repeated,
    Optional,
    Required,
    Reserved,
    Import,
    Option,
    Returns,
    Rpc,
    Service,
    Stream,
    // Symbols
    LBrace,    // {
    RBrace,    // }
    LBracket,  // [
    RBracket,  // ]
    LAngle,    // <
    RAngle,    // >
    LParen,    // (
    RParen,    // )
    Semicolon, // ;
    Equals,    // =
    Comma,     // ,
    Dot,       // .
    // Values
    Ident(String),
    IntLit(i64),
    StringLit(String),
    // Meta
    Eof,
}

pub struct Lexer<'a> {
    input: &'a str,
    pos: usize,
    pub line: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(input: &'a str) -> Self {
        Self {
            input,
            pos: 0,
            line: 1,
        }
    }

    pub fn tokenize(&mut self) -> Result<Vec<(Token, usize)>, String> {
        let mut tokens = Vec::new();
        loop {
            self.skip_whitespace_and_comments();
            if self.pos >= self.input.len() {
                tokens.push((Token::Eof, self.line));
                break;
            }
            let line = self.line;
            let token = self.next_token()?;
            tokens.push((token, line));
        }
        Ok(tokens)
    }

    fn skip_whitespace_and_comments(&mut self) {
        let bytes = self.input.as_bytes();
        loop {
            // Skip whitespace
            while self.pos < bytes.len() && bytes[self.pos].is_ascii_whitespace() {
                if bytes[self.pos] == b'\n' {
                    self.line += 1;
                }
                self.pos += 1;
            }
            // Skip line comments
            if self.pos + 1 < bytes.len()
                && bytes[self.pos] == b'/'
                && bytes[self.pos + 1] == b'/'
            {
                while self.pos < bytes.len() && bytes[self.pos] != b'\n' {
                    self.pos += 1;
                }
                continue;
            }
            // Skip block comments
            if self.pos + 1 < bytes.len()
                && bytes[self.pos] == b'/'
                && bytes[self.pos + 1] == b'*'
            {
                self.pos += 2;
                while self.pos + 1 < bytes.len() {
                    if bytes[self.pos] == b'\n' {
                        self.line += 1;
                    }
                    if bytes[self.pos] == b'*' && bytes[self.pos + 1] == b'/' {
                        self.pos += 2;
                        break;
                    }
                    self.pos += 1;
                }
                continue;
            }
            break;
        }
    }

    fn next_token(&mut self) -> Result<Token, String> {
        let bytes = self.input.as_bytes();
        let ch = bytes[self.pos] as char;

        match ch {
            '{' => {
                self.pos += 1;
                Ok(Token::LBrace)
            }
            '}' => {
                self.pos += 1;
                Ok(Token::RBrace)
            }
            '[' => {
                self.pos += 1;
                Ok(Token::LBracket)
            }
            ']' => {
                self.pos += 1;
                Ok(Token::RBracket)
            }
            '<' => {
                self.pos += 1;
                Ok(Token::LAngle)
            }
            '>' => {
                self.pos += 1;
                Ok(Token::RAngle)
            }
            '(' => {
                self.pos += 1;
                Ok(Token::LParen)
            }
            ')' => {
                self.pos += 1;
                Ok(Token::RParen)
            }
            ';' => {
                self.pos += 1;
                Ok(Token::Semicolon)
            }
            '=' => {
                self.pos += 1;
                Ok(Token::Equals)
            }
            ',' => {
                self.pos += 1;
                Ok(Token::Comma)
            }
            '.' => {
                self.pos += 1;
                Ok(Token::Dot)
            }
            '"' | '\'' => self.read_string(),
            '-' | '0'..='9' => self.read_number(),
            _ if ch.is_ascii_alphabetic() || ch == '_' => self.read_ident(),
            _ => Err(format!(
                "Unexpected character '{}' at line {}",
                ch, self.line
            )),
        }
    }

    fn read_string(&mut self) -> Result<Token, String> {
        let quote = self.input.as_bytes()[self.pos] as char;
        self.pos += 1;
        let start = self.pos;
        while self.pos < self.input.len() {
            let ch = self.input.as_bytes()[self.pos] as char;
            if ch == '\\' {
                self.pos += 2;
                continue;
            }
            if ch == quote {
                let val = self.input[start..self.pos].to_string();
                self.pos += 1;
                return Ok(Token::StringLit(val));
            }
            self.pos += 1;
        }
        Err(format!("Unterminated string at line {}", self.line))
    }

    fn read_number(&mut self) -> Result<Token, String> {
        let start = self.pos;
        if self.input.as_bytes()[self.pos] == b'-' {
            self.pos += 1;
        }
        // Hex
        if self.pos + 1 < self.input.len()
            && self.input.as_bytes()[self.pos] == b'0'
            && (self.input.as_bytes()[self.pos + 1] == b'x'
                || self.input.as_bytes()[self.pos + 1] == b'X')
        {
            self.pos += 2;
            while self.pos < self.input.len()
                && self.input.as_bytes()[self.pos].is_ascii_hexdigit()
            {
                self.pos += 1;
            }
        } else {
            while self.pos < self.input.len()
                && self.input.as_bytes()[self.pos].is_ascii_digit()
            {
                self.pos += 1;
            }
        }
        let num_str = &self.input[start..self.pos];
        let n = if num_str.starts_with("0x")
            || num_str.starts_with("0X")
            || num_str.starts_with("-0x")
        {
            i64::from_str_radix(&num_str.replace("0x", "").replace("0X", ""), 16)
                .map_err(|e| format!("Invalid hex number at line {}: {}", self.line, e))?
        } else {
            num_str
                .parse::<i64>()
                .map_err(|e| format!("Invalid number '{}' at line {}: {}", num_str, self.line, e))?
        };
        Ok(Token::IntLit(n))
    }

    fn read_ident(&mut self) -> Result<Token, String> {
        let start = self.pos;
        while self.pos < self.input.len() {
            let ch = self.input.as_bytes()[self.pos];
            if ch.is_ascii_alphanumeric() || ch == b'_' {
                self.pos += 1;
            } else {
                break;
            }
        }
        let word = &self.input[start..self.pos];
        let token = match word {
            "syntax" => Token::Syntax,
            "package" => Token::Package,
            "message" => Token::Message,
            "enum" => Token::Enum,
            "oneof" => Token::Oneof,
            "map" => Token::Map,
            "repeated" => Token::Repeated,
            "optional" => Token::Optional,
            "required" => Token::Required,
            "reserved" => Token::Reserved,
            "import" => Token::Import,
            "option" => Token::Option,
            "returns" => Token::Returns,
            "rpc" => Token::Rpc,
            "service" => Token::Service,
            "stream" => Token::Stream,
            _ => Token::Ident(word.to_string()),
        };
        Ok(token)
    }
}
