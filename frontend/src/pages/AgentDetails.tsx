import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Phone, Mail, MapPin, Building, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { agentService } from '@/services/api';
import { getAgentImageUrl } from '@/lib/agentImage';
import { useToast } from '@/hooks/use-toast';
import type { Agent, Property } from '@/types';

const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize phone number for tel: links
  const normalizePhoneForTel = (phone: string | undefined): string => {
    if (!phone) return '';
    // Remove spaces, dashes, parentheses, and other non-digit characters except +
    let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
    // If doesn't start with +, add Somalia country code +252
    if (!normalized.startsWith('+')) {
      normalized = '+252' + normalized.replace(/^252/, '');
    }
    return normalized;
  };

  // Normalize phone number for WhatsApp (digits only, no +)
  const normalizePhoneForWhatsApp = (phone: string | undefined): string => {
    if (!phone) return '';
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    // If starts with 252 (Somalia), keep it; otherwise assume it's missing country code
    if (!normalized.startsWith('252') && normalized.length > 0) {
      normalized = '252' + normalized;
    }
    return normalized;
  };

  // Handle Call Now button
  const handleCallNow = () => {
    const phone = normalizePhoneForTel(agent?.phone);
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast({
        title: 'Phone number not available',
        description: 'This agent has not provided a phone number.',
        variant: 'destructive',
      });
    }
  };

  // Handle Send Email button
  const handleSendEmail = () => {
    const email = agent?.email;
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast({
        title: 'Email not available',
        description: 'This agent has not provided an email address.',
        variant: 'destructive',
      });
    }
  };

  // Handle WhatsApp button
  const handleWhatsApp = () => {
    const whatsapp = agent?.whatsapp || agent?.phone;
    if (whatsapp) {
      const normalized = normalizePhoneForWhatsApp(whatsapp);
      if (normalized) {
        const message = encodeURIComponent(`Hi ${agent?.name || 'there'}, I'm interested in your listings on FaithState.`);
        window.open(`https://wa.me/${normalized}?text=${message}`, '_blank');
      } else {
        toast({
          title: 'WhatsApp number not available',
          description: 'This agent has not provided a WhatsApp number.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'WhatsApp number not available',
        description: 'This agent has not provided a WhatsApp number.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch agent and properties in parallel
        const [agentResponse, propertiesResponse] = await Promise.all([
          agentService.getById(parseInt(id)),
          agentService.getProperties(parseInt(id))
        ]);
        
        if (agentResponse.success && agentResponse.data) {
          setAgent(agentResponse.data);
        }
        
        if (propertiesResponse.success && propertiesResponse.data) {
          setProperties(propertiesResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch agent data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-custom pt-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
          <Button onClick={() => navigate('/agents')}>Back to Agents</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container-custom py-8">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/agents');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent Info Card */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-24">
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                    <img
                      src={getAgentImageUrl(agent)}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">{agent.name}</h1>
                  <p className="text-muted-foreground mb-4">{agent.title || 'Real Estate Agent'}</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-semibold">{agent.rating || 0}</span>
                    <span className="text-sm text-muted-foreground">({agent.reviews || 0} reviews)</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {agent.specialty && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Specialty</p>
                      <p className="font-semibold text-foreground">{agent.specialty}</p>
                    </div>
                  )}
                  {agent.experience && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Experience</p>
                      <p className="font-semibold text-foreground">{agent.experience} years</p>
                    </div>
                  )}
                  {agent.sales && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
                      <p className="font-semibold text-foreground">{agent.sales}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-12 gap-2" onClick={handleCallNow}>
                    <Phone className="w-4 h-4" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-2" onClick={handleSendEmail}>
                    <Mail className="w-4 h-4" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 gap-2" 
                    onClick={handleWhatsApp}
                    disabled={!agent?.whatsapp && !agent?.phone}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            {/* Agent Properties */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Properties by {agent.name}</h2>
                <p className="text-muted-foreground">
                  Browse properties listed by this agent
                </p>
              </div>

              {properties && properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <Link
                      key={property.id}
                      to={`/properties/${property.slug || property.id}`}
                      className="glass-card group overflow-hidden block"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                          src={
                            property.images && Array.isArray(property.images) && property.images.length > 0 && property.images[0]
                              ? (property.images[0].startsWith('http')
                                  ? property.images[0]
                                  : `${import.meta.env.VITE_API_URL}${property.images[0]}`)
                              : property.image 
                                ? (property.image.startsWith('http') ? property.image : `${import.meta.env.VITE_API_URL}${property.image}`)
                                : 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80'
                          }
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <p className="text-lg font-bold text-card">
                            {property.currency || 'USD'} {property.price.toLocaleString()}
                            {property.rent_period && `/${property.rent_period}`}
                          </p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{property.location}{property.city ? `, ${property.city}` : ''}</span>
                        </div>
                        {(property.beds || property.baths || property.area) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {property.beds && <span>{property.beds} Beds</span>}
                            {property.baths && <span>{property.baths} Baths</span>}
                            {property.area && <span>{property.area} {property.area_unit || 'sqm'}</span>}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No properties listed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AgentDetails;

