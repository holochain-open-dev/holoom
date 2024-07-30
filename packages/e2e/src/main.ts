import "./style.css";
import { AppWebsocket, encodeHashToBase64 } from "@holochain/client";
import {
  HoloomClient,
  FaceitAuthFlowClient,
  ExternalIdAttestationRequestorClient,
  EvmBytesSignatureRequestorClient,
  decodeAppEntry,
} from "@holoom/client";
import WebSdkApi, { ChaperoneState } from "@holo-host/web-sdk";

function untilSignedIn(holoClient: WebSdkApi) {
  return new Promise<void>((resolve) => {
    const handleHoloChaperoneStateChange = (state: ChaperoneState) => {
      if (state.uiState.isVisible) return;
      if (!state.agentState.isAvailable) return;

      if (state.agentState.isAnonymous) holoClient.signUp({});
      else resolve();
    };
    holoClient.on("chaperone-state", handleHoloChaperoneStateChange);
    if (holoClient.chaperoneState)
      handleHoloChaperoneStateChange(holoClient.chaperoneState);
  });
}

const global = window as any;

async function createClients() {
  console.log("creating clients");
  const holo = await WebSdkApi.connect({
    chaperoneUrl: "http://localhost:24274",
  });
  holo.signUp({});

  // Hand off the puppeteer to fill out iframe
  await untilSignedIn(holo);
  global.agentPubKeyB64 = encodeHashToBase64(holo.myPubKey);
  const holoom = new HoloomClient(holo as unknown as AppWebsocket);

  await holoom.untilReady();

  const faceitAuthFlow = new FaceitAuthFlowClient({
    redirectUri: "http://localhost:5173/auth/callback/faceit",
    authEndpoint: "http://localhost:3002/accounts",
    tokenEndpoint: "http://localhost:3002/token",
    clientId: "mock-client-id",
    clientSecret: "mock-client-secret",
  });
  const externalIdRequestor = new ExternalIdAttestationRequestorClient(
    holo as unknown as AppWebsocket
  );
  const evmSignatureRequestor = new EvmBytesSignatureRequestorClient(
    holo as unknown as AppWebsocket
  );
  if (window.location.pathname.includes("/auth/callback")) {
    const { code, codeVerifier } = faceitAuthFlow.getCodes();
    global.externalIdRequestProm = externalIdRequestor
      .requestExternalIdAttestation(codeVerifier!, code!)
      .then(decodeAppEntry);
  } else {
  }
  return {
    holo,
    holoom,
    faceitAuthFlow,
    externalIdRequestor,
    evmSignatureRequestor,
  };
}

global.clientsProm = createClients()
  .then((clients) => {
    global.clients = clients;
  })
  .catch((err) => {
    console.error("Failed to create clients", err);
  });
