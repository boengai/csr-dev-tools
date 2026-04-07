use super::lexer::Token;
use super::types::*;
use std::collections::BTreeMap;

pub struct ProtoParser {
    tokens: Vec<(Token, usize)>,
    pos: usize,
}

impl ProtoParser {
    pub fn new(tokens: Vec<(Token, usize)>) -> Self {
        Self { tokens, pos: 0 }
    }

    fn peek(&self) -> &Token {
        &self.tokens[self.pos].0
    }

    fn line(&self) -> usize {
        self.tokens[self.pos].1
    }

    fn advance(&mut self) -> &Token {
        let tok = &self.tokens[self.pos].0;
        self.pos += 1;
        tok
    }

    fn expect(&mut self, expected: &Token) -> Result<(), String> {
        if self.peek() == expected {
            self.advance();
            Ok(())
        } else {
            Err(format!(
                "Expected {:?}, found {:?} at line {}",
                expected,
                self.peek(),
                self.line()
            ))
        }
    }

    fn expect_ident(&mut self) -> Result<String, String> {
        match self.advance().clone() {
            Token::Ident(s) => Ok(s),
            other => Err(format!(
                "Expected identifier, found {:?} at line {}",
                other,
                self.line()
            )),
        }
    }

    fn expect_int(&mut self) -> Result<i64, String> {
        match self.advance().clone() {
            Token::IntLit(n) => Ok(n),
            other => Err(format!(
                "Expected integer, found {:?} at line {}",
                other,
                self.line()
            )),
        }
    }

    pub fn parse(&mut self) -> Result<ProtobufSchemaInfo, String> {
        let mut schema = ProtobufSchemaInfo {
            enums: Vec::new(),
            messages: Vec::new(),
            package: None,
            syntax: None,
        };

        let mut namespace_prefix = String::new();

        while *self.peek() != Token::Eof {
            match self.peek().clone() {
                Token::Syntax => {
                    self.advance();
                    self.expect(&Token::Equals)?;
                    if let Token::StringLit(s) = self.advance().clone() {
                        schema.syntax = Some(s);
                    }
                    self.expect(&Token::Semicolon)?;
                }
                Token::Package => {
                    self.advance();
                    let mut pkg = self.expect_ident()?;
                    while *self.peek() == Token::Dot {
                        self.advance();
                        pkg.push('.');
                        pkg.push_str(&self.expect_ident()?);
                    }
                    schema.package = Some(pkg.clone());
                    namespace_prefix = format!(".{}", pkg);
                    self.expect(&Token::Semicolon)?;
                }
                Token::Message => {
                    let msg = self.parse_message(&namespace_prefix)?;
                    schema.messages.push(msg);
                }
                Token::Enum => {
                    let enum_info = self.parse_enum(&namespace_prefix)?;
                    schema.enums.push(enum_info);
                }
                Token::Import => {
                    // Skip import statements
                    self.advance();
                    self.advance(); // string
                    self.expect(&Token::Semicolon)?;
                }
                Token::Option => {
                    self.skip_option()?;
                }
                Token::Service => {
                    self.skip_service()?;
                }
                _ => {
                    return Err(format!(
                        "Unexpected token {:?} at line {}",
                        self.peek(),
                        self.line()
                    ));
                }
            }
        }

        // Resolve field types
        self.resolve_fields(&mut schema);

        Ok(schema)
    }

    fn parse_message(&mut self, prefix: &str) -> Result<ProtobufMessageInfo, String> {
        self.expect(&Token::Message)?;
        let name = self.expect_ident()?;
        let full_name = format!("{}.{}", prefix, name);
        self.expect(&Token::LBrace)?;

        let mut msg = ProtobufMessageInfo {
            fields: Vec::new(),
            full_name,
            name,
            nested_enums: Vec::new(),
            nested_messages: Vec::new(),
            oneofs: Vec::new(),
        };

        while *self.peek() != Token::RBrace {
            match self.peek().clone() {
                Token::Message => {
                    let nested = self.parse_message(&msg.full_name)?;
                    msg.nested_messages.push(nested);
                }
                Token::Enum => {
                    let nested = self.parse_enum(&msg.full_name)?;
                    msg.nested_enums.push(nested);
                }
                Token::Oneof => {
                    let (oneof, fields) = self.parse_oneof(&msg.full_name)?;
                    msg.oneofs.push(oneof);
                    msg.fields.extend(fields);
                }
                Token::Map => {
                    let field = self.parse_map_field()?;
                    msg.fields.push(field);
                }
                Token::Repeated | Token::Optional | Token::Required => {
                    let field = self.parse_field(Some(self.peek().clone()))?;
                    msg.fields.push(field);
                }
                Token::Reserved => {
                    self.skip_reserved()?;
                }
                Token::Option => {
                    self.skip_option()?;
                }
                Token::Ident(_) => {
                    let field = self.parse_field(None)?;
                    msg.fields.push(field);
                }
                _ => {
                    return Err(format!(
                        "Unexpected token {:?} in message at line {}",
                        self.peek(),
                        self.line()
                    ));
                }
            }
        }

        self.expect(&Token::RBrace)?;
        Ok(msg)
    }

    fn parse_field(&mut self, rule_token: Option<Token>) -> Result<ProtobufFieldInfo, String> {
        let rule = match &rule_token {
            Some(Token::Repeated) => {
                self.advance();
                Some("repeated".to_string())
            }
            Some(Token::Optional) => {
                self.advance();
                Some("optional".to_string())
            }
            Some(Token::Required) => {
                self.advance();
                Some("required".to_string())
            }
            _ => None,
        };

        let field_type = self.parse_type_name()?;
        let name = self.expect_ident()?;
        self.expect(&Token::Equals)?;
        let id = self.expect_int()? as u32;

        // Skip field options [...]
        if *self.peek() == Token::LBracket {
            self.skip_field_options()?;
        }
        self.expect(&Token::Semicolon)?;

        Ok(ProtobufFieldInfo {
            description: None,
            id,
            is_map: false,
            name: snake_to_camel(&name),
            resolved_kind: "scalar".to_string(), // resolved later
            resolved_type_name: None,            // resolved later
            rule,
            field_type,
        })
    }

    fn parse_map_field(&mut self) -> Result<ProtobufFieldInfo, String> {
        self.expect(&Token::Map)?;
        self.expect(&Token::LAngle)?;
        let _key_type = self.parse_type_name()?;
        self.expect(&Token::Comma)?;
        let value_type = self.parse_type_name()?;
        self.expect(&Token::RAngle)?;
        let name = self.expect_ident()?;
        self.expect(&Token::Equals)?;
        let id = self.expect_int()? as u32;

        if *self.peek() == Token::LBracket {
            self.skip_field_options()?;
        }
        self.expect(&Token::Semicolon)?;

        Ok(ProtobufFieldInfo {
            description: None,
            id,
            is_map: true,
            name: snake_to_camel(&name),
            resolved_kind: "scalar".to_string(),
            resolved_type_name: None,
            rule: None,
            field_type: value_type,
        })
    }

    fn parse_oneof(
        &mut self,
        _prefix: &str,
    ) -> Result<(OneofInfo, Vec<ProtobufFieldInfo>), String> {
        self.expect(&Token::Oneof)?;
        let name = self.expect_ident()?;
        self.expect(&Token::LBrace)?;

        let mut fields = Vec::new();
        let mut field_names = Vec::new();

        while *self.peek() != Token::RBrace {
            if *self.peek() == Token::Option {
                self.skip_option()?;
                continue;
            }
            let field = self.parse_field(None)?;
            field_names.push(field.name.clone());
            fields.push(field);
        }
        self.expect(&Token::RBrace)?;

        Ok((
            OneofInfo {
                field_names,
                name: snake_to_camel(&name),
            },
            fields,
        ))
    }

    fn parse_enum(&mut self, prefix: &str) -> Result<ProtobufEnumInfo, String> {
        self.expect(&Token::Enum)?;
        let name = self.expect_ident()?;
        let full_name = format!("{}.{}", prefix, name);
        self.expect(&Token::LBrace)?;

        let mut values = BTreeMap::new();

        while *self.peek() != Token::RBrace {
            match self.peek().clone() {
                Token::Option => {
                    self.skip_option()?;
                }
                Token::Reserved => {
                    self.skip_reserved()?;
                }
                Token::Ident(val_name) => {
                    self.advance();
                    self.expect(&Token::Equals)?;
                    let num = self.expect_int()? as i32;
                    // Skip options
                    if *self.peek() == Token::LBracket {
                        self.skip_field_options()?;
                    }
                    self.expect(&Token::Semicolon)?;
                    values.insert(val_name, num);
                }
                _ => {
                    return Err(format!(
                        "Unexpected token {:?} in enum at line {}",
                        self.peek(),
                        self.line()
                    ));
                }
            }
        }
        self.expect(&Token::RBrace)?;

        Ok(ProtobufEnumInfo {
            full_name,
            name,
            values,
        })
    }

    fn parse_type_name(&mut self) -> Result<String, String> {
        let mut name = match self.peek().clone() {
            Token::Dot => {
                self.advance();
                ".".to_string()
            }
            _ => String::new(),
        };

        let ident = self.expect_ident()?;
        name.push_str(&ident);

        while *self.peek() == Token::Dot {
            self.advance();
            name.push('.');
            name.push_str(&self.expect_ident()?);
        }

        Ok(name)
    }

    fn skip_field_options(&mut self) -> Result<(), String> {
        self.expect(&Token::LBracket)?;
        let mut depth = 1;
        while depth > 0 {
            match self.advance().clone() {
                Token::LBracket => depth += 1,
                Token::RBracket => depth -= 1,
                Token::Eof => return Err("Unterminated field options".into()),
                _ => {}
            }
        }
        Ok(())
    }

    fn skip_option(&mut self) -> Result<(), String> {
        self.expect(&Token::Option)?;
        // Skip until semicolon
        while *self.peek() != Token::Semicolon && *self.peek() != Token::Eof {
            self.advance();
        }
        self.expect(&Token::Semicolon)?;
        Ok(())
    }

    fn skip_reserved(&mut self) -> Result<(), String> {
        self.advance(); // 'reserved'
        while *self.peek() != Token::Semicolon && *self.peek() != Token::Eof {
            self.advance();
        }
        self.expect(&Token::Semicolon)?;
        Ok(())
    }

    fn skip_service(&mut self) -> Result<(), String> {
        self.advance(); // 'service'
        self.expect_ident()?; // name
        self.expect(&Token::LBrace)?;
        let mut depth = 1;
        while depth > 0 {
            match self.advance().clone() {
                Token::LBrace => depth += 1,
                Token::RBrace => depth -= 1,
                Token::Eof => return Err("Unterminated service block".into()),
                _ => {}
            }
        }
        Ok(())
    }

    fn resolve_fields(&self, schema: &mut ProtobufSchemaInfo) {
        let all_messages = collect_all_message_names(&schema.messages);
        let all_enums = collect_all_enum_names(&schema.messages, &schema.enums);

        for msg in &mut schema.messages {
            resolve_message_fields(msg, &all_messages, &all_enums);
        }
    }
}

fn collect_all_message_names(messages: &[ProtobufMessageInfo]) -> Vec<String> {
    let mut names = Vec::new();
    for msg in messages {
        names.push(msg.full_name.clone());
        names.extend(collect_all_message_names(&msg.nested_messages));
    }
    names
}

fn collect_all_enum_names(
    messages: &[ProtobufMessageInfo],
    top_enums: &[ProtobufEnumInfo],
) -> Vec<String> {
    let mut names: Vec<String> = top_enums.iter().map(|e| e.full_name.clone()).collect();
    for msg in messages {
        for e in &msg.nested_enums {
            names.push(e.full_name.clone());
        }
        names.extend(collect_all_enum_names(&msg.nested_messages, &[]));
    }
    names
}

fn resolve_message_fields(
    msg: &mut ProtobufMessageInfo,
    all_messages: &[String],
    all_enums: &[String],
) {
    for field in &mut msg.fields {
        resolve_field_type(field, &msg.full_name, all_messages, all_enums);
    }
    for nested in &mut msg.nested_messages {
        resolve_message_fields(nested, all_messages, all_enums);
    }
}

fn resolve_field_type(
    field: &mut ProtobufFieldInfo,
    parent_full_name: &str,
    all_messages: &[String],
    all_enums: &[String],
) {
    let ft = &field.field_type;

    // Scalar types
    if is_scalar(ft) {
        field.resolved_kind = "scalar".to_string();
        return;
    }

    // Try resolving as nested type first (parent.Type), then walk up scopes
    let mut candidates = vec![format!("{}.{}", parent_full_name, ft)];

    // Walk up parent scopes: .example.Person → .example → .
    let mut scope = parent_full_name.to_string();
    while let Some(dot_pos) = scope.rfind('.') {
        scope.truncate(dot_pos);
        if scope.is_empty() {
            candidates.push(format!(".{}", ft));
        } else {
            candidates.push(format!("{}.{}", scope, ft));
        }
    }
    candidates.push(ft.clone());

    for candidate in &candidates {
        if all_messages.iter().any(|m| m == candidate) {
            field.resolved_kind = "message".to_string();
            field.resolved_type_name = Some(candidate.clone());
            return;
        }
        if all_enums.iter().any(|e| e == candidate) {
            field.resolved_kind = "enum".to_string();
            field.resolved_type_name = Some(candidate.clone());
            return;
        }
    }

    // Default to scalar if unresolved
    field.resolved_kind = "scalar".to_string();
}

fn is_scalar(t: &str) -> bool {
    matches!(
        t,
        "double"
            | "float"
            | "int32"
            | "int64"
            | "uint32"
            | "uint64"
            | "sint32"
            | "sint64"
            | "fixed32"
            | "fixed64"
            | "sfixed32"
            | "sfixed64"
            | "bool"
            | "string"
            | "bytes"
    )
}

fn snake_to_camel(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut capitalize_next = false;
    for ch in s.chars() {
        if ch == '_' {
            capitalize_next = true;
        } else if capitalize_next {
            result.extend(ch.to_uppercase());
            capitalize_next = false;
        } else {
            result.push(ch);
        }
    }
    result
}
