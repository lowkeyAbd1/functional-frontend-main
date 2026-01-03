import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Building2, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { projectService } from '@/services/api';
import type { Project } from '@/types';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        const response = await projectService.getById(parseInt(id));
        if (response.success && response.data) {
          setProject(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-custom pt-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        {/* Hero Image */}
        <div className="relative h-[60vh] overflow-hidden">
          <img
            src={project.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80'}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 container-custom">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 ${getStatusColor(project.status)} text-xs font-semibold rounded-full capitalize`}>
                {project.status}
              </span>
              {project.is_featured && (
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Featured
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-card mb-4">{project.title}</h1>
            <div className="flex items-center gap-4 text-card/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{project.location}</span>
              </div>
              {project.developer && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>{project.developer}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            className="absolute top-8 left-8 bg-card/90 backdrop-blur-sm text-foreground hover:bg-card"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/projects');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="container-custom py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Key Facts */}
              <div className="glass-card p-6 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Key Facts</h2>
                <div className="grid grid-cols-2 gap-4">
                  {project.price_from && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Starting Price</p>
                      <p className="text-xl font-bold text-foreground">${project.price_from.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="text-xl font-bold text-foreground capitalize">{project.status}</p>
                  </div>
                  {project.developer && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Developer</p>
                      <p className="text-xl font-bold text-foreground">{project.developer}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="text-xl font-bold text-foreground">{project.location}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div className="glass-card p-6 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">About This Project</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Location Map Placeholder */}
              <div className="glass-card p-6 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Location</h2>
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Map view coming soon</p>
                    <p className="text-sm text-muted-foreground mt-1">{project.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-24">
                <h3 className="text-xl font-bold text-foreground mb-4">Interested in this project?</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Contact us to learn more about this development and schedule a viewing.
                </p>
                <div className="space-y-3">
                  <Button className="w-full h-12 gap-2">
                    <Phone className="w-4 h-4" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-2">
                    <Mail className="w-4 h-4" />
                    Send Email
                  </Button>
                  <Link to="/contact" className="block">
                    <Button variant="outline" className="w-full h-12">
                      Contact Form
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetails;

