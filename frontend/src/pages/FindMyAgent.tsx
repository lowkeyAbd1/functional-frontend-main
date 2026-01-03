import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AgentFilters from '@/components/agent/AgentFilters';
import AgentCard from '@/components/agent/AgentCard';
import AgentStoriesRow from '@/components/stories/AgentStoriesRow';
import { agentsServiceEnhanced } from '@/services/api';
import type { Agent } from '@/types';

const FindMyAgent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    language: searchParams.get('language') || '',
    name: searchParams.get('name') || '',
    specialization: searchParams.get('specialization') || '',
    purpose: searchParams.get('purpose') || '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAgents();
  }, [filters]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await agentsServiceEnhanced.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (response.success && response.data) {
        setAgents(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container-custom py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Find My Agent
          </h1>
          <p className="text-muted-foreground mb-8">
            Connect with experienced real estate agents in Somalia
          </p>

          {/* Filters */}
          <AgentFilters onFilter={handleFilter} />

          {/* Stories Row */}
          <div className="mb-8">
            <AgentStoriesRow city={filters.city} />
          </div>

          {/* Agents List */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${pagination.total} agents found`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <p>No agents found matching your filters.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindMyAgent;

