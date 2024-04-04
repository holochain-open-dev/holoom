import "./style.css";
import { AppAgentWebsocket } from "@holochain/client";
import { HolochainGameIdentityClient } from "@holochain-game-identity/client";
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

async function createClient() {
  const holoClient = await WebSdkApi.connect({
    chaperoneUrl: "http://localhost:24274",
  });
  holoClient.signUp({});

  // Hand off the puppeteer to fill out iframe
  await untilSignedIn(holoClient);

  const gameIdentityClient = new HolochainGameIdentityClient(
    holoClient as unknown as AppAgentWebsocket
  );
  await gameIdentityClient.untilReady();
  return gameIdentityClient;
}

const global = window as any;
global.gameIdentityClientProm = createClient().then((client) => {
  global.gameIdentityClient = client;
});
