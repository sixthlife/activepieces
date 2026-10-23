import { createHmac, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  OutputSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { solarDialerAuth } from '../auth';
import { solarDialerApi } from './client';
import { SolarDialerEvent, SolarDialerHook } from './types';

function solarDialerWebhookTrigger({
  name,
  displayName,
  description,
  event,
  aiDescription,
  sampleData,
  outputSchema,
}: SolarDialerTriggerParams) {
  const storeKey = `solardialer_hook_${name}`;
  return createTrigger({
    auth: solarDialerAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: {},
    sampleData,
    outputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const hook = await solarDialerApi.request<SolarDialerHook>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/hooks',
        body: {
          event,
          target_url: context.webhookUrl,
          source: 'activepieces',
        },
      });
      await context.store.put<HookState>(storeKey, {
        id: hook.id,
        secret: hook.secret,
      });
    },
    async onDisable(context) {
      const hook = await context.store.get<HookState>(storeKey);
      if (hook) {
        await solarDialerApi
          .request({
            apiKey: context.auth.secret_text,
            method: HttpMethod.DELETE,
            path: `/hooks/${hook.id}`,
          })
          .catch(() => undefined);
      }
      await context.store.delete(storeKey);
      await context.store.delete(seenKey(storeKey));
    },
    async test(context) {
      return solarDialerApi.request<SolarDialerEvent[]>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/events',
        queryParams: { event, limit: '5' },
      });
    },
    async run(context) {
      const hook = await context.store.get<HookState>(storeKey);
      if (
        !hook ||
        !verifySignature({
          secret: hook.secret,
          rawBody: context.payload.rawBody,
          headers: context.payload.headers,
          nowMs: Date.now(),
        })
      ) {
        return [];
      }
      const body = context.payload.body;
      if (!solarDialerApi.isRecord(body) || body['event'] !== event) {
        return [];
      }
      const eventId = body['id'];
      if (typeof eventId === 'number' || typeof eventId === 'string') {
        const seen = (await context.store.get<string[]>(seenKey(storeKey))) ?? [];
        if (seen.includes(String(eventId))) {
          return [];
        }
        await context.store.put(
          seenKey(storeKey),
          [...seen, String(eventId)].slice(-MAX_REMEMBERED_EVENTS)
        );
      }
      return [body];
    },
  });
}

function verifySignature({
  secret,
  rawBody,
  headers,
  nowMs,
}: {
  secret: string;
  rawBody: unknown;
  headers: Record<string, string | undefined> | undefined;
  nowMs: number;
}): boolean {
  const raw =
    typeof rawBody === 'string'
      ? rawBody
      : Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : undefined;
  const timestamp = headerValue({ headers, name: 'x-solardialer-timestamp' });
  const signature = headerValue({
    headers,
    name: 'x-solardialer-signature-256',
  });
  if (raw === undefined || timestamp === undefined || signature === undefined) {
    return false;
  }
  if (!/^\d+$/.test(timestamp)) {
    return false;
  }
  const sentMs = Number(timestamp) * 1000;
  if (nowMs - sentMs > REPLAY_WINDOW_MS || sentMs - nowMs > CLOCK_SKEW_MS) {
    return false;
  }
  const expected = Buffer.from(
    'sha256=' +
      createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex'),
    'utf8'
  );
  const received = Buffer.from(signature.trim().toLowerCase(), 'utf8');
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

function headerValue({
  headers,
  name,
}: {
  headers: Record<string, string | undefined> | undefined;
  name: string;
}): string | undefined {
  if (!headers) {
    return undefined;
  }
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return match === undefined ? undefined : headers[match];
}

function seenKey(storeKey: string): string {
  return `${storeKey}_seen`;
}

const REPLAY_WINDOW_MS = 15 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_REMEMBERED_EVENTS = 200;

export const solarDialerWebhook = {
  trigger: solarDialerWebhookTrigger,
  verifySignature,
};

type HookState = {
  id: number;
  secret: string;
};

type SolarDialerTriggerParams = {
  name: string;
  displayName: string;
  description: string;
  event: SolarDialerEventName;
  aiDescription: string;
  sampleData: Record<string, unknown>;
  outputSchema: OutputSchema;
};

export type SolarDialerEventName =
  | 'call.ended'
  | 'call.transferred'
  | 'lead.interested'
  | 'callback.booked'
  | 'lead.status_changed'
  | 'lead.created'
  | 'campaign.finished'
  | 'lead.removed';
