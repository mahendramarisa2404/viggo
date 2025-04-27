
import React, { useEffect, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { playAlarmSound, stopAlarmSound, isAlarmActive } from '@/utils/notificationUtils';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

const SPEED_LIMIT = 60; // km/h

const SpeedAlert: React.FC = () => {
  const { speedData } = useLocation();
  const [isOverSpeedLimit, setIsOverSpeedLimit] = useState(false);

  useEffect(() => {
    if (speedData.speed > SPEED_LIMIT && !isOverSpeedLimit) {
      setIsOverSpeedLimit(true);
      playAlarmSound();
      toast.error(`Speed Alert!`, {
        description: `You are exceeding the speed limit (${SPEED_LIMIT} km/h)`,
        duration: Infinity,
      });
    } else if (speedData.speed <= SPEED_LIMIT && isOverSpeedLimit) {
      setIsOverSpeedLimit(false);
      stopAlarmSound();
    }
  }, [speedData.speed, isOverSpeedLimit]);

  return isOverSpeedLimit ? (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <Button
        variant="destructive"
        size="lg"
        className="flex items-center gap-2 px-6 py-8 text-lg font-bold rounded-full shadow-lg"
        onClick={() => {
          stopAlarmSound();
          setIsOverSpeedLimit(false);
        }}
      >
        <AlertTriangle className="w-6 h-6" />
        STOP ALARM
      </Button>
    </div>
  ) : null;
};

export default SpeedAlert;
