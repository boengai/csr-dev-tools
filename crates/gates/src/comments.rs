//! A small lexer that finds the comments in Rust source, skipping string,
//! raw-string and char literals. `syn` drops plain comments, so the comment
//! rules need this.

/// One comment. `text` excludes the `//`, `///`, `//!` or `/* */` markers.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Comment {
    /// The 1-based line the comment starts on.
    pub line: usize,
    pub text: String,
    pub kind: CommentKind,
    /// A line comment with only whitespace before it on its line.
    pub whole_line: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CommentKind {
    Line,
    Doc,
    Block,
}

pub fn comments(source: &str) -> Vec<Comment> {
    let chars: Vec<char> = source.chars().collect();
    let mut lexer = Lexer {
        chars: &chars,
        at: 0,
        line: 1,
        line_has_code: false,
        found: Vec::new(),
    };
    lexer.run();
    lexer.found
}

struct Lexer<'a> {
    chars: &'a [char],
    at: usize,
    line: usize,
    line_has_code: bool,
    found: Vec<Comment>,
}

impl Lexer<'_> {
    fn peek(&self, offset: usize) -> Option<char> {
        self.chars.get(self.at + offset).copied()
    }

    fn bump(&mut self) -> Option<char> {
        let c = self.peek(0)?;
        self.at += 1;
        if c == '\n' {
            self.line += 1;
            self.line_has_code = false;
        }
        Some(c)
    }

    fn run(&mut self) {
        while let Some(c) = self.peek(0) {
            match (c, self.peek(1)) {
                ('/', Some('/')) => self.line_comment(),
                ('/', Some('*')) => self.block_comment(),
                ('"', _) => self.string(),
                ('r' | 'b' | 'c', _) if self.raw_string_starts() => self.raw_string(),
                ('\'', _) => self.char_or_lifetime(),
                _ => {
                    if !c.is_whitespace() {
                        self.line_has_code = true;
                    }
                    if c.is_alphanumeric() || c == '_' {
                        self.skip_ident();
                    } else {
                        self.bump();
                    }
                }
            }
        }
    }

    fn skip_ident(&mut self) {
        while self
            .peek(0)
            .is_some_and(|c| c.is_alphanumeric() || c == '_')
        {
            self.bump();
        }
    }

    fn line_comment(&mut self) {
        let (line, whole_line) = (self.line, !self.line_has_code);
        self.at += 2;
        let kind = match (self.peek(0), self.peek(1)) {
            (Some('/'), next) if next != Some('/') => CommentKind::Doc,
            (Some('!'), _) => CommentKind::Doc,
            _ => CommentKind::Line,
        };
        if kind == CommentKind::Doc {
            self.at += 1;
        }
        let mut text = String::new();
        while let Some(c) = self.peek(0).filter(|c| *c != '\n') {
            text.push(c);
            self.at += 1;
        }
        self.found.push(Comment {
            line,
            text,
            kind,
            whole_line,
        });
    }

    fn block_comment(&mut self) {
        let line = self.line;
        self.at += 2;
        let mut depth = 1;
        let mut text = String::new();
        while depth > 0 {
            match (self.peek(0), self.peek(1)) {
                (Some('/'), Some('*')) => depth += 1,
                (Some('*'), Some('/')) => depth -= 1,
                (None, _) => break,
                _ => {}
            }
            if depth == 0 {
                self.at += 2;
            } else if let Some(c) = self.bump() {
                text.push(c);
            }
        }
        self.found.push(Comment {
            line,
            text,
            kind: CommentKind::Block,
            whole_line: false,
        });
    }

    fn string(&mut self) {
        self.line_has_code = true;
        self.bump();
        while let Some(c) = self.bump() {
            match c {
                '\\' => {
                    self.bump();
                }
                '"' => return,
                _ => {}
            }
        }
    }

    /// `r"…"`, `r#"…"#`, `br"…"` and `cr"…"`, not an identifier like `bar`.
    fn raw_string_starts(&self) -> bool {
        let follows_ident = self.at > 0
            && self
                .chars
                .get(self.at - 1)
                .is_some_and(|c| c.is_alphanumeric() || *c == '_');
        if follows_ident {
            return false;
        }
        let mut offset = usize::from(self.peek(0) != Some('r'));
        if self.peek(offset) != Some('r') {
            return false;
        }
        offset += 1;
        while self.peek(offset) == Some('#') {
            offset += 1;
        }
        self.peek(offset) == Some('"')
    }

    fn raw_string(&mut self) {
        self.line_has_code = true;
        while self.peek(0) != Some('r') {
            self.bump();
        }
        self.bump();
        let mut hashes = 0;
        while self.peek(0) == Some('#') {
            hashes += 1;
            self.bump();
        }
        self.bump();
        while let Some(c) = self.bump() {
            if c == '"' && (0..hashes).all(|offset| self.peek(offset) == Some('#')) {
                self.at += hashes;
                return;
            }
        }
    }

    /// `'a'` and `'\n'` are chars; `'a` in `<'a>` is a lifetime.
    fn char_or_lifetime(&mut self) {
        self.line_has_code = true;
        self.bump();
        if self.peek(0) == Some('\\') {
            self.bump();
            self.bump();
            while self.peek(0).is_some_and(|c| c != '\'') {
                self.bump();
            }
            self.bump();
        } else if self.peek(1) == Some('\'') {
            self.bump();
            self.bump();
        }
    }
}
