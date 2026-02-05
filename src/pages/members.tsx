import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Search,
  Calendar,
  Edit,
  Trash2,
  FileText,
  MapPin,
  Building2,
  AlertTriangle,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { usePersons, useDeletePerson } from '@/hooks/use-persons';
import { RELATIONSHIP_OPTIONS, GENDER_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import MemberForm from '@/components/members/member-form';
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

export default function Members() {
  const navigate = useNavigate();
  const { data: persons, isLoading, error, refetch } = usePersons();
  const deletePerson = useDeletePerson();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const personsResponse = await apiClient.get('/api/v1/persons');
      const personsList = personsResponse.data?.data || [];

      let documentCount = 0;
      let addressCount = 0;
      let bankAccountCount = 0;
      const expiring: ExpiringDocument[] = [];

      for (const person of personsList) {
        try {
          const docsResponse = await apiClient.get(`/api/v1/persons/${person.id}/documents`);
          const docs = docsResponse.data?.data || [];
          documentCount += docs.length;

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

          const addressesResponse = await apiClient.get(`/api/v1/persons/${person.id}/addresses`);
          addressCount += (addressesResponse.data?.data || []).length;

          const bankResponse = await apiClient.get(`/api/v1/persons/${person.id}/bank-accounts`);
          bankAccountCount += (bankResponse.data?.data || []).length;
        } catch {
          // Continue with other persons if one fails
        }
      }

      setStats({
        memberCount: personsList.length,
        documentCount,
        addressCount,
        bankAccountCount,
      });
      setExpiringDocs(expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry));
    } catch {
      // Stats loading failed silently
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefreshAll = () => {
    refetch();
    fetchStats();
  };

  const statCards = [
    { title: '家庭成员', value: stats?.memberCount ?? '-', icon: Users, color: 'text-blue-500' },
    { title: '证件数量', value: stats?.documentCount ?? '-', icon: FileText, color: 'text-green-500' },
    { title: '地址记录', value: stats?.addressCount ?? '-', icon: MapPin, color: 'text-orange-500' },
    { title: '银行账户', value: stats?.bankAccountCount ?? '-', icon: Building2, color: 'text-purple-500' },
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

  const filteredPersons = persons?.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRelationshipLabel = (value: string) => {
    return RELATIONSHIP_OPTIONS.find((opt) => opt.value === value)?.label || value;
  };

  const getGenderLabel = (value: string) => {
    return GENDER_OPTIONS.find((opt) => opt.value === value)?.label || value;
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`确定要删除 "${name}" 吗？此操作不可撤销。`)) {
      await deletePerson.mutateAsync(id);
    }
  };

  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            家庭成员
          </h2>
          <p className="text-sm text-muted-foreground">
            共 {persons?.length || 0} 位成员
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isLoading || statsLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || statsLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加成员
          </Button>
        </div>
      </div>

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
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Documents & Quick Actions */}
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
            {statsLoading ? (
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
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setShowForm(true)}>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索姓名、昵称或关系..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-md border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Member List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-destructive">加载失败: {error.message}</p>
          </CardContent>
        </Card>
      ) : filteredPersons?.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? '未找到匹配的成员' : '暂无家庭成员，点击"添加成员"开始'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPersons?.map((person) => {
            const age = calculateAge(person.birth_date);
            return (
              <Card
                key={person.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/members/${person.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className={cn(
                          'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white',
                          person.gender === 'male'
                            ? 'bg-blue-500'
                            : person.gender === 'female'
                            ? 'bg-pink-500'
                            : 'bg-gray-500'
                        )}
                      >
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt={person.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          person.name.charAt(0)
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-semibold">{person.name}</h3>
                        {person.nickname && (
                          <p className="text-sm text-muted-foreground">
                            {person.nickname}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">
                            {getRelationshipLabel(person.relationship)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getGenderLabel(person.gender)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPerson(person.id);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(person.id, person.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {person.birth_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {person.birth_date}
                        {age !== null && ` (${age}岁)`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Member Form Dialog */}
      {showForm && (
        <MemberForm
          personId={editingPerson}
          onClose={() => {
            setShowForm(false);
            setEditingPerson(null);
          }}
        />
      )}
    </div>
  );
}
