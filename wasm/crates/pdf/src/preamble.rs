/// Fixed Typst preamble prepended to every compiled document.
///
/// v1: hard-coded page size, fonts, paragraph justification.
/// Theming is future work — see spec §"Typst preamble".
pub const PREAMBLE: &str = r#"
#set page(paper: "us-letter", margin: 1in)
#set par(justify: true, leading: 0.65em)
#set text(font: "New Computer Modern", size: 11pt)
#set heading(numbering: none)
#show raw: set text(font: "JetBrains Mono", size: 9pt)

"#;
