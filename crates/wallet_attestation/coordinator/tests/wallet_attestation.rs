use hdk::prelude::*;
use holochain::conductor::api::error::ConductorApiResult;
use holoom_types::{ChainWalletSignature, EvmAddress, EvmSignature, WalletAttestation};
use wallet_attestation_integrity::{evm_signing_message, solana_signing_message};
mod config;
use config::TestSetup;

#[cfg(test)]

#[tokio::test(flavor = "multi_thread")]
async fn checks_validity_of_evm_wallet_attestation() {
    let setup = TestSetup::authority_and_alice().await;

    // Create WalletAttestation for alice at address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

    // First account of seed phrase: test test test test test test test test test test test junk
    let signer_private_key = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    use std::str::FromStr;

    use ethers_signers::{LocalWallet, Signer};
    let signer_wallet = LocalWallet::from_str(signer_private_key).unwrap();
    let wallet_address = signer_wallet.address();
    let wallet_address = EvmAddress::try_from(wallet_address.as_bytes()).unwrap();
    assert_eq!(
        wallet_address.to_checksum(None),
        String::from("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    );
    let message: String = setup
        .alice_call(
            "wallet_attestation",
            "get_evm_wallet_binding_message",
            wallet_address,
        )
        .await
        .unwrap();

    let signature = signer_wallet.sign_message(message).await.unwrap();
    let signature_bytes = signature.to_vec();
    let signature = EvmSignature::try_from(&signature_bytes[..]).unwrap();

    let chain_wallet_signature = ChainWalletSignature::Evm {
        evm_address: wallet_address,
        evm_signature: signature,
    };

    // Genuine attestation should be accepted
    let res: ConductorApiResult<Record> = setup
        .alice_call(
            "wallet_attestation",
            "attest_wallet_signature",
            chain_wallet_signature,
        )
        .await;
    assert!(res.is_ok());

    let prev_action = res.unwrap().action_address().clone();
    let malicious_message =
        evm_signing_message(&wallet_address, fake_agent_pubkey_1(), prev_action.clone());
    let signature = signer_wallet.sign_message(malicious_message).await.unwrap();
    let signature_bytes = signature.to_vec();
    let signature = EvmSignature::try_from(&signature_bytes[..]).unwrap();

    let malicious_attestation = WalletAttestation {
        chain_wallet_signature: ChainWalletSignature::Evm {
            evm_address: wallet_address,
            evm_signature: signature,
        },
        agent: setup.alice_pubkey(),
        prev_action,
    };

    // Malicious attestation should be rejected
    let res: ConductorApiResult<Record> = setup
        .alice_call(
            "wallet_attestation",
            "create_wallet_attestation",
            malicious_attestation,
        )
        .await;
    assert!(res.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn checks_validity_of_solana_wallet_attestation() {
    let setup = TestSetup::authority_and_alice().await;

    // Create WalletAttestation for alice at address oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96

    // First account of seed phrase: test test test test test test test test test test test junk
    let private_key =
        "4Cfc4TJ6dsWwLcw8aJ5uhx7UJKPR5VGXTu2iJr5bVRoTDsxzb6qfJrzR5HNhBcwGwsXqGeHzDR3eUWLr7MRnska8";
    let private_key_bytes = bs58::decode(private_key).into_vec().unwrap();

    use ed25519_dalek::{Signer, SigningKey, SECRET_KEY_LENGTH};

    let signing_key = SigningKey::try_from(&private_key_bytes[..SECRET_KEY_LENGTH]).unwrap();
    let solana_address = signing_key.verifying_key();

    assert_eq!(
        bs58::encode(solana_address.as_bytes()).into_string(),
        String::from("oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96")
    );

    let message: String = setup
        .alice_call(
            "wallet_attestation",
            "get_solana_wallet_binding_message",
            solana_address,
        )
        .await
        .unwrap();
    let solana_signature = signing_key.try_sign(message.as_bytes()).unwrap();

    let chain_wallet_signature = ChainWalletSignature::Solana {
        solana_address: Box::new(solana_address),
        solana_signature,
    };

    // Genuine attestation should be accepted
    let res: ConductorApiResult<Record> = setup
        .alice_call(
            "wallet_attestation",
            "attest_wallet_signature",
            chain_wallet_signature,
        )
        .await;
    assert!(res.is_ok());

    let prev_action = res.unwrap().action_address().clone();
    let malicious_message =
        solana_signing_message(&solana_address, fake_agent_pubkey_1(), prev_action.clone());
    let solana_signature = signing_key.try_sign(malicious_message.as_bytes()).unwrap();

    let malicious_attestation = WalletAttestation {
        chain_wallet_signature: ChainWalletSignature::Solana {
            solana_address: Box::new(solana_address),
            solana_signature,
        },
        agent: setup.alice_pubkey(),
        prev_action,
    };

    // Genuine attestation should be rejected
    let res: ConductorApiResult<Record> = setup
        .alice_call(
            "wallet_attestation",
            "create_wallet_attestation",
            malicious_attestation,
        )
        .await;
    assert!(res.is_err());
}
