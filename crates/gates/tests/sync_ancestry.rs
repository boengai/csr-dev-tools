//! `pr_source::brings_main` against a throwaway git repository: does a PR
//! bring `main` commits its base lacks?

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use gates::pr_source::brings_main;

fn git(repo: &Path, args: &[&str]) -> Result<(), String> {
    let output = Command::new("git")
        .args([
            "-c",
            "user.name=gates",
            "-c",
            "user.email=gates@example.invalid",
            "-c",
            "commit.gpgsign=false",
        ])
        .args(args)
        .current_dir(repo)
        .output()
        .map_err(|error| error.to_string())?;
    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

/// main and develop part after `start`; `sync` merges main into develop;
/// `topic` is cut from develop; `late-topic` is cut from `sync`, as a branch
/// cut from develop after the sync has landed.
fn history(name: &str) -> Result<PathBuf, String> {
    let repo = std::env::temp_dir().join(format!("gates-{name}-{}", std::process::id()));
    if repo.exists() {
        fs::remove_dir_all(&repo).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&repo).map_err(|error| error.to_string())?;
    git(&repo, &["init", "-q", "-b", "develop"])?;
    git(&repo, &["commit", "-q", "--allow-empty", "-m", "start"])?;
    git(&repo, &["branch", "main"])?;
    git(&repo, &["switch", "-q", "main"])?;
    git(
        &repo,
        &["commit", "-q", "--allow-empty", "-m", "fix on main"],
    )?;
    git(&repo, &["switch", "-q", "develop"])?;
    git(
        &repo,
        &["commit", "-q", "--allow-empty", "-m", "work on develop"],
    )?;
    git(&repo, &["branch", "topic"])?;
    git(&repo, &["switch", "-q", "-c", "sync"])?;
    git(&repo, &["merge", "-q", "--no-ff", "--no-edit", "main"])?;
    git(&repo, &["branch", "late-topic"])?;
    Ok(repo)
}

#[test]
fn a_branch_brings_main_only_when_main_has_commits_the_base_lacks() {
    let repo = history("brings-main").unwrap();
    assert_eq!(brings_main(&repo, "main", "develop", "sync"), Ok(true));
    assert_eq!(brings_main(&repo, "main", "develop", "topic"), Ok(false));
    // After the sync lands, develop holds main's tip: a branch cut from it
    // brings nothing from main.
    assert_eq!(brings_main(&repo, "main", "sync", "late-topic"), Ok(false));
    fs::remove_dir_all(&repo).unwrap();
}

#[test]
fn a_git_error_is_an_error_not_a_sync() {
    let repo = history("git-error").unwrap();
    assert!(brings_main(&repo, "no-such-ref", "develop", "sync").is_err());
    assert!(brings_main(&repo, "main", "no-such-ref", "sync").is_err());
    fs::remove_dir_all(&repo).unwrap();
}
