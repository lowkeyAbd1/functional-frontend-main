import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { agentService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/types';

const AdminAgentCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Agent> & { email?: string; password?: string }>({
    name: '',
    email: '',
    password: '',
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
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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

    if (!formData.email || formData.email.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setTempPassword(null);
    
    try {
      const response = await agentService.createAdminAgent({
        name: formData.name!,
        email: formData.email!,
        password: formData.password || undefined,
        title: formData.title,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        bio: formData.specialty,
        profile_photo: formData.profile_photo,
        image: formData.image,
        experience: formData.experience,
        specialization: formData.specialization,
        specialty: formData.specialty,
        languages: formData.languages,
        city: formData.city,
        company: formData.company,
      });
      
      if (response.success) {
        if (response.tempPassword) {
          setTempPassword(response.tempPassword);
          toast({
            title: 'Success',
            description: 'Agent created successfully. Temporary password generated.',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Agent created successfully',
          });
          navigate('/admin/agents');
        }
      } else {
        throw new Error(response.message || 'Failed to create agent');
      }
    } catch (error: any) {
      console.error('[AdminAgentCreate] Error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create agent';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

            <h1 className="text-3xl font-bold mb-8">Create New Agent</h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
              {/* Account Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Email (Gmail) *</label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="agent@gmail.com"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used for login. If password is not provided, a temporary password will be generated.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Password (Optional)</label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave empty to generate temporary password"
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If left empty, a temporary password will be generated and shown after creation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        // Normalize: if user enters full URL, keep it; if relative path, ensure it starts with /
                        // Reject Windows paths
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
                        // Normalize: reject Windows paths
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

              {/* Temporary Password Display */}
              {tempPassword && (
                <div className="glass-card p-6 bg-green-900/20 border-green-500/50">
                  <h3 className="text-lg font-semibold mb-2 text-green-400">Agent Created Successfully!</h3>
                  <p className="text-sm mb-3">Temporary password generated:</p>
                  <div className="bg-black/50 p-4 rounded-lg border border-green-500/50">
                    <code className="text-lg font-mono text-green-300 break-all">{tempPassword}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Please send this password to the agent. They should change it after first login.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword);
                        toast({
                          title: 'Copied',
                          description: 'Password copied to clipboard',
                        });
                      }}
                      variant="outline"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      Copy Password
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setTempPassword(null);
                        navigate('/admin/agents');
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit */}
              {!tempPassword && (
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Agent'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/agents')}>
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminAgentCreate;

