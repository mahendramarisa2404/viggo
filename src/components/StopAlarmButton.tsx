
import React, { useEffect, useState } from 'react';
import { stopAlarmSound, isAlarmActive, addAlarmListener, removeAlarmListener } from '@/utils/notificationUtils';
import { XCircle } from 'lucide-react';

const StopAlarmButton: React.FC = () => {
  const [visible, setVisible] = useState(isAlarmActive);

  useEffect(() => {
    const onAlarmState = (active: boolean) => setVisible(active);
    addAlarmListener(onAlarmState);
    // Ensure up-to-date if alarm is started before mount
    setVisible(isAlarmActive);

    return () => {
      removeAlarmListener(onAlarmState);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 transform -translate-x-1/2">
      <button
        onClick={stopAlarmSound}
        className="bg-sss-purple text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-sss-blue focus:outline-none focus:ring-2 focus:ring-sss-blue"
        aria-label="Stop alarm"
      >
        <XCircle className="w-5 h-5" />
        Stop Alarm
      </button>
    </div>
  );
};

export default StopAlarmButton;
