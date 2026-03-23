import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRentalProperty } from '@/hooks/use-rental';

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function LifeRentalDetail() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: property, isLoading, isError } = useRentalProperty(propertyId ?? '');

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20 text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="p-6 space-y-4">
        <Link
          to="/life/rental"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回房源列表
        </Link>
        <p className="text-sm text-red-500">无法加载房源详情，请稍后重试。</p>
      </div>
    );
  }

  const overBudget = property.price_pcm > 2800;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/life/rental"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回房源列表
        </Link>
      </div>

      {/* Price header */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className={`text-3xl font-bold ${overBudget ? 'text-orange-600' : 'text-green-600'}`}>
            £{property.price_pcm.toLocaleString()}/月
          </span>
          {property.price_pw != null && (
            <span className="text-base text-muted-foreground">
              £{property.price_pw.toLocaleString()}/周
            </span>
          )}
          <Badge
            variant="outline"
            className={`text-xs ${overBudget ? 'border-orange-300 text-orange-600' : 'border-green-300 text-green-600'}`}
          >
            {overBudget ? '超出预算' : '预算内'}
          </Badge>
        </div>
        <p className="text-base text-foreground">{property.address}</p>
      </div>

      {/* Info grid */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">房源信息</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="房屋类型" value={property.property_type} />
            <InfoRow label="卧室" value={property.bedrooms ? `${property.bedrooms} 间` : null} />
            <InfoRow label="浴室" value={property.bathrooms ? `${property.bathrooms} 间` : null} />
            <InfoRow label="面积" value={property.size_sqft ? `${property.size_sqft} sqft` : null} />
            <InfoRow label="装修状态" value={property.furnish_type} />
            <InfoRow label="EPC 评级" value={property.epc_rating} />
            <InfoRow label="市政税级别" value={property.council_tax_band} />
            <InfoRow label="最近地铁站" value={property.nearest_station} />
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      {(property.available_date || property.deposit || property.min_tenancy) && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">租赁条款</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="可入住日期" value={property.available_date} />
              <InfoRow label="押金" value={property.deposit} />
              <InfoRow label="最短租期" value={property.min_tenancy} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">配套设施</h2>
          <div className="space-y-2">
            <BoolRow label="花园" value={property.has_garden} />
            <BoolRow label="停车位" value={property.has_parking} />
          </div>
        </CardContent>
      </Card>

      {/* Key features */}
      {property.key_features && property.key_features.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">房源亮点</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              {property.key_features.map((feat, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {feat}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {property.description && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">描述</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {property.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Agent */}
      {(property.agent_name || property.agent_phone) && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">中介信息</h2>
            <div className="space-y-1">
              {property.agent_name && (
                <p className="text-sm font-medium">{property.agent_name}</p>
              )}
              {property.agent_phone && (
                <p className="text-sm text-muted-foreground">{property.agent_phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Rightmove */}
      <Button
        className="w-full"
        variant="outline"
        onClick={() => window.open(property.source_url, '_blank')}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        打开 Rightmove
      </Button>
    </div>
  );
}
