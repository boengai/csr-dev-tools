use x509_parser::der_parser::Oid;

pub fn signature_algorithm_name(oid: &Oid) -> String {
    match oid.to_id_string().as_str() {
        // RSA family
        "1.2.840.113549.1.1.5"  => "SHA-1 with RSA".into(),
        "1.2.840.113549.1.1.11" => "SHA-256 with RSA".into(),
        "1.2.840.113549.1.1.12" => "SHA-384 with RSA".into(),
        "1.2.840.113549.1.1.13" => "SHA-512 with RSA".into(),
        // ECDSA family
        "1.2.840.10045.4.3.2"   => "SHA-256 with ECDSA".into(),
        "1.2.840.10045.4.3.3"   => "SHA-384 with ECDSA".into(),
        "1.2.840.10045.4.3.4"   => "SHA-512 with ECDSA".into(),
        // EdDSA
        "1.3.101.112"           => "Ed25519".into(),
        other                   => other.to_string(),
    }
}

pub fn public_key_algorithm_name(oid: &Oid) -> String {
    match oid.to_id_string().as_str() {
        "1.2.840.113549.1.1.1" => "RSA".into(),
        "1.2.840.10045.2.1"    => "ECDSA".into(),
        "1.3.101.112"          => "Ed25519".into(),
        other                  => other.to_string(),
    }
}

pub fn ec_curve_bit_size(curve_oid: &Oid) -> Option<u32> {
    match curve_oid.to_id_string().as_str() {
        "1.2.840.10045.3.1.7" => Some(256), // P-256
        "1.3.132.0.34"        => Some(384), // P-384
        "1.3.132.0.35"        => Some(521), // P-521
        _                     => None,
    }
}

/// Look up an EKU display name by its dotted OID string.
/// This is the single source of truth for EKU labels.
pub fn eku_name_from_str(oid_str: &str) -> Option<&'static str> {
    match oid_str {
        "1.3.6.1.5.5.7.3.1" => Some("Server Authentication"),  // id-kp-serverAuth
        "1.3.6.1.5.5.7.3.2" => Some("Client Authentication"),  // id-kp-clientAuth
        "1.3.6.1.5.5.7.3.3" => Some("Code Signing"),           // id-kp-codeSigning
        "1.3.6.1.5.5.7.3.4" => Some("Email Protection"),       // id-kp-emailProtection
        "1.3.6.1.5.5.7.3.8" => Some("Time Stamping"),          // id-kp-timeStamping
        "1.3.6.1.5.5.7.3.9" => Some("OCSP Signing"),           // id-kp-OCSPSigning
        _                   => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use x509_parser::der_parser::oid;

    #[test]
    fn sha256_rsa_signature_algorithm_name() {
        let oid = oid!(1.2.840.113549.1.1.11);
        assert_eq!(signature_algorithm_name(&oid), "SHA-256 with RSA");
    }

    #[test]
    fn ecdsa_sha384_signature_algorithm_name() {
        let oid = oid!(1.2.840.10045.4.3.3);
        assert_eq!(signature_algorithm_name(&oid), "SHA-384 with ECDSA");
    }

    #[test]
    fn ed25519_signature_algorithm_name() {
        let oid = oid!(1.3.101.112);
        assert_eq!(signature_algorithm_name(&oid), "Ed25519");
    }

    #[test]
    fn rsa_public_key_algorithm() {
        let oid = oid!(1.2.840.113549.1.1.1);
        assert_eq!(public_key_algorithm_name(&oid), "RSA");
    }

    #[test]
    fn ec_curve_p256_bit_size() {
        let oid = oid!(1.2.840.10045.3.1.7);
        assert_eq!(ec_curve_bit_size(&oid), Some(256));
    }

    #[test]
    fn unknown_oid_falls_back_to_string() {
        let oid = oid!(1.2.3.4.5);
        assert_eq!(signature_algorithm_name(&oid), "1.2.3.4.5");
    }
}
