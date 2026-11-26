//! A STORE-only ZIP writer: what `JSZip.generateAsync({ type: 'blob' })` does by
//! default (src/utils/zip.ts). Images are already compressed, so nothing deflates.

/// CRC-32 (IEEE), bitwise: archives here are a few files, so no table.
pub fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= u32::from(byte);
        for _ in 0..8 {
            crc = if crc & 1 == 1 { (crc >> 1) ^ 0xEDB8_8320 } else { crc >> 1 };
        }
    }
    !crc
}

/// Builds a ZIP archive holding `files` uncompressed, in order.
pub fn store(files: &[(&str, &[u8])]) -> Vec<u8> {
    let mut out = Vec::new();
    let mut central = Vec::new();
    for (name, data) in files {
        let offset = out.len() as u32;
        let crc = crc32(data);
        let size = data.len() as u32;
        let name = name.as_bytes();
        // Version 2.0, flag bit 11 (UTF-8 names), method 0 (stored), DOS time and date 0.
        let common = |buf: &mut Vec<u8>| {
            for v in [20u16, 0x0800, 0, 0, 0] {
                buf.extend_from_slice(&v.to_le_bytes());
            }
            for v in [crc, size, size] {
                buf.extend_from_slice(&v.to_le_bytes());
            }
            buf.extend_from_slice(&(name.len() as u16).to_le_bytes());
            buf.extend_from_slice(&0u16.to_le_bytes()); // extra field length
        };

        out.extend_from_slice(&0x0403_4b50u32.to_le_bytes());
        common(&mut out);
        out.extend_from_slice(name);
        out.extend_from_slice(data);

        central.extend_from_slice(&0x0201_4b50u32.to_le_bytes());
        central.extend_from_slice(&20u16.to_le_bytes()); // made by
        common(&mut central);
        for v in [0u16, 0, 0] {
            central.extend_from_slice(&v.to_le_bytes()); // comment, disk, internal attributes
        }
        central.extend_from_slice(&0u32.to_le_bytes()); // external attributes
        central.extend_from_slice(&offset.to_le_bytes());
        central.extend_from_slice(name);
    }

    let central_offset = out.len() as u32;
    let count = files.len() as u16;
    out.extend_from_slice(&central);
    out.extend_from_slice(&0x0605_4b50u32.to_le_bytes());
    for v in [0u16, 0, count, count] {
        out.extend_from_slice(&v.to_le_bytes());
    }
    out.extend_from_slice(&(central.len() as u32).to_le_bytes());
    out.extend_from_slice(&central_offset.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes()); // comment length
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn crc32_matches_the_standard_check_value() {
        assert_eq!(crc32(b"123456789"), 0xCBF4_3926);
    }

    #[test]
    fn unzip_accepts_the_archive_and_reads_back_each_file() {
        let archive = store(&[("a.webp", b"first".as_slice()), ("b.webp", b"second file".as_slice())]);
        let dir = std::env::temp_dir().join(format!("csr-zip-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("t.zip");
        std::fs::write(&path, &archive).unwrap();

        let test = std::process::Command::new("unzip").arg("-t").arg(&path).output().unwrap();
        assert!(test.status.success(), "{}", String::from_utf8_lossy(&test.stdout));
        let b = std::process::Command::new("unzip").arg("-p").arg(&path).arg("b.webp").output().unwrap();
        assert_eq!(b.stdout, b"second file");
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
