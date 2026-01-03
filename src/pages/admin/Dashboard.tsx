import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Video, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    agents: 0,
    stories: 0,
    projects: 0,
    contacts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts from various endpoints
        const [propertiesRes, agentsRes, storiesRes, projectsRes, contactsRes] = await Promise.all([
          apiFetch('/admin/properties').catch(() => ({ success: false, data: [] })),
          apiFetch('/agents').catch(() => ({ success: false, data: [] })),
          apiFetch('/stories').catch(() => ({ success: false, data: [] })),
          apiFetch('/admin/projects').catch(() => ({ success: false, data: [] })),
          apiFetch('/contacts').catch(() => ({ success: false, data: [] })),
        ]);

        // Handle response format: { success: true, data: [...] } or direct array
        const getDataArray = (res: any): any[] => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.success && Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.data)) return res.data;
          return [];
        };

        setStats({
          properties: getDataArray(propertiesRes).length,
          agents: getDataArray(agentsRes).length,
          stories: getDataArray(storiesRes).length,
          projects: getDataArray(projectsRes).length,
          contacts: getDataArray(contactsRes).length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Properties', value: stats.properties, icon: Building2, color: 'bg-blue-500/10 text-blue-600', link: '/admin/properties' },
    { label: 'Agents', value: stats.agents, icon: Users, color: 'bg-green-500/10 text-green-600', link: '/admin/agents' },
    { label: 'Projects', value: stats.projects, icon: Building2, color: 'bg-rose-500/10 text-rose-600', link: '/admin/projects' },
    { label: 'Contacts', value: stats.contacts, icon: MessageSquare, color: 'bg-teal-500/10 text-teal-600', link: '/admin/contacts' },
  ];

  // Add Stories card only for agents
  if (user?.role === 'agent') {
    statCards.push({
      label: 'Stories',
      value: stats.stories,
      icon: Video,
      color: 'bg-purple-500/10 text-purple-600',
      link: '/admin/stories',
    });
  }

  return (
    <ProtectedRoute roles={['admin', 'agent']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => navigate(stat.link)}
                    className="glass-card p-6 text-left hover:border-primary/50 transition-colors"
                  >
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;

