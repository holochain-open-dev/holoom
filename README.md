# Holoom

Tools for weaving blockchain data into holochain. Initial implementations have been in blockchain gaming.

## Key Components

### Holoom hApp

A Holoom hApp network provides a space in which users can:

- Register a unique username to their holochain agent (made possible by an authority agent)
- Bind their various blockchain wallets to their agent with use of signatures
- Curate freeform metadata strings linked to their own agent

### `@holoom/client`

An npm library that provides helpers for interacting with a Holoom hApp agent, whether that be via the holo network, or with a conductor directly.

### `@holoom/authority`

Provides several micro-service-like nodeJS applications that can be attached to an authority agent enabling:

- REST queries of the user registry
- Fulfillment of username attestation requests
- Fulfillment of External ID attestation requests

## The Authority Agent

Any agent can offer to act as an authority, whether it be on username uniqueness or ownership of an external ID. Where or not an authority is respected is determined at point of use. E.g. If a user were an interested in executing a recipe for a specific EVM signing offer, they would only be interested in external IDs attested by authorities specified in the trust list of that recipe.

## Testing

### `crates/holoom_dna_tests`

This provides coverage for the holoom hApp's various zomes, and can be invoked locally using:

```
npm run test:dna
```

### `packages/tryorama`

This provides coverage for using the hApp in conjunction with the `@holoom/client` and `@holoom/authority` components. The full build and tests can then be invoked via:

```
npm run test:tryorama
```

## API documents

[Holoom API docs](https://holochain-open-dev.github.io/holoom)
