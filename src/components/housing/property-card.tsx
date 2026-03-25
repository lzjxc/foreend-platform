import { motion } from 'framer-motion';
import { Home, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/types/housing';
import { PROPERTY_TYPE_LABELS } from '@/types/housing';
import { formatDate } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => void;
}

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
  const navigate = useNavigate();

  const activeTenancy = property.tenancies?.find((t) => t.status === 'active');
  const hasActive = !!activeTenancy;

  const unpaidBills = activeTenancy
    ? activeTenancy.utilities.flatMap((u) => u.bills).filter((b) => !b.paid).length
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`rounded-lg border bg-card p-4 shadow-sm cursor-pointer transition-shadow hover:shadow-md ${
        !hasActive ? 'opacity-70' : ''
      }`}
      onClick={() => navigate(`/life/housing/${property.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Home className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{property.address_line1}</h3>
            <p className="text-xs text-muted-foreground">
              {property.city} · {property.postcode} · {PROPERTY_TYPE_LABELS[property.property_type]}
              {property.bedrooms ? ` · ${property.bedrooms} bed` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={hasActive ? 'default' : 'secondary'} className={hasActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
            {hasActive ? 'Active' : 'Ended'}
          </Badge>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit?.(property); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete?.(property.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {activeTenancy && (
        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span>💷 £{activeTenancy.rent_pcm?.toLocaleString()}/月</span>
          {activeTenancy.agent_name && <span>🏢 {activeTenancy.agent_name}</span>}
          {activeTenancy.start_date && activeTenancy.end_date && (
            <span>
              📅 {formatDate(activeTenancy.start_date, 'yyyy-MM')} → {formatDate(activeTenancy.end_date, 'yyyy-MM')}
            </span>
          )}
          {unpaidBills > 0 && (
            <span className="flex items-center gap-1 font-medium text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {unpaidBills} unpaid
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
