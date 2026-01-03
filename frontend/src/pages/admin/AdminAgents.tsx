import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { agentService } from '@/services/api';
import { getAgentImageUrl } from '@/lib/agentImage';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/types';

const AdminAgents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [searchQuery]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response: any = await agentService.getAll();
      
      // Handle different response formats
      let agentsData: Agent[] = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          agentsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          agentsData = response.data.data;
        } else if (Array.isArray(response)) {
          agentsData = response;
        }
      } else if (Array.isArray(response)) {
        agentsData = response;
      }
      
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(query) ||
      agent.title?.toLowerCase().includes(query) ||
      agent.city?.toLowerCase().includes(query) ||
      agent.company?.toLowerCase().includes(query) ||
      agent.languages?.toLowerCase().includes(query) ||
      agent.specialty?.toLowerCase().includes(query) ||
      agent.specialization?.toLowerCase().includes(query)
    );
  });

  const handleDelete = async () => {
    if (!agentToDelete) return;

    try {
      const response = await agentService.delete(agentToDelete.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Agent deleted successfully',
        });
        fetchAgents();
      } else {
        throw new Error(response.message || 'Failed to delete agent');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  };

  return (
    <ProtectedRoute roles={['admin', 'agent']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Agents</h1>
                <p className="text-muted-foreground">View and manage all agents</p>
              </div>
              <Button onClick={() => navigate('/admin/agents/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Agents Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Image</th>
                        <th className="text-left p-4 font-semibold text-foreground">ID</th>
                        <th className="text-left p-4 font-semibold text-foreground">Name</th>
                        <th className="text-left p-4 font-semibold text-foreground">Title</th>
                        <th className="text-left p-4 font-semibold text-foreground">City</th>
                        <th className="text-left p-4 font-semibold text-foreground">Languages</th>
                        <th className="text-left p-4 font-semibold text-foreground">Company</th>
                        <th className="text-left p-4 font-semibold text-foreground">Phone</th>
                        <th className="text-left p-4 font-semibold text-foreground">WhatsApp</th>
                        <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.length > 0 ? (
                        filteredAgents.map((agent) => (
                          <tr key={agent.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                            <td className="p-4">
                              <img
                                src={getAgentImageUrl(agent)}
                                alt={agent.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            </td>
                            <td className="p-4 text-muted-foreground">{agent.id}</td>
                            <td className="p-4">
                              <div className="font-semibold text-foreground">{agent.name}</div>
                            </td>
                            <td className="p-4 text-muted-foreground">{agent.title || '-'}</td>
                            <td className="p-4 text-muted-foreground">{agent.city || '-'}</td>
                            <td className="p-4 text-muted-foreground">
                              {agent.languages ? (
                                <div className="flex flex-wrap gap-1">
                                  {agent.languages.split(',').map((lang, idx) => (
                                    <span key={idx} className="text-xs bg-secondary px-2 py-1 rounded">
                                      {lang.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-4 text-muted-foreground">{agent.company || '-'}</td>
                            <td className="p-4 text-muted-foreground">
                              {agent.phone ? (
                                <a href={`tel:${agent.phone}`} className="text-primary hover:underline">
                                  {agent.phone}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {agent.whatsapp ? (
                                <a
                                  href={`https://wa.me/${agent.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {agent.whatsapp}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/agents/${agent.id}`)}
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/agents/${agent.id}/edit`)}
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAgentToDelete(agent);
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="text-center py-12 text-muted-foreground">
                            No agents found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {agentToDelete?.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminAgents;
