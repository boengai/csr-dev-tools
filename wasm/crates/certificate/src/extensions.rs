use serde::Serialize;
use x509_parser::extensions::{GeneralName, ParsedExtension, X509Extension};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionDto {
    pub critical: bool,
    pub name: String,
    pub oid: String,
    pub value: String,
}

pub fn build_extension_dto(ext: &X509Extension<'_>) -> ExtensionDto {
    let oid = ext.oid.to_id_string();
    let critical = ext.critical;
    let (name, value) = format_extension_fields(ext);
    ExtensionDto {
        critical,
        name,
        oid,
        value,
    }
}

/// Format the value of an extension as a human-readable string.
/// Used in tests to assert on formatted output.
pub fn format_extension(ext: &X509Extension<'_>) -> String {
    format_extension_fields(ext).1
}

fn format_extension_fields(ext: &X509Extension<'_>) -> (String, String) {
    let oid_str = ext.oid.to_id_string();
    match ext.parsed_extension() {
        ParsedExtension::SubjectAlternativeName(san) => {
            let parts: Vec<String> = san
                .general_names
                .iter()
                .map(format_general_name)
                .collect();
            ("Subject Alternative Name".into(), parts.join(", "))
        }
        ParsedExtension::KeyUsage(ku) => {
            let flags: Vec<&str> = KEY_USAGE_FLAGS
                .iter()
                .enumerate()
                .filter_map(|(i, label)| {
                    if (ku.flags >> i) & 1 != 0 {
                        Some(*label)
                    } else {
                        None
                    }
                })
                .collect();
            ("Key Usage".into(), flags.join(", "))
        }
        ParsedExtension::ExtendedKeyUsage(eku) => {
            let mut oid_strs: Vec<String> = Vec::new();
            // Check named booleans in canonical bit-order (any, server_auth, client_auth, …)
            if eku.any              { oid_strs.push("any".into()); }
            if eku.server_auth      { oid_strs.push("1.3.6.1.5.5.7.3.1".into()); }
            if eku.client_auth      { oid_strs.push("1.3.6.1.5.5.7.3.2".into()); }
            if eku.code_signing     { oid_strs.push("1.3.6.1.5.5.7.3.3".into()); }
            if eku.email_protection { oid_strs.push("1.3.6.1.5.5.7.3.4".into()); }
            if eku.time_stamping    { oid_strs.push("1.3.6.1.5.5.7.3.8".into()); }
            if eku.ocsp_signing     { oid_strs.push("1.3.6.1.5.5.7.3.9".into()); }
            for oid in &eku.other {
                oid_strs.push(oid.to_id_string());
            }
            // Resolve every OID string through the single source of truth.
            // Unknown OIDs fall back to the raw dotted string.
            let names: Vec<String> = oid_strs
                .iter()
                .map(|o| {
                    crate::algorithms::eku_name_from_str(o)
                        .map(String::from)
                        .unwrap_or_else(|| o.clone())
                })
                .collect();
            ("Extended Key Usage".into(), names.join(", "))
        }
        ParsedExtension::BasicConstraints(bc) => {
            let value = match bc.path_len_constraint {
                None => format!("CA: {}", bc.ca),
                Some(pl) => format!("CA: {}, Path Length: {}", bc.ca, pl),
            };
            ("Basic Constraints".into(), value)
        }
        ParsedExtension::SubjectKeyIdentifier(ski) => {
            ("Subject Key Identifier".into(), bytes_to_colon_hex(ski.0))
        }
        ParsedExtension::AuthorityKeyIdentifier(aki) => {
            let value = match &aki.key_identifier {
                Some(ki) => bytes_to_colon_hex(ki.0),
                None => bytes_to_colon_hex(ext.value),
            };
            ("Authority Key Identifier".into(), value)
        }
        _ => {
            let name = format!("Extension ({oid_str})");
            let value = bytes_to_colon_hex(ext.value);
            (name, value)
        }
    }
}

fn format_general_name(gn: &GeneralName<'_>) -> String {
    match gn {
        GeneralName::DNSName(s) => format!("DNS:{s}"),
        GeneralName::RFC822Name(s) => format!("Email:{s}"),
        GeneralName::URI(s) => format!("URI:{s}"),
        GeneralName::IPAddress(bytes) => {
            let addr = format_ip(bytes).unwrap_or_else(|| bytes_to_colon_hex(bytes));
            format!("IP:{addr}")
        }
        GeneralName::DirectoryName(dn) => format!("DirName:{dn}"),
        GeneralName::RegisteredID(oid) => format!("RegisteredID:{oid}"),
        GeneralName::OtherName(oid, _) => format!("OtherName:{oid}"),
        GeneralName::X400Address(_) => "X400Address:<unparsed>".into(),
        GeneralName::EDIPartyName(_) => "EDIPartyName:<unparsed>".into(),
    }
}

fn bytes_to_colon_hex(bytes: &[u8]) -> String {
    if bytes.is_empty() {
        return String::new();
    }
    bytes
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect::<Vec<_>>()
        .join(":")
}

fn format_ip(bytes: &[u8]) -> Option<String> {
    match bytes.len() {
        4  => Some(format!("{}.{}.{}.{}", bytes[0], bytes[1], bytes[2], bytes[3])), // IPv4
        16 => {
            let segments: Vec<String> = bytes
                .chunks(2)
                .map(|chunk| format!("{:x}", u16::from_be_bytes([chunk[0], chunk[1]])))
                .collect();
            Some(segments.join(":"))
        } // IPv6
        _  => None,
    }
}

const KEY_USAGE_FLAGS: [&str; 9] = [
    "Digital Signature",
    "Non Repudiation",
    "Key Encipherment",
    "Data Encipherment",
    "Key Agreement",
    "Key Cert Sign",
    "CRL Sign",
    "Encipher Only",
    "Decipher Only",
];

#[cfg(test)]
mod tests {
    use super::*;
    use x509_parser::pem::parse_x509_pem;
    use x509_parser::prelude::FromDer;

    fn parse_fixture(pem_bytes: &[u8]) -> x509_parser::certificate::X509Certificate<'static> {
        let (_, pem) = parse_x509_pem(pem_bytes).unwrap();
        // In test only: leak the DER so we get a 'static cert for assertion convenience.
        let der: &'static [u8] = Box::leak(pem.contents.into_boxed_slice());
        let (_, cert) = x509_parser::certificate::X509Certificate::from_der(der).unwrap();
        cert
    }

    #[test]
    fn formats_san_with_dns_and_ip() {
        let pem = include_bytes!("../tests/fixtures/self_signed_rsa.pem");
        let cert = parse_fixture(pem);
        let san = cert
            .extensions()
            .iter()
            .find(|e| e.oid.to_id_string() == "2.5.29.17")
            .expect("fixture has SAN");
        let value = format_extension(san);
        assert!(value.contains("DNS:test.example.com"));
        assert!(value.contains("DNS:www.test.example.com"));
        assert!(value.contains("IP:127.0.0.1"));
    }

    #[test]
    fn formats_key_usage_with_digital_signature_and_key_encipherment() {
        let pem = include_bytes!("../tests/fixtures/self_signed_rsa.pem");
        let cert = parse_fixture(pem);
        let ku = cert
            .extensions()
            .iter()
            .find(|e| e.oid.to_id_string() == "2.5.29.15")
            .expect("fixture has KeyUsage");
        let value = format_extension(ku);
        assert!(value.contains("Digital Signature"));
        assert!(value.contains("Key Encipherment"));
    }
}
