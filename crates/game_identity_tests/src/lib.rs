use game_identity_types::GameIdentityDnaProperties;
use hdk::prelude::*;
use holochain::{prelude::DnaFile, sweettest::SweetDnaFile};

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
