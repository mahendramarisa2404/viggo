import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { createRouteGeoJson } from '@/utils/mapboxUtils';
import { School, User } from 'lucide-react';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const collegeMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { currentLocation, collegeInfo, isTracking } = useLocation();
  const { route, isNavigating } = useNavigation();

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.2090, 28.6139],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
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
          'line-dasharray': [1, 1],
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

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (!collegeMarker.current) {
      collegeMarker.current = new mapboxgl.Marker(createCustomMarker('school'))
        .setLngLat([collegeInfo.location.longitude, collegeInfo.location.latitude])
        .addTo(map.current);

      new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setLngLat([collegeInfo.location.longitude, collegeInfo.location.latitude])
        .setHTML(`<h3 class="font-bold">Vignan College</h3><p>${collegeInfo.address}</p>`)
        .addTo(map.current);
    }
  }, [mapLoaded, collegeInfo]);

  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const lngLat: [number, number] = [currentLocation.longitude, currentLocation.latitude];

    if (!userMarker.current) {
      userMarker.current = new mapboxgl.Marker(createCustomMarker('user'))
        .setLngLat(lngLat)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(lngLat);
    }

    if (isTracking) {
      map.current.flyTo({
        center: lngLat,
        essential: true,
        speed: 0.5,
      });
    }
  }, [currentLocation, mapLoaded, isTracking]);

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

      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [route, mapLoaded, isNavigating]);

  const createCustomMarker = (icon: 'school' | 'user') => {
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
  };

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default MapView;
