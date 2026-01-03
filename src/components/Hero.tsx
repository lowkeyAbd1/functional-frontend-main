import { Search, MapPin, ChevronDown, LayoutGrid, Home, BedDouble, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Hero = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const [searchLocation, setSearchLocation] = useState('');
  const [type, setType] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Map 'buy' to 'Sale' and 'rent' to 'Rent' (matching Properties page)
    params.set('purpose', activeTab === 'buy' ? 'Sale' : 'Rent');
    
    if (searchLocation.trim()) {
      params.set('location', searchLocation.trim());
    }
    if (type) {
      params.set('type', type);
    }
    if (beds) {
      params.set('beds', beds);
    }
    if (baths) {
      params.set('baths', baths);
    }
    if (minPrice) {
      params.set('minPrice', minPrice);
    }
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    }

    navigate(`/properties?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-32 md:pt-36">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt="Luxury home"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-3xl">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 animate-fade-in">
            Find Your <span className="text-primary">Dream Home</span> in Somalia
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in stagger-1">
            Properties in Mogadishu, Hargeisa, Bosaso & More
          </p>

          {/* Search Box */}
          <div className="search-box animate-fade-in stagger-2" id="property-search">
            {/* Tabs */}
            <div className="flex gap-1 mb-6">
              <button
                onClick={() => setActiveTab('buy')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'buy'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'rent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Rent
              </button>
            </div>

            {/* Search Form */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  placeholder="Enter location"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <Button onClick={handleSearch} className="btn-teal h-14 px-8 rounded-xl text-base">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button 
                onClick={() => {
                  setType('');
                  setBeds('');
                  setBaths('');
                  setMinPrice('');
                  setMaxPrice('');
                  navigate('/properties');
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-sm font-medium text-primary transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>All</span>
              </button>
              
              {/* Type Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-sm font-medium text-foreground transition-colors">
                    <Home className="w-4 h-4 text-primary" />
                    <span>{type || 'All Types'}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    <button
                      onClick={() => setType('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !type ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                      }`}
                    >
                      All Types
                    </button>
                    {['Apartment', 'Villa', 'House', 'Land', 'Office', 'Shop'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          type === t ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Beds & Baths Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-sm font-medium text-foreground transition-colors">
                    <BedDouble className="w-4 h-4 text-primary" />
                    <span>Beds & Baths</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Beds</label>
                      <select
                        value={beds}
                        onChange={(e) => setBeds(e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Baths</label>
                      <select
                        value={baths}
                        onChange={(e) => setBaths(e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Price Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-sm font-medium text-foreground transition-colors">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>Price</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Min Price</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Price</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="No limit"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-10 animate-fade-in stagger-3">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">15K+</p>
              <p className="text-sm text-muted-foreground">Properties</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Expert Agents</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">98%</p>
              <p className="text-sm text-muted-foreground">Happy Clients</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
