import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Key, TrendingUp, Shield, Calculator, Headphones, LucideIcon, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceInfoDrawer from '@/components/ServiceInfoDrawer';
import PropertySearchPanel from '@/components/PropertySearchPanel';
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

interface ServiceData {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionType: 'drawer' | 'scroll' | 'search';
  drawerContent?: {
    overview: string;
    bullets: string[];
    primaryCTA: {
      label: string;
      action: 'contact' | 'browse';
    };
  };
}

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Services data with actions
  const servicesData: ServiceData[] = [
    {
      id: 'property-search',
      title: 'Property Search',
      description: 'Find your perfect property with our advanced search tools',
      icon: 'home',
      actionType: 'search',
    },
    {
      id: 'support-24-7',
      title: '24/7 Support',
      description: 'Get help anytime with our round-the-clock customer support',
      icon: 'headphones',
      actionType: 'scroll',
    },
    {
      id: 'property-management',
      title: 'Property Management',
      description: 'End-to-end property management services',
      icon: 'key',
      actionType: 'drawer',
      drawerContent: {
        overview: 'We manage your property end-to-end so you earn more with less stress.',
        bullets: [
          'Tenant screening & communication',
          'Rent collection follow-up',
          'Maintenance coordination',
          'Monthly performance updates',
        ],
        primaryCTA: {
          label: 'Contact Us',
          action: 'contact',
        },
      },
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Make smarter decisions with local trend insights',
      icon: 'trending',
      actionType: 'drawer',
      drawerContent: {
        overview: 'Make smarter decisions using local trend insights and pricing support.',
        bullets: [
          'Price estimation guidance',
          'Neighborhood demand insights',
          'Rent vs buy comparisons',
          'Investment potential review',
        ],
        primaryCTA: {
          label: 'Browse Properties',
          action: 'browse',
        },
      },
    },
    {
      id: 'legal-assistance',
      title: 'Legal Assistance',
      description: 'Safer deals with documentation and compliance guidance',
      icon: 'shield',
      actionType: 'drawer',
      drawerContent: {
        overview: 'Safer deals with guidance on documentation and compliance.',
        bullets: [
          'Contract guidance',
          'Ownership verification steps',
          'Deal process support',
          'Dispute prevention best practices',
        ],
        primaryCTA: {
          label: 'Contact Us',
          action: 'contact',
        },
      },
    },
    {
      id: 'mortgage-services',
      title: 'Mortgage Services',
      description: 'Support for financing options and affordability planning',
      icon: 'calculator',
      actionType: 'drawer',
      drawerContent: {
        overview: 'Support for financing options and affordability planning.',
        bullets: [
          'Affordability review',
          'Payment plan guidance',
          'Financing partner referral (future)',
          'Pre-approval checklist',
        ],
        primaryCTA: {
          label: 'Contact Us',
          action: 'contact',
        },
      },
    },
  ];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleServiceClick = (service: ServiceData) => {
    if (service.actionType === 'search') {
      setShowSearchPanel(true);
    } else if (service.actionType === 'scroll') {
      navigate('/#contact-us');
      // If already on home, scroll immediately
      if (window.location.pathname === '/') {
        setTimeout(() => {
          const element = document.getElementById('contact-us');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } else if (service.actionType === 'drawer') {
      setSelectedService(service);
      setShowDrawer(true);
    }
  };

  const handleDrawerCTA = (action: 'contact' | 'browse') => {
    setShowDrawer(false);
    if (action === 'contact') {
      // Scroll to Contact Us section on Home
      if (window.location.pathname === '/') {
        setTimeout(() => {
          const element = document.getElementById('contact-us');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById('contact-us');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      }
    } else if (action === 'browse') {
      navigate('/properties');
    }
  };

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

  // Handle hash scrolling when component mounts or hash changes
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove #
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  // Match services from API with servicesData
  const getServiceData = (service: Service): ServiceData | undefined => {
    return servicesData.find(s => 
      s.title.toLowerCase() === service.title.toLowerCase() ||
      service.title.toLowerCase().includes(s.title.toLowerCase()) ||
      s.title.toLowerCase().includes(service.title.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <section id="our-services" className="section-padding bg-muted/30 scroll-mt-24">
          <div className="container-custom">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-6"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Section Header */}
            <div className="text-center mb-12">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                What We Offer
              </span>
              <h1 className="section-title text-foreground mt-2">
                Our Services
              </h1>
              <p className="section-subtitle mx-auto text-center">
                Comprehensive real estate services tailored to meet all your property needs
              </p>
            </div>

            {/* Services Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesData.map((serviceData, index) => {
                  const Icon = iconMap[serviceData.icon] || iconMap.default;
                  
                  return (
                    <div
                      key={serviceData.id}
                      id={serviceData.id === 'support-24-7' ? 'support-24-7' : serviceData.id}
                      className="scroll-mt-24"
                    >
                      <button
                        onClick={() => handleServiceClick(serviceData)}
                        className="glass-card p-6 group animate-fade-in text-left hover:border-primary/50 transition-all cursor-pointer w-full"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                          <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {serviceData.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {serviceData.description}
                        </p>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Property Search Panel Drawer */}
      {showSearchPanel && (
        <>
          <div
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setShowSearchPanel(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full md:w-[600px] max-w-[90vw] bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Property Search</h2>
                <button
                  onClick={() => setShowSearchPanel(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <PropertySearchPanel onClose={() => setShowSearchPanel(false)} />
            </div>
          </div>
        </>
      )}

      {/* Service Info Drawer */}
      {selectedService && selectedService.drawerContent && (
        <ServiceInfoDrawer
          isOpen={showDrawer}
          onClose={() => {
            setShowDrawer(false);
            setSelectedService(null);
          }}
          title={selectedService.title}
          overview={selectedService.drawerContent.overview}
          bullets={selectedService.drawerContent.bullets}
          primaryCTA={{
            label: selectedService.drawerContent.primaryCTA.label,
            action: () => handleDrawerCTA(selectedService.drawerContent!.primaryCTA.action),
          }}
        />
      )}
    </div>
  );
};

export default Services;
