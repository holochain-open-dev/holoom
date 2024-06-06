use hdi::prelude::*;

pub fn deserialize_record_entry<O>(record: Record) -> ExternResult<O>
where
    O: TryFrom<SerializedBytes, Error = SerializedBytesError>,
{
    let entry: O = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "Entry not present in Record".into()
        )))?;
    Ok(entry)
}

pub fn hash_identifier(identifier: String) -> ExternResult<EntryHash> {
    #[derive(SerializedBytes, Serialize, Debug, Deserialize)]
    struct SerializableIdentifier(String);

    let bytes = SerializedBytes::try_from(SerializableIdentifier(identifier))
        .map_err(|err| wasm_error!(err))?;
    hash_entry(Entry::App(AppEntryBytes(bytes)))
}
