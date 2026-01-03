/**
 * Time utility functions for displaying relative time
 */

export const getDaysAgo = (date: string | Date): string => {
  const now = new Date();
  const storyDate = new Date(date);
  const diffMs = now.getTime() - storyDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
};

export const isExpired = (expiresAt: string | Date): boolean => {
  return new Date(expiresAt) < new Date();
};

export const getTimeUntilExpiry = (expiresAt: string | Date): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `Expires in ${diffHours}h ${diffMinutes}m`;
  } else {
    return `Expires in ${diffMinutes}m`;
  }
};

