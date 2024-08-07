import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';


export function create_attestation(cell:CallableCell,input:any):Promise<Record>{
    return cell.callZome({
        zome_name: "username_registry", //"external_attestation"
        fn_name: "create_external_id_attestation",
        payload: input
    })
}