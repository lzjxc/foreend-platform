import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Loader2 } from 'lucide-react';
import {
  usePerson,
  useCreatePerson,
  useUpdatePerson,
} from '@/hooks/use-persons';
import { RELATIONSHIP_OPTIONS, GENDER_OPTIONS } from '@/types';

const personSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  nickname: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  birth_date: z.string().optional(),
  relationship: z.string().min(1, '请选择关系'),
  avatar_url: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type PersonFormData = z.infer<typeof personSchema>;

interface MemberFormProps {
  personId?: string | null;
  onClose: () => void;
}

export default function MemberForm({ personId, onClose }: MemberFormProps) {
  const isEditing = !!personId;
  const { data: person, isLoading: isLoadingPerson } = usePerson(personId || '');
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      name: '',
      nickname: '',
      gender: 'male',
      birth_date: '',
      relationship: 'self',
      avatar_url: '',
      notes: '',
    },
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (person && isEditing) {
      reset({
        name: person.name,
        nickname: person.nickname || '',
        gender: person.gender,
        birth_date: person.birth_date || '',
        relationship: person.relationship,
        avatar_url: person.avatar_url || '',
        notes: person.notes || '',
      });
    }
  }, [person, isEditing, reset]);

  const onSubmit = async (data: PersonFormData) => {
    try {
      // Clean up empty strings
      const cleanData = {
        ...data,
        nickname: data.nickname || undefined,
        birth_date: data.birth_date || undefined,
        avatar_url: data.avatar_url || undefined,
        notes: data.notes || undefined,
      };

      if (isEditing && personId) {
        await updatePerson.mutateAsync({ id: personId, data: cleanData });
      } else {
        await createPerson.mutateAsync(cleanData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save person:', error);
    }
  };

  if (isEditing && isLoadingPerson) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md">
          <CardContent className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? '编辑成员' : '添加成员'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">
                姓名 <span className="text-destructive">*</span>
              </label>
              <input
                {...register('name')}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入姓名"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label className="text-sm font-medium">昵称</label>
              <input
                {...register('nickname')}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入昵称（可选）"
              />
            </div>

            {/* Gender & Relationship */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  性别 <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('gender')}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  关系 <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('relationship')}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.relationship && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.relationship.message}
                  </p>
                )}
              </div>
            </div>

            {/* Birth Date */}
            <div>
              <label className="text-sm font-medium">出生日期</label>
              <input
                {...register('birth_date')}
                type="date"
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="text-sm font-medium">头像 URL</label>
              <input
                {...register('avatar_url')}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
              {errors.avatar_url && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.avatar_url.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">备注</label>
              <textarea
                {...register('notes')}
                className="mt-1 min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="备注信息（可选）"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '保存' : '添加'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
