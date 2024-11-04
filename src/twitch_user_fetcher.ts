interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
}

interface TwitchUserResponse {
  data: TwitchUser[];
}

interface TwitchEmote {
  id: string;
  name: string;
  images: {
    url_1x: string;
    url_2x: string;
    url_4x: string;
  };
}

interface TwitchEmotesResponse {
  data: TwitchEmote[];
}

class TwitchUserFetcher {
  private readonly _clientId: string;
  private _accessToken: string = "";

  constructor(clientId: string) {
    this._clientId = clientId;
  }

  public updateAccessToken(accessToken: string): void {
    this._accessToken = accessToken;
  }

  public async getBroadcasterId(username: string): Promise<string> {
    const response = await fetch(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        method: "GET",
        headers: {
          "Client-ID": this._clientId,
          Authorization: `Bearer ${this._accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const data: TwitchUserResponse = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }

    throw new Error(`User not found: ${username}`);
  }

  public async getEmotesForUser(broadcasterId: string): Promise<TwitchEmote[]> {
    const response = await fetch(
      `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${broadcasterId}`,
      {
        method: "GET",
        headers: {
          "Client-ID": this._clientId,
          Authorization: `Bearer ${this._accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch emotes: ${response.statusText}`);
    }

    const data: TwitchEmotesResponse = await response.json();

    return data.data;
  }
}

export { TwitchUserFetcher };
export type { TwitchEmote, TwitchUser };
