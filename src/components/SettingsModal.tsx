
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, MapPin } from 'lucide-react';
import NotificationSettings from './NotificationSettings';
import { useNavigation } from '@/contexts/NavigationContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { clearNavigationHistory } = useNavigation();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </DialogTitle>
          <DialogDescription>
            Configure your navigation and notification preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Navigation</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="mt-4">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="navigation" className="mt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Navigation Settings
                </h3>
                <p className="text-sm text-gray-500">
                  Manage your navigation history and preferences
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <h4 className="text-sm font-medium mb-2">Navigation History</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Clear your navigation history to remove all previously searched destinations.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={clearNavigationHistory}
                  >
                    Clear History
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
