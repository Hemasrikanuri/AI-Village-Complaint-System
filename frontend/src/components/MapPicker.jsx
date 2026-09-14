import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet marker icon path bug in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onSelect }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

const MapPicker = ({ initialLat = 17.3850, initialLng = 78.4867, onLocationSelect }) => {
  const [position, setPosition] = useState([initialLat, initialLng]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700 relative">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onSelect={onLocationSelect} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs px-3 py-1.5 rounded-md shadow border border-slate-200 dark:border-slate-800 font-mono">
        Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
      </div>
    </div>
  );
};

export default MapPicker;
