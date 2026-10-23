import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { callLeadAction } from './lib/actions/call-lead';
import { createOrUpdateLeadAction } from './lib/actions/create-or-update-lead';
import { findLeadAction } from './lib/actions/find-lead';
import { solarDialerAuth } from './lib/auth';
import { SOLARDIALER_BASE_URL } from './lib/common/client';
import { callEndedTrigger } from './lib/triggers/call-ended';
import { callbackBookedTrigger } from './lib/triggers/callback-booked';
import { campaignFinishedTrigger } from './lib/triggers/campaign-finished';
import { leadAskedNotToBeCalledTrigger } from './lib/triggers/lead-asked-not-to-be-called';
import { leadInterestedTrigger } from './lib/triggers/lead-interested';
import { leadStatusChangedTrigger } from './lib/triggers/lead-status-changed';
import { leadTransferredTrigger } from './lib/triggers/lead-transferred';
import { newLeadTrigger } from './lib/triggers/new-lead';

export const solardialer = createPiece({
  displayName: 'SolarDialer',
  description:
    'AI calling for solar sales teams: calls your leads, qualifies them and live-transfers interested homeowners to your closer.',
  auth: solarDialerAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/solardialer.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  authors: ['sixthlife'],
  actions: [
    callLeadAction,
    createOrUpdateLeadAction,
    findLeadAction,
    createCustomApiCallAction({
      baseUrl: () => SOLARDIALER_BASE_URL,
      auth: solarDialerAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    callEndedTrigger,
    leadTransferredTrigger,
    leadInterestedTrigger,
    callbackBookedTrigger,
    leadStatusChangedTrigger,
    newLeadTrigger,
    campaignFinishedTrigger,
    leadAskedNotToBeCalledTrigger,
  ],
});
