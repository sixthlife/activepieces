import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const newLeadTrigger = solarDialerWebhook.trigger({
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is added.',
  event: 'lead.created',
  aiDescription:
    'Fires once for each lead new to the SolarDialer account, by any path (upload, API, integration), with its list, source and details. Updates to an existing lead do not fire it.',
  sampleData: solarDialerSamples.leadCreated,
  outputSchema: solarDialerOutputSchemas.leadCreatedEvent,
});
