import type { Story, StoryGroup } from '@/types';

/**
 * Group stories by agent (Bayut-style)
 * Stories are sorted: oldest → newest within each agent
 * Agents are sorted: newest first
 */
export function groupStoriesByAgent(apiStories: Story[]): StoryGroup[] {
  const map = new Map<number, StoryGroup>();

  apiStories.forEach((s) => {
    const agentId = s.agent_id;
    if (!map.has(agentId)) {
      map.set(agentId, {
        agent_id: agentId,
        agent_name: s.agent_name,
        agent_title: s.agent_title,
        agent_photo: s.agent_photo,
        phone: s.phone,
        whatsapp: s.whatsapp,
        postedAt: s.created_at,
        stories: []
      });
    }
    map.get(agentId)!.stories.push(s);
  });

  // Sort stories within each agent: newest → oldest (most recent first)
  const groups = Array.from(map.values());
  groups.forEach(g => {
    g.stories.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Newest first
    });
  });

  // Sort agents: newest first (most recent agent stories appear first)
  groups.sort((a, b) => {
    // Use the newest story's date for each agent
    const newestA = a.stories.length > 0 
      ? new Date(a.stories[0].created_at).getTime() 
      : new Date(a.postedAt || '').getTime();
    const newestB = b.stories.length > 0 
      ? new Date(b.stories[0].created_at).getTime() 
      : new Date(b.postedAt || '').getTime();
    return newestB - newestA; // Newest first
  });

  return groups;
}

