import { useState, useEffect } from 'react';
import { storiesService } from '@/services/api';
import { getAgentImageUrl } from '@/lib/agentImage';
import { groupStoriesByAgent } from '@/lib/storyUtils';
import StoryViewerModal from './StoryViewerModal';
import type { Story, StoryGroup } from '@/types';

interface AgentStoriesRowProps {
  city?: string;
}

const AgentStoriesRow = ({ city }: AgentStoriesRowProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchStories();
  }, [city]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await storiesService.getAll();
      console.log('Stories API response:', response); // Debug log
      if (response.success && response.data) {
        const storiesArray = Array.isArray(response.data) ? response.data : [];
        console.log('Stories loaded:', storiesArray.length); // Debug log
        setStories(storiesArray);
        // Group stories by agent (Bayut-style)
        const grouped = groupStoriesByAgent(storiesArray);
        setStoryGroups(grouped);
      } else {
        console.warn('Stories API returned no data:', response);
        setStories([]);
        setStoryGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (agentIndex: number) => {
    // Open modal with this agent's stories (Bayut-style)
    setSelectedAgentIndex(agentIndex);
  };

  const handleCloseModal = () => {
    setSelectedAgentIndex(null);
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    return `${backendUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (stories.length === 0) {
    // Show placeholder message if no stories
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">TruBroker™ Stories – Somalia</h2>
        <p className="text-muted-foreground text-center py-8">
          No stories available yet. Check back soon!
        </p>
      </div>
    );
  }

  // Use storyGroups (already grouped by agent)

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">TruBroker™ Stories – Somalia</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
          {storyGroups.map((group, index) => {
            const firstStory = group.stories[0];
            const thumbnailUrl = firstStory.thumbnail_url || firstStory.media_url;
            
            return (
              <button
                key={group.agent_id}
                onClick={() => handleStoryClick(index)}
                className="flex-shrink-0 group relative"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Story card - Bayut style (one per agent) */}
                <div className="relative w-[170px] h-[280px] sm:w-[190px] sm:h-[320px] md:w-[210px] md:h-[360px] rounded-2xl overflow-hidden bg-secondary shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  {/* Story media - show video thumbnail or image */}
                  <div className="absolute inset-0">
                    {firstStory.media_type === 'video' ? (
                      <>
                        {/* Video thumbnail - prefer thumbnail_url, fallback to video poster */}
                        {firstStory.thumbnail_url ? (
                          <img
                            src={getMediaUrl(firstStory.thumbnail_url)}
                            alt={group.agent_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to video element if thumbnail fails
                              const img = e.currentTarget;
                              const video = document.createElement('video');
                              video.src = getMediaUrl(firstStory.media_url);
                              video.className = 'w-full h-full object-cover';
                              video.muted = true;
                              video.playsInline = true;
                              video.preload = 'metadata';
                              video.currentTime = 0.1;
                              img.parentElement?.replaceChild(video, img);
                            }}
                          />
                        ) : (
                          <video
                            src={getMediaUrl(firstStory.media_url)}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                            poster={getMediaUrl(firstStory.media_url)}
                            onLoadedMetadata={(e) => {
                              // Set thumbnail from first frame
                              const video = e.currentTarget;
                              video.currentTime = 0.1;
                            }}
                          />
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={getMediaUrl(thumbnailUrl)}
                        alt={group.agent_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  {/* Gradient overlay bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Agent avatar overlay - bottom area */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <div className="relative flex-shrink-0">
                      {/* Story ring indicator */}
                      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-primary/60"></div>
                      {/* Profile photo */}
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background border-2 border-background">
                        <img
                          src={getAgentImageUrl({ profile_photo: group.agent_photo, image: null })}
                          alt={group.agent_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{group.agent_name}</p>
                      {group.agent_title && (
                        <p className="text-white/80 text-xs truncate">{group.agent_title}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Media type indicator */}
                  {firstStory.media_type === 'video' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedAgentIndex !== null && storyGroups[selectedAgentIndex] && (
        <StoryViewerModal
          storyGroups={storyGroups}
          initialAgentIndex={selectedAgentIndex}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default AgentStoriesRow;

