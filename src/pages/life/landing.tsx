import { useNavigate } from 'react-router-dom';
import { Plane, Home, Hotel } from 'lucide-react';
import { useTravelPlans } from '@/hooks/use-travel';
import { useRentalProperties } from '@/hooks/use-rental';
import { useAccommodationListings } from '@/hooks/use-accommodation';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  iconBg: string;
  countLabel: (n: number) => string;
  count: number | undefined;
}

export default function LifeLanding() {
  const navigate = useNavigate();

  const { data: travelData } = useTravelPlans(1, 1);
  const { data: rentalData } = useRentalProperties(1, 1);
  const { data: accommodationData } = useAccommodationListings(1, 1);

  const modules: ModuleCard[] = [
    {
      id: 'travel',
      title: '旅游计划',
      description: 'AI 生成行程 · 预算估算',
      icon: Plane,
      path: '/life/travel',
      iconBg: 'bg-indigo-500',
      countLabel: (n) => `${n} 个计划`,
      count: travelData?.total,
    },
    {
      id: 'rental',
      title: '找房',
      description: 'Rightmove · 房源搜索追踪',
      icon: Home,
      path: '/life/rental',
      iconBg: 'bg-orange-500',
      countLabel: (n) => `${n} 个房源`,
      count: rentalData?.total,
    },
    {
      id: 'accommodation',
      title: '住宿搜索',
      description: 'Booking · 比价比较',
      icon: Hotel,
      path: '/life/accommodation',
      iconBg: 'bg-green-500',
      countLabel: (n) => `${n} 个住宿`,
      count: accommodationData?.total,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">生活助手</h1>
        <p className="text-sm text-muted-foreground mt-1">life-app</p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => navigate(mod.path)}
              className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-4"
            >
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <div className={`${mod.iconBg} rounded-lg p-2.5 flex-shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{mod.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                </div>
              </div>

              {/* Count */}
              <div className="text-sm text-muted-foreground border-t pt-3">
                {mod.count !== undefined
                  ? mod.countLabel(mod.count)
                  : '加载中...'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
