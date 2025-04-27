
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { playAlarmSound, stopAlarmSound, isAlarmActive } from '@/utils/notificationUtils';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

const SPEED_LIMIT = 60; // km/h
// How long speed must be over limit before alerting (to avoid false alarms)
const THRESHOLD_TIME_MS = 2000;

const SpeedAlert: React.FC = () => {
  const { speedData } = useLocation();
  const [isOverSpeedLimit, setIsOverSpeedLimit] = useState(false);
  
  // Track consecutive overspeed readings
  const overspeedStart = useRef<number | null>(null);
  const alarmTriggeredRef = useRef(false);
  
  // Debounce speed alert to prevent rapid on/off switching
  useEffect(() => {
    // Start counting time when speed exceeds limit
    if (speedData.speed > SPEED_LIMIT && !alarmTriggeredRef.current) {
      if (overspeedStart.current === null) {
        overspeedStart.current = Date.now();
      } else if (Date.now() - overspeedStart.current > THRESHOLD_TIME_MS) {
        // Only trigger alarm if speed is consistently over limit
        setIsOverSpeedLimit(true);
        playAlarmSound();
        alarmTriggeredRef.current = true;
        
        toast.error(`Speed Alert!`, {
          description: `You are exceeding the speed limit (${SPEED_LIMIT} km/h)`,
          duration: Infinity,
        });
      }
    } 
    // Reset when speed is back under limit
    else if (speedData.speed <= SPEED_LIMIT * 0.95) { // Hysteresis to prevent toggling
      overspeedStart.current = null;
      if (isOverSpeedLimit) {
        setIsOverSpeedLimit(false);
        stopAlarmSound();
        alarmTriggeredRef.current = false;
      }
    }
  }, [speedData.speed, isOverSpeedLimit]);

  const handleStopAlarm = useCallback(() => {
    stopAlarmSound();
    setIsOverSpeedLimit(false);
    alarmTriggeredRef.current = false;
    toast.success("Speed alarm disabled", {
      description: "Alarm will trigger again if you exceed speed limit"
    });
  }, []);

  if (!isOverSpeedLimit) return null;
  
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <Button
        variant="destructive"
        size="lg"
        className="flex items-center gap-2 px-6 py-8 text-lg font-bold rounded-full shadow-lg"
        onClick={handleStopAlarm}
      >
        <AlertTriangle className="w-6 h-6" />
        STOP ALARM
      </Button>
    </div>
  );
};

export default SpeedAlert;
