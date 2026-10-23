import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { solarDialerAuth } from '../auth';
import { solarDialerApi } from '../common/client';
import { solarDialerOutputSchemas } from '../common/output-schemas';
import { CALL_LIST_DESCRIPTION, solarDialerProps } from '../common/props';
import { SolarDialerCalledLead } from '../common/types';

export const callLeadAction = createAction({
  auth: solarDialerAuth,
  name: 'call_lead',
  classification: 'WRITE',
  displayName: 'Call Lead Now',
  description: 'Creates a lead and calls it right away.',
  audience: 'both',
  aiMetadata: {
    description:
      "Save a lead in SolarDialer and have its AI agent phone that lead right away to qualify it and transfer interested homeowners to the account's closer. Use for a fresh lead that should be called within the minute; to only save a lead for a campaign to call later, use Create or Update Lead. Each run places a real, billed call, so retries call again.",
    idempotent: false,
  },
  outputSchema: solarDialerOutputSchemas.calledLead,
  props: solarDialerProps.lead({ listDescription: CALL_LIST_DESCRIPTION }),
  async run({ auth, propsValue }) {
    const result = await solarDialerApi.request<SolarDialerCalledLead>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/calls',
      body: solarDialerProps.leadBody(propsValue),
    });
    return {
      ...result,
      campaign_id: result.campaign_id ?? null,
      warnings: result.warnings ?? [],
    };
  },
});
