import { Mail, Phone, MessageCircle, MapPin, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAgentImageUrl } from '@/lib/agentImage';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
}

const AgentCard = ({ agent }: AgentCardProps) => {
  const languages = agent.languages ? agent.languages.split(',').map(l => l.trim()) : [];

  return (
    <div className="glass-card p-6 hover:border-primary/50 transition-colors">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          <img
            src={getAgentImageUrl(agent)}
            alt={agent.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">{agent.name}</h3>
              {agent.title && (
                <p className="text-sm text-muted-foreground">{agent.title}</p>
              )}
              {agent.company && (
                <p className="text-sm text-muted-foreground">{agent.company}</p>
              )}
            </div>
            {agent.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{agent.rating}</span>
                {agent.reviews && (
                  <span className="text-xs text-muted-foreground">({agent.reviews})</span>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          {agent.city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Serves in {agent.city}</span>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Speaks:</p>
              <div className="flex flex-wrap gap-1">
                {languages.map((lang, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Specialization */}
          {(agent.specialization || agent.specialty) && (
            <div className="mb-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {agent.specialization || agent.specialty}
              </Badge>
            </div>
          )}

          {/* Stats */}
          {agent.properties_count !== undefined && (
            <p className="text-sm text-muted-foreground mb-4">
              {agent.properties_count} {agent.properties_count === 1 ? 'property' : 'properties'}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            )}
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            )}
            {agent.whatsapp && (
              <a
                href={`https://wa.me/${agent.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;

