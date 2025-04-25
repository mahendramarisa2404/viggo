
import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useNavigation } from '@/contexts/NavigationContext';
import { Location } from '@/types';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';

// Use the Mapbox token from mapboxUtils
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

const SearchDestination: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { startNavigation } = useNavigation();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}`
      );

      if (response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].center;
        const destination: Location = {
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
        };
        startNavigation(destination);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 pr-4"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching || !searchQuery.trim()}
        className="bg-sss-blue hover:bg-sss-purple"
      >
        <MapPin className="w-4 h-4" />
        Navigate
      </Button>
    </div>
  );
};

export default SearchDestination;
