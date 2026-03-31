import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, ScaleControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity, Accommodation } from '@/types/life-app';

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
  accommodation?: Accommodation | null;
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

function labelIcon(label: string, color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color}; color: white; border-radius: 4px;
      padding: 2px 6px; font-size: 11px; font-weight: 700;
      border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      white-space: nowrap;
    ">${label}</div>`,
    iconSize: [40, 22],
    iconAnchor: [20, 11],
  });
}

export default function DayMap({ activities, accommodation }: DayMapProps) {
  const geoActivities = activities.filter(
    (a) => a.latitude != null && a.longitude != null && a.type !== 'transport'
  );

  const hasAccGeo = accommodation?.latitude != null && accommodation?.longitude != null;

  if (geoActivities.length === 0 && !hasAccGeo) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground text-center">
        暂无地理坐标数据，
        <span className="text-xs">景点坐标将自动补全</span>
      </div>
    );
  }

  const positions: [number, number][] = [];

  // Start: accommodation
  if (hasAccGeo) {
    positions.push([accommodation!.latitude!, accommodation!.longitude!]);
  }

  // Activities
  for (const a of geoActivities) {
    positions.push([a.latitude!, a.longitude!]);
  }

  // End: back to accommodation
  if (hasAccGeo) {
    positions.push([accommodation!.latitude!, accommodation!.longitude!]);
  }

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
        <ScaleControl position="bottomleft" metric imperial={false} />

        {/* Accommodation marker */}
        {hasAccGeo && (
          <Marker
            position={[accommodation!.latitude!, accommodation!.longitude!]}
            icon={labelIcon('住宿', '#10b981')}
          >
            <Tooltip permanent direction="right" offset={[16, 0]} className="marker-tooltip">
              <span style={{ fontSize: 11, fontWeight: 500 }}>{accommodation!.name ?? '住宿'}</span>
            </Tooltip>
          </Marker>
        )}

        {/* Activity markers */}
        {geoActivities.map((act, idx) => (
          <Marker
            key={act.id}
            position={[act.latitude!, act.longitude!]}
            icon={numberIcon(idx + 1)}
          >
            <Tooltip permanent direction="right" offset={[12, 0]} className="marker-tooltip">
              <span style={{ fontSize: 11, fontWeight: 500 }}>{act.name}</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Route polyline: accommodation → activities → accommodation */}
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
