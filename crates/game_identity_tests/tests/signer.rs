use game_identity_types::SignableBytes;
use holochain::{
    conductor::config::ConductorConfig,
    prelude::{DnaFile, Signature},
    sweettest::*,
};
use holochain_keystore::AgentPubKeyExt;

pub async fn load_dna() -> DnaFile {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../workdir/game_identity.dna");

    SweetDnaFile::from_bundle(&dna_path).await.unwrap()
}

#[tokio::test(flavor = "multi_thread")]
async fn sign_message_verify_signature() {
    let dna = load_dna().await;

    // Set up conductors
    let mut conductor = SweetConductor::from_config(ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductor.keystore()).await;
    let app = conductor
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), &[dna])
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Alice can sign a message
    let message = SignableBytes([0u8; 2048].to_vec());
    let signature: Signature = conductor
        .call(&alice.zome("signer"), "sign_message", message.clone())
        .await;

    // Signature is valid
    let is_valid = alice
        .agent_pubkey()
        .clone()
        .verify_signature(&signature, message)
        .await;

    assert!(is_valid);
}
