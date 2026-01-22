import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export default function MemberList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">家庭成员</h2>
          <p className="text-sm text-muted-foreground">
            管理家庭成员信息
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加成员
        </Button>
      </div>

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
