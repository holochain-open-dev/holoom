import { runScenario } from "@holochain/tryorama";
import { expect, test, vi } from "vitest";
import { setupPlayer } from "../utils/setup-happ";
import { AppClient } from "@holochain/client";
import {
  ExternalIdAttestorClient,
  AccessTokenAssessor,
  ExternalIdAttestation,
} from "@holoom/authority";
import {
  decodeAppEntry,
  ExternalIdAttestationRequestorClient,
  forMs,
} from "@holoom/client";

// This service is is intended to be run as a sandboxed microservice, but that
// is not a concern of this test, hence we cheat and instantiate locally.
function createExternalIdAttestorService(appClient: AppClient) {
  const tokenEndpoint = "https://some-auth-provider.com/token";
  const userInfoEndpoint = "https://some-auth-provider.com/userinfo";

  // Mock fetch from authority provider
  global.fetch = vi.fn((url, _init) => {
    let content;
    switch (url) {
      case tokenEndpoint:
        content = { access_token: "mock-token" };
        break;
      case userInfoEndpoint:
        content = { guid: "mock-guid", nickname: "molly" };
        break;
      default:
        throw new Error("Unexpected URL in mocks");
    }
    return Promise.resolve({ json: () => Promise.resolve(content) }) as any;
  });

  const accessTokenAssessor = new AccessTokenAssessor({
    tokenEndpoint,
    clientSecret: "whatever",
    redirectUri:
      "https://my-holo-hosted-happ.com/auth/callback/some-provider-name",
    userInfoEndpoint,
    externalIdFieldName: "guid",
    displayNameFieldName: "nickname",
  });

  const externalIdAttestorClient = new ExternalIdAttestorClient(
    appClient,
    accessTokenAssessor
  );

  return {
    setup: () => externalIdAttestorClient.setup(),
    destroy: () => externalIdAttestorClient.destroy(),
  };
}

test("e2e external-id", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Open authority to ingest attestation requests
    await authorityCoordinators.usernameRegistry.externalIdAuthoritySetup();

    const externalIdAttestationRequesterClient =
      new ExternalIdAttestationRequestorClient(
        alice.appWs as AppClient,
        authority.agentPubKey
      );

    // Listens for incoming request signals
    const externalIdAttestorService = createExternalIdAttestorService(
      authority.appWs as AppClient
    );
    await externalIdAttestorService.setup();

    // This PKCE Authorisation Code flow is intended to be run in a browser.
    // This test doesn't cover browser redirect behaviour, and instead we'll
    // pretend that:
    // The browser saved to sessionStorage:
    const codeVerifier = "some-random-secret";
    // And then entered the flow by navigating to:
    // "https://some-auth-provider.com" + new URLSearchParams({
    //   scope: "openid",
    //   response_type: "code",
    //   client_id: "some-client-id",
    //   redirect_uri: "https://my-holo-hosted-happ.com/auth/callback/some-provider-name",
    //   code_challenge: sha256(codeVerifier),
    //   code_challenge_method: "S256",
    // })

    // Which after some user interaction redirected the browser to:
    // https://my-holo-hosted-happ.com/auth/callback/some-provider-name?code=some-code
    // Such that we extract the authorisation code from the url params
    const code = "some-code";

    const attestationRecord =
      await externalIdAttestationRequesterClient.requestExternalIdAttestation(
        codeVerifier,
        code
      );
    expect(decodeAppEntry(attestationRecord)).toSatisfy(
      ({ external_id, display_name }: ExternalIdAttestation) =>
        external_id === "mock-guid" && display_name === "molly"
    );

    externalIdAttestationRequesterClient.destroy();
    externalIdAttestorService.destroy();
    // Avoid "client closed with pending requests" error
    await forMs(1000);
  });
});
