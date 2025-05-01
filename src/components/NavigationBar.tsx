
import React, { useState, useCallback } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { MapPin, Navigation, AlertTriangle, Settings, Home, Locate } from 'lucide-react';
import SettingsModal from './SettingsModal';
import SearchDestination from './SearchDestination';
import { toast } from 'sonner';
import { resetAlarmState } from '@/utils/notificationUtils';

const NavigationBar: React.FC = () => {
  const { startLocationTracking, stopLocationTracking, isTracking, isNearCollege, collegeInfo } = useLocation();
  const { startNavigation, stopNavigation, isNavigating, destination } = useNavigation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopLocationTracking();
      toast.info("Location tracking stopped");
    } else {
      startLocationTracking();
      toast.success("Location tracking started");
    }
  }, [isTracking, startLocationTracking, stopLocationTracking]);

  const handleToggleNavigation = useCallback(() => {
    if (isNavigating) {
      stopNavigation();
      toast.info("Navigation stopped");
    } else {
      // Navigate to college if no destination set
      startNavigation();
      resetAlarmState(); // Reset alarm state when starting new navigation
      toast.success("Navigation to college started");
    }
  }, [isNavigating, startNavigation, stopNavigation]);
  
  const handleNavigateToCollege = useCallback(() => {
    startNavigation(collegeInfo.location);
    resetAlarmState(); // Reset alarm state when starting new navigation
    toast.success(`Navigating to ${collegeInfo.name}`, {
      description: "Route to college calculated"
    });
  }, [collegeInfo, startNavigation]);
  
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
        
        <div className="flex space-x-2">
          <button
            onClick={handleToggleTracking}
            className={`flex items-center justify-center p-2 rounded-full ${
              isTracking ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
            title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
            aria-label={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          >
            <Locate className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleToggleNavigation}
            className={`flex items-center justify-center p-2 rounded-full ${
              isNavigating ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
            title={isNavigating ? 'Stop Navigation' : 'Start Navigation'}
            aria-label={isNavigating ? 'Stop Navigation' : 'Start Navigation'}
          >
            <Navigation className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNavigateToCollege}
            className="flex items-center justify-center p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
            title="Navigate to College"
            aria-label="Navigate to College"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleOpenSettings}
            className="flex items-center justify-center p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {isNearCollege && (
        <div className="mb-3 flex items-center justify-center py-1 px-3 bg-green-100 text-green-700 rounded-full text-sm">
          <AlertTriangle className="w-4 h-4 mr-1" />
          <span>Near College</span>
        </div>
      )}
      
      <div className="px-2">
        <SearchDestination />
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
};

export default NavigationBar;
