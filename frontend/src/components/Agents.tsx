import { useState, useEffect } from 'react';
import { Star, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { agentService } from '@/services/api';
import { getAgentImageUrl } from '@/lib/agentImage';
import type { Agent } from '@/types';

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await agentService.getAll();
        if (response.success && response.data) {
          setAgents(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);
  return (
    <section id="agents" className="section-padding pt-10 md:pt-12">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Expert Agents
            </span>
            <h2 className="section-title text-foreground mt-2">
              Find a TruBroker™
            </h2>
            <p className="section-subtitle">
              Connect with trusted agents awarded for their excellent performance
            </p>
          </div>
          <Link to="/agents">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2 rounded-full">
              Find My Agent
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.slice(0, 4).map((agent, index) => (
              <Link
                key={agent.id}
                to={`/agents/${agent.id}`}
                className="agent-card group animate-fade-in block"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={getAgentImageUrl(agent)}
                  alt={agent.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-card/90 backdrop-blur-sm rounded-full">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-foreground">{agent.rating || 0}</span>
                </div>
                
                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-semibold text-card">{agent.name}</h3>
                  <p className="text-sm text-card/80">{agent.title || 'Agent'}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{agent.specialty || 'General'}</span>
                  <span className="font-semibold text-primary">{agent.reviews || 0} {agent.reviews === 1 ? 'deal' : 'deals'}</span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No agents available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Agents;
