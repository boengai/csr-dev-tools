pub const WIRE_VARINT: u32 = 0;
pub const WIRE_64BIT: u32 = 1;
pub const WIRE_LENGTH_DELIMITED: u32 = 2;
pub const WIRE_32BIT: u32 = 5;

// ── Encoding ──

pub fn encode_varint(mut value: u64, buf: &mut Vec<u8>) {
    loop {
        let mut byte = (value & 0x7F) as u8;
        value >>= 7;
        if value != 0 {
            byte |= 0x80;
        }
        buf.push(byte);
        if value == 0 {
            break;
        }
    }
}

pub fn encode_tag(field_number: u32, wire_type: u32, buf: &mut Vec<u8>) {
    encode_varint(((field_number as u64) << 3) | (wire_type as u64), buf);
}

pub fn encode_zigzag32(n: i32) -> u64 {
    ((n << 1) ^ (n >> 31)) as u32 as u64
}

pub fn encode_zigzag64(n: i64) -> u64 {
    ((n << 1) ^ (n >> 63)) as u64
}

// ── Decoding ──

pub struct WireReader<'a> {
    buf: &'a [u8],
    pos: usize,
}

impl<'a> WireReader<'a> {
    pub fn new(buf: &'a [u8]) -> Self {
        Self { buf, pos: 0 }
    }

    pub fn remaining(&self) -> usize {
        self.buf.len() - self.pos
    }

    pub fn read_varint(&mut self) -> Result<u64, String> {
        let mut result: u64 = 0;
        let mut shift = 0;
        loop {
            if self.pos >= self.buf.len() {
                return Err("Unexpected end of buffer reading varint".into());
            }
            let byte = self.buf[self.pos];
            self.pos += 1;
            result |= ((byte & 0x7F) as u64) << shift;
            if byte & 0x80 == 0 {
                break;
            }
            shift += 7;
            if shift >= 64 {
                return Err("Varint too long".into());
            }
        }
        Ok(result)
    }

    pub fn read_tag(&mut self) -> Result<(u32, u32), String> {
        let val = self.read_varint()?;
        let field_number = (val >> 3) as u32;
        let wire_type = (val & 0x7) as u32;
        Ok((field_number, wire_type))
    }

    pub fn read_bytes(&mut self) -> Result<&'a [u8], String> {
        let len = self.read_varint()? as usize;
        if self.pos + len > self.buf.len() {
            return Err("Unexpected end of buffer reading bytes".into());
        }
        let data = &self.buf[self.pos..self.pos + len];
        self.pos += len;
        Ok(data)
    }

    pub fn read_fixed32(&mut self) -> Result<u32, String> {
        if self.pos + 4 > self.buf.len() {
            return Err("Unexpected end of buffer reading fixed32".into());
        }
        let bytes = [
            self.buf[self.pos],
            self.buf[self.pos + 1],
            self.buf[self.pos + 2],
            self.buf[self.pos + 3],
        ];
        self.pos += 4;
        Ok(u32::from_le_bytes(bytes))
    }

    pub fn read_fixed64(&mut self) -> Result<u64, String> {
        if self.pos + 8 > self.buf.len() {
            return Err("Unexpected end of buffer reading fixed64".into());
        }
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&self.buf[self.pos..self.pos + 8]);
        self.pos += 8;
        Ok(u64::from_le_bytes(bytes))
    }

    pub fn skip_field(&mut self, wire_type: u32) -> Result<(), String> {
        match wire_type {
            WIRE_VARINT => {
                self.read_varint()?;
            }
            WIRE_64BIT => {
                self.read_fixed64()?;
            }
            WIRE_LENGTH_DELIMITED => {
                self.read_bytes()?;
            }
            WIRE_32BIT => {
                self.read_fixed32()?;
            }
            _ => return Err(format!("Unknown wire type {}", wire_type)),
        }
        Ok(())
    }
}

pub fn decode_zigzag32(n: u32) -> i32 {
    ((n >> 1) as i32) ^ (-((n & 1) as i32))
}

pub fn decode_zigzag64(n: u64) -> i64 {
    ((n >> 1) as i64) ^ (-((n & 1) as i64))
}
