
import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLocation } from '@/contexts/LocationContext';
import { Location } from '@/types';
import axios from 'axios';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

interface SearchResult {
  placeName: string;
  coordinates: [number, number];
  distance?: number;
  placeType?: string;
}

const SearchDestination: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { startNavigation, isNavigating, isLoadingRoute } = useNavigation();
  const { currentLocation } = useLocation();
  
  const debouncedSearch = useDebounce(searchQuery, 300); // Reduced from 500ms to 300ms for faster response

  const handleSearch = useCallback(async () => {
    if (!debouncedSearch.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Use current location for proximity if available, otherwise fall back to default
      const proximityLng = currentLocation?.longitude || 83.1669508;
      const proximityLat = currentLocation?.latitude || 17.7097776;
      
      // Calculate bounding box around current location (roughly 10km in each direction)
      const bbox = currentLocation ? 
        `${proximityLng - 0.1},${proximityLat - 0.1},${proximityLng + 0.1},${proximityLat + 0.1}` : 
        undefined;
      
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          debouncedSearch
        )}.json`, {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 10, // Increased from 5 to 10 for more options
            country: 'in',
            types: 'place,address,poi,district,locality,neighborhood',
            proximity: `${proximityLng},${proximityLat}`,
            bbox: bbox,
            fuzzyMatch: true,
            autocomplete: true
          }
        }
      );

      if (response.data.features?.length > 0) {
        // Enhanced result processing with more metadata
        const results: SearchResult[] = response.data.features.map((feature: any) => ({
          placeName: feature.place_name,
          coordinates: feature.center,
          distance: feature.properties?.distance,
          placeType: feature.place_type?.[0] || 'location'
        }));
        
        // Sort results by confidence and relevance
        const enhancedResults = results
          .filter((result) => result.placeName.trim() !== '')
          .sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
        
        setSearchResults(enhancedResults);
        setShowResults(true);
      } else {
        toast.warning("No locations found", {
          description: "Try a different search term"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed", {
        description: "Please check your internet connection and try again"
      });
    } finally {
      setIsSearching(false);
    }
  }, [debouncedSearch, currentLocation]);

  useEffect(() => {
    if (debouncedSearch) {
      handleSearch();
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  }, [debouncedSearch, handleSearch]);

  const handleSelectLocation = async (result: SearchResult) => {
    try {
      const [lng, lat] = result.coordinates;
      const destination: Location = {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now()
      };
      
      await startNavigation(destination);
      toast.success("Navigation started", {
        description: `Navigating to ${result.placeName.split(',')[0]}`
      });
      
      setSearchQuery('');
      setShowResults(false);
      setSearchResults([]);
    } catch (error) {
      toast.error("Navigation failed", {
        description: "Unable to start navigation. Please try again."
      });
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative search-container">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="pl-10 pr-4"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          className={`${isNavigating ? 'bg-primary text-white' : ''}`}
          onClick={() => {
            if (searchResults.length > 0) {
              handleSelectLocation(searchResults[0]);
            }
          }}
          disabled={isLoadingRoute || searchResults.length === 0}
          title="Start Navigation"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>
      
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {searchResults.map((result, index) => (
              <li 
                key={index}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-start gap-3 transition-colors"
                onClick={() => handleSelectLocation(result)}
              >
                <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{result.placeName.split(',')[0]}</div>
                  <div className="text-xs text-gray-500">{result.placeName.split(',').slice(1).join(',')}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {result.placeType && (
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {result.placeType}
                      </span>
                    )}
                    {result.distance && (
                      <span className="text-xs text-primary">
                        {(result.distance / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {(isSearching || isLoadingRoute) && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default SearchDestination;
