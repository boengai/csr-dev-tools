// tool-entry: two Tool entries in one Tool crate.
ui::tool_entry!(HashGeneratorEntry, hash_generator, view);
wasm_split::lazy_loader!(extern "hash_generator_again" fn other() -> Element);
