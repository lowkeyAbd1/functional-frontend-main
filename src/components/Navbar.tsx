import { useState, useEffect } from 'react';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleServicesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // On home page, scroll to section
      const element = document.getElementById('services');
      if (element) {
        // Use smooth scroll - scroll-mt-24 will handle header offset
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '/#services');
      }
    } else {
      // On other pages, navigate to home then scroll (ScrollToTop will reset scroll first)
      navigate('/#services');
    }
    setIsOpen(false);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // On home page, scroll to section
      const element = document.getElementById('contact-us');
      if (element) {
        // Use smooth scroll - scroll-mt-24 will handle header offset
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '/#contact-us');
      }
    } else {
      // On other pages, navigate to home then scroll (ScrollToTop will reset scroll first)
      navigate('/#contact-us');
    }
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Find my Agent', href: '/agents' },
    { name: 'Properties', href: '/properties' },
    { name: 'New Projects', href: '/new-projects' },
    { name: 'Services', href: '/#services', isServices: true },
    { name: 'Contact Us', href: '/#contact-us', isContact: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b border-border/30">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.isContact) {
                return (
                  <button
                    key={link.name}
                    onClick={handleContactClick}
                    className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-secondary/50"
                  >
                    {link.name}
                  </button>
                );
              }
              if (link.isServices) {
                return (
                  <button
                    key={link.name}
                    onClick={handleServicesClick}
                    className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-secondary/50"
                  >
                    {link.name}
                  </button>
                );
              }
              return link.href.startsWith('/') ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-secondary/50"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-secondary/50"
                >
                  {link.name}
                </a>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {(user?.role === 'admin' || user?.role === 'agent') && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="text-foreground/70 hover:text-primary">
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-foreground/70">
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.name || user?.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-foreground/70 hover:text-primary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-primary">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="btn-teal rounded-full px-6">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="space-y-1">
              {navLinks.map((link) => {
                if (link.isContact) {
                  return (
                    <button
                      key={link.name}
                      onClick={handleContactClick}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                    >
                      {link.name}
                    </button>
                  );
                }
                return link.href.startsWith('/') ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-4 py-3 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-3 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 mt-4 px-4">
              {isAuthenticated ? (
                <>
                  {(user?.role === 'admin' || user?.role === 'agent') && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <div className="flex items-center gap-2 text-sm text-foreground/70 px-4 py-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{user?.name || user?.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/signin" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="btn-teal w-full">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
