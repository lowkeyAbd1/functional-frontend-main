import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { adminPropertyService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/types';

const AdminPropertyForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEdit = !!id;
  const isAgent = user?.role === 'agent';
  
  // Only agents can access property form (create/edit)
  if (!isAgent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            Only agents can create and edit properties.
          </p>
          <Button onClick={() => navigate('/admin/properties')}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'Apartment' as 'Apartment' | 'Villa' | 'House' | 'Land' | 'Office' | 'Shop',
    purpose: 'Sale' as 'Rent' | 'Sale',
    price: '',
    currency: 'USD',
    rent_period: 'Monthly' as 'Monthly' | 'Yearly' | 'Weekly' | 'Daily' | '',
    beds: '',
    baths: '',
    area: '',
    area_unit: 'sqm' as 'sqm' | 'sqft',
    location: '',
    city: '',
    description: '',
    amenities: [] as string[],
    agent_name: '',
    agent_phone: '',
    whatsapp: '',
    latitude: '',
    longitude: '',
    is_featured: false,
    is_published: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newAmenity, setNewAmenity] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      fetchProperty();
    }
  }, [id, isEdit]);

  const fetchProperty = async () => {
    setLoadingData(true);
    try {
      const response = await adminPropertyService.getById(parseInt(id!));
      if (response.success && response.data) {
        const property = response.data;
        setFormData({
          title: property.title || '',
          slug: property.slug || '',
          type: property.type || 'Apartment',
          purpose: property.purpose || 'Sale',
          price: property.price?.toString() || '',
          currency: property.currency || 'USD',
          rent_period: property.rent_period || '',
          beds: property.beds?.toString() || '',
          baths: property.baths?.toString() || '',
          area: property.area?.toString() || '',
          area_unit: property.area_unit || 'sqm',
          location: property.location || '',
          city: property.city || '',
          description: property.description || '',
          amenities: Array.isArray(property.amenities) ? property.amenities : [],
          agent_name: property.agent_name || '',
          agent_phone: property.agent_phone || '',
          whatsapp: property.whatsapp || '',
          latitude: property.latitude?.toString() || '',
          longitude: property.longitude?.toString() || '',
          is_featured: property.is_featured || false,
          is_published: (property as any).is_published !== undefined ? (property as any).is_published : true,
        });
        setImages(property.images || []);
      } else {
        throw new Error(response.message || 'Failed to load property');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load property',
        variant: 'destructive',
      });
      navigate('/admin/properties');
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!isEdit || !formData.slug) {
      setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
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

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Normalize numeric fields: empty strings become null, ensure numbers are numbers
      const normalizeNumeric = (value: string | undefined | null): number | null => {
        if (!value || value === '' || value.trim() === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      const normalizeInt = (value: string | undefined | null): number | null => {
        if (!value || value === '' || value.trim() === '') return null;
        const num = parseInt(value);
        return isNaN(num) ? null : num;
      };

      const propertyData: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || null,
        type: formData.type,
        purpose: formData.purpose,
        price: normalizeNumeric(formData.price) || 0, // Price is required, default to 0 if empty
        currency: formData.currency || 'USD',
        rent_period: formData.purpose === 'Rent' ? (formData.rent_period || null) : null,
        beds: normalizeInt(formData.beds),
        baths: normalizeInt(formData.baths),
        area: normalizeNumeric(formData.area),
        area_unit: formData.area_unit || 'sqm',
        location: formData.location.trim(),
        city: formData.city?.trim() || null,
        description: formData.description?.trim() || null,
        amenities: formData.amenities.length > 0 ? formData.amenities : null,
        agent_name: formData.agent_name?.trim() || null,
        agent_phone: formData.agent_phone?.trim() || null,
        whatsapp: formData.whatsapp?.trim() || null,
        latitude: normalizeNumeric(formData.latitude),
        longitude: normalizeNumeric(formData.longitude),
        is_featured: formData.is_featured ? 1 : 0,
        is_published: formData.is_published ? 1 : 0,
      };

      let response;
      if (isEdit) {
        // For updates: Upload new images first, then update property with all images
        const propertyId = parseInt(id!);
        
        // Upload new image files first (if any)
        let newImageUrls: string[] = [];
        if (imageFiles.length > 0) {
          const uploadResponse = await adminPropertyService.uploadImages(propertyId, imageFiles);
          if (uploadResponse.success && uploadResponse.data) {
            newImageUrls = uploadResponse.data;
          }
        }
        
        // Combine existing image URLs (non-data URLs) with newly uploaded URLs
        // Filter out data URLs (preview URLs) and keep only actual image URLs
        const existingImageUrls = images.filter(img => img && !img.startsWith('data:'));
        // Combine: existing URLs + newly uploaded URLs
        propertyData.images = [...existingImageUrls, ...newImageUrls];
        
        response = await adminPropertyService.update(propertyId, propertyData);
      } else {
        // For create: Set images array (will be empty, files uploaded after)
        propertyData.images = images.filter(img => img && !img.startsWith('data:'));
        response = await adminPropertyService.create(propertyData);
        
        if (response.success) {
          const propertyId = (response.data as any).id;
          if (imageFiles.length > 0) {
            await adminPropertyService.uploadImages(propertyId, imageFiles);
          }
        }
      }

      if (response.success) {

        toast({
          title: 'Success',
          description: `Property ${isEdit ? 'updated' : 'created'} successfully`,
        });
        navigate('/admin/properties');
      } else {
        throw new Error(response.message || 'Failed to save property');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save property',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute roles={['admin', 'agent']}>
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
                  onClick={() => navigate('/admin/properties')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Properties
                </Button>

                <h1 className="text-3xl font-bold mb-8">
                  {isEdit ? 'Edit Property' : 'Create New Property'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
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
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="House">House</option>
                      <option value="Land">Land</option>
                      <option value="Office">Office</option>
                      <option value="Shop">Shop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Purpose *</label>
                    <select
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    >
                      <option value="Sale">Sale</option>
                      <option value="Rent">Rent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  {formData.purpose === 'Rent' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Rent Period</label>
                      <select
                        value={formData.rent_period}
                        onChange={(e) => setFormData({ ...formData, rent_period: e.target.value as any })}
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Beds</label>
                    <input
                      type="number"
                      value={formData.beds}
                      onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Baths</label>
                    <input
                      type="number"
                      value={formData.baths}
                      onChange={(e) => setFormData({ ...formData, baths: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Area</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg"
                      />
                      <select
                        value={formData.area_unit}
                        onChange={(e) => setFormData({ ...formData, area_unit: e.target.value as any })}
                        className="px-4 py-2 bg-secondary border border-border rounded-lg"
                      >
                        <option value="sqm">sqm</option>
                        <option value="sqft">sqft</option>
                      </select>
                    </div>
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
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>

              {/* Amenities */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    placeholder="Add amenity"
                    className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg"
                  />
                  <Button type="button" onClick={addAmenity}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-lg">
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={formData.agent_name}
                      onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Agent Phone</label>
                    <input
                      type="text"
                      value={formData.agent_phone}
                      onChange={(e) => setFormData({ ...formData, agent_phone: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Location Coordinates */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Location Coordinates (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
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
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={img.startsWith('http') ? img : img.startsWith('data:') ? img : `http://localhost:5001${img}`}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Featured Property</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Published</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/properties')}>
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

export default AdminPropertyForm;

