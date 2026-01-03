import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { contactService } from '@/services/api';
import type { Contact } from '@/types';

const AdminContacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await contactService.getAll();
        if (response.success && response.data) {
          setContacts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      new: { label: 'New', className: 'bg-blue-500/10 text-blue-600' },
      contacted: { label: 'Contacted', className: 'bg-amber-500/10 text-amber-600' },
      closed: { label: 'Closed', className: 'bg-green-500/10 text-green-600' },
    };
    const statusInfo = statusMap[status || 'new'] || statusMap.new;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
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
                <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
                <p className="text-muted-foreground">
                  Manage all contact form submissions
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {contacts.length} messages
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-20">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No messages yet</h3>
                <p className="text-muted-foreground">Contact messages will appear here when users submit the contact form.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Message</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-foreground font-medium">
                            {contact.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {contact.phone ? (
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground max-w-xs">
                            {truncateMessage(contact.message)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(contact.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatDate(contact.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedContact(contact)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Message Detail Modal */}
            {selectedContact && (
              <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Message Details</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContact(null)}
                    >
                      ×
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">Name</label>
                      <p className="text-foreground">{selectedContact.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">Email</label>
                      <p className="text-foreground">
                        <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                          {selectedContact.email}
                        </a>
                      </p>
                    </div>
                    {selectedContact.phone && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground">Phone</label>
                        <p className="text-foreground">
                          <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                            {selectedContact.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">Message</label>
                      <p className="text-foreground whitespace-pre-wrap">{selectedContact.message}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">Date</label>
                      <p className="text-foreground">{formatDate(selectedContact.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedContact.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedContact(null)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminContacts;

