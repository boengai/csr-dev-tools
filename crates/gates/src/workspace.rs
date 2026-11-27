//! The workspace as the gates see it: its members, each in a layer
//! (ADR-0035 §2), read from `cargo metadata --no-deps`.

use std::path::{Path, PathBuf};

use cargo_metadata::{MetadataCommand, Package};

/// ADR-0035's nine layers, plus what sits outside them.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Layer {
    App,
    Tool {
        key: String,
    },
    Ui,
    Platform,
    Bridges,
    Persist,
    Registry,
    Logic {
        name: String,
    },
    Worker {
        name: String,
    },
    /// The `gates` crate: test-only, outside the layers.
    Gates,
    /// A must-fail fixture of the `gates` crate.
    Fixture,
    /// React's `wasm/crates/<name>`, gated only once split.
    Wasm {
        name: String,
    },
    /// Under `crates/` but in no layer.
    Unknown,
}

impl Layer {
    /// The layer of a member, from its directory relative to the root.
    pub fn of(dir: &str) -> Self {
        let parts: Vec<&str> = dir.split('/').collect();
        match parts.as_slice() {
            ["crates", "app"] => Self::App,
            ["crates", "ui"] => Self::Ui,
            ["crates", "platform"] => Self::Platform,
            ["crates", "bridges"] => Self::Bridges,
            ["crates", "persist"] => Self::Persist,
            ["crates", "registry"] => Self::Registry,
            ["crates", "gates"] => Self::Gates,
            ["crates", "gates", "fixtures", ..] => Self::Fixture,
            ["crates", "tools", key] => Self::Tool {
                key: (*key).to_owned(),
            },
            ["crates", "logic", name] => Self::Logic {
                name: (*name).to_owned(),
            },
            ["crates", "workers", name] => Self::Worker {
                name: (*name).to_owned(),
            },
            ["wasm", "crates", name] => Self::Wasm {
                name: (*name).to_owned(),
            },
            _ => Self::Unknown,
        }
    }

    /// The package name ADR-0035 §12 gives a member of this layer, if fixed.
    pub fn package_name(&self) -> Option<String> {
        match self {
            Self::App => Some("app".into()),
            Self::Ui => Some("ui".into()),
            Self::Platform => Some("platform".into()),
            Self::Bridges => Some("bridges".into()),
            Self::Persist => Some("persist".into()),
            Self::Registry => Some("registry".into()),
            Self::Gates => Some("gates".into()),
            Self::Tool { key } => Some(format!("tool-{key}")),
            Self::Logic { name } => Some(format!("logic-{name}")),
            Self::Worker { name } => Some(format!("worker-{name}")),
            Self::Fixture | Self::Wasm { .. } | Self::Unknown => None,
        }
    }
}

#[derive(Clone, Debug)]
pub struct Member {
    /// Its directory relative to the workspace root, with `/` separators.
    pub dir: String,
    pub layer: Layer,
    pub package: Package,
}

impl Member {
    pub fn name(&self) -> &str {
        &self.package.name
    }
}

#[derive(Clone, Debug)]
pub struct Workspace {
    pub root: PathBuf,
    pub members: Vec<Member>,
}

impl Workspace {
    /// Reads the workspace whose root manifest is in `root`.
    pub fn load(root: &Path) -> Result<Self, cargo_metadata::Error> {
        let metadata = MetadataCommand::new()
            .manifest_path(root.join("Cargo.toml"))
            .no_deps()
            .other_options(vec!["--offline".to_owned()])
            .exec()?;
        let root_dir = metadata.workspace_root.clone().into_std_path_buf();
        let members = metadata
            .workspace_packages()
            .into_iter()
            .map(|package| {
                let manifest = package.manifest_path.clone().into_std_path_buf();
                let dir = manifest
                    .parent()
                    .and_then(|dir| dir.strip_prefix(&root_dir).ok())
                    .map_or_else(String::new, |dir| dir.to_string_lossy().replace('\\', "/"));
                Member {
                    layer: Layer::of(&dir),
                    dir,
                    package: package.clone(),
                }
            })
            .collect();
        Ok(Self {
            root: root_dir,
            members,
        })
    }

    pub fn member(&self, name: &str) -> Option<&Member> {
        self.members.iter().find(|member| member.name() == name)
    }

    /// The gated packages (ADR-0036 §1): every member under `crates/` but the
    /// fixtures, and each `wasm/crates` wrapper that depends on a logic crate.
    pub fn gated(&self) -> Vec<&Member> {
        self.members
            .iter()
            .filter(|member| match member.layer {
                Layer::Fixture => false,
                Layer::Wasm { .. } => member
                    .package
                    .dependencies
                    .iter()
                    .any(|dep| dep.name.starts_with("logic-")),
                _ => member.dir.starts_with("crates/"),
            })
            .collect()
    }
}
