
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { createRouteGeoJson } from '@/utils/mapboxUtils';
import { School, User } from 'lucide-react';

// Set a default token, but we will let this be overridable through context
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapView: React.FC = () => {
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

  // Optimize map for mobile
  useEffect(() => {
    if (!mapContainer.current) return;

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
      });

      // Optimize for mobile
      if (isMobile) {
        map.current.dragRotate.disable(); // Disable drag rotation on mobile
        map.current.touchZoomRotate.disableRotation(); // Disable rotation on mobile
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

      // Add error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Error loading map');
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);

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

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Could not initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

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

  // Update user marker with improved throttling for better performance
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const now = Date.now();
    // Enhanced throttling for smoother performance
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
      // Use jumpTo instead of easeTo for smoother tracking on mobile
      if (isMobile) {
        map.current.jumpTo({
          center: lngLat,
        });
      } else {
        map.current.easeTo({
          center: lngLat,
          essential: true,
          duration: 300,
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

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      // Use different animation settings based on device
      map.current.fitBounds(bounds, {
        padding: isMobile ? 50 : 100,
        maxZoom: 15,
        duration: isMobile ? 500 : 1500, // Shorter duration on mobile for responsiveness
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

  // Display a loading or error state
  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">{mapError}</p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Reload Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default MapView;
