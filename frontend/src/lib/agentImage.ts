/**
 * Unified helper to resolve agent image URLs
 * Prefers profile_photo, falls back to image, then default
 * Uses exactly what is stored in database - no transformation
 * Supports full URLs (https://...) and relative paths (/uploads/agents/...)
 */
const DEFAULT_AGENT_IMAGE = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face';

export const getAgentImageUrl = (agent: { profile_photo?: string | null; image?: string | null } | null | undefined): string => {
  if (!agent) {
    return DEFAULT_AGENT_IMAGE;
  }

  // Priority: profile_photo || image (handle null/empty strings)
  const imageUrl = (agent.profile_photo && agent.profile_photo.trim()) || (agent.image && agent.image.trim());

  if (!imageUrl) {
    return DEFAULT_AGENT_IMAGE;
  }

  // If it's already a full URL (http:// or https://), return exactly as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path starting with /uploads/, prepend backend base URL
  // This handles paths like /uploads/agents/ayub.jpg exactly as stored in DB
  if (imageUrl.startsWith('/uploads/')) {
    console.log('Constructing full URL for agent image:', imageUrl);
    return `${import.meta.env.VITE_API_URL}${imageUrl}`;
  }

  // Reject Windows paths (C:\, file://, etc.) - use default instead
  if (imageUrl.includes(':\\') || imageUrl.startsWith('file://') || imageUrl.startsWith('C:\\')) {
    console.warn('Invalid image path detected (Windows absolute path):', imageUrl);
    return DEFAULT_AGENT_IMAGE;
  }

  // Fallback to default if format is unexpected
  return DEFAULT_AGENT_IMAGE;
};

