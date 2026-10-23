import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { solarDialerApi, SolarDialerApiError } from './common/client';
import { SolarDialerAccount } from './common/types';

export const solarDialerAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your SolarDialer API key:

1. Sign in at [solardialer.net](https://solardialer.net).
2. Open [Account → API](https://solardialer.net/account/api) and create a key.
3. Copy the key (it starts with \`sdk_\` and is shown once) and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await fetchAccount(auth);
      return { valid: true };
    } catch (error) {
      if (error instanceof SolarDialerApiError && error.status === 401) {
        return {
          valid: false,
          error:
            'SolarDialer did not accept this API key. Create a new one in SolarDialer → Account → API.',
        };
      }
      return {
        valid: false,
        error: `Could not check this key with SolarDialer: ${solarDialerApi.describe(
          error
        )}`,
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const account = await fetchAccount(auth);
      return account.email ?? account.name ?? undefined;
    } catch {
      return undefined;
    }
  },
});

function fetchAccount(apiKey: string): Promise<SolarDialerAccount> {
  return solarDialerApi.request<SolarDialerAccount>({
    apiKey,
    method: HttpMethod.GET,
    path: '/me',
  });
}
