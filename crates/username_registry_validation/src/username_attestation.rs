use hdi::prelude::*;
use holoom_types::UsernameAttestation;

pub fn validate_create_username_attestation(
    action: EntryCreationAction,
    username_attestation: UsernameAttestation,
) -> ExternResult<ValidateCallbackResult> {
    // Username length is 6-32 characters
    let username_len = username_attestation.username.chars().count();
    if !(6..=32).contains(&username_len) {
        return Ok(ValidateCallbackResult::Invalid(
            "Username must be between 6-32 characters".into(),
        ));
    }

    let author_activity = must_get_agent_activity(
        action.author().clone(),
        ChainFilter::new(action.prev_action().clone()).include_cached_entries(),
    )?;
    let created_usernames: Vec<UsernameAttestation> = author_activity
        .into_iter()
        .filter_map(
            |agent_activity| match agent_activity.action.action().action_type() {
                ActionType::Create => agent_activity
                    .action
                    .clone()
                    .action()
                    .entry_type()
                    .and_then(|entry_type: &EntryType| match entry_type.clone() {
                        EntryType::App(app_entry_def) => {
                            match (app_entry_def.zome_index, app_entry_def.entry_index) {
                                (ZomeIndex(0), EntryDefIndex(0)) => Some(agent_activity),
                                _ => None,
                            }
                        }
                        _ => None,
                    }),
                _ => None,
            },
        )
        .filter_map(|agent_activity| {
            agent_activity
                .action
                .action()
                .entry_data()
                .and_then(|(entry_hash, ..)| {
                    must_get_entry(entry_hash.clone())
                        .ok()
                        .and_then(|entry| UsernameAttestation::try_from(entry.as_content()).ok())
                })
        })
        .collect();

    // Each username is unique
    let identical_usernames_count = created_usernames
        .clone()
        .into_iter()
        .filter(|ua| ua.username == username_attestation.username)
        .count();

    if identical_usernames_count > 0 {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "Username {:} has already been registered",
            username_attestation.username
        )));
    }

    // Each agent is unique
    let identical_agents_count = created_usernames
        .clone()
        .iter()
        .filter(|ua| ua.agent == username_attestation.agent)
        .count();

    if identical_agents_count > 0 {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "Agent {:} has already set a Username",
            username_attestation.agent
        )));
    }

    Ok(ValidateCallbackResult::Valid)
}
