import { solarDialerOutputSchemas } from '../common/output-schemas';
import { solarDialerSamples } from '../common/samples';
import { solarDialerWebhook } from '../common/webhook';

export const campaignFinishedTrigger = solarDialerWebhook.trigger({
  name: 'campaign_finished',
  displayName: 'Campaign Finished',
  description: 'Triggers when a campaign finishes.',
  event: 'campaign.finished',
  aiDescription:
    'Fires once when a SolarDialer campaign finishes, with its totals: leads, calls, conversations, transfers and appointments.',
  sampleData: solarDialerSamples.campaignFinished,
  outputSchema: solarDialerOutputSchemas.campaignFinishedEvent,
});
