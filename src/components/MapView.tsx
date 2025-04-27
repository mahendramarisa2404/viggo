
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { createRouteGeoJson } from '@/utils/mapboxUtils';
import { School, User } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const collegeMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // Track the last update time to throttle updates on mobile
  const lastUpdate = useRef<number>(0);

  const { currentLocation, collegeInfo, isTracking } = useLocation();
  const { route, isNavigating } = useNavigation();

  // Optimize map for mobile
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

    map.current.on('load', () => {
      setMapLoaded(true);

      map.current?.addSource('route', {
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

      map.current?.addLayer({
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

      map.current?.addSource('college-radius', {
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

      map.current?.addLayer({
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

  // Update user marker with throttling for better performance
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const now = Date.now();
    // Throttle updates on mobile to avoid flickering
    if (now - lastUpdate.current < 150) return;
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
      // Use easeTo instead of flyTo for smoother animation on mobile
      map.current.easeTo({
        center: lngLat,
        essential: true,
        duration: 500,
      });
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

      // Use longer duration for smoother animation
      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15,
        duration: 1500,
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

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default MapView;
