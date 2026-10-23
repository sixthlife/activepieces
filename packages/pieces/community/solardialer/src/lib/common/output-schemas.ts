import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const leadFields: OutputSchemaField[] = [
  { key: 'lead_id', label: 'SolarDialer Lead ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'phones', label: 'Phones' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP' },
  {
    key: 'source_id',
    label: 'Your Lead ID',
    description: 'The ID the lead came in with (a CSV row, a CRM contact).',
  },
];

const leadField: OutputSchemaField = {
  key: 'lead',
  label: 'Lead',
  children: leadFields,
};

const eventHead: OutputSchemaField[] = [
  { key: 'id', label: 'Event ID', format: 'number' },
  { key: 'event', label: 'Event' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const callEvent: OutputSchema = {
  fields: [
    ...eventHead,
    { key: 'call_id', label: 'Call ID' },
    {
      key: 'outcome',
      label: 'Outcome',
      description:
        'As the Calls page shows it: transferred, transfer_failed, talked, voicemail, no_answer, called_us and so on.',
    },
    { key: 'ended_reason', label: 'Ended Reason' },
    {
      key: 'direction',
      label: 'Direction',
      description: 'outbound: SolarDialer called the lead; inbound: the lead called you.',
    },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'seconds', label: 'Duration (Seconds)', format: 'number' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'campaign', label: 'Campaign' },
    { key: 'disposition', label: 'Disposition' },
    { key: 'call_url', label: 'Call URL', format: 'url' },
    {
      key: 'recording_url',
      label: 'Recording URL',
      format: 'url',
      description:
        "The API's address for the audio: it needs your API key. To download the file, use Recording File URL.",
    },
    {
      key: 'recording_link',
      label: 'Recording Link',
      format: 'url',
      description:
        'Plays the recording in a browser, no login needed: for a CRM note or an email.',
    },
    {
      key: 'recording_audio',
      label: 'Recording File URL',
      format: 'url',
      description:
        'The audio file itself, no key needed: download it with the HTTP piece.',
    },
    {
      key: 'from_number',
      label: 'From Number',
      description:
        'Your number on the call: the one SolarDialer called from, or the lead called.',
    },
    {
      key: 'to_number',
      label: 'To Number',
      description:
        "The lead's number this call rang (it may be their second or third).",
    },
    { key: 'summary', label: 'Summary' },
    { key: 'transcript', label: 'Transcript' },
    {
      key: 'answers',
      label: 'Answers',
      description:
        "What the lead answered the agent's qualifying questions (homeowner, monthly_bill...).",
    },
    { key: 'objections', label: 'Objections' },
    { key: 'interest', label: 'Interest (1-5)', format: 'number' },
    leadField,
  ],
};

const callbackEvent: OutputSchema = {
  fields: [
    ...eventHead,
    { key: 'at', label: 'Callback At', format: 'datetime' },
    { key: 'when_text', label: 'When (As Said)' },
    { key: 'note', label: 'Note' },
    { key: 'set_by', label: 'Set By' },
    {
      key: 'caller',
      label: 'Who Calls Back',
      description:
        "agent: SolarDialer's agent calls them again; closer: your closer calls them.",
    },
    {
      key: 'kind',
      label: 'Kind',
      description: 'phone: a call back; home: a home visit.',
    },
    leadField,
  ],
};

const statusChangedEvent: OutputSchema = {
  fields: [
    ...eventHead,
    { key: 'old', label: 'Old Status' },
    { key: 'new', label: 'New Status' },
    leadField,
  ],
};

const leadCreatedEvent: OutputSchema = {
  fields: [
    ...eventHead,
    { key: 'list', label: 'List' },
    { key: 'source', label: 'Source' },
    leadField,
  ],
};

const campaignFinishedEvent: OutputSchema = {
  fields: [
    ...eventHead,
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'campaign', label: 'Campaign' },
    { key: 'how', label: 'How It Finished' },
    { key: 'leads', label: 'Leads', format: 'number' },
    { key: 'calls', label: 'Calls', format: 'number' },
    { key: 'talked', label: 'Talked', format: 'number' },
    { key: 'transferred', label: 'Transferred', format: 'number' },
    { key: 'appointments', label: 'Appointments', format: 'number' },
    { key: 'finished_at', label: 'Finished At', format: 'datetime' },
  ],
};

const leadRemovedEvent: OutputSchema = {
  fields: [...eventHead, { key: 'call_id', label: 'Call ID' }, leadField],
};

const savedLeadFields: OutputSchemaField[] = [
  { key: 'id', label: 'SolarDialer Lead ID' },
  { key: 'lead_id', label: 'Your Lead ID' },
  {
    key: 'created',
    label: 'Created',
    format: 'boolean',
    description: 'True for a new lead; false when an existing one was updated.',
  },
  { key: 'list', label: 'List' },
  { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
  {
    key: 'warnings',
    label: 'Warnings',
    description: 'Parts of the lead that were left out, and why.',
  },
];

const savedLead: OutputSchema = {
  fields: savedLeadFields,
};

const calledLead: OutputSchema = {
  fields: [
    { key: 'called', label: 'Called', format: 'boolean' },
    { key: 'call_id', label: 'Call ID' },
    {
      key: 'reason',
      label: 'Why It Was Not Called',
      description:
        'Set when the lead was saved but not called now (outside its calling hours, called too recently...). A running campaign on its list calls it when it can.',
    },
    ...savedLeadFields,
  ],
};

const foundLead: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      format: 'boolean',
      description: 'False when no lead has this phone number or ID.',
    },
    ...leadFields,
    { key: 'status', label: 'Status' },
    { key: 'url', label: 'Lead URL', format: 'url' },
  ],
};

export const solarDialerOutputSchemas = {
  callEvent,
  callbackEvent,
  statusChangedEvent,
  leadCreatedEvent,
  campaignFinishedEvent,
  leadRemovedEvent,
  savedLead,
  calledLead,
  foundLead,
};
