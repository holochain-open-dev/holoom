use hdk::prelude::*;

/// Returns the monorepo git commit revision that was injected at build time.
#[hdk_extern]
pub fn git_rev(_: ()) -> ExternResult<String> {
    Ok(env!("GIT_HASH").to_string())
}
