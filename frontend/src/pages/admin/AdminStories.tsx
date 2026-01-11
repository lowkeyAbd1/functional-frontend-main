import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { storiesService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { getAgentImageUrl } from '@/lib/agentImage';
import type { Story } from '@/types';

const AdminStories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    media_type: 'video' as 'image' | 'video', // Default to video since user wants to add video
    media_url: '',
    thumbnail_url: '',
    duration: 30,
    title: '',
    project_name: '',
    caption: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      console.log('[AdminStories] Fetching stories...'); // Debug log
      // For agents, fetch their own stories; for admins, fetch all stories
      const response = await storiesService.getAll(); // Fetch all stories (backend filters by agent if needed)
      console.log('[AdminStories] Response:', response); // Debug log
      if (response.success && response.data) {
        const storiesArray = Array.isArray(response.data) ? response.data : [];
        console.log('[AdminStories] Loaded', storiesArray.length, 'stories'); // Debug log
        setStories(storiesArray);
      } else {
        console.warn('[AdminStories] No stories data:', response);
        setStories([]);
      }
    } catch (err: any) {
      console.error('[AdminStories] Failed to fetch stories:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to load stories. Make sure the database table exists.',
        variant: 'destructive',
      });
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;

    try {
      const response = await storiesService.delete(storyToDelete.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Story deleted successfully',
        });
        fetchStories();
      } else {
        throw new Error(response.message || 'Failed to delete story');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete story',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let response;
      if (uploadFile) {
        // Upload file
        const formDataObj = new FormData();
        formDataObj.append('media', uploadFile);
        formDataObj.append('media_type', formData.media_type);
        formDataObj.append('duration', formData.duration.toString());
        if (formData.thumbnail_url) {
          formDataObj.append('thumbnail_url', formData.thumbnail_url);
        }
        response = await storiesService.create(formDataObj);
      } else {
        // Use URL
        if (!formData.media_url || formData.media_url.trim() === '') {
          throw new Error(`${formData.media_type === 'video' ? 'Video' : 'Image'} URL or file is required`);
        }
        
        // Validate URL format
        const urlPattern = /^(https?:\/\/|http:\/\/)/i;
        if (!urlPattern.test(formData.media_url.trim())) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }
        
        response = await storiesService.create({
          media_type: formData.media_type,
          media_url: formData.media_url.trim(),
          thumbnail_url: formData.thumbnail_url?.trim() || undefined,
          duration: formData.duration,
          title: formData.title || undefined,
          project_name: formData.project_name || undefined,
          caption: formData.caption || undefined,
        });
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Story created successfully',
        });
        setShowAddForm(false);
        setFormData({ media_type: 'video', media_url: '', thumbnail_url: '', duration: 30, title: '', project_name: '', caption: '' });
        setUploadFile(null);
        fetchStories();
      } else {
        throw new Error(response.message || 'Failed to create story');
      }
    } catch (err: any) {
      console.error('[AdminStories] Create story error:', err);
      console.error('[AdminStories] Error details:', {
        message: err.message,
        code: err.code,
        sqlState: err.sqlState,
        response: err.response,
        stack: err.stack
      });
      
      // Extract error message - prefer sqlMessage, then message, then default
      let errorMessage = err.message || 'Failed to create story';
      if (err.response?.sqlMessage) {
        errorMessage = err.response.sqlMessage;
      } else if (err.response?.message) {
        errorMessage = err.response.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    return `${import.meta.env.VITE_UR}${url}`;
  };

  return (
    <ProtectedRoute roles={['agent']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">TruBroker™ Stories</h1>
                <p className="text-muted-foreground">Manage your stories</p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Story
              </Button>
            </div>

            {/* Add Story Form */}
            {showAddForm && (
              <div className="glass-card p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Add New Story</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Media Type *</label>
                    <select
                      value={formData.media_type}
                      onChange={(e) => {
                        const newType = e.target.value as 'image' | 'video';
                        setFormData({ ...formData, media_type: newType });
                        // Clear file/URL when switching types
                        setUploadFile(null);
                        setFormData(prev => ({ ...prev, media_url: '', thumbnail_url: '' }));
                      }}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                      required
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Story title"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name (Optional)</label>
                    <input
                      type="text"
                      value={formData.project_name}
                      onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                      placeholder="Related project name"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Caption (Optional)</label>
                    <textarea
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Story caption or description"
                      rows={3}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {formData.media_type === 'video' ? 'Video URL or Upload File' : 'Image URL or Upload File'}
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Option 1: Paste {formData.media_type === 'video' ? 'Video' : 'Image'} URL
                        </label>
                        <input
                          type="url"
                          value={formData.media_url}
                          onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                          placeholder={formData.media_type === 'video' 
                            ? "https://example.com/video.mp4 or https://youtube.com/watch?v=..." 
                            : "https://example.com/image.jpg"}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.media_type === 'video' 
                            ? 'Supports direct video URLs (.mp4, .webm, etc.) or YouTube/Vimeo links'
                            : 'Supports direct image URLs (.jpg, .png, .webp, etc.)'}
                        </p>
                      </div>
                      <div className="text-center text-sm text-muted-foreground font-medium">OR</div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Option 2: Upload File
                        </label>
                        <input
                          type="file"
                          accept={formData.media_type === 'video' ? 'video/*' : 'image/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setUploadFile(file || null);
                            // Clear URL when file is selected
                            if (file) {
                              setFormData({ ...formData, media_url: '' });
                            }
                          }}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                        />
                        {uploadFile && (
                          <p className="text-xs text-green-600 mt-1">
                            Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.media_type === 'video' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Thumbnail/Preview Image URL (Optional)</label>
                      <input
                        type="url"
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Preview image shown before video plays. If not provided, first frame will be used.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (seconds, max 30) *</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Math.min(30, Math.max(1, parseInt(e.target.value) || 30)) })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Story'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Stories List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div key={story.id} className="glass-card overflow-hidden">
                    <div className="relative aspect-[9/16] bg-black">
                      {story.media_type === 'video' ? (
                        <video
                          src={getMediaUrl(story.media_url)}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={getMediaUrl(story.thumbnail_url || story.media_url)}
                          alt={`Story by ${story.agent_name}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        {story.media_type === 'video' ? (
                          <Video className="w-5 h-5 text-white" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={getAgentImageUrl({ profile_photo: story.agent_photo, image: null })}
                          alt={story.agent_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{story.agent_name}</p>
                          <p className="text-xs text-muted-foreground">{story.duration}s</p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setStoryToDelete(story);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No stories yet. Create your first story!</p>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Story</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this story? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminStories;

