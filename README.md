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

### Holoom Rocket Server

Provides a REST API wrapper for a Holoom conductor instance (usually the authority agent). This is useful for building services around a Holoom network that are intended to be accessed without requiring ownership of an agent within the network.

## The Authority Agent

Each Holoom network is intialised with an authority agent specified in the network's DNA properties. The role of the authority agent is to maintain a registry of unique usernames, and is expected to be run on a server maintained by the instigator of the network. The authority agent is considered to be a partially trusted node in that users can validate its correct execution, but cannot prevent its downtime or censorship decisions.

## Testing

### `crates/holoom_dna_tests`

This provides coverage for the holoom hApp's various zomes, and can be invoked locally using:

```
npm run test:dna
```

### `packages/e2e`

This provides coverage for using the hApp in conjunction with the `@holoom/client` and `holoom_rocket_server` components. To run these tests locally, docker should be running, and a one-time setup script needs invoking:

```
scripts/build_rocket_builder.sh
```

The above script enables caching of `holoom_rocket_server` build artefacts. (CI doesn't use this.) The full build and tests can then be invoked via:

```
npm run test:e2e
```

## API documents 

[Holoom API docs](https://holochain-open-dev.github.io/holoom)

