import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Copy, Key, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function ServiceAccountGenerator() {
  const [formData, setFormData] = useState({
    projectId: "",
    serviceAccountEmail: "",
    privateKey: "",
    privateKeyId: "",
    clientId: ""
  });
  const [generatedJson, setGeneratedJson] = useState("");

  const generateServiceAccountJson = () => {
    if (!formData.projectId || !formData.serviceAccountEmail || !formData.privateKey) {
      toast.error("필수 필드를 모두 입력해주세요", {
        description: "Project ID, Service Account Email, Private Key는 필수입니다.",
        duration: 4000,
      });
      return;
    }

    // Private Key 형식 확인 및 정리
    let cleanPrivateKey = formData.privateKey.trim();
    if (!cleanPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      cleanPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanPrivateKey}\n-----END PRIVATE KEY-----\n`;
    }

    const serviceAccountJson = {
      "type": "service_account",
      "project_id": formData.projectId,
      "private_key_id": formData.privateKeyId || `key_${Date.now()}`,
      "private_key": cleanPrivateKey,
      "client_email": formData.serviceAccountEmail,
      "client_id": formData.clientId || `${Date.now()}`,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(formData.serviceAccountEmail)}`,
      "universe_domain": "googleapis.com"
    };

    const jsonString = JSON.stringify(serviceAccountJson, null, 2);
    setGeneratedJson(jsonString);
    
    toast.success("Service Account JSON이 생성되었습니다!", {
      description: "생성된 JSON을 환경변수에 설정하세요.",
      duration: 4000,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다!", {
      description: "GOOGLE_SERVICE_ACCOUNT_JSON 환경변수에 붙여넣으세요.",
      duration: 3000,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Service Account JSON 생성 도구</h1>
        <p className="text-gray-600">Google Cloud Console 정보를 입력하여 올바른 Service Account JSON을 생성하세요.</p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">사용 방법</p>
            <p className="text-sm text-blue-800 mt-1">
              Google Cloud Console에서 Service Account를 생성한 후, 아래 정보를 입력하여 올바른 JSON 형식을 생성하세요.
              실제로는 Google Cloud Console에서 JSON 키를 직접 다운로드하는 것이 가장 안전합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 입력 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Service Account 정보 입력</span>
          </CardTitle>
          <CardDescription>
            Google Cloud Console의 Service Account 정보를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project ID *</Label>
              <Input
                placeholder="예: my-haccp-project"
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({...prev, projectId: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Account Email *</Label>
              <Input
                placeholder="예: haccp-backup@my-project.iam.gserviceaccount.com"
                value={formData.serviceAccountEmail}
                onChange={(e) => setFormData(prev => ({...prev, serviceAccountEmail: e.target.value}))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Private Key ID</Label>
              <Input
                placeholder="예: 1234567890abcdef (선택사항)"
                value={formData.privateKeyId}
                onChange={(e) => setFormData(prev => ({...prev, privateKeyId: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                placeholder="예: 1234567890 (선택사항)"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({...prev, clientId: e.target.value}))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Private Key *</Label>
            <Textarea
              placeholder="-----BEGIN PRIVATE KEY-----로 시작하는 전체 Private Key를 입력하세요..."
              value={formData.privateKey}
              onChange={(e) => setFormData(prev => ({...prev, privateKey: e.target.value}))}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={generateServiceAccountJson} className="w-full">
            <Key className="w-4 h-4 mr-2" />
            Service Account JSON 생성
          </Button>
        </CardContent>
      </Card>

      {/* 생성된 JSON */}
      {generatedJson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>생성된 Service Account JSON</span>
              </div>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generatedJson)}
              >
                <Copy className="w-4 h-4 mr-2" />
                복사
              </Button>
            </CardTitle>
            <CardDescription>
              아래 JSON을 GOOGLE_SERVICE_ACCOUNT_JSON 환경변수에 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {generatedJson}
                </pre>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800 font-medium mb-1">✅ 다음 단계:</p>
                <ol className="text-xs text-green-700 list-decimal list-inside space-y-1">
                  <li>위의 JSON을 복사하여 GOOGLE_SERVICE_ACCOUNT_JSON 환경변수에 설정</li>
                  <li>Google Sheets에서 새 스프레드시트 생성</li>
                  <li>스프레드시트를 Service Account 이메일({formData.serviceAccountEmail})과 공유 (편집자 권한)</li>
                  <li>스프레드시트 ID를 GOOGLE_SHEETS_SPREADSHEET_ID 환경변수에 설정</li>
                  <li>서버 재시작 후 백업 기능 테스트</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 경고 메시지 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">⚠️ 보안 주의사항</p>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• 이 도구는 임시 해결책입니다. 실제 운영환경에서는 Google Cloud Console에서 직접 JSON 키를 다운로드하세요.</li>
              <li>• Private Key는 절대 다른 사람과 공유하지 마세요.</li>
              <li>• 생성된 Service Account에는 최소한의 권한만 부여하세요.</li>
              <li>• 정기적으로 키를 교체하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}