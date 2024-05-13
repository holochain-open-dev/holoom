export class FaceitAuthFlowClient {
  constructor(
    readonly config: {
      redirectUri: string;
      authEndpoint: string;
      tokenEndpoint: string;
      clientId: string;
      clientSecret: string;
    }
  ) {}

  async start() {
    const codeVerifier = this.generateVerifierCode();
    window.sessionStorage.setItem("code_verifier", codeVerifier);
    const params = new URLSearchParams({
      redirect_popup: "true",
      scope: "openid profile email",
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge: await this.calculateCodeChallenge(codeVerifier),
      code_challenge_method: "S256",
    });
    const url = `${this.config.authEndpoint}?${params}`;
    window.open(url, "_self");
  }

  getCodes() {
    const codeVerifier = sessionStorage.getItem("code_verifier");
    const code = new URLSearchParams(window.location.search).get("code");
    return { code, codeVerifier };
  }

  generateVerifierCode() {
    let text = "";
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 64; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return text;
  }

  async calculateCodeChallenge(codeVerifier: string) {
    var digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier)
    );

    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
}
