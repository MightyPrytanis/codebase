// User whitelist for SwimMeet registration control
export const AUTHORIZED_USERS = [
  { name: 'David Towne', username: 'davidtowne', email: 'david@towne.com' },
  { name: 'Demo User', username: 'demo', email: 'demo@swimmeet.com' },
  { name: 'John Barreto', username: 'jbarreto', email: 'john@barreto.com' },
  { name: 'Mekel Miller', username: 'mmiller', email: 'mekel@miller.com' },
  { name: 'Patricia Sampier', username: 'psampier', email: 'patricia@sampier.com' },
  { name: 'Heather Reilly', username: 'hreilly', email: 'heather@reilly.com' },
  { name: 'Joseph Reilly', username: 'jreilly', email: 'joseph@reilly.com' },
  { name: 'Grace Reilly', username: 'greilly', email: 'grace@reilly.com' },
  { name: 'Brian Reilly', username: 'breilly', email: 'brian@reilly.com' },
  { name: 'Patrick Wehner', username: 'pwehner', email: 'patrick@wehner.com' },
  { name: 'Brandon Tally', username: 'btally', email: 'brandon@tally.com' }
];

export function isUserWhitelisted(username: string): boolean {
  return AUTHORIZED_USERS.some(user => user.username === username.toLowerCase());
}

export function isEmailWhitelisted(email: string): boolean {
  return AUTHORIZED_USERS.some(user => user.email === email.toLowerCase());
}