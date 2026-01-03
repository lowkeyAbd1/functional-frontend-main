import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FeaturedProperties from '@/components/FeaturedProperties';
import ServicesSection from '@/components/ServicesSection';
import AgentStoriesRow from '@/components/stories/AgentStoriesRow';
import Agents from '@/components/Agents';
import ContactUsSection from '@/components/ContactUsSection';
import Footer from '@/components/Footer';

const Index = () => {
  const location = useLocation();

  // Handle hash scrolling on page load or hash change
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.substring(1); // Remove #
      // Use setTimeout to ensure DOM is ready and ScrollToTop has finished
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          // Use smooth scroll with start block - scroll-mt-24 will handle header offset
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <section id="stories" className="section-padding bg-secondary/30">
          <div className="container-custom">
            <AgentStoriesRow />
          </div>
        </section>
        <FeaturedProperties />
        <ServicesSection />
        <Agents />
        <ContactUsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
