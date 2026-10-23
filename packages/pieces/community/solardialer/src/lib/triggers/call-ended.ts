import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const callEndedTrigger = solarDialerWebhook.trigger({
  name: 'call_ended',
  displayName: 'Call Ended',
  description: 'Triggers when a call ends.',
  event: 'call.ended',
  aiDescription:
    "Fires once for every SolarDialer call that ends, answered or not, with its outcome, summary, transcript, the lead's answers and recording links. Use for logging every call; for only the hot leads use Lead Interested or Lead Transferred.",
  sampleData: solarDialerSamples.callEnded,
  outputSchema: solarDialerOutputSchemas.callEvent,
});
