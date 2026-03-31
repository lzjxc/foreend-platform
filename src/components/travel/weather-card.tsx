import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';
import type { WeatherData } from '@/hooks/use-travel';

function WeatherIcon({ descriptions }: { descriptions: string[] }) {
  const text = descriptions.join(' ').toLowerCase();
  if (text.includes('雨') || text.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-500" />;
  if (text.includes('云') || text.includes('cloud') || text.includes('阴')) return <Cloud className="w-5 h-5 text-gray-400" />;
  return <Sun className="w-5 h-5 text-yellow-500" />;
}

export default function WeatherCard({ weather }: { weather: WeatherData }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3">
      <WeatherIcon descriptions={weather.descriptions} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="font-medium">
          {weather.temp_min}°C ~ {weather.temp_max}°C
        </span>
        <span className="text-muted-foreground">
          {weather.descriptions.join('、')}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Droplets className="w-3.5 h-3.5" />
          {weather.rain_probability}%
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Wind className="w-3.5 h-3.5" />
          {weather.wind_speed} m/s
        </span>
      </div>
    </div>
  );
}
