
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
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-sss-blue">ETA</h3>
        {isLoadingRoute && <div className="text-xs text-gray-500">Updating...</div>}
      </div>

      <div className="flex items-center mb-2">
        <Clock className="w-5 h-5 text-sss-purple mr-2" />
        <div>
          <div className="font-bold text-xl">
            {eta.arrivalTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="text-sm text-gray-600">
            {formatRemainingTime(eta.remainingTime)} remaining
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <MapPin className="w-5 h-5 text-sss-purple mr-2" />
        <div className="text-sm text-gray-600">
          {formatDistance(eta.remainingDistance)} to destination
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;
