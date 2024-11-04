class TwitchAppAuthFlow {
  private readonly _clientId: string;
  private readonly _clientSecret: string;
  private _accessToken: string | null = null;
  private _expiresAt: number | null = null;

  public get clientId(): string {
    return this._clientId;
  }

  constructor(clientId: string, clientSecret: string) {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }

  public async getAccessToken(): Promise<string | null> {
    if (this._accessToken && this._expiresAt && Date.now() < this._expiresAt) {
      return this._accessToken;
    }

    const params = new URLSearchParams();
    params.append("client_id", this._clientId);
    params.append("client_secret", this._clientSecret);
    params.append("grant_type", "client_credentials");

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch access token: ${response.statusText}`);
    }

    const data = await response.json();

    this._accessToken = data.access_token;
    this._expiresAt = Date.now() + data.expires_in * 1000 - 60000;

    return this._accessToken;
  }
}

export { TwitchAppAuthFlow };
