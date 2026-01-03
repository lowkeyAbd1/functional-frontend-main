import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AgentFiltersProps {
  onFilter: (filters: {
    city?: string;
    language?: string;
    name?: string;
    specialization?: string;
    purpose?: string;
  }) => void;
}

const AgentFilters = ({ onFilter }: AgentFiltersProps) => {
  const [city, setCity] = useState('');
  const [language, setLanguage] = useState('');
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleSearch = () => {
    onFilter({
      city: city || undefined,
      language: language || undefined,
      name: name || undefined,
      specialization: specialization || undefined,
      purpose: purpose || undefined,
    });
  };

  const handleClear = () => {
    setCity('');
    setLanguage('');
    setName('');
    setSpecialization('');
    setPurpose('');
    onFilter({});
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Agents dropdown */}
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger>
            <SelectValue placeholder="Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Agents</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="rent">Rent</SelectItem>
          </SelectContent>
        </Select>

        {/* Buy/Rent/Residential/Ready */}
        <Select value={specialization} onValueChange={setSpecialization}>
          <SelectTrigger>
            <SelectValue placeholder="Specialization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Ready">Ready</SelectItem>
            <SelectItem value="Off-Plan">Off-Plan</SelectItem>
          </SelectContent>
        </Select>

        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Location"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Agent Name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Agent Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Languages */}
        <input
          type="text"
          placeholder="Languages"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button onClick={handleSearch} className="flex-1">
          Find
        </Button>
        {(city || language || name || specialization || purpose) && (
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default AgentFilters;

