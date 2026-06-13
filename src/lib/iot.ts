import type { MqttClient } from "mqtt";

const IOT_ENDPOINT = process.env.NEXT_PUBLIC_IOT_ENDPOINT ?? "";
const TOKEN        = process.env.NEXT_PUBLIC_SENTINEL_TOKEN ?? "";
export const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? "";

export const allSessionsTopic = () => `users/${USER_ID}/sessions/#`;
export const sessionTopic     = (id: string) => `users/${USER_ID}/sessions/${id}`;

let _client: MqttClient | null = null;
let _connecting = false;
const _waiters: Array<(c: MqttClient) => void> = [];

export async function getIoTClient(): Promise<MqttClient> {
  if (_client?.connected) return _client;

  return new Promise((resolve) => {
    _waiters.push(resolve);
    if (_connecting) return;
    _connecting = true;

    const url = `wss://${IOT_ENDPOINT}/mqtt` +
      `?x-amz-customauthorizer-name=sentinel-jwt-authorizer` +
      `&token=${encodeURIComponent(TOKEN)}`;

    // Dynamic import keeps mqtt out of the SSR bundle
    import("mqtt").then(({ default: mqtt }) => {
      _client = mqtt.connect(url, {
        clientId: `dashboard-${USER_ID}-${Date.now()}`,
        protocolVersion: 5,
        reconnectPeriod: 3000,
        manualConnect: false,
      });

      _client.on("connect", () => {
        _connecting = false;
        const c = _client!;
        _waiters.splice(0).forEach((r) => r(c));
      });

      _client.on("error", (err) => {
        console.warn("[IoT] connection error:", err.message);
        _connecting = false;
      });
    });
  });
}
