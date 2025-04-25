
import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { MapPin, Navigation, AlertTriangle, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';
import SearchDestination from './SearchDestination';

const NavigationBar: React.FC = () => {
  const { startLocationTracking, stopLocationTracking, isTracking, isNearCollege } = useLocation();
  const { startNavigation, stopNavigation, isNavigating } = useNavigation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const handleToggleNavigation = () => {
    if (isNavigating) {
      stopNavigation();
    } else {
      // Use college location as default destination
      startNavigation();
    }
  };
  
  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };
  
  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className="bg-white shadow-md py-3 px-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <img src="/lovable-uploads/044edc96-22a8-40d3-aa29-9036a1de557b.png" alt="Viggo" className="h-10 w-10 mr-3" />
          <h1 className="text-lg font-bold text-[#ea384c]">Viggo</h1>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleToggleTracking}
            className={`flex items-center justify-center p-2 rounded-full ${
              isTracking ? 'bg-sss-blue text-white' : 'bg-gray-100 text-gray-600'
            }`}
            title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          >
            <MapPin className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleToggleNavigation}
            className={`flex items-center justify-center p-2 rounded-full ${
              isNavigating ? 'bg-sss-blue text-white' : 'bg-gray-100 text-gray-600'
            }`}
            title={isNavigating ? 'Stop Navigation' : 'Start Navigation'}
          >
            <Navigation className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleOpenSettings}
            className="flex items-center justify-center p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {isNearCollege && (
            <div className="flex items-center text-green-500">
              <AlertTriangle className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Near College</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-2">
        <SearchDestination />
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
};

export default NavigationBar;
