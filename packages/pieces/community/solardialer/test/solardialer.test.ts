import { HttpError } from '@activepieces/pieces-common';
import { OutputSchema } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callLeadAction } from '../src/lib/actions/call-lead';
import { createOrUpdateLeadAction } from '../src/lib/actions/create-or-update-lead';
import { findLeadAction } from '../src/lib/actions/find-lead';
import { solarDialerAuth } from '../src/lib/auth';
import { solarDialerOutputSchemas } from '../src/lib/common/output-schemas';
import { solarDialerSamples } from '../src/lib/common/samples';
import { solarDialerWebhook } from '../src/lib/common/webhook';
import { callEndedTrigger } from '../src/lib/triggers/call-ended';
import { callbackBookedTrigger } from '../src/lib/triggers/callback-booked';
import { campaignFinishedTrigger } from '../src/lib/triggers/campaign-finished';
import { leadAskedNotToBeCalledTrigger } from '../src/lib/triggers/lead-asked-not-to-be-called';
import { leadInterestedTrigger } from '../src/lib/triggers/lead-interested';
import { leadStatusChangedTrigger } from '../src/lib/triggers/lead-status-changed';
import { leadTransferredTrigger } from '../src/lib/triggers/lead-transferred';
import { newLeadTrigger } from '../src/lib/triggers/new-lead';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { type: 'SECRET_TEXT', secret_text: 'sdk_test' };
const BASE = 'https://solardialer.net/api/v1';

const SIGNED_BODY =
  '{"id": 101, "event": "call.ended", "created_at": "2026-10-15T15:04:31+00:00", "call_id": "abc"}';
const SIGNED_AT = 1792000000;
const SIGNED_WITH = 'test-secret';
const SIGNATURE =
  'sha256=f18a8f0823b52485cd2a0df2c7d5d683311e951b485f8e2ef4e69c9f4032b666';

function httpError(status: number, responseBody: unknown) {
  return new HttpError({}, { status, responseBody } as never);
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function runAction(action: { run: (ctx: never) => Promise<unknown> }, propsValue: Record<string, unknown>) {
  return action.run({ auth: AUTH, propsValue } as never);
}

function signedPayload({ body = SIGNED_BODY, at = SIGNED_AT, signature = SIGNATURE } = {}) {
  return {
    body: JSON.parse(body),
    rawBody: body,
    headers: {
      'content-type': 'application/json',
      'x-solardialer-timestamp': String(at),
      'x-solardialer-signature-256': signature,
    },
  };
}

beforeEach(() => {
  sendRequest.mockReset();
  vi.useRealTimers();
});

describe('Call Lead Now', () => {
  it('posts the filled-in fields to /calls with the key as a bearer token', async () => {
    sendRequest.mockResolvedValueOnce({ body: solarDialerSamples.calledLead });

    await runAction(callLeadAction, {
      first_name: 'Dana',
      phone: '215-555-0147',
      state: 'PA',
      email: '',
      last_name: undefined,
      list: 'Website leads',
      campaign_id: '5',
      notes: '   ',
    });

    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${BASE}/calls`);
    expect(request.headers.Authorization).toBe('Bearer sdk_test');
    expect(request.body).toEqual({
      first_name: 'Dana',
      phone: '215-555-0147',
      state: 'PA',
      list: 'Website leads',
      campaign_id: '5',
    });
  });

  it('returns a lead that was saved but not called, with why, as a result', async () => {
    sendRequest.mockResolvedValueOnce({
      body: {
        ok: true,
        id: 'u3-W1047',
        lead_id: 'W1047',
        created: false,
        list: null,
        called: false,
        call_id: null,
        reason: 'Outside calling hours.',
      },
    });

    const result = await runAction(callLeadAction, { first_name: 'Dana', phone: '2155550147' });

    expect(result).toEqual({
      ok: true,
      id: 'u3-W1047',
      lead_id: 'W1047',
      created: false,
      list: null,
      campaign_id: null,
      warnings: [],
      called: false,
      call_id: null,
      reason: 'Outside calling hours.',
    });
  });

  it("fails with the API's own words", async () => {
    sendRequest.mockRejectedValueOnce(
      httpError(409, {
        ok: false,
        errors: ['Check the lines your agent will say first.', 'Open Account → Script.'],
      }),
    );

    await expect(runAction(callLeadAction, { first_name: 'Dana', phone: '2155550147' })).rejects.toThrow(
      'Check the lines your agent will say first. Open Account → Script.',
    );
  });
});

describe('Create or Update Lead', () => {
  it('posts to /leads', async () => {
    sendRequest.mockResolvedValueOnce({ body: { ...solarDialerSamples.savedLead, warnings: ['x'] } });

    const result = await runAction(createOrUpdateLeadAction, {
      first_name: 'Dana Rivera',
      phone: '2155550147',
      lead_id: 'W1047',
    });

    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${BASE}/leads`);
    expect(request.body).toEqual({ first_name: 'Dana Rivera', phone: '2155550147', lead_id: 'W1047' });
    expect(result).toMatchObject({ id: 'u3-W1047', warnings: ['x'], campaign_id: null });
  });

  it('reads the errors from a body that came back as text', async () => {
    sendRequest.mockRejectedValueOnce(
      httpError(400, JSON.stringify({ ok: false, errors: ["'12' isn't a phone number."] })),
    );

    await expect(runAction(createOrUpdateLeadAction, { first_name: 'Dana', phone: '12' })).rejects.toThrow(
      "'12' isn't a phone number.",
    );
  });
});

describe('Find Lead', () => {
  it('searches by phone', async () => {
    const { found: _found, ...lead } = solarDialerSamples.foundLead;
    sendRequest.mockResolvedValueOnce({ body: [lead] });

    const result = await runAction(findLeadAction, { find_by: 'phone', value: ' 215-555-0147 ' });

    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${BASE}/leads`);
    expect(request.queryParams).toEqual({ phone: '215-555-0147' });
    expect(result).toEqual(solarDialerSamples.foundLead);
  });

  it('searches by lead ID and answers found: false with every key when there is none', async () => {
    sendRequest.mockResolvedValueOnce({ body: [] });

    const result = (await runAction(findLeadAction, { find_by: 'lead_id', value: 'W1047' })) as Record<
      string,
      unknown
    >;

    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ lead_id: 'W1047' });
    expect(result['found']).toBe(false);
    expect(Object.keys(result).sort()).toEqual(Object.keys(solarDialerSamples.foundLead).sort());
  });

  it('refuses an empty value before calling SolarDialer', async () => {
    await expect(runAction(findLeadAction, { find_by: 'phone', value: '  ' })).rejects.toThrow(/phone or lead ID/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Auth', () => {
  const validate = (key: string) =>
    (solarDialerAuth.validate as (params: { auth: string }) => Promise<{ valid: boolean; error?: string }>)({
      auth: key,
    });

  it('checks the key against /me', async () => {
    sendRequest.mockResolvedValueOnce({ body: { ok: true, id: 3, email: 'ray@example.com' } });

    await expect(validate('sdk_good')).resolves.toEqual({ valid: true });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe(`${BASE}/me`);
    expect(request.headers.Authorization).toBe('Bearer sdk_good');
  });

  it('refuses a key SolarDialer does not accept', async () => {
    sendRequest.mockRejectedValueOnce(httpError(401, { ok: false, errors: ['Missing or wrong API key.'] }));

    const result = await validate('sdk_bad');

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/did not accept this API key/);
  });
});

describe('Webhook triggers', () => {
  const ALL = [
    { trigger: callEndedTrigger, event: 'call.ended', schema: solarDialerOutputSchemas.callEvent },
    { trigger: leadTransferredTrigger, event: 'call.transferred', schema: solarDialerOutputSchemas.callEvent },
    { trigger: leadInterestedTrigger, event: 'lead.interested', schema: solarDialerOutputSchemas.callEvent },
    { trigger: callbackBookedTrigger, event: 'callback.booked', schema: solarDialerOutputSchemas.callbackEvent },
    {
      trigger: leadStatusChangedTrigger,
      event: 'lead.status_changed',
      schema: solarDialerOutputSchemas.statusChangedEvent,
    },
    { trigger: newLeadTrigger, event: 'lead.created', schema: solarDialerOutputSchemas.leadCreatedEvent },
    {
      trigger: campaignFinishedTrigger,
      event: 'campaign.finished',
      schema: solarDialerOutputSchemas.campaignFinishedEvent,
    },
    {
      trigger: leadAskedNotToBeCalledTrigger,
      event: 'lead.removed',
      schema: solarDialerOutputSchemas.leadRemovedEvent,
    },
  ];

  it.each(ALL)('$event subscribes on enable and unsubscribes on disable', async ({ trigger, event }) => {
    const store = memoryStore();
    sendRequest.mockResolvedValueOnce({
      body: { id: 42, event, target_url: 'https://hooks.example/abc', source: 'activepieces', failing: false, secret: 's3' },
    });

    await trigger.onEnable({ auth: AUTH, store, webhookUrl: 'https://hooks.example/abc' } as never);

    const subscribe = sendRequest.mock.calls[0][0];
    expect(subscribe.method).toBe('POST');
    expect(subscribe.url).toBe(`${BASE}/hooks`);
    expect(subscribe.body).toEqual({ event, target_url: 'https://hooks.example/abc', source: 'activepieces' });

    sendRequest.mockResolvedValueOnce({ body: '' });
    await trigger.onDisable({ auth: AUTH, store } as never);

    const unsubscribe = sendRequest.mock.calls[1][0];
    expect(unsubscribe.method).toBe('DELETE');
    expect(unsubscribe.url).toBe(`${BASE}/hooks/42`);
    expect(store.data.size).toBe(0);
  });

  it.each(ALL)("$event's sample has exactly the fields its output schema shows", ({ trigger, schema }) => {
    expect(trigger.sampleData).toMatchObject({ id: expect.any(Number), created_at: expect.any(String) });
    expect(fieldKeys(schema)).toEqual(Object.keys(trigger.sampleData as object).sort());
  });

  it.each(ALL)('$event loads recent events of its kind as test data', async ({ trigger, event }) => {
    sendRequest.mockResolvedValueOnce({ body: [] });

    await trigger.test({ auth: AUTH, store: memoryStore() } as never);

    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe(`${BASE}/events`);
    expect(request.queryParams).toEqual({ event, limit: '5' });
  });

  it('turning a flow off is never blocked by SolarDialer', async () => {
    const store = memoryStore();
    await store.put('solardialer_hook_call_ended', { id: 7, secret: 's' });
    sendRequest.mockRejectedValueOnce(httpError(500, 'boom'));

    await expect(callEndedTrigger.onDisable({ auth: AUTH, store } as never)).resolves.toBeUndefined();
    expect(store.data.size).toBe(0);
  });

  describe('run', () => {
    async function enabledStore() {
      const store = memoryStore();
      await store.put('solardialer_hook_call_ended', { id: 7, secret: SIGNED_WITH });
      return store;
    }

    function run(store: ReturnType<typeof memoryStore>, payload: unknown) {
      return callEndedTrigger.run({ auth: AUTH, store, payload } as never);
    }

    it('passes on an event signed as SolarDialer signs it', async () => {
      vi.useFakeTimers({ now: SIGNED_AT * 1000 + 30_000 });

      const result = await run(await enabledStore(), signedPayload());

      expect(result).toEqual([JSON.parse(SIGNED_BODY)]);
    });

    it('drops an event with a wrong signature', async () => {
      vi.useFakeTimers({ now: SIGNED_AT * 1000 });

      const result = await run(await enabledStore(), signedPayload({ signature: SIGNATURE.replace('f18a', 'f18b') }));

      expect(result).toEqual([]);
    });

    it('drops an old post sent again', async () => {
      vi.useFakeTimers({ now: SIGNED_AT * 1000 + 16 * 60 * 1000 });

      expect(await run(await enabledStore(), signedPayload())).toEqual([]);
    });

    it('drops an event of another kind', async () => {
      vi.useFakeTimers({ now: SIGNED_AT * 1000 });
      const other = SIGNED_BODY.replace('call.ended', 'lead.created');
      const signature = `sha256=${await hmac(`${SIGNED_AT}.${other}`)}`;

      expect(await run(await enabledStore(), signedPayload({ body: other, signature }))).toEqual([]);
    });

    it('drops an event delivered twice', async () => {
      vi.useFakeTimers({ now: SIGNED_AT * 1000 });
      const store = await enabledStore();

      expect(await run(store, signedPayload())).toHaveLength(1);
      expect(await run(store, signedPayload())).toEqual([]);
    });

    it('drops everything when the flow has no subscription', async () => {
      vi.useFakeTimers({ now: SIGNED_AT * 1000 });

      expect(await run(memoryStore(), signedPayload())).toEqual([]);
    });
  });

  it('verifies the signature over "timestamp.body"', () => {
    expect(
      solarDialerWebhook.verifySignature({
        secret: SIGNED_WITH,
        rawBody: Buffer.from(SIGNED_BODY),
        headers: { 'X-SolarDialer-Timestamp': String(SIGNED_AT), 'X-SolarDialer-Signature-256': SIGNATURE },
        nowMs: SIGNED_AT * 1000,
      }),
    ).toBe(true);
  });
});

describe('Action samples', () => {
  it.each([
    { sample: solarDialerSamples.calledLead, schema: solarDialerOutputSchemas.calledLead },
    { sample: solarDialerSamples.savedLead, schema: solarDialerOutputSchemas.savedLead },
    { sample: solarDialerSamples.foundLead, schema: solarDialerOutputSchemas.foundLead },
  ])('every output field is described', ({ sample, schema }) => {
    expect(fieldKeys(schema)).toEqual(Object.keys(sample).filter((key) => key !== 'ok').sort());
  });
});

function fieldKeys(schema: OutputSchema): string[] {
  return schema.fields.map((field) => field.key).sort();
}

async function hmac(text: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return createHmac('sha256', SIGNED_WITH).update(text).digest('hex');
}
