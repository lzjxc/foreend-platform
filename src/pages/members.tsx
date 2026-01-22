import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';
import { usePersons, useDeletePerson } from '@/hooks/use-persons';
import { RELATIONSHIP_OPTIONS, GENDER_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import MemberForm from '@/components/members/member-form';

export default function Members() {
  const navigate = useNavigate();
  const { data: persons, isLoading, error } = usePersons();
  const deletePerson = useDeletePerson();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<string | null>(null);

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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加成员
        </Button>
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
