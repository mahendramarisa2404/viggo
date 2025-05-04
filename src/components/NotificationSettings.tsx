
import React, { useState, useEffect } from 'react';
import { 
  getSoundMuted, 
  setSoundMuted, 
  getVibrationIntensity, 
  setVibrationIntensity 
} from '@/utils/notificationUtils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, VolumeX, Vibrate } from 'lucide-react';

const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(!getSoundMuted());
  const [vibrationIntensity, setVibIntensity] = useState(getVibrationIntensity());

  // Update settings when changed
  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    setSoundMuted(!checked);
  };

  const handleVibrationChange = (value: number[]) => {
    const intensity = value[0];
    setVibIntensity(intensity);
    setVibrationIntensity(intensity);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </h3>
        <p className="text-sm text-gray-500">
          Configure how you want to be notified during navigation
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {soundEnabled ? (
              <Volume2 className="h-5 w-5 text-gray-600" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-600" />
            )}
            <Label htmlFor="sound-toggle" className="font-medium">
              Notification Sounds
            </Label>
          </div>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={handleSoundToggle}
          />
        </div>
        
        {/* Vibration intensity slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Vibrate className="h-5 w-5 text-gray-600" />
              <Label htmlFor="vibration-slider" className="font-medium">
                Vibration Intensity
              </Label>
            </div>
            <span className="text-sm text-gray-500">
              {Math.round(vibrationIntensity * 100)}%
            </span>
          </div>
          <Slider
            id="vibration-slider"
            defaultValue={[vibrationIntensity]}
            max={1}
            step={0.01}
            value={[vibrationIntensity]}
            onValueChange={handleVibrationChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Off</span>
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>
      
      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 mt-4">
        <p>Notifications may require permission from your browser and device settings.</p>
      </div>
    </div>
  );
};

export default NotificationSettings;
