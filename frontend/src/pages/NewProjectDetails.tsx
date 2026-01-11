import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, MessageCircle, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { newProjectService } from '@/services/api';
import type { Project as NewProject } from '@/types/project';

const NewProjectDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<NewProject | null>(null);
  const [recommendations, setRecommendations] = useState<NewProject[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const projectData = await newProjectService.getBySlug(slug!);
      if (projectData) {
        setProject(projectData);
        // Fetch recommendations
        fetchRecommendations(projectData);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (currentProject: NewProject) => {
    try {
      const allProjects = await newProjectService.getAll();
      if (Array.isArray(allProjects)) {
        const recs = allProjects
          .filter(p => 
            p.id !== currentProject.id && (
              p.location === currentProject.location ||
              p.developer === currentProject.developer ||
              p.handover === currentProject.handover
            )
          )
          .slice(0, 6);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-20 text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <Button onClick={() => navigate('/new-projects')}>
              Back to Projects
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const descriptionPreview = project.description ? project.description.substring(0, 300) : '';
  const hasMoreDescription = project.description ? project.description.length > 300 : false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container-custom py-8">
          {/* Jump Links */}
          <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-border">
            <button
              onClick={() => scrollToSection('about-project')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              About the project
            </button>
            <button
              onClick={() => scrollToSection('payment-plan')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Payment Plan
            </button>
            <button
              onClick={() => scrollToSection('properties')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Properties
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Recommended for you
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec) => (
                      <Link
                        key={rec.id}
                        to={`/new-projects/${rec.slug}`}
                        className="glass-card p-4 hover:border-primary/50 transition-colors block"
                      >
                        <div className="flex gap-4">
                          <img
                            src={rec.images && rec.images.length > 0
                              ? (rec.images[0].startsWith('http') 
                                  ? rec.images[0] 
                                  : `${import.meta.env.VITE_URL}${rec.images[0]}`)
                              : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'}
                            alt={rec.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                              {rec.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              {rec.location}
                            </p>
                            <p className="text-sm font-medium text-primary">
                              {rec.launchPrice}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* About Section */}
              <section id="about-project">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  About {project.name}
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {showFullDescription ? project.description : descriptionPreview}
                    {hasMoreDescription && !showFullDescription && '...'}
                  </p>
                  {hasMoreDescription && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary hover:underline mt-2 text-sm font-medium"
                    >
                      {showFullDescription ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
              </section>

              {/* Payment Plan Section */}
              <section id="payment-plan">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Payment Plan
                </h2>
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      {project.paymentPlanLabel}
                    </Badge>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <Info className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <h4 className="font-semibold mb-3">Payment Plan Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          {project.paymentPlan.map((milestone, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-muted-foreground">{milestone.label}:</span>
                              <span className="font-medium">{milestone.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Payment Plan Timeline */}
                  <div className="relative pl-8">
                    {/* Vertical Line */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-primary/30" />
                    
                    <div className="space-y-6">
                      {project.paymentPlan.map((milestone, index) => (
                        <div key={index} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-11 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          
                          <div className="bg-secondary/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {milestone.label}
                                </h4>
                                {milestone.note && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {milestone.note}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  {milestone.percent}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  of property value
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Properties Section (Placeholder) */}
              <section id="properties">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Properties
                </h2>
                <p className="text-muted-foreground">
                  Browse available units in this project.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/properties?project=${project.name.toUpperCase()}&category=${project.tags.includes('Off-Plan') ? 'offplan' : 'ready'}&location=${project.location}`)}
                >
                  View Properties
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </section>
            </div>

            {/* Right Sticky Card */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-32">
                {/* Main Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  <img
                    src={project.images && project.images[selectedImageIndex] 
                      ? (project.images[selectedImageIndex].startsWith('http') 
                          ? project.images[selectedImageIndex] 
                          : `${import.meta.env.VITE_URL}${project.images[selectedImageIndex]}`)
                      : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnails */}
                {project.images && project.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {project.images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === idx
                            ? 'border-primary'
                            : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img.startsWith('http') ? img : `${import.meta.env.VITE_URL}${img}`}
                          alt={`${project.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Project Info */}
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{project.location}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Developer</p>
                    <p className="font-semibold text-foreground">{project.developer}</p>
                  </div>

                  <div>
                    <Badge className={project.status === 'Ready' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}>
                      {project.status}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Handover</p>
                    <p className="font-semibold text-foreground">{project.handover}</p>
                  </div>

                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/252612345678?text=Hi, I'm interested in ${project.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact via WhatsApp
                  </a>
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

export default NewProjectDetails;

