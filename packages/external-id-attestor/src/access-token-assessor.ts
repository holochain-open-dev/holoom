export class AccessTokenAssessor {
  constructor(
    readonly config: {
      tokenEndpoint: string;
      clientSecret: string;
      redirectUri: string;
      userInfoEndpoint: string;
      externalIdFieldName: string;
      displayNameFieldName: string;
    }
  ) {}

  async exchangeAccessToken(codeVerifier: string, code: string) {
    console.log("exchangeAccessToken", codeVerifier, code);
    const resp = await fetch(this.config.tokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        accept: "application/json",
        authorization: `Basic ${this.config.clientSecret}`,
      },
      body: new URLSearchParams({
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
        code,
        grant_type: "authorization_code",
      }),
    });
    const data = await resp.json();
    return data.access_token;
  }

  async fetchUserInfo(
    accessToken: string
  ): Promise<{ externalId: string; displayName: string }> {
    console.log("fetchUserInfo", accessToken);
    const resp = await fetch(this.config.userInfoEndpoint, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const userInfo = await resp.json();
    const externalId = userInfo?.[this.config.externalIdFieldName];
    const displayName = userInfo?.[this.config.displayNameFieldName];
    if ((externalId?.length ?? 0) === 0) {
      throw Error(
        `Invalid externalId in userInfo: ${JSON.stringify(userInfo)}`
      );
    }
    if ((displayName?.length ?? 0) === 0) {
      throw Error(
        `Invalid displayName in userInfo: ${JSON.stringify(userInfo)}`
      );
    }
    return { externalId, displayName };
  }
}
