import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '@/types/life-app';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DayMapProps {
  activities: Activity[];
  city: string;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, positions]);
  return null;
}

function numberIcon(n: number) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: #3b82f6; color: white; border-radius: 50%;
      width: 26px; height: 26px; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 700;
      border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function DayMap({ activities }: DayMapProps) {
  const geoActivities = activities.filter(
    (a) => a.latitude != null && a.longitude != null && a.type !== 'transport'
  );

  if (geoActivities.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground text-center">
        暂无地理坐标数据，
        <span className="text-xs">景点坐标将自动补全</span>
      </div>
    );
  }

  const positions: [number, number][] = geoActivities.map((a) => [
    a.latitude!,
    a.longitude!,
  ]);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ height: 350 }}>
      <MapContainer
        center={positions[0]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {geoActivities.map((act, idx) => (
          <Marker
            key={act.id}
            position={[act.latitude!, act.longitude!]}
            icon={numberIcon(idx + 1)}
          >
            <Popup>
              <div className="text-xs">
                <strong>{act.time} {act.name}</strong>
                {act.address && <p className="mt-0.5 text-gray-500">{act.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '6,8', opacity: 0.6 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
