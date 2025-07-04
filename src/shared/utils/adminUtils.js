/**
 * Admin utility functions
 */

export function isAdminUser(user) {
  if (!user) return false;
  
  return user.email === 'lsg5235@gmail.com' || 
         user.user_metadata?.role === 'admin' ||
         user.user_metadata?.role === 'developer' ||
         user?.user_profiles?.is_admin;
};

export function checkAdminAccess(user) {
  return isAdminUser(user);
};

export function checkPremiumAccess(user) {
  if (!user) return false;
  
  // Admin users automatically have premium access
  if (isAdminUser(user)) return true;
  
  // Check premium status from user_profiles
  return user?.user_profiles?.is_premium || false;
};

export function checkPremiumOrAdminAccess(user) {
  return checkAdminAccess(user) || checkPremiumAccess(user);
};