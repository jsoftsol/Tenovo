import { createClient } from "redis";
import type RealtimeNotification from "@/types/realtime-notification";

const REALTIME_CHANNEL = "tenovo:notifications";

export async function publishNotification(notification: RealtimeNotification) {
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  await client.connect();

  await client.publish(
    REALTIME_CHANNEL,
    JSON.stringify(notification)
  );

  await client.destroy();
}