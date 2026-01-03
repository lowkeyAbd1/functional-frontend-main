import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { storiesService } from '@/services/api';
import { getAgentImageUrl } from '@/lib/agentImage';
import type { AgentWithStories } from '@/types';
import StoryViewerModal from './StoryViewerModal';

const StoriesRow = ({ city }: { city?: string }) => {
  const [agentsWithStories, setAgentsWithStories] = useState<AgentWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<{ agent: AgentWithStories['agent']; storyIndex: number } | null>(null);

  useEffect(() => {
    fetchStories();
  }, [city]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await storiesService.getActive({ city });
      if (response.success && response.data) {
        setAgentsWithStories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (agent: AgentWithStories['agent'], storyIndex: number) => {
    setSelectedStory({ agent, storyIndex });
  };

  const handleCloseModal = () => {
    setSelectedStory(null);
  };

  const handleNextStory = () => {
    if (!selectedStory) return;
    
    const agent = agentsWithStories.find(a => a.agent.id === selectedStory.agent.id);
    if (!agent) return;
    
    if (selectedStory.storyIndex < agent.stories.length - 1) {
      setSelectedStory({ ...selectedStory, storyIndex: selectedStory.storyIndex + 1 });
    } else {
      // Move to next agent's first story
      const currentIndex = agentsWithStories.findIndex(a => a.agent.id === selectedStory.agent.id);
      if (currentIndex < agentsWithStories.length - 1) {
        const nextAgent = agentsWithStories[currentIndex + 1];
        if (nextAgent.stories.length > 0) {
          setSelectedStory({ agent: nextAgent.agent, storyIndex: 0 });
        }
      }
    }
  };

  const handlePrevStory = () => {
    if (!selectedStory) return;
    
    if (selectedStory.storyIndex > 0) {
      setSelectedStory({ ...selectedStory, storyIndex: selectedStory.storyIndex - 1 });
    } else {
      // Move to previous agent's last story
      const currentIndex = agentsWithStories.findIndex(a => a.agent.id === selectedStory.agent.id);
      if (currentIndex > 0) {
        const prevAgent = agentsWithStories[currentIndex - 1];
        if (prevAgent.stories.length > 0) {
          setSelectedStory({ agent: prevAgent.agent, storyIndex: prevAgent.stories.length - 1 });
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (agentsWithStories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {agentsWithStories.map((item) => {
          const agent = item.agent;
          const hasActiveStories = item.stories.length > 0;
          
          return (
            <button
              key={agent.id}
              onClick={() => hasActiveStories && handleStoryClick(agent, 0)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className="relative">
                {/* Story ring */}
                <div className={`absolute inset-0 rounded-full ${hasActiveStories ? 'bg-gradient-to-tr from-primary via-primary/80 to-primary/60 p-0.5' : 'bg-muted p-0.5'}`}>
                  <div className="w-full h-full rounded-full bg-background"></div>
                </div>
                {/* Profile photo */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-secondary">
                  <img
                    src={getAgentImageUrl(agent)}
                    alt={agent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Active indicator */}
                {hasActiveStories && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                )}
              </div>
              <span className="text-xs text-muted-foreground max-w-[80px] truncate group-hover:text-foreground transition-colors">
                {agent.name}
              </span>
            </button>
          );
        })}
      </div>

      {selectedStory && (
        <StoryViewerModal
          agent={selectedStory.agent}
          storyIndex={selectedStory.storyIndex}
          agentsWithStories={agentsWithStories}
          onClose={handleCloseModal}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
        />
      )}
    </>
  );
};

export default StoriesRow;

