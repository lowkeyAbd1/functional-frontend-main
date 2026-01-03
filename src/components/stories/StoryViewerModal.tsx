import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Phone, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getAgentImageUrl } from '@/lib/agentImage';
import type { StoryGroup } from '@/types';

// Helper function to format time ago
const getTimeAgo = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    
    const diffMonth = Math.floor(diffDay / 30);
    return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
};

interface StoryViewerModalProps {
  storyGroups: StoryGroup[];
  initialAgentIndex: number;
  onClose: () => void;
}

const StoryViewerModal = ({
  storyGroups,
  initialAgentIndex,
  onClose,
}: StoryViewerModalProps) => {
  const navigate = useNavigate();
  const [agentIndex, setAgentIndex] = useState(initialAgentIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const actualDurationRef = useRef<number>(30);

  // Get current agent and story
  const currentAgent = storyGroups[agentIndex];
  const currentStory = currentAgent?.stories[storyIndex];

  // Bayut-style navigation: Next
  const goNext = useCallback(() => {
    const agent = storyGroups[agentIndex];
    if (!agent) return;
    const isLastStory = storyIndex >= agent.stories.length - 1;

    if (!isLastStory) {
      // Next story in same agent
      setStoryIndex(storyIndex + 1);
    } else {
      // Last story of current agent → move to next agent
      const isLastAgent = agentIndex >= storyGroups.length - 1;
      if (!isLastAgent) {
        setAgentIndex(agentIndex + 1);
        setStoryIndex(0); // Start from first story of next agent
      } else {
        // End of all stories
        onClose();
      }
    }
  }, [agentIndex, storyIndex, storyGroups, onClose]);

  // Bayut-style navigation: Previous
  const goPrev = useCallback(() => {
    const agent = storyGroups[agentIndex];
    if (!agent) return;
    const isFirstStory = storyIndex <= 0;

    if (!isFirstStory) {
      // Previous story in same agent
      setStoryIndex(storyIndex - 1);
    } else {
      // First story of current agent → go to last story of previous agent
      const isFirstAgent = agentIndex <= 0;
      if (!isFirstAgent) {
        const prevAgentIndex = agentIndex - 1;
        const prevAgent = storyGroups[prevAgentIndex];
        setAgentIndex(prevAgentIndex);
        setStoryIndex(prevAgent.stories.length - 1); // Last story of previous agent
      }
      // If first agent and first story, do nothing (stay at start)
    }
  }, [agentIndex, storyIndex, storyGroups]);

  // Reset progress when agent or story changes
  useEffect(() => {
    // Smooth transition: reset progress immediately
    setProgress(0);
    setPlaybackDuration(null);
    actualDurationRef.current = 30;

    if (!currentStory) return;

    // Small delay to ensure smooth transition between stories
    const transitionTimeout = setTimeout(() => {
      // Continue with story setup after transition
    }, 50);

    // Handle video playback - use actual video duration
    if (currentStory.media_type === 'video' && videoRef.current) {
      const videoEl = videoRef.current;
      
      const handleLoadedMetadata = () => {
        const videoDuration = videoEl.duration || 0;
        if (videoDuration > 0) {
          // Use actual video duration (cap at 30s max)
          const actualDuration = Math.min(videoDuration, 30);
          actualDurationRef.current = actualDuration;
          setPlaybackDuration(actualDuration);
          playVideo(actualDuration);
        } else {
          const fallbackDuration = Math.min(currentStory.duration || 30, 30);
          actualDurationRef.current = fallbackDuration;
          setPlaybackDuration(fallbackDuration);
          playVideo(fallbackDuration);
        }
      };
      
      const playVideo = async (duration: number) => {
        try {
          videoEl.currentTime = 0;
          videoEl.muted = false;
          await videoEl.play();
          
          const durationMs = duration * 1000;
          const interval = 50;
          let elapsed = 0;
          
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          progressIntervalRef.current = setInterval(() => {
            elapsed += interval;
            const newProgress = Math.min((elapsed / durationMs) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              goNext();
            }
          }, interval);
          
        } catch (playError) {
          console.error('[StoryViewerModal] Video play error:', playError);
          videoEl.muted = true;
          await videoEl.play().catch(console.error);
          videoEl.addEventListener('playing', () => {
            videoEl.muted = false;
          }, { once: true });
        }
      };
      
      if (videoEl.readyState >= 1) {
        handleLoadedMetadata();
      } else {
        videoEl.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
      
      const handleTimeUpdate = () => {
        const stopDuration = actualDurationRef.current;
        if (videoEl.currentTime >= stopDuration) {
          videoEl.pause();
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          goNext();
        }
      };
      
      videoEl.addEventListener('timeupdate', handleTimeUpdate);
      videoEl.addEventListener('ended', () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        goNext();
      });
      
      return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
        videoEl.removeEventListener('ended', goNext);
        videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.removeEventListener('playing', () => {});
      };
    } else {
      // For images, use story duration (clamped 1-30 seconds)
      const imgDuration = Math.min(Math.max(currentStory.duration || 30, 1), 30);
      setPlaybackDuration(imgDuration);
      const durationMs = imgDuration * 1000;
      const interval = 50;
      let elapsed = 0;

      progressIntervalRef.current = setInterval(() => {
        elapsed += interval;
        const newProgress = Math.min((elapsed / durationMs) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          goNext();
        }
      }, interval);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (transitionTimeout) clearTimeout(transitionTimeout);
      if (videoRef.current) {
        videoRef.current.removeEventListener('ended', goNext);
      }
    };
  }, [agentIndex, storyIndex, currentStory, goNext]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, goNext, goPrev]);

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    return `${backendUrl}${url}`;
  };

  const handleCall = () => {
    if (currentAgent?.phone) {
      window.location.href = `tel:${currentAgent.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (currentAgent?.whatsapp) {
      const phone = currentAgent.whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const handleVisitProfile = () => {
    onClose();
    navigate(`/agents/${currentAgent?.agent_id}`);
  };

  if (!currentStory || !currentAgent) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-[420px] w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] bg-transparent border-none overflow-hidden custom-close !translate-x-[-50%] !translate-y-[-50%] !left-1/2 !top-1/2">
        <div className="relative w-full bg-black rounded-[24px] overflow-hidden shadow-2xl" style={{ height: 'clamp(600px, 85vh, 800px)', aspectRatio: '9/16', maxWidth: '420px' }}>
          {/* Progress bar - Bayut style: shows ONLY current agent's stories */}
          <div className="absolute top-0 left-0 right-0 z-50 p-2">
            <div className="flex gap-1 mb-2">
              {currentAgent.stories.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-50 ease-linear"
                    style={{
                      width: idx < storyIndex
                        ? '100%'
                        : idx === storyIndex
                        ? `${progress}%`
                        : '0%',
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Time ago + Duration - Below progress bar */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <img
                  src={getAgentImageUrl({ profile_photo: currentAgent.agent_photo, image: null })}
                  alt={currentAgent.agent_name}
                  className="w-6 h-6 rounded-full object-cover border border-white"
                />
                <span className="text-white text-xs font-medium">{currentAgent.agent_name}</span>
                {currentStory.created_at && (
                  <span className="text-white/60 text-xs">
                    • {getTimeAgo(currentStory.created_at)}
                  </span>
                )}
              </div>
              
              {/* Duration badge */}
              {playbackDuration !== null && (
                <span className="text-white/80 text-xs bg-black/50 px-2 py-0.5 rounded">
                  {Math.round(playbackDuration)}s
                </span>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous button - Always visible, disabled when at start */}
          <button
            onClick={goPrev}
            disabled={agentIndex === 0 && storyIndex === 0}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors backdrop-blur-sm ${
              agentIndex === 0 && storyIndex === 0
                ? 'bg-black/20 cursor-not-allowed opacity-50'
                : 'bg-black/50 hover:bg-black/70 cursor-pointer'
            }`}
            aria-label="Previous story"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button - Always visible, disabled when at end */}
          <button
            onClick={goNext}
            disabled={agentIndex >= storyGroups.length - 1 && storyIndex >= currentAgent.stories.length - 1}
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors backdrop-blur-sm ${
              agentIndex >= storyGroups.length - 1 && storyIndex >= currentAgent.stories.length - 1
                ? 'bg-black/20 cursor-not-allowed opacity-50'
                : 'bg-black/50 hover:bg-black/70 cursor-pointer'
            }`}
            aria-label="Next story"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Media content - Smooth transition with fade */}
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            {currentStory.media_type === 'video' ? (
              <video
                key={`story-${agentIndex}-${storyIndex}-${currentStory.id}`}
                ref={videoRef}
                src={getMediaUrl(currentStory.media_url)}
                className="w-full h-full object-cover animate-fade-in"
                playsInline
                autoPlay
                muted={false}
                loop={false}
                poster={currentStory.thumbnail_url ? getMediaUrl(currentStory.thumbnail_url) : undefined}
                onError={(e) => {
                  console.error('[StoryViewerModal] Video load error:', e);
                }}
              />
            ) : (
              <img
                key={`story-${agentIndex}-${storyIndex}-${currentStory.id}`}
                src={getMediaUrl(currentStory.media_url)}
                alt={`Story by ${currentAgent.agent_name}`}
                className="w-full h-full object-cover animate-fade-in"
                onError={(e) => {
                  console.error('[StoryViewerModal] Image load error:', e);
                }}
              />
            )}
          </div>

          {/* Agent info and actions - Bayut style bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <img
                src={getAgentImageUrl({ profile_photo: currentAgent.agent_photo, image: null })}
                alt={currentAgent.agent_name}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm md:text-base truncate">{currentAgent.agent_name}</h3>
                {currentAgent.agent_title && (
                  <p className="text-white/80 text-xs md:text-sm truncate">{currentAgent.agent_title}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {currentAgent.phone && (
                <Button
                  onClick={handleCall}
                  size="sm"
                  className="flex-1 min-w-[100px] bg-white text-black hover:bg-white/90 text-xs md:text-sm"
                >
                  <Phone className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  Call
                </Button>
              )}
              {currentAgent.whatsapp && (
                <Button
                  onClick={handleWhatsApp}
                  size="sm"
                  className="flex-1 min-w-[100px] bg-green-600 text-white hover:bg-green-700 text-xs md:text-sm"
                >
                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  WhatsApp
                </Button>
              )}
              <Button
                onClick={handleVisitProfile}
                size="sm"
                variant="outline"
                className="flex-1 min-w-[100px] border-white text-white hover:bg-white/10 text-xs md:text-sm"
              >
                <User className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                Visit Profile
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewerModal;
