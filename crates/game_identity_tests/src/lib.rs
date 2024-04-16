use std::time::Duration;

use game_identity_types::GameIdentityDnaProperties;
use hdk::prelude::*;
use holochain::{
    conductor::{api::error::ConductorApiResult, config::ConductorConfig},
    prelude::DnaFile,
    sweettest::{consistency, SweetAgents, SweetCell, SweetConductorBatch, SweetDnaFile},
};

#[cfg(test)]
mod tests;

async fn load_dna() -> DnaFile {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../workdir/game_identity.dna");

    SweetDnaFile::from_bundle(&dna_path).await.unwrap()
}

pub async fn game_identity_dna_with_authority(authority_agent: &AgentPubKey) -> DnaFile {
    let dna = load_dna().await;
    let properties = SerializedBytes::try_from(GameIdentityDnaProperties {
        authority_agent: authority_agent.to_string(),
    })
    .unwrap();
    dna.update_modifiers(DnaModifiersOpt {
        network_seed: None,
        properties: Some(properties),
        origin_time: None,
        quantum_time: None,
    })
}

pub struct TestSetup {
    pub conductors: SweetConductorBatch,
    cells: Vec<SweetCell>,
}

impl TestSetup {
    pub async fn new(user_count: usize) -> Self {
        // Set up conductors
        let mut conductors: SweetConductorBatch =
            SweetConductorBatch::from_config(1 + user_count, ConductorConfig::default()).await;

        let authority_agent_pubkey = SweetAgents::one(conductors[0].keystore()).await;

        let dnas = &[game_identity_dna_with_authority(&authority_agent_pubkey).await];

        let authority_app = conductors[0]
            .setup_app_for_agent("game_identity", authority_agent_pubkey.clone(), dnas)
            .await
            .unwrap();
        let (authority_cell,) = authority_app.into_tuple();
        let mut cells = Vec::from([authority_cell]);
        for i in 1..1 + user_count {
            let user_app = conductors[i]
                .setup_app("game_identity", dnas)
                .await
                .unwrap();
            let (user_cell,) = user_app.into_tuple();
            cells.push(user_cell);
        }

        TestSetup { conductors, cells }
    }

    pub async fn authority_only() -> Self {
        Self::new(0).await
    }

    pub async fn authority_and_alice() -> Self {
        Self::new(1).await
    }

    pub async fn authority_and_alice_bob() -> Self {
        Self::new(2).await
    }

    pub async fn authority_call<I, O>(
        &self,
        zome_name: &str,
        fn_name: &str,
        payload: I,
    ) -> ConductorApiResult<O>
    where
        I: serde::Serialize + std::fmt::Debug,
        O: serde::de::DeserializeOwned + std::fmt::Debug,
    {
        self.conductors[0]
            .call_fallible(&self.cells[0].zome(zome_name), fn_name, payload)
            .await
    }

    pub async fn alice_call<I, O>(
        &self,
        zome_name: &str,
        fn_name: &str,
        payload: I,
    ) -> ConductorApiResult<O>
    where
        I: serde::Serialize + std::fmt::Debug,
        O: serde::de::DeserializeOwned + std::fmt::Debug,
    {
        self.conductors[1]
            .call_fallible(&self.cells[1].zome(zome_name), fn_name, payload)
            .await
    }

    pub async fn bob_call<I, O>(
        &self,
        zome_name: &str,
        fn_name: &str,
        payload: I,
    ) -> ConductorApiResult<O>
    where
        I: serde::Serialize + std::fmt::Debug,
        O: serde::de::DeserializeOwned + std::fmt::Debug,
    {
        self.conductors[2]
            .call_fallible(&self.cells[2].zome(zome_name), fn_name, payload)
            .await
    }

    pub fn authority_pubkey(&self) -> AgentPubKey {
        self.cells[0].agent_pubkey().clone()
    }

    pub fn alice_pubkey(&self) -> AgentPubKey {
        self.cells[1].agent_pubkey().clone()
    }

    pub fn bob_pubkey(&self) -> AgentPubKey {
        self.cells[1].agent_pubkey().clone()
    }

    pub async fn consistency(&self) {
        consistency(self.cells.iter(), 100, Duration::from_secs(10)).await;
    }
}
