import { useState } from 'react';
import { Home, Key, TrendingUp, Shield, Calculator, Headphones, LucideIcon } from 'lucide-react';
import ServiceInfoDrawer from './ServiceInfoDrawer';
import PropertySearchPanel from './PropertySearchPanel';
import { useNavigate, useLocation } from 'react-router-dom';

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
      action: 'contact' | 'browse' | 'search';
    };
  };
}

const ServicesSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      id: 'support',
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

  const handleServiceClick = (service: ServiceData) => {
    if (service.actionType === 'search') {
      // Scroll to property search section
      const element = document.getElementById('property-search');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '/#property-search');
      }
    } else if (service.actionType === 'scroll') {
      // Scroll to Contact Us section
      const element = document.getElementById('contact-us');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '/#contact-us');
      }
    } else if (service.actionType === 'drawer') {
      setSelectedService(service);
      setShowDrawer(true);
    }
  };

  const handleDrawerCTA = (action: 'contact' | 'browse' | 'search') => {
    setShowDrawer(false);
    if (action === 'contact') {
      // Scroll to Contact Us section
      const element = document.getElementById('contact-us');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '/#contact-us');
      }
    } else if (action === 'browse') {
      navigate('/properties');
    } else if (action === 'search') {
      const element = document.getElementById('property-search');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '/#property-search');
      }
    }
  };

  return (
    <section id="services" className="section-padding pb-10 md:pb-12 bg-muted/30 scroll-mt-24">
      <div id="about-us" className="container-custom scroll-mt-24">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.map((serviceData, index) => {
            const Icon = iconMap[serviceData.icon] || iconMap.default;
            
            return (
              <button
                key={serviceData.id}
                onClick={() => handleServiceClick(serviceData)}
                className="glass-card p-6 group animate-fade-in text-left hover:border-primary/50 transition-all cursor-pointer"
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
            );
          })}
        </div>
      </div>

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
    </section>
  );
};

export default ServicesSection;

