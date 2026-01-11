export const ACTION_CACHE_MAP: Record<string, string[]> = {
  // Budget Actions
  'budget.create': ['/api/budget'],
  'budget.update': ['/api/budget'],
  'budget.patch': ['/api/budget'],
  'budget.setActive': ['/api/budget'],
  'budget.delete': ['/api/budget'],

  // Category Actions
  'category.create': ['/api/categories'],
  'category.update': ['/api/categories'],
  'category.delete': ['/api/categories'],

  // Mono Actions
  'mono.processConnection': ['/api/accounts', '/api/transactions'],

  // User Actions
  'user.signup': [],
  'user.updateProfile': ['/api/user'],
  'delete.user': [],

  // Security Actions
  'security.changePassword': [],
  'security.changePIN': [],
  'security.setPIN': [],
  'security.resendVerificationEmail': [],

  // Settings Actions
  'settings.update': ['/api/user'],

  // Session Actions
  'session.logout': [],
  'session.revoke': ['/api/sessions/active'],
  'session.logoutAll': ['/api/sessions/active'],
}
