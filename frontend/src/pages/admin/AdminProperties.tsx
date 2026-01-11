import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/context/AuthContext';
import { adminPropertyService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/types';

const AdminProperties = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const isAgent = user?.role === 'agent';

  useEffect(() => {
    fetchProperties();
  }, [searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      console.log("PROPERTIES RECEIVED - AdminProperties: Fetching...");
      const response = await adminPropertyService.getAll(searchQuery || undefined);
      console.log("PROPERTIES RECEIVED - AdminProperties: Response:", response);
      
      // Handle response format: { success: true, data: [...] } or direct array
      if (response.success && response.data) {
        const propertiesArray = Array.isArray(response.data) ? response.data : [];
        console.log("PROPERTIES RECEIVED:", propertiesArray.length);
        setProperties(propertiesArray);
      } else if (Array.isArray(response)) {
        // Handle case where response is direct array
        console.log("PROPERTIES RECEIVED:", response.length);
        setProperties(response);
      } else {
        console.log("PROPERTIES RECEIVED: 0 (no valid format)");
        setProperties([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch properties:', error);
      console.log("PROPERTIES RECEIVED: 0 (error)");
      toast({
        title: 'Error',
        description: error.message || 'Failed to load properties',
        variant: 'destructive',
      });
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const response = await adminPropertyService.delete(propertyToDelete.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Property deleted successfully',
        });
        fetchProperties();
      } else {
        throw new Error(response.message || 'Failed to delete property');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete property',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const getImageUrl = (property: any) => {
    // Handle images array
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const firstImage = property.images[0];
      const url = typeof firstImage === 'string' ? firstImage : (firstImage.url || '');
      if (url) {
        return url.startsWith('http') ? url : `${import.meta.env.VITE_URL}${url}`;
      }
    }
    // Handle image_urls (from GROUP_CONCAT)
    if (property.image_urls) {
      const urls = property.image_urls.split(',');
      if (urls.length > 0 && urls[0]) {
        const url = urls[0].trim();
        return url.startsWith('http') ? url : `${import.meta.env.VITE_URL}${url}`;
      }
    }
    // Fallback to property.image or placeholder
    if (property.image) {
      return property.image.startsWith('http') ? property.image : `${import.meta.env.VITE_URL}${property.image}`;
    }
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
  };

  const formatPrice = (price: number, currency: string = 'USD', rentPeriod?: string) => {
    // Normalize currency code - handle invalid codes like "$" or empty strings
    let normalizedCurrency = currency || 'USD';
    
    // If currency is a symbol like "$", map it to ISO code
    if (normalizedCurrency === '$' || normalizedCurrency === 'USD') {
      normalizedCurrency = 'USD';
    } else if (normalizedCurrency === '€' || normalizedCurrency === 'EUR') {
      normalizedCurrency = 'EUR';
    } else if (normalizedCurrency === '£' || normalizedCurrency === 'GBP') {
      normalizedCurrency = 'GBP';
    }
    
    // Validate currency code is 3 letters (ISO 4217 format)
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      normalizedCurrency = 'USD'; // Fallback to USD if invalid
    }
    
    let formatted: string;
    try {
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      // If NumberFormat still fails, use simple fallback
      console.warn('[formatPrice] Currency formatting failed, using fallback:', error);
      formatted = `$${price.toLocaleString('en-US')}`;
    }
    
    if (rentPeriod) {
      return `${formatted}/${rentPeriod}`;
    }
    return formatted;
  };

  return (
    <ProtectedRoute roles={['admin', 'agent']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Properties</h1>
                <p className="text-muted-foreground">
                  {isAgent ? 'Create and manage properties' : 'View all properties'}
                </p>
              </div>
              {isAgent && (
                <Button onClick={() => navigate('/admin/properties/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Properties Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Image</th>
                        <th className="text-left p-4 font-semibold text-foreground">Title</th>
                        <th className="text-left p-4 font-semibold text-foreground">Purpose</th>
                        <th className="text-left p-4 font-semibold text-foreground">Type</th>
                        <th className="text-left p-4 font-semibold text-foreground">Location</th>
                        <th className="text-left p-4 font-semibold text-foreground">Price</th>
                        <th className="text-left p-4 font-semibold text-foreground">Updated</th>
                        <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => (
                        <tr key={property.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <img
                              src={getImageUrl(property)}
                              alt={property.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{property.title}</div>
                            {(property.is_featured || property.featured) && (
                              <Badge className="mt-1 bg-primary text-primary-foreground text-xs">Featured</Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{property.purpose || 'Sale'}</Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{property.type || '-'}</td>
                          <td className="p-4 text-muted-foreground">{property.location}</td>
                          <td className="p-4 text-muted-foreground">
                            {formatPrice(property.price, property.currency, property.rent_period)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {property.updated_at ? new Date(property.updated_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/properties/${property.slug || property.id}`)}
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {isAgent && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPropertyToDelete(property);
                                      setDeleteDialogOpen(true);
                                    }}
                                    title="Delete"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {properties.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No properties found</p>
                    {isAgent && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate('/admin/properties/new')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create your first property
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{propertyToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default AdminProperties;
