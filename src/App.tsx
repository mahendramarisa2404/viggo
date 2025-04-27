
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocationProvider } from "./contexts/LocationContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { MapboxTokenProvider } from "./contexts/MapboxTokenContext";
import MapPage from "./pages/MapPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MapboxTokenProvider>
        <LocationProvider>
          <NavigationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MapPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NavigationProvider>
        </LocationProvider>
      </MapboxTokenProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
