
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { createRouteGeoJson, verifyMapboxToken } from '@/utils/mapboxUtils';
import { School, User } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// Import token from centralized location
import { MAPBOX_TOKEN } from '@/utils/mapboxUtils';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapViewProps {
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const collegeMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  // Track the last update time to throttle updates on mobile
  const lastUpdate = useRef<number>(0);

  const { currentLocation, collegeInfo, isTracking } = useLocation();
  const { route, isNavigating } = useNavigation();
  
  // Check if token is valid
  useEffect(() => {
    const checkToken = async () => {
      const isValid = await verifyMapboxToken();
      if (!isValid) {
        setMapError("Invalid Mapbox token. Please check your token.");
        toast.error("Map loading failed", {
          description: "Unable to validate Mapbox token. Please check your configuration."
        });
      }
    };
    
    checkToken();
  }, []);

  // Optimize map for mobile
  useEffect(() => {
    if (!mapContainer.current || mapError) return;

    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [83.1669508, 17.7097776], // Initial center at Vignan Institute
        zoom: 12,
        attributionControl: false,
        preserveDrawingBuffer: true, // Reduces flickering on some mobile devices
        fadeDuration: isMobile ? 0 : 300, // Disable fade animations on mobile to reduce flickering
        renderWorldCopies: false, // Disable world copies to improve performance
        maxPitch: 60, // Limit pitch to improve performance
        pitchWithRotate: !isMobile, // Disable pitch with rotate on mobile
        antialias: true, // Improve text rendering
        cooperativeGestures: isMobile, // Prevent accidental map movement on mobile
      });

      // Optimize for mobile
      if (isMobile) {
        map.current.dragRotate.disable(); // Disable drag rotation on mobile
        map.current.touchZoomRotate.disableRotation(); // Disable rotation on mobile
        map.current.touchPitch.disable(); // Disable pitch on mobile
      }

      // Add minimal controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: !isMobile,
          showZoom: true,
          visualizePitch: false
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapLoaded(true);
        
        if (!map.current) return;

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#4A90E2',
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        map.current.addSource('college-radius', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [collegeInfo.location.longitude, collegeInfo.location.latitude],
            },
          },
        });

        map.current.addLayer({
          id: 'college-radius',
          type: 'circle',
          source: 'college-radius',
          paint: {
            'circle-radius': {
              stops: [[0, 0], [20, collegeInfo.notificationRadius * 50]],
              base: 2,
            },
            'circle-color': '#8C65AA',
            'circle-opacity': 0.2,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#8C65AA',
          },
        });
      });
      
      // Handle load error events
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        if (e.error && e.error.message) {
          setMapError(e.error.message);
        } else {
          setMapError('Failed to load map. Please check your connection.');
        }
      });

      // Handle style error events
      map.current.on('styledata', (e) => {
        const { status } = map.current?.getStyle() || {};
        if (status === 'error') {
          setMapError('Failed to load map style.');
        }
      });
      
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map. Please try again.');
      toast.error("Map loading failed", {
        description: "Unable to initialize map. Please refresh the page."
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapError]);

  // Add college marker
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (!collegeMarker.current) {
      collegeMarker.current = new mapboxgl.Marker(createCustomMarker('school'))
        .setLngLat([collegeInfo.location.longitude, collegeInfo.location.latitude])
        .addTo(map.current);

      // Use popup only on desktop to improve mobile performance
      if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setLngLat([collegeInfo.location.longitude, collegeInfo.location.latitude])
          .setHTML(`<h3 class="font-bold">Vignan College</h3><p>${collegeInfo.address}</p>`)
          .addTo(map.current);
      }
    }
  }, [mapLoaded, collegeInfo]);

  // Update user marker with throttling for better performance
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const now = Date.now();
    // Improved throttling for mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const throttleTime = isMobile ? 250 : 100; // More aggressive throttling on mobile
    
    if (now - lastUpdate.current < throttleTime) return;
    lastUpdate.current = now;

    const lngLat: [number, number] = [currentLocation.longitude, currentLocation.latitude];

    if (!userMarker.current) {
      userMarker.current = new mapboxgl.Marker(createCustomMarker('user'))
        .setLngLat(lngLat)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(lngLat);
    }

    if (isTracking) {
      // Use flyTo for smoothness but with optimized parameters
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Simple pan for mobile - less smooth but more stable
        map.current.setCenter(lngLat);
      } else {
        // Smooth animation for desktop
        map.current.flyTo({
          center: lngLat,
          essential: true,
          duration: 700,
          speed: 1.8,
        });
      }
    }
  }, [currentLocation, mapLoaded, isTracking]);

  // Update route with optimization
  useEffect(() => {
    if (!mapLoaded || !map.current || !route) return;

    const source = map.current.getSource('route');
    if (source && 'setData' in source) {
      const routeGeoJson = createRouteGeoJson(route);
      source.setData(routeGeoJson);
    }

    if (isNavigating && route.geometry.coordinates.length > 0) {
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
      );

      // Use fitBounds with optimized parameters
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      map.current.fitBounds(bounds, {
        padding: isMobile ? 50 : 100,
        maxZoom: 15,
        duration: isMobile ? 800 : 1500,
        essential: true,
      });
    }
  }, [route, mapLoaded, isNavigating]);

  const createCustomMarker = useCallback((icon: 'school' | 'user') => {
    const el = document.createElement('div');
    el.className = `${icon}-marker`;
    el.style.width = icon === 'school' ? '40px' : '30px';
    el.style.height = icon === 'school' ? '40px' : '30px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = icon === 'school' ? '#8C65AA' : '#1E96FC';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.willChange = 'transform'; // Performance optimization for animations
    el.style.pointerEvents = 'auto'; // Make markers clickable

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'white');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    if (icon === 'school') {
      svg.innerHTML = '<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 5v17"/><path d="M6 5v17"/>';
    } else {
      svg.innerHTML = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
    }

    el.appendChild(svg);
    return el;
  }, []);

  // Display error message if map fails to load
  if (mapError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6 ${className}`} style={{ height: '100%', minHeight: '300px' }}>
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Map loading failed</h3>
        <p className="text-gray-600 text-center mb-4">{mapError}</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-full rounded-lg ${className}`} 
      style={{ minHeight: '300px' }}
    />
  );
};

export default MapView;
