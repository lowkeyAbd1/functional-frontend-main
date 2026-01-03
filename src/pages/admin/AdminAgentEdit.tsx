import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { agentService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/types';

const AdminAgentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    title: '',
    specialty: '',
    city: '',
    languages: '',
    specialization: '',
    company: '',
    phone: '',
    whatsapp: '',
    profile_photo: '',
    image: '',
    experience: 0,
    rating: 0,
    reviews: 0,
    sales: '',
  });

  useEffect(() => {
    if (id) {
      fetchAgent();
    }
  }, [id]);

  const fetchAgent = async () => {
    setLoadingData(true);
    try {
      const response = await agentService.getById(parseInt(id!));
      if (response.success && response.data) {
        const agent = response.data;
        setFormData({
          name: agent.name || '',
          title: agent.title || '',
          specialty: agent.specialty || '',
          city: agent.city || '',
          languages: agent.languages || '',
          specialization: agent.specialization || '',
          company: agent.company || '',
          phone: agent.phone || '',
          whatsapp: agent.whatsapp || '',
          profile_photo: agent.profile_photo || '',
          image: agent.image || '',
          experience: agent.experience || 0,
          rating: agent.rating || 0,
          reviews: agent.reviews || 0,
          sales: agent.sales || '',
        });
      } else {
        throw new Error(response.message || 'Failed to load agent');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load agent',
        variant: 'destructive',
      });
      navigate('/admin/agents');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare data: convert empty strings to null, ensure numbers are numbers
      const updateData: Partial<Agent> = {
        name: formData.name?.trim() || '',
        title: formData.title?.trim() || null,
        specialty: formData.specialty?.trim() || null,
        specialization: formData.specialization?.trim() || null,
        city: formData.city?.trim() || null,
        languages: formData.languages?.trim() || null,
        company: formData.company?.trim() || null,
        phone: formData.phone?.trim() || null,
        whatsapp: formData.whatsapp?.trim() || null,
        profile_photo: formData.profile_photo?.trim() || null,
        image: formData.image?.trim() || null,
        experience: formData.experience ? Number(formData.experience) : 0,
        rating: formData.rating ? Number(formData.rating) : 0,
        reviews: formData.reviews ? Number(formData.reviews) : 0,
        sales: formData.sales?.trim() || null,
      };

      // Remove null values that are empty strings converted to null
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof Agent];
        if (value === '' || (typeof value === 'string' && value.trim() === '')) {
          updateData[key as keyof Agent] = null as any;
        }
      });

      const response = await agentService.update(parseInt(id!), updateData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Agent updated successfully',
        });
        navigate('/admin/agents');
      } else {
        throw new Error(response.message || 'Failed to update agent');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ProtectedRoute roles={['admin']}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-24">
            <div className="container-custom py-8">
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate('/admin/agents')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agents
            </Button>

            <h1 className="text-3xl font-bold mb-8">Edit Agent</h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
              {/* Basic Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Senior Real Estate Agent"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty || ''}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="e.g., Luxury Homes"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization || ''}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g., Residential, Commercial"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., FaithState Real Estate"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Mogadishu"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g., +252612345678"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="e.g., 252612345678"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Languages</label>
                    <input
                      type="text"
                      value={formData.languages || ''}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      placeholder="e.g., Somali, English, Arabic (comma-separated)"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separate multiple languages with commas
                    </p>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Profile Photo URL</label>
                    <input
                      type="text"
                      value={formData.profile_photo || ''}
                      onChange={(e) => {
                        let value = e.target.value.trim();
                        if (value && (value.includes(':\\') || value.startsWith('file://') || value.startsWith('C:\\'))) {
                          toast({
                            title: 'Invalid Path',
                            description: 'Please use relative paths like /uploads/agents/filename.jpg or full URLs',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setFormData({ ...formData, profile_photo: value });
                      }}
                      placeholder="/uploads/agents/filename.jpg or https://..."
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use relative path: /uploads/agents/filename.jpg or full URL
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL (Legacy)</label>
                    <input
                      type="text"
                      value={formData.image || ''}
                      onChange={(e) => {
                        let value = e.target.value.trim();
                        if (value && (value.includes(':\\') || value.startsWith('file://') || value.startsWith('C:\\'))) {
                          toast({
                            title: 'Invalid Path',
                            description: 'Please use relative paths like /uploads/agents/filename.jpg or full URLs',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setFormData({ ...formData, image: value });
                      }}
                      placeholder="/uploads/agents/filename.jpg or https://..."
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use relative path: /uploads/agents/filename.jpg or full URL
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats (Optional) */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Stats (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience (years)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.experience || 0}
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating || 0}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reviews</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reviews || 0}
                      onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sales</label>
                    <input
                      type="text"
                      value={formData.sales || ''}
                      onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
                      placeholder="e.g., $12M+"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Agent'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/agents')}>
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

export default AdminAgentEdit;

