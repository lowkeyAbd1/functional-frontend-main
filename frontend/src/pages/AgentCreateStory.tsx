import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { storiesService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const AgentCreateStory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    project_name: '',
    caption: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    
    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        // For videos, use a placeholder or video thumbnail
        setPreviews(prev => [...prev, '']);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload at least one media file',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('project_name', formData.project_name);
      formDataToSend.append('caption', formData.caption);
      
      files.forEach(file => {
        formDataToSend.append('media', file);
      });

      const response = await storiesService.create(formDataToSend);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Story posted successfully! It will expire in 24 hours.',
        });
        
        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        navigate('/find-agent');
      } else {
        throw new Error(response.message || 'Failed to create story');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create story',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute roles={['agent', 'admin']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <h1 className="text-3xl font-bold mb-8">Create Story</h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
              {/* Title */}
              <div className="glass-card p-6">
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., New Property Launch"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>

              {/* Project Name */}
              <div className="glass-card p-6">
                <label className="block text-sm font-medium mb-2">Project Name (Optional)</label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="e.g., Amal Residence"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>

              {/* Caption */}
              <div className="glass-card p-6">
                <label className="block text-sm font-medium mb-2">Caption</label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Tell your story..."
                  rows={4}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>

              {/* Media Upload */}
              <div className="glass-card p-6">
                <label className="block text-sm font-medium mb-4">Media Files (Images/Videos)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </span>
                  </Button>
                </label>

                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={previews[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">Video</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Upload up to 10 images or videos. Story will expire in 24 hours.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" disabled={loading || files.length === 0}>
                  {loading ? 'Posting...' : 'Post Story'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AgentCreateStory;

