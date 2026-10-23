import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const leadStatusChangedTrigger = solarDialerWebhook.trigger({
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description: "Triggers when a lead's status changes.",
  event: 'lead.status_changed',
  aiDescription:
    'Fires once each time a lead is given a new status in SolarDialer, with the old and the new status and the lead.',
  sampleData: solarDialerSamples.leadStatusChanged,
  outputSchema: solarDialerOutputSchemas.statusChangedEvent,
});
