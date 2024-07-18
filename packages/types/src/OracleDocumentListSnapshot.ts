import { ActionHash } from "@holochain/client";
// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { SnapshotInput } from "./SnapshotInput";

export type OracleDocumentListSnapshot = { 
/**
 * The action hash of an OracleDocument that gives a list of identifiers
 */
identifiers_input: SnapshotInput, resolved_documents: ActionHash[], };
