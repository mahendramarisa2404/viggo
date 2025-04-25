
import React, { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useNavigation } from '@/contexts/NavigationContext';
import { Location } from '@/types';
import axios from 'axios';
import { toast } from './ui/sonner';

// Use the Mapbox token from mapboxUtils
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

interface SearchResult {
  placeName: string;
  coordinates: [number, number]; // [longitude, latitude]
}

const SearchDestination: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { startNavigation } = useNavigation();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,address,poi`
      );

      if (response.data.features && response.data.features.length > 0) {
        const results: SearchResult[] = response.data.features.map((feature: any) => ({
          placeName: feature.place_name,
          coordinates: feature.center
        }));
        
        setSearchResults(results);
        setShowResults(true);
      } else {
        toast.error("No locations found", {
          description: "Try a different search term"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed", {
        description: "Please try again"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: SearchResult) => {
    const [lng, lat] = result.coordinates;
    const destination: Location = {
      latitude: lat,
      longitude: lng,
      timestamp: Date.now(),
    };
    
    startNavigation(destination);
    toast.success("Navigation started", {
      description: `Navigating to ${result.placeName.split(',')[0]}`
    });
    
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  // Close search results when clicking outside
  const handleBlur = (e: React.FocusEvent) => {
    // Small delay to allow for clicking on results
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="pl-10 pr-4"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="bg-sss-blue hover:bg-sss-purple"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>
      
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {searchResults.map((result, index) => (
              <li 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-start"
                onClick={() => handleSelectLocation(result)}
              >
                <MapPin className="w-4 h-4 text-sss-blue mt-1 mr-2 flex-shrink-0" />
                <span className="text-sm">{result.placeName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchDestination;
