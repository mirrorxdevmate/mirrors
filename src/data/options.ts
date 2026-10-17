export const INTENTS = ['Serious relationship', 'Marriage', 'Dating', 'Casual', 'Friendship / Social connection', 'Still figuring it out'];
export const STATUSES = ['Single', 'Separated', 'Divorced', 'Widowed'];
export const CHILDREN = [
  'Have children and want more',
  "Have children and don't want more",
  "Don't have children, but want them",
  "Don't have children and don't want them",
  'Not sure yet',
  'Prefer not to say',
];
export const LIFESTYLE: { key: string; label: string; options: string[] }[] = [
  { key: 'smoking', label: 'Smoking', options: ['Never', 'Sometimes', 'Regularly', 'Trying to quit'] },
  { key: 'drinking', label: 'Drinking', options: ['Never', 'Socially', 'Regularly'] },
  { key: 'exercise', label: 'Exercise', options: ['Rarely', 'Sometimes', 'Very active'] },
  { key: 'social', label: 'Social Style', options: ['Homebody', 'Balanced', 'Social'] },
  { key: 'pets', label: 'Pets', options: ['No pets', 'Have pets', 'Love pets', "Don't prefer"] },
];
export const HOBBIES = ['Travel', 'Fitness', 'Food', 'Cooking', 'Music', 'Reading', 'Sports', 'Movies', 'Fashion', 'Art', 'Gaming', 'Hiking', 'Socializing', 'Wellness', 'Photography'];
export const FAITHS = ['Muslim', 'Christian', 'Hindu', 'Buddhist', 'Jewish', 'Spiritual', 'Not religious', 'Prefer not to say'];
export const EDUCATION = ['High school', "Bachelor's", "Master's", 'Doctorate', 'Other', 'Prefer not to say'];
export const CULTURES = ['South Asian', 'Middle Eastern / North African', 'Black / African', 'East Asian', 'White / European', 'Latin / Hispanic', 'Other', 'Prefer not to say'];
export const MATTERS = ['Personality', 'Communication', 'Physical attraction', 'Family goals', 'Shared values', 'Financial stability', 'Lifestyle', 'Religion', 'Children', 'Ambition', 'Education', 'Career', 'Interests', 'Location'];
export const FLEX_LEVELS = ['Flexible', 'Preference', 'Important', 'Deal-breaker'] as const;
export const NOT_FOR_ME = ['Not attracted', 'Different intent', 'Lifestyle mismatch', 'Distance', 'Not my type', 'Other'];
export const REPORT_REASONS = ['Fake profile', 'Catfishing', 'Scam', 'Money request', 'Misleading intentions', 'Harassment', 'Inappropriate sexual behavior', 'Spam / promotion', 'Other'];
export const LEAVE_REASONS = [
  'I met someone on Mirror',
  'I met someone somewhere else',
  "I'm not finding the right matches",
  "I'm not getting enough matches",
  "I'm taking a break from dating",
  "Mirror isn't what I expected",
  'Other',
];
export const DEAL_BREAKERS = ['Honesty', 'Relationship intention', 'Smoking', 'Wants children', "Doesn't want children", 'Religion', 'Distance', 'Drinking'];
