import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Phone, Mail, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { agentService } from '@/services/api';
import type { Agent } from '@/types';

import { getAgentImageUrl } from '@/lib/agentImage';

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response: any = await agentService.getAll();

        // Support both shapes:
        // 1) { success:true, data: [] }
        // 2) { success:true, data: { data: [] , pagination: {} } }
        // 3) { data: [] } (some libs)
        const raw = response?.data;

        const list =
          Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(response)
                ? response
                : [];

        if (response?.success === false) {
          setAgents([]);
          return;
        }

        setAgents(list as Agent[]);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const q = searchQuery.trim().toLowerCase();

  const filteredAgents = agents.filter((agent: any) => {
    const name = (agent?.name || '').toLowerCase();
    const specialty = (agent?.specialty || agent?.specialization || '').toLowerCase();
    const title = (agent?.title || '').toLowerCase();

    return name.includes(q) || specialty.includes(q) || title.includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container-custom py-6">
          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Agents Grid - Moved to top */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {filteredAgents.map((agent: any, index: number) => (
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
                        <span className="text-sm font-semibold text-foreground">
                          {agent.rating ?? 0}
                        </span>
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
                        <span className="text-muted-foreground">
                          {agent.specialty || agent.specialization || 'General'}
                        </span>
                        <span className="font-semibold text-primary">
                          {agent.reviews ?? 0} deals
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const phone = agent.phone || agent.agent_phone || '+252612345678';
                            window.location.href = `tel:${phone}`;
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `mailto:${agent.email || 'info@faithstate.so'}`;
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Empty State */}
              {filteredAgents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No agents found.</p>
                </div>
              )}

              {/* Find a TruBroker™ Section - Moved below agents grid */}
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Find a TruBroker™
                </h1>
                
                {/* Search */}
                <div className="relative max-w-2xl mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search agents by name, specialty, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Results Count */}
                <p className="text-muted-foreground">
                  {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Agents;
