import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccommodationListing, useVerifyListing } from '@/hooks/use-accommodation';

// ─── Amenity row ─────────────────────────────────────────────────────────────
function AmenityRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? (
        <span className="text-green-600 font-bold text-sm">✓</span>
      ) : (
        <span className="text-muted-foreground text-sm">✗</span>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LifeAccommodationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, isError } = useAccommodationListing(id ?? '');

  const verifyMutation = useVerifyListing();
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const result = await verifyMutation.mutateAsync(id);
      if (result.is_valid === true) {
        toast.success('链接有效');
      } else if (result.is_valid === false) {
        toast.error('链接已失效');
      } else {
        toast.info('验证结果未知');
      }
    } catch {
      toast.error('验证失败，请稍后重试');
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">加载中…</div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="p-6 text-center text-destructive">加载住宿详情失败</div>
    );
  }

  const amenities: { label: string; key: keyof typeof listing }[] = [
    { label: '厨房', key: 'has_kitchen' },
    { label: '免费停车', key: 'has_free_parking' },
    { label: '免费取消', key: 'has_free_cancellation' },
    { label: '免费WiFi', key: 'has_free_wifi' },
    { label: '含早餐', key: 'breakfast_included' },
    { label: '儿童免费入住', key: 'child_stays_free' },
    { label: '泳池', key: 'has_pool' },
    { label: '热水浴缸', key: 'has_hot_tub' },
    { label: '允许宠物', key: 'pets_allowed' },
  ];

  // validity badge
  let validityBadge: React.ReactNode = null;
  if (listing.is_valid === true) {
    validityBadge = (
      <Badge className="bg-green-100 text-green-700 border-green-200">链接有效</Badge>
    );
  } else if (listing.is_valid === false) {
    validityBadge = (
      <Badge className="bg-red-100 text-red-700 border-red-200">链接失效</Badge>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <Link
        to="/life/accommodation"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回住宿列表
      </Link>

      {/* Name + Rating */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{listing.name}</h1>
          {validityBadge}
        </div>
        <div className="flex items-center gap-3">
          {listing.rating != null && (
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              {listing.rating.toFixed(1)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {listing.review_count} 条评论
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">每晚</p>
            <p className="text-xl font-bold">
              {listing.currency ?? '£'}{listing.price_per_night.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">总价</p>
            <p className="text-xl font-bold">
              {listing.currency ?? '£'}{listing.total_price.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Property details */}
      <div className="space-y-2">
        <h2 className="font-semibold text-base">房源信息</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {listing.property_type && (
            <>
              <span className="text-muted-foreground">类型</span>
              <span>{listing.property_type}</span>
            </>
          )}
          {listing.bedrooms != null && (
            <>
              <span className="text-muted-foreground">卧室</span>
              <span>{listing.bedrooms} 间</span>
            </>
          )}
          {listing.bathrooms != null && (
            <>
              <span className="text-muted-foreground">卫浴</span>
              <span>{listing.bathrooms} 间</span>
            </>
          )}
          {listing.sleeps != null && (
            <>
              <span className="text-muted-foreground">可住</span>
              <span>{listing.sleeps} 人</span>
            </>
          )}
          {listing.distance_from_centre && (
            <>
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                距市中心
              </span>
              <span>{listing.distance_from_centre}</span>
            </>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <h2 className="font-semibold text-base">设施</h2>
        <div className="grid grid-cols-2 divide-x divide-border border rounded-lg overflow-hidden">
          <div className="px-4 divide-y divide-border">
            {amenities
              .filter((_, i) => i % 2 === 0)
              .map((a) => (
                <AmenityRow
                  key={a.key}
                  label={a.label}
                  value={Boolean(listing[a.key])}
                />
              ))}
          </div>
          <div className="px-4 divide-y divide-border">
            {amenities
              .filter((_, i) => i % 2 === 1)
              .map((a) => (
                <AmenityRow
                  key={a.key}
                  label={a.label}
                  value={Boolean(listing[a.key])}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleVerify}
          disabled={verifying || verifyMutation.isPending}
        >
          <ShieldCheck className="h-4 w-4 mr-1.5" />
          {verifying || verifyMutation.isPending ? '验证中…' : '验证链接'}
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => window.open(listing.booking_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          打开 Booking
        </Button>
      </div>
    </div>
  );
}
