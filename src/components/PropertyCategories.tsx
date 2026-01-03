import { useState, useEffect } from 'react';
import { Building2, Home, Building, Castle, Warehouse, TreePine, ArrowRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryService } from '@/services/api';
import type { Category } from '@/types';

// Icon mapping - maps category name/slug to lucide-react icons
const iconMap: Record<string, LucideIcon> = {
  apartments: Building2,
  villas: Home,
  townhouses: Building,
  penthouses: Castle,
  commercial: Warehouse,
  land: TreePine,
  default: Building2,
};

// Color mapping - provides default colors if not in API
const colorMap: Record<string, string> = {
  apartments: 'bg-primary/10 text-primary',
  villas: 'bg-emerald-500/10 text-emerald-600',
  townhouses: 'bg-blue-500/10 text-blue-600',
  penthouses: 'bg-amber-500/10 text-amber-600',
  commercial: 'bg-purple-500/10 text-purple-600',
  land: 'bg-rose-500/10 text-rose-600',
  default: 'bg-primary/10 text-primary',
};

const PropertyCategories = () => {
  const [categories, setCategories] = useState<Array<{
    name: string;
    count: number;
    icon: LucideIcon;
    color: string;
    slug: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAll();
        if (response.success && response.data) {
          const mappedCategories = response.data.map((cat: Category) => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
            const Icon = iconMap[slug] || iconMap[cat.name.toLowerCase()] || iconMap.default;
            const color = cat.color || colorMap[slug] || colorMap[cat.name.toLowerCase()] || colorMap.default;
            
            return {
              name: cat.name,
              count: cat.count || 0,
              icon: Icon,
              color,
              slug,
            };
          });
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to empty array on error
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  return (
    <section id="categories" className="section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Property Types
          </span>
          <h2 className="section-title text-foreground mt-2">
            Browse by Category
          </h2>
          <p className="section-subtitle mx-auto text-center">
            Explore properties across different categories to find exactly what you're looking for
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category.slug || category.name}
                to={`/properties?category=${category.slug}`}
                className="feature-card group text-center animate-fade-in hover:border-primary/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 ${category.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{category.count} {category.count === 1 ? 'property' : 'properties'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No categories available at the moment.</p>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-12 teal-gradient rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Sell or Rent Your Property with Confidence
            </h3>
            <p className="text-primary-foreground/80 mt-2">
              Connect with a trusted agent to secure the best deal, faster.
            </p>
          </div>
          <button className="flex items-center gap-2 px-8 py-4 bg-card text-foreground font-semibold rounded-full hover:bg-card/90 transition-colors whitespace-nowrap">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PropertyCategories;
