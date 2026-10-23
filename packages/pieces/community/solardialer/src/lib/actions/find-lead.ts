import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { solarDialerAuth } from '../auth';
import { solarDialerApi } from '../common/client';
import { solarDialerOutputSchemas } from '../common/output-schemas';
import { SolarDialerFoundLead } from '../common/types';

export const findLeadAction = createAction({
  auth: solarDialerAuth,
  name: 'find_lead',
  classification: 'SEARCH',
  displayName: 'Find Lead',
  description: 'Finds a lead by phone or ID.',
  audience: 'both',
  aiMetadata: {
    description:
      "Look up one SolarDialer lead by any of its phone numbers or by its lead ID, and return its details and current status. Use before Create or Update Lead to check whether a lead exists. Returns found: false when there is no match. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: solarDialerOutputSchemas.foundLead,
  props: {
    find_by: Property.StaticDropdown({
      displayName: 'Find By',
      required: true,
      defaultValue: 'phone',
      options: {
        options: [
          { label: 'Phone', value: 'phone' },
          { label: 'Lead ID', value: 'lead_id' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description:
        "Any of the lead's numbers, or the ID you sent it with (or SolarDialer's own, like u3-W1047).",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const value = propsValue.value.trim();
    if (value === '') {
      throw new Error('Fill in the phone or lead ID.');
    }
    const found = await solarDialerApi.request<SolarDialerFoundLead[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/leads',
      queryParams: {
        [propsValue.find_by === 'lead_id' ? 'lead_id' : 'phone']: value,
      },
    });
    const lead = found[0];
    if (lead === undefined) {
      return { found: false, ...EMPTY_LEAD };
    }
    return { found: true, ...EMPTY_LEAD, ...lead };
  },
});

const EMPTY_LEAD: Record<keyof SolarDialerFoundLead, null> = {
  lead_id: null,
  first_name: null,
  last_name: null,
  phone: null,
  phones: null,
  email: null,
  address: null,
  city: null,
  state: null,
  zip: null,
  source_id: null,
  status: null,
  url: null,
};
