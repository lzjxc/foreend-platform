import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Users,
  FileText,
  MapPin,
  Building2,
  AlertTriangle,
  RefreshCw,
  Upload,
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

export default function MemberList() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
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
    fetchData();
  }, []);

  const statCards = [
    {
      title: '家庭成员',
      value: stats?.memberCount ?? '-',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: '证件数量',
      value: stats?.documentCount ?? '-',
      icon: FileText,
      color: 'text-green-500',
    },
    {
      title: '地址记录',
      value: stats?.addressCount ?? '-',
      icon: MapPin,
      color: 'text-orange-500',
    },
    {
      title: '银行账户',
      value: stats?.bankAccountCount ?? '-',
      icon: Building2,
      color: 'text-purple-500',
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
          <h2 className="text-lg font-semibold">家庭成员</h2>
          <p className="text-sm text-muted-foreground">
            管理家庭成员信息、证件和地址
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加成员
          </Button>
        </div>
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
          <Card key={stat.title} className="hover:bg-muted/50 transition-colors">
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
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                添加家庭成员
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                添加证件
              </Button>
              <Link to="/form-filling" className="w-full">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  填写表单
                </Button>
              </Link>
              <Link to="/files" className="w-full">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Upload className="h-4 w-4" />
                  文件管理
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            成员列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            连接后端 API 后将显示家庭成员列表
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
