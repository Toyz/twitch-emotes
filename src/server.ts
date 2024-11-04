import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import Redis from "ioredis";
import { TwitchAppAuthFlow } from "./app_auth_flow";
import { logger } from "./logger";
import { TwitchUserFetcher } from "./twitch_user_fetcher";

const app = express();
app.disable("x-powered-by");
app.use(cors());

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const commandRedis = new Redis(REDIS_URL);

const auth = new TwitchAppAuthFlow(
  process.env.TWITCH_CLIENT_ID ?? "",
  process.env.TWITCH_CLIENT_SECRET ?? ""
);

const twitchFetcher = new TwitchUserFetcher(process.env.TWITCH_CLIENT_ID ?? "");

app.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).send("Missing user ID");
    return;
  }

  try {
    const emotes = await getEmotes(userId.toLowerCase());
    res.json(emotes);
  } catch (err) {
    logger.error(`Failed to get emotes: ${err}`);
    res.status(500).send("Failed to get emotes");
  }
});

// get emote by name
app.get("/:userId/:emoteName", async (req, res) => {
  const { userId, emoteName } = req.params;

  if (!userId || !emoteName) {
    return res.status(400).json({ error: "Missing user ID or emote name" });
  }

  try {
    const emotes = await getEmotes(userId.toLowerCase());
    const emoteNameLower = emoteName.toLowerCase();

    const emoteEntry = Object.entries(emotes).find(
      ([name]) => name.toLowerCase() === emoteNameLower
    );

    if (!emoteEntry) {
      return res.status(404).json({ error: "Emote not found" });
    }

    const [name, emote] = emoteEntry;

    res.json({
      name,
      id: emote.id,
      sizes: emote.sizes,
    });
  } catch (err) {
    logger.error(`Failed to get emote for user ${userId}: ${err.message}`);
    res.status(500).json({ error: "Failed to get emote" });
  }
});

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

async function getEmotes(
  userId: string
): Promise<Record<string, { id: string; sizes: Record<string, string> }>> {
  const token = await auth.getAccessToken();
  if (!token) {
    throw new Error("Failed to get access token");
  }

  twitchFetcher.updateAccessToken(token);

  const key = `user:${userId}`;
  const cachedData = await commandRedis.get(key);
  let boardcasterId = "";
  if (cachedData) {
    boardcasterId = cachedData;
  } else {
    try {
      boardcasterId = await twitchFetcher.getBroadcasterId(userId);
      await commandRedis.set(key, boardcasterId);
    } catch (err) {
      throw new Error(`Failed to get broadcaster ID: ${err}`);
    }
  }

  // check if we have the emotes in cache
  const emotesKey = `emotes:${boardcasterId}`;
  const cachedEmotes = await commandRedis.get(emotesKey);
  if (cachedEmotes) {
    return JSON.parse(cachedEmotes);
  }

  try {
    const emotes = await twitchFetcher.getEmotesForUser(boardcasterId);
    const emotesMap = emotes.reduce(
      (acc, emote) => {
        acc[emote.name] = {
          id: emote.id,
          sizes: emote.images,
        };
        return acc;
      },
      {} as Record<string, { id: string; sizes: Record<string, string> }>
    );

    await commandRedis.setex(emotesKey, 3600, JSON.stringify(emotesMap));

    return emotesMap;
  } catch (err) {
    throw new Error(`Failed to get emotes: ${err}`);
  }
}
