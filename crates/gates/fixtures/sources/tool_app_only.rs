// tool-app-only: a Tool reaches ui's app-only dialog and modal frame.
use ui::primitives::{dialog::Dialog, select::Select};

fn View() -> Element {
    rsx! {
        ui::frame::ModalFrame {}
    }
}
