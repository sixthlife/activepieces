import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { solarDialerAuth } from '../auth';
import { solarDialerApi } from '../common/client';
import { solarDialerOutputSchemas } from '../common/output-schemas';
import { LIST_DESCRIPTION, solarDialerProps } from '../common/props';
import { SolarDialerSavedLead } from '../common/types';

export const createOrUpdateLeadAction = createAction({
  auth: solarDialerAuth,
  name: 'create_or_update_lead',
  classification: 'WRITE',
  displayName: 'Create or Update Lead',
  description: 'Creates a new lead or updates an existing one.',
  audience: 'both',
  aiMetadata: {
    description:
      'Save a lead in SolarDialer, matched by its phone number or your lead ID, so sending the same lead again updates it instead of adding a second one. Use to add leads that a campaign calls later; to have the AI agent call the lead right now, use Call Lead Now. Safe to retry.',
    idempotent: true,
  },
  outputSchema: solarDialerOutputSchemas.savedLead,
  props: solarDialerProps.lead({ listDescription: LIST_DESCRIPTION }),
  async run({ auth, propsValue }) {
    const result = await solarDialerApi.request<SolarDialerSavedLead>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/leads',
      body: solarDialerProps.leadBody(propsValue),
    });
    return {
      ...result,
      campaign_id: result.campaign_id ?? null,
      warnings: result.warnings ?? [],
    };
  },
});
