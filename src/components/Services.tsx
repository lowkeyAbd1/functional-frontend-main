import { useState, useEffect } from 'react';
import { Home, Key, TrendingUp, Shield, Calculator, Headphones, LucideIcon } from 'lucide-react';
import { serviceService } from '@/services/api';
import type { Service } from '@/types';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  key: Key,
  trending: TrendingUp,
  shield: Shield,
  calculator: Calculator,
  headphones: Headphones,
  default: Home,
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceService.getAll();
        if (response.success && response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);
  return (
    <section id="services" className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            What We Offer
          </span>
          <h2 className="section-title text-foreground mt-2">
            Our Services
          </h2>
          <p className="section-subtitle mx-auto text-center">
            Comprehensive real estate services tailored to meet all your property needs
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const iconName = service.icon?.toLowerCase() || 'default';
              const Icon = iconMap[iconName] || iconMap.default;
              
              return (
                <div
                  key={service.id}
                  className="glass-card p-6 group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  {service.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No services available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
