
import React from 'react';
import { MapPin, WifiOff } from 'lucide-react';

interface LocationFallbackProps {
  error?: string;
  onRetry: () => void;
}

const LocationFallback: React.FC<LocationFallbackProps> = ({ 
  error = "Location services are unavailable",
  onRetry 
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="mb-6 p-4 bg-sss-light-purple bg-opacity-20 rounded-full">
        {error.includes('permission') ? (
          <MapPin className="w-12 h-12 text-sss-purple" />
        ) : (
          <WifiOff className="w-12 h-12 text-sss-purple" />
        )}
      </div>
      
      <h2 className="text-2xl font-bold text-sss-blue mb-2">Location Unavailable</h2>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {error}
      </p>
      
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-sss-blue text-white rounded-md shadow-sm hover:bg-opacity-90 transition-opacity"
      >
        Try Again
      </button>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-md">
        <h3 className="font-semibold text-sss-blue mb-2">Troubleshooting Tips:</h3>
        <ul className="text-sm text-left text-gray-600 space-y-2">
          <li>• Check if location services are enabled on your device</li>
          <li>• Allow location access for this app in your browser settings</li>
          <li>• Try refreshing the page</li>
          <li>• Check your internet connection</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationFallback;
