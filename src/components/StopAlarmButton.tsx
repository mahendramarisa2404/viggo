
import React, { useEffect, useState } from 'react';
import { stopAlarmSound, isAlarmActive, addAlarmListener, removeAlarmListener } from '@/utils/notificationUtils';
import { XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from './ui/sonner';

const StopAlarmButton: React.FC = () => {
  const [visible, setVisible] = useState(isAlarmActive);
  const [pulseEffect, setPulseEffect] = useState(false);

  useEffect(() => {
    const onAlarmState = (active: boolean) => {
      setVisible(active);
      if (active) {
        // Add pulse effect when alarm is triggered
        setPulseEffect(true);
      }
    };
    
    addAlarmListener(onAlarmState);
    // Ensure up-to-date if alarm is started before mount
    setVisible(isAlarmActive);

    // Create pulse animation
    const pulseInterval = setInterval(() => {
      if (isAlarmActive) {
        setPulseEffect(prev => !prev);
      }
    }, 1000);

    return () => {
      removeAlarmListener(onAlarmState);
      clearInterval(pulseInterval);
    };
  }, []);

  const handleStop = () => {
    stopAlarmSound();
    toast.success("Alarm stopped", {
      description: "Notifications and vibration have been disabled"
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 transform -translate-x-1/2">
      <Button
        onClick={handleStop}
        className={`bg-red-500 hover:bg-red-600 text-white px-5 py-6 rounded-full shadow-lg 
                    flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400
                    ${pulseEffect ? 'animate-pulse' : ''}`}
        size="lg"
        aria-label="Stop alarm"
      >
        <XCircle className="w-5 h-5" />
        STOP ALARM
      </Button>
    </div>
  );
};

export default StopAlarmButton;
