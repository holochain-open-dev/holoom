use hdk::prelude::*;

//#[hdk_extern]
pub fn get_record(action_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(action_hash, GetOptions::network())
}

//#[hdk_extern]
pub fn get_chain_status(agent: AgentPubKey) -> ExternResult<AgentActivity> {
    get_agent_activity(agent, ChainQueryFilter::default(), ActivityRequest::Status)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetChainSegmentPayload {
    pub agent: AgentPubKey,
    pub start: u32,
    pub end: u32,
}

//#[hdk_extern]
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
