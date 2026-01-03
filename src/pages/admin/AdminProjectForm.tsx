import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminProjectService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Project as NewProject, PaymentMilestone } from '@/types/project';

const AdminProjectForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    developer: '',
    location: '',
    status: 'Under Construction' as 'Under Construction' | 'Ready',
    handover: '',
    launch_price: '',
    payment_plan_label: '',
    description: '',
    category: 'residential',
    beds: '',
    baths: '',
    completion_percent: '',
    is_published: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [paymentPlan, setPaymentPlan] = useState<PaymentMilestone[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      fetchProject();
    }
  }, [id, isEdit]);

  const fetchProject = async () => {
    setLoadingData(true);
    try {
      const response = await adminProjectService.getById(parseInt(id!));
      if (response.success && response.data) {
        const project = response.data;
        setFormData({
          name: project.name || '',
          slug: project.slug || '',
          developer: project.developer || '',
          location: project.location || '',
          status: project.status || 'Under Construction',
          handover: project.handover || '',
          launch_price: project.launchPrice || '',
          payment_plan_label: project.paymentPlanLabel || '',
          description: project.description || '',
          category: project.category || 'residential',
          beds: project.beds?.toString() || '',
          baths: project.baths?.toString() || '',
          completion_percent: project.completionPercent?.toString() || '',
          is_published: project.is_published !== undefined ? project.is_published : true,
        });
        setImages(project.images || []);
        setPaymentPlan(project.paymentPlan || []);
      } else {
        throw new Error(response.message || 'Failed to load project');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load project',
        variant: 'destructive',
      });
      navigate('/admin/projects');
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (!isEdit || !formData.slug) {
      setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      // Preview URLs
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    const newImages = [...images];
    const newFiles = [...imageFiles];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];

    setImages(newImages);
    setImageFiles(newFiles);
  };

  const normalizePercent = (v: string) => {
    const onlyDigits = v.replace(/[^\d]/g, "");
    const noLeadingZeros = onlyDigits.replace(/^0+(?=\d)/, ""); // "020" -> "20", "0100" -> "100"
    const n = Number(noLeadingZeros || "0");
    return Math.max(0, Math.min(100, n));
  };

  const addMilestone = () => {
    setPaymentPlan(prev => [...prev, { label: '', percent: 0, note: '' }]);
  };

  const updateMilestone = (index: number, field: keyof PaymentMilestone, value: string | number) => {
    setPaymentPlan(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeMilestone = (index: number) => {
    setPaymentPlan(prev => prev.filter((_, i) => i !== index));
  };

  const moveMilestone = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === paymentPlan.length - 1) return;

    const newPlan = [...paymentPlan];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newPlan[index], newPlan[newIndex]] = [newPlan[newIndex], newPlan[index]];
    setPaymentPlan(newPlan);
  };

  const calculateTotalPercent = () => {
    return paymentPlan.reduce((sum, m) => sum + (m.percent || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate payment plan totals
      const totalPercent = calculateTotalPercent();
      if (paymentPlan.length > 0 && totalPercent !== 100) {
        toast({
          title: 'Validation Error',
          description: `Payment plan total must equal 100%. Current total: ${totalPercent}%`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Prepare project data
      const projectData: any = {
        name: formData.name,
        slug: formData.slug,
        developer: formData.developer,
        location: formData.location,
        status: formData.status,
        handover: formData.handover || null,
        launch_price: formData.launch_price || null,
        payment_plan_label: formData.payment_plan_label || null,
        description: formData.description || null,
        category: formData.category || null,
        beds: formData.beds ? parseInt(formData.beds) : null,
        baths: formData.baths ? parseInt(formData.baths) : null,
        completion_percent: formData.completion_percent ? parseInt(formData.completion_percent) : null,
        is_published: formData.is_published ? 1 : 0,
        images: images.filter(img => img && !img.startsWith('data:')), // Only send non-data URLs
        paymentPlan: paymentPlan.length > 0 ? paymentPlan.map(m => ({
          label: String(m.label || '').trim(),
          percent: Number(m.percent) || 0,
          note: m.note ? String(m.note).trim() : null,
        })) : [],
      };

      let response;
      if (isEdit) {
        response = await adminProjectService.update(parseInt(id!), projectData);
      } else {
        response = await adminProjectService.create(projectData);
      }

      if (response.success) {
        const projectId = isEdit ? parseInt(id!) : (response.data as any).id;

        // Upload new images if any
        if (imageFiles.length > 0) {
          await adminProjectService.uploadImages(projectId, imageFiles);
        }

        toast({
          title: 'Success',
          description: `Project ${isEdit ? 'updated' : 'created'} successfully`,
        });
        navigate('/admin/projects');
      } else {
        throw new Error(response.message || 'Failed to save project');
      }
    } catch (error: any) {
      console.error('Project save error:', error);
      const errorMessage = error.message || 'Failed to save project';
      
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
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="mb-6"
                  onClick={() => navigate('/admin/projects')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>

                <h1 className="text-3xl font-bold mb-8">
                  {isEdit ? 'Edit Project' : 'Create New Project'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Developer *</label>
                    <input
                      type="text"
                      required
                      value={formData.developer}
                      onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    >
                      <option value="Under Construction">Under Construction</option>
                      <option value="Ready">Ready</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Handover</label>
                    <input
                      type="text"
                      placeholder="Q4 2029"
                      value={formData.handover}
                      onChange={(e) => setFormData({ ...formData, handover: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Launch Price</label>
                    <input
                      type="text"
                      placeholder="$120K"
                      value={formData.launch_price}
                      onChange={(e) => setFormData({ ...formData, launch_price: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Plan Label</label>
                    <input
                      type="text"
                      placeholder="80/20"
                      value={formData.payment_plan_label}
                      onChange={(e) => setFormData({ ...formData, payment_plan_label: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Beds</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.beds}
                      onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Baths</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.baths}
                      onChange={(e) => setFormData({ ...formData, baths: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Completion %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completion_percent}
                      onChange={(e) => setFormData({ ...formData, completion_percent: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Images</h2>
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Images
                      </span>
                    </Button>
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.startsWith('data:') ? img : `http://localhost:5001${img}`}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === images.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeImage(index)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Plan */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Payment Plan</h2>
                  <Button type="button" variant="outline" onClick={addMilestone}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
                {paymentPlan.length > 0 && (
                  <div className="mb-4">
                    <Badge className={calculateTotalPercent() === 100 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                      Total: {calculateTotalPercent()}%
                    </Badge>
                    {calculateTotalPercent() !== 100 && (
                      <p className="text-sm text-red-600 mt-2">Total must equal 100%</p>
                    )}
                  </div>
                )}
                <div className="space-y-4">
                  {paymentPlan.map((milestone, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 bg-secondary/50 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Label (e.g., Down Payment)"
                          value={milestone.label}
                          onChange={(e) => updateMilestone(index, 'label', e.target.value)}
                          className="px-4 py-2 bg-background border border-border rounded-lg"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Percent"
                          value={milestone.percent ?? 0}
                          onChange={(e) => {
                            const value = normalizePercent(e.target.value);
                            updateMilestone(index, 'percent', value);
                          }}
                          className="px-4 py-2 bg-background border border-border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={milestone.note || ''}
                          onChange={(e) => updateMilestone(index, 'note', e.target.value)}
                          className="px-4 py-2 bg-background border border-border rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => moveMilestone(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => moveMilestone(index, 'down')}
                          disabled={index === paymentPlan.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMilestone(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="btn-teal">
                  {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/projects')}>
                  Cancel
                </Button>
              </div>
            </form>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminProjectForm;

