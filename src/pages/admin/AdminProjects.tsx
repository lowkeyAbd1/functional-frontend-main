import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { adminProjectService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Project as NewProject } from '@/types/project';

const AdminProjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<NewProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<NewProject | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [searchQuery]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await adminProjectService.getAll(searchQuery || undefined);
      // Handle response format: { success: true, data: [...] } or direct array
      if (response.success && response.data) {
        const projectsArray = Array.isArray(response.data) ? response.data : [];
        setProjects(projectsArray);
      } else if (Array.isArray(response)) {
        // Handle case where response is direct array
        setProjects(response);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load projects',
        variant: 'destructive',
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      const response = await adminProjectService.delete(projectToDelete.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Project deleted successfully',
        });
        fetchProjects();
      } else {
        throw new Error(response.message || 'Failed to delete project');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const getImageUrl = (project: any) => {
    // Handle both array of strings and array of objects with url property
    if (project.images && project.images.length > 0) {
      const firstImage = project.images[0];
      const url = typeof firstImage === 'string' ? firstImage : (firstImage.url || '');
      if (url) {
        return url.startsWith('http') ? url : `http://localhost:5001${url}`;
      }
    }
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24">
          <div className="container-custom py-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Projects</h1>
                <p className="text-muted-foreground">Create and manage new projects</p>
              </div>
              <Button onClick={() => navigate('/admin/projects/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Projects Table */}
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
                        <th className="text-left p-4 font-semibold text-foreground">Name</th>
                        <th className="text-left p-4 font-semibold text-foreground">Location</th>
                        <th className="text-left p-4 font-semibold text-foreground">Status</th>
                        <th className="text-left p-4 font-semibold text-foreground">Handover</th>
                        <th className="text-left p-4 font-semibold text-foreground">Launch Price</th>
                        <th className="text-left p-4 font-semibold text-foreground">Updated</th>
                        <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <img
                              src={getImageUrl(project)}
                              alt={project.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.developer}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">{project.location}</td>
                          <td className="p-4">
                            <Badge className={project.status === 'Ready' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{project.handover || '-'}</td>
                          <td className="p-4 text-muted-foreground">{project.launchPrice || '-'}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/new-projects/${project.slug}`)}
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/projects/${project.id}/edit`)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setProjectToDelete(project);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {projects.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No projects found</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/admin/projects/new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first project
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default AdminProjects;
