use serde::Serialize;
use x509_parser::der_parser::Oid;
use x509_parser::pem::parse_x509_pem;
use x509_parser::prelude::FromDer;
use x509_parser::public_key::RSAPublicKey;
use x509_parser::time::ASN1Time;
use x509_parser::x509::SubjectPublicKeyInfo;

use crate::extensions::{build_extension_dto, ExtensionDto};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CertificateDecodedDto {
    pub subject: String,
    pub issuer: String,
    pub serial_number: String,
    pub not_before: String,
    pub not_after: String,
    pub signature_algorithm: String,
    pub public_key_algorithm: String,
    pub public_key_size: u32,
    pub extensions: Vec<ExtensionDto>,
}

#[derive(Debug)]
pub struct DecodeError(pub String);

impl std::fmt::Display for DecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for DecodeError {}

pub fn decode_pem(pem: &str) -> Result<CertificateDecodedDto, DecodeError> {
    let (_, pem) = parse_x509_pem(pem.as_bytes())
        .map_err(|e| DecodeError(format!("PEM parse failed: {e}")))?;
    let (_, cert) = x509_parser::certificate::X509Certificate::from_der(&pem.contents)
        .map_err(|e| DecodeError(format!("DER parse failed: {e}")))?;

    let serial_bytes = cert.tbs_certificate.serial.to_bytes_be();
    let serial_number = format_serial(&serial_bytes);

    let not_before = iso8601(cert.validity().not_before);
    let not_after = iso8601(cert.validity().not_after);

    let signature_algorithm =
        crate::algorithms::signature_algorithm_name(&cert.signature_algorithm.algorithm);
    let public_key_algorithm =
        crate::algorithms::public_key_algorithm_name(&cert.tbs_certificate.subject_pki.algorithm.algorithm);
    let public_key_size = compute_public_key_size(&cert.tbs_certificate.subject_pki);

    let extensions: Vec<ExtensionDto> = cert
        .extensions()
        .iter()
        .map(build_extension_dto)
        .collect();

    Ok(CertificateDecodedDto {
        subject: cert.subject().to_string(),
        issuer: cert.issuer().to_string(),
        serial_number,
        not_before,
        not_after,
        signature_algorithm,
        public_key_algorithm,
        public_key_size,
        extensions,
    })
}

fn format_serial(bytes: &[u8]) -> String {
    if bytes.is_empty() {
        return "00".to_string();
    }
    bytes
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect::<Vec<_>>()
        .join(":")
}

fn iso8601(time: ASN1Time) -> String {
    let secs = time.timestamp();
    chrono::DateTime::<chrono::Utc>::from_timestamp(secs, 0)
        .map(|dt| dt.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string())
        .unwrap_or_else(|| "1970-01-01T00:00:00.000Z".to_string())
}

const OID_RSA: &str = "1.2.840.113549.1.1.1";
const OID_ECDSA: &str = "1.2.840.10045.2.1";
const OID_ED25519: &str = "1.3.101.112";

fn compute_public_key_size(spki: &SubjectPublicKeyInfo<'_>) -> u32 {
    let alg_oid = spki.algorithm.algorithm.to_id_string();
    match alg_oid.as_str() {
        OID_RSA => rsa_modulus_bits(&spki.subject_public_key.data).unwrap_or(0),
        OID_ECDSA => ecdsa_curve_bits(&spki.algorithm.parameters).unwrap_or(0),
        OID_ED25519 => 256,
        _ => 0,
    }
}

fn rsa_modulus_bits(spki_bytes: &[u8]) -> Option<u32> {
    let (_, rsa) = RSAPublicKey::from_der(spki_bytes).ok()?;
    // Strip a single leading zero pad byte if present (ASN.1 INTEGER positive padding).
    let modulus = match rsa.modulus.first() {
        Some(0) => &rsa.modulus[1..],
        _ => rsa.modulus,
    };
    if modulus.is_empty() {
        return None;
    }
    Some((modulus.len() as u32).checked_mul(8)?)
}

fn ecdsa_curve_bits(parameters: &Option<x509_parser::der_parser::asn1_rs::Any<'_>>) -> Option<u32> {
    let any = parameters.as_ref()?;
    let oid: Oid = any.as_oid().ok()?;
    crate::algorithms::ec_curve_bit_size(&oid)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_self_signed_rsa_fixture() {
        let pem = include_str!("../tests/fixtures/self_signed_rsa.pem");
        let dto = decode_pem(pem).expect("fixture should decode");
        assert_eq!(dto.public_key_algorithm, "RSA");
        assert_eq!(dto.public_key_size, 2048);
        assert!(dto.signature_algorithm.contains("SHA-256"));
        assert!(dto.subject.contains("test.example.com"));
        assert!(dto.not_before.starts_with("2026-02-24T09:45:20"));
        assert!(!dto.extensions.is_empty());
    }

    #[test]
    fn decodes_short_lived_fixture() {
        let pem = include_str!("../tests/fixtures/short_lived.pem");
        let dto = decode_pem(pem).expect("fixture should decode");
        assert!(dto.subject.contains("expired.example.com"));
        assert!(dto.not_before.starts_with("2026-02-24"));
        assert!(dto.not_after.starts_with("2026-02-25"));
    }

    #[test]
    fn rejects_garbage_input() {
        assert!(decode_pem("not a pem at all").is_err());
    }
}
