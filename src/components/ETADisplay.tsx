
import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { Clock, MapPin } from 'lucide-react';
import { formatRemainingTime, formatDistance } from '@/utils/mapboxUtils';

const ETADisplay: React.FC = () => {
  const { eta, isNavigating, isLoadingRoute } = useNavigation();

  if (!isNavigating || !eta) {
    return null;
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-md text-center space-y-1 w-full md:w-56 max-w-[250px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-sss-blue">ETA</h3>
        {isLoadingRoute && <div className="text-xs text-gray-500">Updating...</div>}
      </div>

      <div className="flex items-center mb-1">
        <Clock className="w-4 h-4 text-sss-purple mr-2" />
        <div>
          <div className="font-bold text-xl">
            {eta.arrivalTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="text-xs text-gray-600">
            {formatRemainingTime(eta.remainingTime)} remaining
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <MapPin className="w-4 h-4 text-sss-purple mr-2" />
        <div className="text-xs text-gray-600">
          {formatDistance(eta.remainingDistance)} to destination
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;
