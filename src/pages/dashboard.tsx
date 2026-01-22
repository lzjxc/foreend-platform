import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  MapPin,
  Building2,
  AlertTriangle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface DashboardStats {
  memberCount: number;
  documentCount: number;
  addressCount: number;
  bankAccountCount: number;
}

interface ExpiringDocument {
  id: string;
  personName: string;
  type: string;
  number: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch persons list (API returns { success, data, message } wrapper)
      const personsResponse = await apiClient.get('/api/v1/persons');
      const persons = personsResponse.data?.data || [];

      let documentCount = 0;
      let addressCount = 0;
      let bankAccountCount = 0;
      const expiring: ExpiringDocument[] = [];

      // For each person, fetch their related data
      for (const person of persons) {
        try {
          // Fetch documents (API returns { success, data, message } wrapper)
          const docsResponse = await apiClient.get(`/api/v1/persons/${person.id}/documents`);
          const docs = docsResponse.data?.data || [];
          documentCount += docs.length;

          // Check for expiring documents (within 90 days)
          const now = new Date();
          for (const doc of docs) {
            if (doc.expiry_date) {
              const expiryDate = new Date(doc.expiry_date);
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
                expiring.push({
                  id: doc.id,
                  personName: person.name,
                  type: doc.type,
                  number: doc.number ? `****${doc.number.slice(-4)}` : '****',
                  expiryDate: doc.expiry_date,
                  daysUntilExpiry,
                });
              }
            }
          }

          // Fetch addresses
          const addressesResponse = await apiClient.get(`/api/v1/persons/${person.id}/addresses`);
          addressCount += (addressesResponse.data?.data || []).length;

          // Fetch bank accounts
          const bankResponse = await apiClient.get(`/api/v1/persons/${person.id}/bank-accounts`);
          bankAccountCount += (bankResponse.data?.data || []).length;
        } catch {
          // Continue with other persons if one fails
        }
      }

      setStats({
        memberCount: persons.length,
        documentCount,
        addressCount,
        bankAccountCount,
      });

      // Sort expiring docs by days until expiry
      setExpiringDocs(expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: '家庭成员',
      value: stats?.memberCount ?? '-',
      icon: Users,
      color: 'text-blue-500',
      href: '/members',
    },
    {
      title: '证件数量',
      value: stats?.documentCount ?? '-',
      icon: FileText,
      color: 'text-green-500',
      href: '/documents',
    },
    {
      title: '地址记录',
      value: stats?.addressCount ?? '-',
      icon: MapPin,
      color: 'text-orange-500',
      href: '/addresses',
    },
    {
      title: '银行账户',
      value: stats?.bankAccountCount ?? '-',
      icon: Building2,
      color: 'text-purple-500',
      href: '/bank-accounts',
    },
  ];

  const documentTypeLabels: Record<string, string> = {
    id_card: '身份证',
    passport: '护照',
    driver_license: '驾驶证',
    birth_certificate: '出生证明',
    household_register: '户口本',
    marriage_cert: '结婚证',
    other: '其他',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">仪表盘</h2>
          <p className="text-sm text-muted-foreground">
            个人信息管理概览
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">加载失败: {error}</p>
            <p className="text-sm text-muted-foreground mt-1">
              请确保后端 API 服务正常运行
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiring Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              即将过期的证件
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : expiringDocs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                暂无即将过期的证件 ✓
              </p>
            ) : (
              <div className="space-y-3">
                {expiringDocs.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {doc.personName} - {documentTypeLabels[doc.type] || doc.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {doc.number} · 过期日期: {doc.expiryDate}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${
                      doc.daysUntilExpiry <= 30 ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      {doc.daysUntilExpiry} 天后过期
                    </span>
                  </div>
                ))}
                {expiringDocs.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    还有 {expiringDocs.length - 5} 个证件即将过期
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/members">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  添加家庭成员
                </Button>
              </Link>
              <Link to="/documents">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  管理证件
                </Button>
              </Link>
              <Link to="/addresses">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MapPin className="h-4 w-4" />
                  管理地址
                </Button>
              </Link>
              <Link to="/bank-accounts">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Building2 className="h-4 w-4" />
                  管理银行账户
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
