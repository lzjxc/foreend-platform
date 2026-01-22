import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  CreditCard,
  Phone,
  Edit,
  User,
} from 'lucide-react';
import { usePerson } from '@/hooks/use-persons';
import { usePersonDocuments } from '@/hooks/use-documents';
import { usePersonAddresses } from '@/hooks/use-addresses';
import { usePersonBankAccounts } from '@/hooks/use-bank-accounts';
import { usePersonContacts } from '@/hooks/use-contacts';
import { RELATIONSHIP_OPTIONS, GENDER_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import MemberForm from '@/components/members/member-form';
import ContactsTab from '@/components/contacts/contacts-tab';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: person, isLoading: isLoadingPerson, isRefetching, error } = usePerson(id || '');
  const { data: documents } = usePersonDocuments(id || '');
  const { data: addresses } = usePersonAddresses(id || '');
  const { data: bankAccounts } = usePersonBankAccounts(id || '');
  const { data: contacts } = usePersonContacts(id || '');

  const getRelationshipLabel = (value: string) => {
    return RELATIONSHIP_OPTIONS.find((opt) => opt.value === value)?.label || value;
  };

  const getGenderLabel = (value: string) => {
    return GENDER_OPTIONS.find((opt) => opt.value === value)?.label || value;
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

  if (isLoadingPerson || (isRefetching && !person)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-destructive">
              {error ? `加载失败: ${error.message}` : '成员不存在'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const age = calculateAge(person.birth_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回成员列表
        </Button>
        <Button onClick={() => setShowEditForm(true)}>
          <Edit className="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div
              className={cn(
                'flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-4xl font-semibold text-white',
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
                person.name?.charAt(0) || '?'
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{person.name}</h1>
              {person.nickname && (
                <p className="text-muted-foreground">{person.nickname}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{getRelationshipLabel(person.relationship)}</Badge>
                <Badge variant="secondary">{getGenderLabel(person.gender)}</Badge>
                {person.birth_date && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {person.birth_date}
                    {age !== null && ` (${age}岁)`}
                  </span>
                )}
              </div>
              {person.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{person.notes}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Phone className="h-4 w-4" />
            联系方式
            {contacts && contacts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {contacts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/documents')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{documents?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">证件</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/addresses')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <MapPin className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{addresses?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">地址</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/bank-accounts')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <CreditCard className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{bankAccounts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">银行账户</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {}}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Phone className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{contacts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">联系方式</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <ContactsTab personId={id || ''} />
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      {showEditForm && (
        <MemberForm
          personId={id}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
