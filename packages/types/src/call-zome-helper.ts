import { AppClient } from "@holochain/client";
import { ValidationError } from "./errors";

const MISSING_ACTION_REGEX =
  /Source chain error: InvalidCommit error: The dependency AnyDhtHash\(uhCkk[^\)]{48}\) was not found on the DHT/;

export async function callZomeAndTransformError(
  client: AppClient,
  role_name: string,
  zome_name: string,
  fn_name: string,
  payload: unknown
) {
  const invoke = () =>
    client
      .callZome({
        role_name,
        zome_name,
        fn_name,
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  try {
    const result = await invoke();
    return result;
  } catch (err) {
    if (err instanceof Error && MISSING_ACTION_REGEX.test(err.message)) {
      // This appears to be some timing related error. So far I've only seen
      // it occur in CI. For now we'll allow one retry after a short wait as a
      // work around.
      await new Promise((r) => setTimeout(r, 500));
      const result = await invoke();
      return result;
    }
    throw err;
  }
}
