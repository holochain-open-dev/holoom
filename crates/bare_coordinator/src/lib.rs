use hdk::prelude::*;
use typeshare::typeshare;

#[hdk_extern]
pub fn get_record(action_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(action_hash, GetOptions::network())
}

/// Input to the `create_app_entry_raw` function
#[derive(Serialize, Deserialize, Debug)]
#[typeshare]
pub struct CreateAppEntryRawInput {
    /// The index of the zome that defines the entry type
    pub zome_index: ZomeIndex,
    /// The index of the entry definition within the zome
    pub entry_def_index: EntryDefIndex,
    /// The msgpack serialised app entry content
    pub entry_bytes: SerializedBytes,
}

/// Directly exposes the hdk functionality for creating entries. This is useful for validation
/// logic tests, because it removes the need for entry coordinator zomes to define create_* methods
/// for unintended actions, merely for the sake of asserting fail cases.
///
/// For now, assumes all entries are public
#[hdk_extern]
pub fn create_app_entry_raw(input: CreateAppEntryRawInput) -> ExternResult<ActionHash> {
    let create_input = CreateInput {
        entry_location: EntryDefLocation::App(AppEntryDefLocation {
            zome_index: input.zome_index,
            entry_def_index: input.entry_def_index,
        }),
        entry: Entry::App(AppEntryBytes(input.entry_bytes)),
        entry_visibility: EntryVisibility::default(),
        chain_top_ordering: ChainTopOrdering::default(),
    };
    create(create_input)
}

/// Directly exposes the hdk functionality for deleting entries. This is useful for validation
/// logic tests, because it removes the need for entry coordinator zomes to define delete_* methods
/// for unintended actions, merely for the sake of asserting fail cases.
#[hdk_extern]
pub fn delete_entry_raw(action_hash: ActionHash) -> ExternResult<ActionHash> {
    let delete_input = DeleteInput {
        deletes_action_hash: action_hash,
        chain_top_ordering: ChainTopOrdering::default(),
    };
    delete(delete_input)
}

/// Input to the `create_link_raw` function
#[derive(Serialize, Deserialize, Debug)]
#[typeshare]
pub struct CreateLinkRawInput {
    /// The 'form' address of the link
    base_address: AnyLinkableHash,
    /// The 'to' address of the link
    target_address: AnyLinkableHash,
    /// The index of the zome in which the link was defined
    zome_index: ZomeIndex,
    /// The index of the link definition within the zome
    link_type: LinkType,
    /// Freeform data attached to the link
    tag: LinkTag,
}

/// Directly exposes the hdk functionality for creating links. This is useful for validation logic
/// tests, because it removes the need for entry coordinator zomes to define create_* methods for
/// unintended actions, merely for the sake of asserting fail cases.
#[hdk_extern]
pub fn create_link_raw(input: CreateLinkRawInput) -> ExternResult<ActionHash> {
    let input = CreateLinkInput {
        base_address: input.base_address,
        target_address: input.target_address,
        zome_index: input.zome_index,
        link_type: input.link_type,
        tag: input.tag,
        chain_top_ordering: ChainTopOrdering::default(),
    };
    HDK.with(|h| h.borrow().create_link(input))
}

/// Directly exposes the hdk functionality for deleting links. This is useful for validation logic
/// tests, because it removes the need for entry coordinator zomes to define delete_* methods for
/// unintended actions, merely for the sake of asserting fail cases.
#[hdk_extern]
pub fn delete_link_raw(create_link_action_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_link(create_link_action_hash)
}

#[hdk_extern]
pub fn get_chain_status(agent: AgentPubKey) -> ExternResult<AgentActivity> {
    get_agent_activity(agent, ChainQueryFilter::default(), ActivityRequest::Status)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetChainSegmentPayload {
    pub agent: AgentPubKey,
    pub start: u32,
    pub end: u32,
}

#[hdk_extern]
pub fn get_chain_segment(payload: GetChainSegmentPayload) -> ExternResult<AgentActivity> {
    let query = ChainQueryFilter::default()
        .descending()
        .include_entries(true)
        .sequence_range(ChainQueryFilterRange::ActionSeqRange(
            payload.start,
            payload.end,
        ));

    get_agent_activity(payload.agent, query, ActivityRequest::Full)
}
