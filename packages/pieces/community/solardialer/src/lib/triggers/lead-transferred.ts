import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const leadTransferredTrigger = solarDialerWebhook.trigger({
  name: 'lead_transferred',
  displayName: 'Lead Transferred',
  description: 'Triggers when a lead is transferred to your closer.',
  event: 'call.transferred',
  aiDescription:
    "Fires once for each call whose lead was put through live to your closer, with the call's outcome, summary, transcript and the lead.",
  sampleData: solarDialerSamples.callTransferred,
  outputSchema: solarDialerOutputSchemas.callEvent,
});
