import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import StatusBadge from './StatusBadge';

// Helper to create custom color SVG pin icons
const createCustomIcon = (priority, status) => {
  let color = '#2563EB'; // default blue
  if (status === 'RESOLVED') color = '#10B981'; // emerald green
  else if (status === 'REJECTED') color = '#6B7280'; // gray
  else if (priority === 'URGENT') color = '#EF4444'; // red
  else if (priority === 'HIGH') color = '#F97316'; // orange

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const ComplaintHeatmap = ({ complaints = [], center = [17.3850, 78.4867], zoom = 12 }) => {
  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {complaints.map((c) => {
          if (!c.latitude || !c.longitude) return null;
          const icon = createCustomIcon(c.priority, c.status);
          return (
            <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icon}>
              <Popup>
                <div className="p-1 space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary-600">{c.reference_id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 leading-tight">{c.title}</h4>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>📍 <strong>Village:</strong> {c.village_name || c.village?.name || 'N/A'}</p>
                    <p>📂 <strong>Category:</strong> {c.category || c.category_name || 'N/A'}</p>
                    <div className="pt-1">
                      <StatusBadge priority={c.priority} />
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ComplaintHeatmap;
