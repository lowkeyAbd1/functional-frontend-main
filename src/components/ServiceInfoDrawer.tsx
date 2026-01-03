import { X, Phone, MessageCircle, Instagram, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

interface ServiceInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  overview: string;
  bullets: string[];
  primaryCTA: {
    label: string;
    action: () => void;
  };
  secondaryCTA?: {
    label: string;
    action: () => void;
  };
}

const ServiceInfoDrawer = ({
  isOpen,
  onClose,
  title,
  overview,
  bullets,
  primaryCTA,
  secondaryCTA,
}: ServiceInfoDrawerProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleContactUs = () => {
    onClose();
    if (location.pathname === '/') {
      // Already on home, scroll to contact section
      setTimeout(() => {
        const element = document.getElementById('contact-us');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.pushState(null, '', '/#contact-us');
        }
      }, 100);
    } else {
      // Navigate to home with hash, then scroll
      navigate('/#contact-us');
      setTimeout(() => {
        const element = document.getElementById('contact-us');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  };

  // Override primaryCTA action if it's "Contact Us"
  const handlePrimaryCTA = () => {
    if (primaryCTA.label === 'Contact Us') {
      handleContactUs();
    } else {
      primaryCTA.action();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-10 h-10 p-0"
              >
                ×
              </Button>
            </div>

            {/* Overview */}
            <div className="mb-6">
              <p className="text-muted-foreground leading-relaxed">{overview}</p>
            </div>

            {/* What You Get */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">What you get:</h3>
              <ul className="space-y-3">
                {bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-6 border-t border-border">
              <Button onClick={handlePrimaryCTA} className="btn-teal w-full h-12 rounded-xl">
                {primaryCTA.label}
              </Button>
              {secondaryCTA && (
                <Button
                  onClick={secondaryCTA.action}
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                >
                  {secondaryCTA.label}
                </Button>
              )}

              {/* Social Contact Buttons */}
              <div className="pt-4 border-t border-border mt-2">
                <p className="text-sm text-muted-foreground mb-3 text-center">Or reach us on</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <a
                    href="tel:+252612345678"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full text-sm font-medium text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </a>
                  <a
                    href="https://wa.me/252612345678"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full text-sm font-medium text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="https://instagram.com/faithstate"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full text-sm font-medium text-primary transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://tiktok.com/@faithstate"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full text-sm font-medium text-primary transition-colors"
                  >
                    <Music className="w-4 h-4" />
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceInfoDrawer;

