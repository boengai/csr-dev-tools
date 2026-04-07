mod block;
mod emit;
mod inline;

// Public for testing across modules
pub use block::parse_blocks;
pub use emit::blocks_to_html;
