import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  Database, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  Play,
  RefreshCw
} from "lucide-react";
import { projectId } from "../utils/supabase/info";

export function DatabaseSetupHelper() {
  const [tableName, setTableName] = useState('kv_store_79e634f3');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    exists: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const defaultCreateSQL = `-- Smart HACCP KV Store 테이블 생성
CREATE TABLE IF NOT EXISTS kv_store_79e634f3 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_79e634f3(key);
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON kv_store_79e634f3(created_at);

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kv_store_updated_at BEFORE UPDATE
ON kv_store_79e634f3 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

  const checkTableExists = async () => {
    setIsChecking(true);
    setCheckResult(null);
    
    try {
      // Supabase REST API를 통해 테이블 존재 확인 시도
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/${tableName}?select=key&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setCheckResult({
          exists: true,
          message: `테이블 '${tableName}'이 존재합니다.`,
          details: "테이블이 정상적으로 접근 가능합니다."
        });
      } else if (response.status === 404) {
        setCheckResult({
          exists: false,
          message: `테이블 '${tableName}'이 존재하지 않습니다.`,
          details: "아래 SQL을 실행하여 테이블을 생성해야 합니다."
        });
      } else {
        setCheckResult({
          exists: false,
          message: `테이블 확인 중 오류가 발생했습니다 (${response.status}).`,
          details: "권한 문제이거나 테이블이 존재하지 않을 수 있습니다."
        });
      }
    } catch (error) {
      setCheckResult({
        exists: false,
        message: "테이블 확인 중 네트워크 오류가 발생했습니다.",
        details: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openSupabaseDashboard = () => {
    window.open(`https://supabase.com/dashboard/project/${projectId}/editor`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">데이터베이스 설정 도우미</h2>
        <p className="text-sm text-gray-600 mt-1">
          KV 스토어 테이블의 존재 여부를 확인하고 생성할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>테이블 확인</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tableName">테이블 이름</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="kv_store_79e634f3"
                className="flex-1"
              />
              <Button 
                onClick={checkTableExists}
                disabled={isChecking}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? '확인 중...' : '확인'}</span>
              </Button>
            </div>
          </div>

          {checkResult && (
            <Alert className={checkResult.exists ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              {checkResult.exists ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>{checkResult.message}</strong></p>
                  {checkResult.details && (
                    <p className="text-sm">{checkResult.details}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={openSupabaseDashboard}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Supabase 대시보드 열기</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>테이블 생성 SQL</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              테이블이 존재하지 않는다면 아래 SQL을 Supabase SQL Editor에서 실행하세요.
            </AlertDescription>
          </Alert>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>SQL 코드</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(defaultCreateSQL)}
                className="flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>복사</span>
              </Button>
            </div>
            <Textarea
              value={defaultCreateSQL}
              readOnly
              className="font-mono text-sm min-h-[300px]"
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">실행 방법:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>위의 &quot;Supabase 대시보드 열기&quot; 버튼을 클릭</li>
              <li>좌측 메뉴에서 &quot;SQL Editor&quot; 선택</li>
              <li>위의 SQL 코드를 복사하여 붙여넣기</li>
              <li>&quot;Run&quot; 버튼을 클릭하여 실행</li>
              <li>완료 후 이 페이지에서 다시 &quot;확인&quot; 버튼 클릭</li>
            </ol>
          </div>

          <Alert className="border-blue-500 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>참고:</strong> 이 SQL은 CREATE TABLE IF NOT EXISTS를 사용하므로 기존 테이블이 있다면 안전하게 무시됩니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>문제 해결 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">1. 테이블 이름이 다른 경우</h4>
              <p className="text-sm text-gray-600">
                Supabase에서 다른 이름으로 테이블을 만들었다면, 위의 입력란에 실제 테이블 이름을 입력하고 확인하세요.
              </p>
            </div>

            <div>
              <h4 className="font-medium">2. 권한 문제</h4>
              <p className="text-sm text-gray-600">
                Supabase 프로젝트의 Settings &gt; Database에서 Row Level Security가 비활성화되어 있는지 확인하세요.
              </p>
            </div>

            <div>
              <h4 className="font-medium">3. 환경 변수 확인</h4>
              <p className="text-sm text-gray-600">
                Edge Function에서 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 올바르게 설정되어 있는지 확인하세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}