import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const leadAskedNotToBeCalledTrigger = solarDialerWebhook.trigger({
  name: 'lead_asked_not_to_be_called',
  displayName: 'Lead Asked Not to Be Called',
  description: 'Triggers when a lead asks not to be called.',
  event: 'lead.removed',
  aiDescription:
    'Fires once when a lead asks not to be called again (on a call, or marked do-not-call in SolarDialer). Use to suppress the lead in other tools.',
  sampleData: solarDialerSamples.leadRemoved,
  outputSchema: solarDialerOutputSchemas.leadRemovedEvent,
});
