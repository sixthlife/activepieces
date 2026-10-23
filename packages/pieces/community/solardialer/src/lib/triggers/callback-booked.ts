import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const callbackBookedTrigger = solarDialerWebhook.trigger({
  name: 'callback_booked',
  displayName: 'Callback Booked',
  description: 'Triggers when a callback is booked.',
  event: 'callback.booked',
  aiDescription:
    'Fires once for each callback a lead books, with when (as a time and as said), who calls back (the AI agent or your closer) and the lead.',
  sampleData: solarDialerSamples.callbackBooked,
  outputSchema: solarDialerOutputSchemas.callbackEvent,
});
