import {
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

async function request<T>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: SolarDialerRequest): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${SOLARDIALER_BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      queryParams,
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new SolarDialerApiError({
        status: error.response.status,
        message: messageOf({
          status: error.response.status,
          body: error.response.body,
        }),
      });
    }
    throw error;
  }
}

function messageOf({ status, body }: { status: number; body: unknown }): string {
  const errors = errorsOf(body);
  if (errors.length > 0) {
    return errors.join(' ');
  }
  if (status === 401) {
    return 'The API key is not valid. Create a new one in SolarDialer → Account → API.';
  }
  const text = typeof body === 'string' ? body.trim() : '';
  if (text !== '' && text.length < 300 && !text.startsWith('<')) {
    return `SolarDialer answered ${status}: ${text}`;
  }
  return `SolarDialer answered ${status}.`;
}

function errorsOf(body: unknown): string[] {
  const parsed = typeof body === 'string' ? parseJson(body) : body;
  if (!isRecord(parsed) || !Array.isArray(parsed['errors'])) {
    return [];
  }
  return parsed['errors'].filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class SolarDialerApiError extends Error {
  readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'SolarDialerApiError';
    this.status = status;
  }
}

export const solarDialerApi = {
  request,
  isRecord,
  describe,
};

export const SOLARDIALER_BASE_URL = 'https://solardialer.net/api/v1';

export type SolarDialerRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
};
