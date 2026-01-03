import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, ChevronDown, Info, MessageCircle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { newProjectService } from '@/services/api';
import type { Project as NewProject } from '@/types/project';

const NewProjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<NewProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<NewProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [purpose, setPurpose] = useState(searchParams.get('purpose') || 'Buy');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ready' | 'Off-Plan'>(
    searchParams.get('status') === 'Ready' ? 'Ready' : 
    searchParams.get('status') === 'Off-Plan' ? 'Off-Plan' : 'Off-Plan'
  );
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [beds, setBeds] = useState(searchParams.get('beds') || '');
  const [handover, setHandover] = useState(searchParams.get('handover') || '');
  const [paymentPlan, setPaymentPlan] = useState(searchParams.get('paymentPlan') || '');
  const [completion, setCompletion] = useState(searchParams.get('completion') || '');

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const filters: Record<string, string> = {};
        if (location) filters.location = location;
        if (statusFilter === 'Ready') filters.status = 'Ready';
        if (statusFilter === 'Off-Plan') filters.status = 'Under Construction';
        if (category) filters.category = category;
        if (beds) filters.beds = beds;
        if (handover) filters.handover = handover;
        if (paymentPlan) filters.paymentPlan = paymentPlan;
        if (completion) filters.completion = completion;

        const response = await newProjectService.getAll(filters);
        
        // Handle response shape safely
        const projects = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        setProjects(projects);
        setFilteredProjects(projects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
        setFilteredProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Apply client-side filters (for UI state changes)
  useEffect(() => {
    let filtered = [...projects];

    // Location filter
    if (location.trim()) {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'Ready') {
      filtered = filtered.filter(p => p.status === 'Ready');
    } else if (statusFilter === 'Off-Plan') {
      filtered = filtered.filter(p => p.tags.includes('Off-Plan'));
    }

    // Category filter
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    // Beds filter
    if (beds) {
      const minBeds = parseInt(beds);
      filtered = filtered.filter(p => p.beds && p.beds >= minBeds);
    }

    // Handover filter
    if (handover) {
      filtered = filtered.filter(p => p.handover.includes(handover));
    }

    // Payment plan filter
    if (paymentPlan) {
      filtered = filtered.filter(p => p.paymentPlanLabel.includes(paymentPlan));
    }

    // Completion filter
    if (completion) {
      const minCompletion = parseInt(completion);
      filtered = filtered.filter(p => 
        p.completionPercent && p.completionPercent >= minCompletion
      );
    }

    setFilteredProjects(filtered);
  }, [location, statusFilter, category, beds, handover, paymentPlan, completion]);

  const clearFilters = () => {
    setLocation('');
    setStatusFilter('Off-Plan');
    setCategory('');
    setBeds('');
    setHandover('');
    setPaymentPlan('');
    setCompletion('');
    setSearchParams({});
  };

  const hasActiveFilters = location || statusFilter !== 'Off-Plan' || category || beds || handover || paymentPlan || completion;

  const handleViewInSearch = (project: NewProject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams();
    params.set('project', project.name.toUpperCase());
    params.set('category', project.tags.includes('Off-Plan') ? 'offplan' : 'ready');
    params.set('location', project.location);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        {/* Sticky Filter Bar */}
        <div className="sticky top-24 z-40 bg-card border-b border-border shadow-sm">
          <div className="container-custom py-4">
            {/* Primary Filter Row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {/* Buy/Rent Dropdown */}
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Buy">Buy</option>
                <option value="Rent">Rent</option>
              </select>

              {/* Location Input */}
              <div className="flex-1 min-w-[200px] relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Status Toggle Buttons */}
              <div className="flex gap-1 bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === 'All'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('Ready')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === 'Ready'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ready
                </button>
                <button
                  onClick={() => setStatusFilter('Off-Plan')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === 'Off-Plan'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Off-Plan
                </button>
              </div>

              {/* Category Dropdown */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Residential</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>

              {/* Beds & Baths Dropdown */}
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Beds & Baths</option>
                <option value="1">1+ Bed</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
              </select>

              {/* More Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    More Filters
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Handover By</label>
                      <select
                        value={handover}
                        onChange={(e) => setHandover(e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                        <option value="2030">2030</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Payment Plan</label>
                      <select
                        value={paymentPlan}
                        onChange={(e) => setPaymentPlan(e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="80">80/20</option>
                        <option value="70">70/30</option>
                        <option value="75">75/25</option>
                        <option value="60">60/40</option>
                        <option value="50">50/50</option>
                        <option value="100">100/0</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">% Completion</label>
                      <select
                        value={completion}
                        onChange={(e) => setCompletion(e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="0">0%+</option>
                        <option value="25">25%+</option>
                        <option value="50">50%+</option>
                        <option value="75">75%+</option>
                        <option value="100">100%</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Projects List */}
            <div className="lg:col-span-3">
              <div className="mb-4">
                <p className="text-muted-foreground">
                  {loading ? 'Loading...' : `${filteredProjects.length} projects found`}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                {filteredProjects.length > 0 ? filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/new-projects/${project.slug}`}
                    className="block glass-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Image */}
                      <div className="md:w-64 flex-shrink-0">
                        <div className="relative aspect-video rounded-lg overflow-hidden">
                          <img
                            src={project.images && project.images.length > 0
                              ? (project.images[0].startsWith('http') 
                                  ? project.images[0] 
                                  : `http://localhost:5001${project.images[0]}`)
                              : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge className={project.status === 'Ready' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}>
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {project.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              by {project.developer}
                            </p>
                          </div>
                        </div>

                        {/* Pills */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Launch Price: {project.launchPrice}
                          </Badge>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20">
                                Payment Plan {project.paymentPlanLabel}
                                <Info className="w-3 h-3 ml-1 inline" />
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <h4 className="font-semibold mb-3">Payment Plan Breakdown</h4>
                              <div className="space-y-2 text-sm">
                                {project.paymentPlan && Array.isArray(project.paymentPlan) && project.paymentPlan.length > 0 ? (
                                  project.paymentPlan.map((milestone, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span className="text-muted-foreground">{milestone.label}:</span>
                                      <span className="font-medium">{milestone.percent}%</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No payment plan details available</p>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Handover: {project.handover}
                          </Badge>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{project.location}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/252612345678?text=Hi, I'm interested in ${project.name}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleViewInSearch(project, e)}
                            className="text-sm"
                          >
                            View in Search
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No projects found matching your filters.</p>
                  </div>
                )}
                </div>
              )}

              {!loading && filteredProjects.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No projects found matching your filters.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-32">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Invest in Somalia
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover exciting investment opportunities in Somalia's growing real estate market.
                </p>
                <div className="space-y-2">
                  <Link to="/properties" className="block text-sm text-primary hover:underline">
                    Browse Properties
                  </Link>
                  <Link to="/agents" className="block text-sm text-primary hover:underline">
                    Find an Agent
                  </Link>
                  <Link to="/#contact-us" className="block text-sm text-primary hover:underline">
                    Contact Us
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

export default NewProjects;

