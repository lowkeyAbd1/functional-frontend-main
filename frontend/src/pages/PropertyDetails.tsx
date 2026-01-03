import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Square, MessageCircle, Phone, ChevronRight, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { propertyServicePublic } from '@/services/api';
import { getAgentImageUrl } from '@/lib/agentImage';
import type { Property } from '@/types';

const PropertyDetails = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slugOrId) {
      fetchProperty();
    }
  }, [slugOrId]);

  const fetchProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const propertyData = await propertyServicePublic.getBySlug(slugOrId!);
      if (propertyData) {
        setProperty(propertyData);
      } else {
        setError('Property not found');
      }
    } catch (error: any) {
      console.error('Failed to fetch property:', error);
      setError(error.message || 'Failed to load property');
    } finally {
      setLoading(false);
    }
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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/properties');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
            {error && <p className="text-muted-foreground mb-4">{error}</p>}
            <p className="text-muted-foreground mb-6">
              The property you are looking for does not exist or is not published.
            </p>
            <Button onClick={() => navigate('/properties')}>
              Browse All Properties
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : property.image 
      ? [property.image] 
      : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container-custom py-8">
          {/* Breadcrumbs */}
          <div className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:underline">Home</Link>
            <ChevronRight className="inline-block w-4 h-4 mx-1" />
            <Link to="/properties" className="hover:underline">Properties</Link>
            <ChevronRight className="inline-block w-4 h-4 mx-1" />
            <span>{property.title}</span>
          </div>

          <Button
            variant="ghost"
            className="mb-6"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div>
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  <img
                    src={images[selectedImageIndex]?.startsWith('http') 
                      ? images[selectedImageIndex] 
                      : `http://localhost:5001${images[selectedImageIndex]}`}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {(property.is_featured || property.featured) && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-background/90">
                      {property.purpose || 'Sale'}
                    </Badge>
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                        } hover:border-primary/50 transition-colors`}
                      >
                        <img
                          src={img.startsWith('http') ? img : `http://localhost:5001${img}`}
                          alt={`${property.title} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{property.title}</h1>
                <p className="text-2xl font-semibold text-primary mb-4">
                  {formatPrice(property.price, property.currency, property.rent_period)}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{property.location}{property.city ? `, ${property.city}` : ''}</span>
                </div>
              </div>

              {/* Facts */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Property Facts</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-semibold text-foreground">{property.type}</p>
                    </div>
                  )}
                  {property.beds !== undefined && property.beds !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <BedDouble className="w-4 h-4" />
                        {property.beds}
                      </p>
                    </div>
                  )}
                  {property.baths !== undefined && property.baths !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.baths}
                      </p>
                    </div>
                  )}
                  {property.area && (
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Square className="w-4 h-4" />
                        {property.area} {property.area_unit || 'sqm'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {property.description && (
                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Description</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Map (if coordinates available) */}
              {property.latitude && property.longitude && (
                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Contact Card */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-32">
                <h2 className="text-xl font-semibold text-foreground mb-4">Published by Agent</h2>
                
                {/* Agent Card */}
                {property.agent_id && property.agent_name && (
                  <Link
                    to={`/agents/${property.agent_id}`}
                    className="flex items-center gap-3 mb-6 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {property.agent_photo && (
                      <img
                        src={property.agent_photo.startsWith('http') 
                          ? property.agent_photo 
                          : `http://localhost:5001${property.agent_photo}`}
                        alt={property.agent_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                        }}
                      />
                    )}
                    {!property.agent_photo && (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{property.agent_name}</p>
                      {property.agent_title && (
                        <p className="text-sm text-muted-foreground truncate">{property.agent_title}</p>
                      )}
                      {!property.agent_title && (
                        <p className="text-sm text-muted-foreground">Real Estate Agent</p>
                      )}
                    </div>
                  </Link>
                )}

                <div className="space-y-3">
                  {property.agent_whatsapp && (
                    <a
                      href={`https://wa.me/${property.agent_whatsapp.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${property.title}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg text-base font-medium transition-colors w-full"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </a>
                  )}
                  
                  {property.agent_phone && (
                    <a
                      href={`tel:${property.agent_phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-base font-medium transition-colors w-full"
                    >
                      <Phone className="w-5 h-5" />
                      Call Now
                    </a>
                  )}
                  
                  {property.agent_id && (
                    <Link
                      to={`/agents/${property.agent_id}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary text-primary hover:bg-primary/10 rounded-lg text-base font-medium transition-colors w-full"
                    >
                      <User className="w-5 h-5" />
                      Visit Profile
                    </Link>
                  )}
                </div>

                {property.agent_phone && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    {property.agent_phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetails;
