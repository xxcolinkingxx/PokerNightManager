import { Redis } from "@upstash/redis";

// This is the app's one and only server-side dependency -- everything
// else is fully local/offline. Requires UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN (from an Upstash Redis database's REST API
// tab) to be set as environment variables. Thrown lazily, at first use,
// rather than at import time, so the rest of the app (which never
// touches this module) isn't affected by it being unconfigured.
let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Invite links aren't configured yet -- set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  client = new Redis({ url, token });
  return client;
}
