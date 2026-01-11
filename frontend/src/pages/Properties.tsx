import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Square, MessageCircle, Search, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { propertyServicePublic } from '@/services/api';
import type { Property } from '@/types';

const Properties = () => {
  // CRITICAL: Component must always render - wrap in try/catch at render level
  try {
    console.log('[Properties] Component RENDERED');
  } catch (err) {
    console.error('[Properties] Render error:', err);
  }
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states - allow empty string to show all properties
  const [purpose, setPurpose] = useState<'Rent' | 'Sale' | ''>(searchParams.get('purpose') === 'Rent' ? 'Rent' : searchParams.get('purpose') === 'Sale' ? 'Sale' : '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [beds, setBeds] = useState(searchParams.get('beds') || '');
  const [baths, setBaths] = useState(searchParams.get('baths') || '');

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (purpose) params.set('purpose', purpose);
    if (type) params.set('type', type);
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    if (baths) params.set('baths', baths);
    setSearchParams(params, { replace: true });
  }, [purpose, type, location, minPrice, maxPrice, beds, baths, setSearchParams]);

  // Safe image parser helper - handles all cases
  const parseImages = (property: any): string[] => {
    try {
      // Case 1: Already an array
      if (Array.isArray(property.images)) {
        return property.images.filter((url: any) => url && typeof url === 'string');
      }
      
      // Case 2: image_urls is a string (comma-separated)
      if (property.image_urls && typeof property.image_urls === 'string') {
        return property.image_urls
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0);
      }
      
      // Case 3: Single image field
      if (property.image && typeof property.image === 'string') {
        return [property.image];
      }
      
      // Case 4: Nothing found - return empty array
      return [];
    } catch (err) {
      console.error('[Properties] Error parsing images:', err);
      return [];
    }
  };

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[Properties] Starting fetch...');
        const filters: Record<string, string> = {};
        // Only filter by purpose if a specific purpose is selected
        if (purpose && (purpose === 'Rent' || purpose === 'Sale')) {
          filters.purpose = purpose;
        }
        if (type) filters.type = type;
        if (location) filters.location = location;
        if (minPrice) filters.minPrice = minPrice;
        if (maxPrice) filters.maxPrice = maxPrice;
        if (beds) filters.beds = beds;
        if (baths) filters.baths = baths;

        console.log('[Properties] Calling API with filters:', filters);
        let response;
        try {
          response = await propertyServicePublic.getAll(filters);
          console.log('[Properties] API Response type:', typeof response);
          console.log('[Properties] API Response:', response);
        } catch (apiError: any) {
          console.error('[Properties] API call failed:', apiError);
          throw new Error(`API request failed: ${apiError.message || 'Unknown error'}`);
        }
        
        // CRITICAL: Normalize response shape - handle ALL possible formats
        let propertiesList: any[] = [];
        
        try {
          if (Array.isArray(response)) {
            // Direct array response
            propertiesList = response;
          } else if (response && typeof response === 'object') {
            // Wrapped response: { success: true, data: [...] } or { data: [...] }
            if (Array.isArray(response.data)) {
              propertiesList = response.data;
            } else if (Array.isArray(response.properties)) {
              propertiesList = response.properties;
            } else if (Array.isArray(response.results)) {
              propertiesList = response.results;
            } else if (response.success && Array.isArray(response.data)) {
              propertiesList = response.data;
            }
          }
        } catch (parseError) {
          console.error('[Properties] Error parsing response:', parseError);
          propertiesList = [];
        }
        
        // CRITICAL: Ensure it's always an array - never null/undefined
        if (!Array.isArray(propertiesList)) {
          console.warn('[Properties] Response is not an array, defaulting to empty array. Response:', response);
          propertiesList = [];
        }

        // Safe image parsing for each property
        propertiesList = propertiesList.map((p: any) => {
          return {
            ...p,
            images: parseImages(p)
          };
        });

        console.log('[Properties] Fetched properties:', propertiesList.length);
        console.log('[Properties] Sample property:', propertiesList[0]);
        console.log("PROPERTIES RECEIVED:", propertiesList.length);
        
        // CRITICAL: Ensure we always set arrays, never null/undefined
        const safePropertiesList = Array.isArray(propertiesList) ? propertiesList : [];
        console.log('[Properties] Setting properties:', safePropertiesList.length);
        
        // DO NOT filter by agent_id - backend handles visibility logic
        // Render whatever backend returns
        setProperties(safePropertiesList);
        setFilteredProperties(safePropertiesList);
        setError(null);
      } catch (error: any) {
        console.error('[Properties] Failed to fetch properties:', error);
        console.error('[Properties] Error details:', error.message, error.stack);
        const errorMessage = error.message || 'Failed to load properties';
        setError(errorMessage);
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
        console.log('[Properties] Fetch complete, loading set to false');
      }
    };

    fetchProperties();
  }, [purpose, type, location, minPrice, maxPrice, beds, baths]);

  const clearFilters = () => {
    setPurpose('');
    setType('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setBeds('');
    setBaths('');
    setSearchParams({});
  };

  const hasActiveFilters = type || location || minPrice || maxPrice || beds || baths;

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

  // Debug: Log current state
  useEffect(() => {
    console.log('[Properties] Component state:', {
      loading,
      propertiesCount: properties.length,
      filteredCount: filteredProperties.length,
      error: error || 'none',
      hasFilteredProperties: filteredProperties.length > 0
    });
  }, [loading, properties, filteredProperties, error]);

  // CRITICAL: Always render something - never return null/undefined
  console.log('[Properties] About to render. Loading:', loading, 'Error:', error, 'Count:', filteredProperties.length);
  console.log('[Properties] Properties array:', properties);
  console.log('[Properties] Filtered array:', filteredProperties);

  // Safety check: ensure we always have valid arrays
  const displayProperties = Array.isArray(filteredProperties) ? filteredProperties : [];
  const isLoading = loading === true;
  const hasError = error !== null && error !== undefined;

  // CRITICAL: Component must always render - add visible test element if needed
  if (!isLoading && !hasError && displayProperties.length === 0) {
    console.warn('[Properties] WARNING: No properties to display but not loading and no error');
  }

  // CRITICAL: Component must ALWAYS render - ensure all code paths return JSX
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        {/* Sticky Filter Bar */}
        <div className="sticky top-24 z-40 bg-card border-b border-border shadow-sm">
          <div className="container-custom py-4">
            {/* Primary Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Purpose Toggle */}
              <div className="flex gap-1 bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setPurpose('')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    purpose === ''
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPurpose('Sale')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    purpose === 'Sale'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setPurpose('Rent')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    purpose === 'Rent'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Rent
                </button>
              </div>

              {/* Location Input */}
              <div className="flex-1 min-w-[200px] relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Type Dropdown */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Land">Land</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
              </select>

              {/* Beds & Baths */}
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>

              {/* More Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    More Filters
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Min Price</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Price</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="No limit"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Baths</label>
                      <select
                        value={baths}
                        onChange={(e) => setBaths(e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Properties</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : hasError ? 'Error loading properties' : `${displayProperties.length} properties found`}
            </p>
            {/* Error message - small inline text, no design changes */}
            {error && !loading && (
              <p className="text-sm text-destructive mt-2">Failed to load properties: {error}</p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : hasError ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">Failed to load properties</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          ) : displayProperties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">No properties found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.slug || property.id}`}
                  className="block glass-card hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    <img
                      src={
                        property.images && Array.isArray(property.images) && property.images.length > 0 && property.images[0]
                          ? (property.images[0].startsWith('http')
                              ? property.images[0]
                              : `${process.env.VITE_API_URL}${property.images[0]}`)
                          : property.image 
                            ? (property.image.startsWith('http') ? property.image : `${process.env.VITE_API_URL}${property.image}`)
                            : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
                      }
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                    {(property.is_featured || property.featured) && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="bg-background/90">
                        {property.purpose || 'Sale'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <p className="text-lg font-bold text-card">
                        {formatPrice(property.price, property.currency, property.rent_period)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="line-clamp-1">{property.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      {property.beds !== undefined && property.beds !== null && (
                        <div className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          <span>{property.beds} Beds</span>
                        </div>
                      )}
                      {property.baths !== undefined && property.baths !== null && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5" />
                          <span>{property.baths} Baths</span>
                        </div>
                      )}
                      {property.area && (
                        <div className="flex items-center gap-1">
                          <Square className="w-3.5 h-3.5" />
                          <span>{property.area} {property.area_unit || 'sqm'}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Agent Info - Always show if agent exists */}
                    {property.agent_id && property.agent_name && (
                      <div className="px-4 pb-3 border-t border-border pt-3">
                        <Link
                          to={`/agents/${property.agent_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          {property.agent_photo && (
                            <img
                              src={property.agent_photo.startsWith('http') 
                                ? property.agent_photo 
                                : `http://localhost:5001${property.agent_photo}`}
                              alt={property.agent_name}
                              className="w-6 h-6 rounded-full object-cover border border-border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(property.agent_name) + '&background=random';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{property.agent_name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {property.agent_title || 'Real Estate Agent'}
                            </div>
                          </div>
                        </Link>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 px-4 pb-4">
                      {property.whatsapp && (
                        <a
                          href={`https://wa.me/${property.whatsapp.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${property.title}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg text-sm font-medium transition-colors flex-1 justify-center"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/properties/${property.slug || property.id}`);
                        }}
                        className="text-sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Properties;
