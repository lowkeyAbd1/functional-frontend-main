import { Heart, MapPin, Bed, Bath, Square, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { propertyServicePublic } from '@/services/api';
import type { Property } from '@/types';

const mockProperties: Property[] = [
  {
    id: 1,
    title: 'Modern Villa with Garden',
    price: 450000,
    location: 'Hodan District',
    region: 'Mogadishu',
    bedrooms: 4,
    bathrooms: 5,
    sqft: 4200,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    featured: true,
    category: 'residential',
  },
  {
    id: 2,
    title: 'Luxury Penthouse',
    price: 820000,
    location: 'Maroodi Jeex',
    region: 'Hargeisa',
    bedrooms: 3,
    bathrooms: 4,
    sqft: 3800,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    featured: true,
    category: 'residential',
  },
  {
    id: 3,
    title: 'Contemporary Apartment',
    price: 210000,
    location: 'Bari Region',
    region: 'Bosaso',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1450,
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    featured: false,
    category: 'residential',
  },
  {
    id: 4,
    title: 'Beachfront Townhouse',
    price: 680000,
    location: 'Lido Beach',
    region: 'Mogadishu',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 5100,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    featured: true,
    category: 'residential',
  },
];

const FeaturedProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>(mockProperties);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Use public property service to get featured properties
        // This already filters for agent_id IS NOT NULL and is_published = 1
        const allProperties = await propertyServicePublic.getAll();
        
        // Filter for featured properties that have an agent_id (must be in admin properties)
        // Limit to 4
        const featured = allProperties
          .filter(p => (p.is_featured || p.featured) && p.agent_id)
          .slice(0, 4);
        
        if (featured.length > 0) {
          setProperties(featured);
        } else {
          // If no featured, show latest 4 properties that have agent_id (must be in admin)
          const latest = allProperties
            .filter(p => p.agent_id) // Only show properties with agent_id
            .slice(0, 4);
          if (latest.length > 0) {
            setProperties(latest);
          }
        }
      } catch (err) {
        console.error('Failed to fetch featured properties:', err);
        // Use mock data if API fails
      }
    };
    fetchProperties();
  }, []);

  return (
    <section id="properties" className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Featured Listings
            </span>
            <h2 className="section-title text-foreground mt-2">
              Discover Your Perfect Property
            </h2>
            <p className="section-subtitle">
              Browse through our handpicked selection of premium properties
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2 rounded-full"
            onClick={() => navigate('/properties')}
          >
            View All Properties
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property, index) => (
            <Link
              to={`/properties/${property.slug || property.id}`}
              key={property.id}
              className="glass-card group overflow-hidden animate-fade-in block"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={
                    property.images && property.images.length > 0
                      ? (property.images[0].startsWith('http')
                          ? property.images[0]
                          : `${import.meta.env.VITE_URL}${property.images[0]}`)
                      : property.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
                  }
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    Villa
                  </span>
                  {property.featured && (
                    <span className="px-3 py-1 bg-card text-foreground text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                
                {/* Favorite Button */}
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-3 right-3 w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-card transition-colors"
                >
                  <Heart className="w-4 h-4" />
                </button>
                
                {/* Price */}
                <div className="absolute bottom-3 left-3">
                  <p className="text-lg font-bold text-card">
                    {property.currency || 'USD'} {property.price?.toLocaleString() || property.price}
                    {property.rent_period && `/${property.rent_period}`}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="line-clamp-1">{property.location}{property.city ? `, ${property.city}` : ''}</span>
                </div>
                
                {/* Features */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bed className="w-4 h-4" />
                    <span>{property.beds || property.bedrooms || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bath className="w-4 h-4" />
                    <span>{property.baths || property.bathrooms || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Square className="w-4 h-4" />
                    <span>{property.area ? `${property.area} ${property.area_unit || 'sqm'}` : (property.sqft ? `${property.sqft} sqft` : 'N/A')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
