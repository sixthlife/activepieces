import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const leadInterestedTrigger = solarDialerWebhook.trigger({
  name: 'lead_interested',
  displayName: 'Lead Interested',
  description: 'Triggers when a lead says they are interested.',
  event: 'lead.interested',
  aiDescription:
    'Fires once per call in which the lead said yes to talking to your closer: the transfer connected, failed, or a closer callback was booked instead. Use to make sure no hot lead is missed.',
  sampleData: solarDialerSamples.leadInterested,
  outputSchema: solarDialerOutputSchemas.callEvent,
});
