//! Common components. As in React, none takes a `class` or `style` prop: a
//! variant is an enum, and layout tweaks go on a wrapper (CLAUDE.md).
mod button;
mod card;
pub mod code_input;
mod emoji;
mod fields;
mod select;
mod status;
pub mod upload;
mod toast;

pub use button::{Button, ButtonSize, ButtonVariant, CheckboxInput, CopyButton, ToggleButton};
pub use card::PageCard;
pub use code_input::CodeInput;
pub use emoji::{Emoji, NotoEmoji};
pub use fields::{CodeOutput, Pane, SplitPanel, TextAreaField};
pub use select::{Select, SelectItem};
pub use status::{StatusMessage, ToolStatus};
pub use upload::UploadInput;
pub use toast::{use_toasts, ToastKind, ToastProvider};
