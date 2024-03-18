use game_identity_tests::game_identity_dna_with_authority;
use game_identity_types::SignableBytes;
use hdk::prelude::fake_agent_pubkey_1;
use holochain::{conductor::config::ConductorConfig, prelude::Signature, sweettest::*};
use holochain_keystore::AgentPubKeyExt;

#[tokio::test(flavor = "multi_thread")]
async fn sign_message_verify_signature() {
    let dna = game_identity_dna_with_authority(&fake_agent_pubkey_1()).await;

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
