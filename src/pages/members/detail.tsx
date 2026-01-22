import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MemberDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">成员详情</h2>

      <Card>
        <CardHeader>
          <CardTitle>成员 ID: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            连接后端 API 后将显示成员详细信息
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
