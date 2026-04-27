// India-focused first, with a generic emergency line as the universal fallback.
// If you fork this for another region, replace the entries — keep the same
// shape (kind: 'mental' | 'medical' | 'emergency').

export const HELPLINES = [
  {
    id: 'kiran',
    name: 'Kiran (National Mental Health)',
    number: '1800-599-0019',
    tel: '18005990019',
    kind: 'mental',
    hours: '24/7',
    note: 'Government-run mental-health helpline. Free, confidential.',
  },
  {
    id: 'vandrevala',
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    tel: '18602662345',
    kind: 'mental',
    hours: '24/7',
    note: 'Free counselling for mental-health concerns and crisis support.',
  },
  {
    id: 'icall',
    name: 'iCall (TISS)',
    number: '9152987821',
    tel: '+919152987821',
    kind: 'mental',
    hours: 'Mon–Sat, 8 AM – 10 PM',
    note: 'Trained psychologists. Email and chat options also available.',
  },
  {
    id: 'health-104',
    name: 'National Health Helpline',
    number: '104',
    tel: '104',
    kind: 'medical',
    hours: '24/7',
    note: 'General medical advice, hospital info, and referrals.',
  },
  {
    id: 'emergency-112',
    name: 'Emergency (all services)',
    number: '112',
    tel: '112',
    kind: 'emergency',
    hours: '24/7',
    note: 'Police, fire, ambulance — single emergency number.',
  },
];

export const KIND_LABEL = {
  mental: 'Mental health',
  medical: 'General medical',
  emergency: 'Emergency',
};

export const KIND_COLOR = {
  mental: '#64D2FF',
  medical: '#30D158',
  emergency: '#FF453A',
};
