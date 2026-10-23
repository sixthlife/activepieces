export type SolarDialerAccount = {
  ok: boolean;
  id: number;
  name: string | null;
  email: string | null;
  company: string | null;
};

export type SolarDialerList = {
  id: number;
  name: string;
  leads: number;
};

export type SolarDialerCampaign = {
  id: number;
  name: string;
  status: string;
  list_ids: number[];
};

export type SolarDialerSavedLead = {
  ok: boolean;
  id: string;
  lead_id: string;
  created: boolean;
  list: string | null;
  campaign_id?: number;
  warnings?: string[];
};

export type SolarDialerCalledLead = SolarDialerSavedLead & {
  called: boolean;
  call_id: string | null;
  reason: string | null;
};

export type SolarDialerFoundLead = {
  lead_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phones: string[];
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source_id: string | null;
  status: string | null;
  url: string;
};

export type SolarDialerHook = {
  id: number;
  event: string;
  target_url: string;
  source: string | null;
  failing: boolean;
  secret: string;
};

export type SolarDialerEvent = Record<string, unknown> & {
  id: number;
  event: string;
  created_at: string;
};
