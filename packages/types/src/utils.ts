import { AppClient } from "@holochain/client";

/**
 * Recursively traverses an object replacing any node.js `Buffer`s with
 * `Uint8Array`s. This is mostly for the benefit of having a consistent
 * behaviour when testing in node vs the browser.
 *
 * @param obj Any input is valid
 * @returns The equivalent to the input with all buffers replaced.
 */
export function convertBuffersToUint8Arrays<T>(obj: T): T {
  if (Buffer.isBuffer(obj)) {
    return new Uint8Array(obj) as T;
  } else if (Array.isArray(obj)) {
    return obj.map(convertBuffersToUint8Arrays) as T;
  } else if (obj !== null && typeof obj === "object") {
    for (const key in obj) {
      type O = typeof obj;
      type K = keyof O;
      obj[key as K] = convertBuffersToUint8Arrays(obj[key as K]) as O[K];
    }
  }
  return obj;
}

export async function callZomeFnHelper(
  client: AppClient,
  role_name: string,
  zome_name: string,
  fn_name: string,
  payload: unknown
) {
  const result = await client.callZome({
    role_name,
    zome_name,
    fn_name,
    payload,
  });
  return convertBuffersToUint8Arrays(result) as any;
}
