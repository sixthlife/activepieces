import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { solarDialerAuth } from '../auth';
import { solarDialerApi } from './client';
import { SolarDialerCampaign, SolarDialerList } from './types';

function leadProps({ listDescription }: { listDescription: string }) {
  return {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description:
        'US numbers in any common form; other countries with + and the country code.',
      required: true,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description:
        'Two letters (PA). Required for US numbers: it decides the calling hours and rules.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP',
      required: false,
    }),
    second_phone: Property.ShortText({
      displayName: 'Second Phone',
      required: false,
    }),
    lead_id: Property.ShortText({
      displayName: 'Your Lead ID',
      description:
        'Your own ID for the lead (e.g. the CRM contact ID). Sending it again updates the lead.',
      required: false,
    }),
    list: listDropdown({ description: listDescription }),
    campaign_id: campaignDropdown(),
    source: Property.ShortText({
      displayName: 'Source',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  };
}

function listDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: solarDialerAuth,
    displayName: 'List',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabled('Connect your SolarDialer account first.');
      }
      try {
        const lists = await solarDialerApi.request<SolarDialerList[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: '/lists',
        });
        return {
          disabled: false,
          options: lists.map((list) => ({
            label: list.name,
            value: list.name,
          })),
          placeholder:
            lists.length === 0
              ? 'No lists yet: turn on Dynamic value and type a name to make one.'
              : undefined,
        };
      } catch (error) {
        return disabled(solarDialerApi.describe(error));
      }
    },
  });
}

function campaignDropdown() {
  return Property.Dropdown({
    auth: solarDialerAuth,
    displayName: 'Campaign',
    description:
      "The campaign to put it in: it goes on that campaign's list (over the List above).",
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabled('Connect your SolarDialer account first.');
      }
      try {
        const campaigns = await solarDialerApi.request<SolarDialerCampaign[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: '/campaigns',
        });
        if (campaigns.length === 0) {
          return disabled('No campaigns yet in this SolarDialer account.');
        }
        return {
          disabled: false,
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: String(campaign.id),
          })),
        };
      } catch (error) {
        return disabled(solarDialerApi.describe(error));
      }
    },
  });
}

function disabled(placeholder: string) {
  return {
    disabled: true,
    options: [],
    placeholder,
  };
}

function leadBody(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined && value !== null && String(value).trim() !== ''
    )
  );
}

export const solarDialerProps = {
  lead: leadProps,
  leadBody,
};

export const LIST_DESCRIPTION =
  'The list to put it on; to make a new one, turn on Dynamic value and type its name.';

export const CALL_LIST_DESCRIPTION =
  "The list to put it on; to make a new one, turn on Dynamic value and type its name. When it can't be called right now (outside its calling hours, say), a running campaign on this list calls it later.";
