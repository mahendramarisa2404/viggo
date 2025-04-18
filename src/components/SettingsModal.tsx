
import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { X, Save } from 'lucide-react';
import { CollegeInfo } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { collegeInfo: currentCollegeInfo } = useLocation();
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo>(currentCollegeInfo);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'latitude' || name === 'longitude') {
      setCollegeInfo({
        ...collegeInfo,
        location: {
          ...collegeInfo.location,
          [name]: parseFloat(value),
        },
      });
    } else if (name === 'notificationRadius') {
      setCollegeInfo({
        ...collegeInfo,
        [name]: parseInt(value, 10),
      });
    } else {
      setCollegeInfo({
        ...collegeInfo,
        [name]: value,
      });
    }
  };

  const { updateCollegeInfo } = useLocation();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update college info in context
    updateCollegeInfo(collegeInfo);
    
    // In a full implementation, we would also save to persistent storage
    console.log('Updated college info:', collegeInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-sss-blue">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                College Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={collegeInfo.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                College Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={collegeInfo.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  step="any"
                  value={collegeInfo.location.latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  step="any"
                  value={collegeInfo.location.longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="notificationRadius" className="block text-sm font-medium text-gray-700 mb-1">
                Notification Radius (meters)
              </label>
              <input
                type="number"
                id="notificationRadius"
                name="notificationRadius"
                min="100"
                max="5000"
                value={collegeInfo.notificationRadius}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-sss-blue hover:bg-opacity-90"
            >
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
