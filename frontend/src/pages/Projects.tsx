import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Building2, Search, SlidersHorizontal, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { projectService } from '@/services/api';
import type { Project } from '@/types';

const Projects = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const location = searchParams.get('location');
        const status = searchParams.get('status');
        const filters: Record<string, string> = {};
        
        if (location) filters.location = location;
        if (status) filters.status = status;

        const response = await projectService.getAll(filters);
        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-600';
      case 'ongoing':
        return 'bg-amber-500/10 text-amber-600';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container-custom py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              New Projects
            </h1>
            <p className="text-muted-foreground">
              Discover exciting new real estate developments
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const params = new URLSearchParams(searchParams);
                    if (searchQuery) {
                      params.set('location', searchQuery);
                    } else {
                      params.delete('location');
                    }
                    window.location.search = params.toString();
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 rounded-xl h-12">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Results Count */}
          <p className="text-muted-foreground mb-6">
            {projects.length} projects found
          </p>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <Link
                  to={`/projects/${project.id}`}
                  key={project.id}
                  className="glass-card group overflow-hidden animate-fade-in block"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={project.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-3 py-1 ${getStatusColor(project.status)} text-xs font-semibold rounded-full capitalize`}>
                        {project.status}
                      </span>
                      {project.is_featured && (
                        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    {/* Price */}
                    {project.price_from && (
                      <div className="absolute bottom-3 left-3">
                        <p className="text-lg font-bold text-card">From ${project.price_from.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="line-clamp-1">{project.location}</span>
                    </div>
                    {project.developer && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{project.developer}</span>
                      </div>
                    )}
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No projects found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Projects;

