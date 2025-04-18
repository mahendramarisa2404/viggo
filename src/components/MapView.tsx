
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { createRouteGeoJson } from '@/utils/mapboxUtils';

// Set Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const collegeMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { currentLocation, collegeInfo, isTracking } = useLocation();
  const { route, isNavigating } = useNavigation();

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.2090, 28.6139], // Default center (Delhi)
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocation control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      'top-right'
    );

    // Set map loaded state when map is ready
    map.current.on('load', () => {
      setMapLoaded(true);

      // Add empty route source and layer
      if (map.current) {
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
            'line-color': '#004AAD',
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        // Add college radius visualization
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
              stops: [
                [0, 0],
                [20, collegeInfo.notificationRadius * 50], // Scale radius for zoom level
              ],
              base: 2,
            },
            'circle-color': '#B191D2',
            'circle-opacity': 0.2,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#8C65AA',
          },
        });
      }
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Add college marker
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Add college marker
    if (!collegeMarker.current) {
      const el = document.createElement('div');
      el.className = 'college-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#8C65AA';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';

      collegeMarker.current = new mapboxgl.Marker(el)
        .setLngLat([collegeInfo.location.longitude, collegeInfo.location.latitude])
        .addTo(map.current);

      // Add popup for college
      new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setLngLat([collegeInfo.location.longitude, collegeInfo.location.latitude])
        .setHTML(`<h3>${collegeInfo.name}</h3><p>${collegeInfo.address}</p>`)
        .addTo(map.current);

      // Update college radius source
      const source = map.current.getSource('college-radius');
      if (source && 'setData' in source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [collegeInfo.location.longitude, collegeInfo.location.latitude],
          },
        });
      }
    }
  }, [mapLoaded, collegeInfo]);

  // Update user marker when location changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const lngLat: [number, number] = [currentLocation.longitude, currentLocation.latitude];

    if (!userMarker.current) {
      // Create user marker if it doesn't exist
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#1E96FC';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .addTo(map.current);
    } else {
      // Update existing marker position
      userMarker.current.setLngLat(lngLat);
    }

    // Center map on user if tracking is active
    if (isTracking) {
      map.current.flyTo({
        center: lngLat,
        essential: true,
        speed: 0.5,
      });
    }
  }, [currentLocation, mapLoaded, isTracking]);

  // Update route line when route changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !route) return;

    const source = map.current.getSource('route');
    if (source && 'setData' in source) {
      const routeGeoJson = createRouteGeoJson(route);
      source.setData(routeGeoJson);
    }

    // Fit map to route bounds if navigating
    if (isNavigating && route.geometry.coordinates.length > 0) {
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
      );

      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [route, mapLoaded, isNavigating]);

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default MapView;
