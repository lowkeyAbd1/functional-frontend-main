import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll helper function
  const scrollToSection = (sectionId: string, targetPage: string = '/') => {
    if (location.pathname === targetPage) {
      // Already on the target page, just scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          // Use smooth scroll - scroll-mt-24 will handle header offset
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Navigate to target page with hash, then scroll (ScrollToTop will reset scroll first)
      navigate(`${targetPage}#${sectionId}`);
    }
  };

  // Popular Searches with navigation
  const popularSearches = [
    { label: 'Apartments in Mogadishu', url: '/properties?type=Apartment&location=Mogadishu' },
    { label: 'Villas in Hargeisa', url: '/properties?type=Villa&location=Hargeisa' },
    { label: 'Properties in Bosaso', url: '/properties?location=Bosaso' },
    { label: 'Land in Kismayo', url: '/properties?type=Land&location=Kismayo' },
    { label: 'Commercial in Baidoa', url: '/properties?type=Commercial&location=Baidoa' },
  ];

  // Services list (excluding Property Search) - all scroll to services section on home page
  const services = [
    { label: 'Property Management' },
    { label: 'Market Analysis' },
    { label: 'Legal Assistance' },
    { label: 'Mortgage Services' },
    { label: '24/7 Support' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/Bayut', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/Bayut', label: 'Twitter' },
    { icon: Instagram, href: 'https://www.instagram.com/bayut', label: 'Instagram' },
    { icon: Linkedin, href: 'https://www.linkedin.com/company/bayut-com', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://www.youtube.com/@Bayut', label: 'YouTube' },
  ];

  return (
    <footer className="bg-foreground text-card">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <Logo size="default" />
            </Link>
            <p className="text-card/70 text-sm leading-relaxed mb-6 max-w-sm">
              Somalia's trusted real estate partner. We connect buyers, sellers, and renters across Mogadishu, Hargeisa, and all major cities.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-card/10 rounded-lg flex items-center justify-center text-card/70 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Popular Searches Column */}
          <div>
            <h4 className="font-semibold text-card mb-4">Popular Searches</h4>
            <ul className="space-y-3">
              {popularSearches.map((search) => (
                <li key={search.label}>
                  <Link
                    to={search.url}
                    className="text-sm text-card/70 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {search.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-semibold text-card mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('about-us', '/')}
                  className="text-sm text-card/70 hover:text-primary transition-colors flex items-center gap-1 group w-full text-left"
                >
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact-us', '/')}
                  className="text-sm text-card/70 hover:text-primary transition-colors flex items-center gap-1 group w-full text-left"
                >
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-semibold text-card mb-4">Services</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection('services', '/')}
                    className="text-sm text-card/70 hover:text-primary transition-colors flex items-center gap-1 group w-full text-left"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {service.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-card/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-card/60">
              © {new Date().getFullYear()} FAITHSTATE Somalia. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-sm text-card/60 hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-card/60 hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-card/60 hover:text-primary transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
