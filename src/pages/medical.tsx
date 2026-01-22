import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';

export default function Medical() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            医疗信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            连接后端 API 后将显示医疗记录
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
