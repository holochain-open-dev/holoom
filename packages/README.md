External Id Attestation
-----------------------

This feature allows a user to register an ID from an external system and given external verification the authority agent will make an attestation and associate the ID with a Holochain ``AgentPubKey``. Two additional fields (``display_name`` and ``request_id``) give the attestation object more uniqueness and traceability. A noticeable behaviour is that a user can register multiple external_id's against different AgentPubKeys. \
For more details on a user agent workflows see: [User Requestor Client](classes/client_src.ExternalIdAttestationRequestorClient.html) \
For the authority agent workflows see: [Authority Attestor Client](classes/authority_src.ExternalIdAttestorClient.html) 


Username Attestation
--------------------

This feature allows a user to register an username against a Holochain AgentPubKey with the attestation of the Authority agent. Usermetadata attribute-links allow the user to attach any related metadata. \
See related functions: [User Holoom client](classes/client_src.HoloomClient.html)


Wallet Attestation
--------------------

This feature allows a user to register a blockchain wallet (Ethereum / Solana)  Holochain AgentPubKey with signatures and validation from the same users source chain. \
See related functions: [User Holoom client](classes/client_src.HoloomClient.html)


Recipes
-------

The Recipes feature defines execution programs that combine functionality from other features /zomes in the holoom stack such as Oracle documents, evm bytes signing, attestations etc
structure of a Recipe:

```
Recipe = {
  trusted_authors: AgentPubKey[];
  arguments: Array<[string, RecipeArgumentType]>;
  instructions: Array<[string, RecipeInstruction]>;
};
```
after you create and execute a recipe, you get back a RecipeExecution record with the following structure:
```
RecipeExecution = {
  recipe_ah: ActionHash;
  arguments: Array<RecipeArgument>;
  instruction_executions: Array<RecipeInstructionExecution>;
  output: string;
};
```
The RecipeExecution action hashes are later used with evm signing offers

see recipe functions: [User Holoom client](classes/client_src.HoloomClient.html) \
See related RecipeExecution client functions : [EVM bytes request client](classes/client_src.evmBytesSignatureRequestorClient.html) \
and related RecipeExecution authority functions: [EVM bytes signing client](classes/authority_src.evmBytesSignerClient.html)
