import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Copy, Key, AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

export function BackupConfigHelper() {
  const [configStatus, setConfigStatus] = useState<{
    serviceAccount: boolean;
    spreadsheetId: boolean;
    checking: boolean;
    error?: string;
  }>({
    serviceAccount: false,
    spreadsheetId: false,
    checking: true
  });

  const [serviceAccountForm, setServiceAccountForm] = useState({
    projectId: "",
    serviceAccountEmail: "",
    privateKey: "",
    privateKeyId: "",
    clientId: ""
  });

  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [generatedJson, setGeneratedJson] = useState("");
  const [activeTab, setActiveTab] = useState("check");

  // 컴포넌트 마운트시 설정 상태 확인
  useEffect(() => {
    checkCurrentConfiguration();
  }, []);

  // 현재 설정 상태 확인
  const checkCurrentConfiguration = async () => {
    setConfigStatus(prev => ({ ...prev, checking: true }));
    
    try {
      console.log('Checking backup configuration...');
      
      const result = await api.getBackupConfigStatus();
      
      console.log('Configuration check result:', result);
      
      if (result.success && result.data) {
        setConfigStatus({
          serviceAccount: result.data.serviceAccount || false,
          spreadsheetId: result.data.spreadsheetId || false,
          checking: false,
          error: result.data.error
        });
        
        if (result.data.serviceAccount && result.data.spreadsheetId) {
          setActiveTab("success");
          toast.success('백업 설정이 완료되었습니다!', {
            description: 'Google Sheets 백업이 사용 가능한 상태입니다.',
            duration: 3000,
          });
        } else if (result.data.error) {
          setActiveTab("fix");
        }
      } else {
        console.log('Configuration check failed');
        setConfigStatus({
          serviceAccount: false,
          spreadsheetId: false,
          checking: false,
          error: result.error || "설정 확인 실패"
        });
        setActiveTab("fix");
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
      
      setConfigStatus({
        serviceAccount: false,
        spreadsheetId: false,
        checking: false,
        error: error.message
      });
      setActiveTab("fix");
    }
  };

  // Service Account JSON 생성
  const generateServiceAccountJson = () => {
    if (!serviceAccountForm.projectId || !serviceAccountForm.serviceAccountEmail || !serviceAccountForm.privateKey) {
      toast.error("필수 필드를 모두 입력해주세요", {
        description: "Project ID, Service Account Email, Private Key는 필수입니다.",
        duration: 4000,
      });
      return;
    }

    // Private Key 형식 확인 및 정리
    let cleanPrivateKey = serviceAccountForm.privateKey.trim();
    if (!cleanPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      cleanPrivateKey = `-----BEGIN PRIVATE KEY-----\\n${cleanPrivateKey}\\n-----END PRIVATE KEY-----\\n`;
    }

    const serviceAccountJson = {
      "type": "service_account",
      "project_id": serviceAccountForm.projectId,
      "private_key_id": serviceAccountForm.privateKeyId || `key_${Date.now()}`,
      "private_key": cleanPrivateKey,
      "client_email": serviceAccountForm.serviceAccountEmail,
      "client_id": serviceAccountForm.clientId || `${Date.now()}`,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(serviceAccountForm.serviceAccountEmail)}`,
      "universe_domain": "googleapis.com"
    };

    const jsonString = JSON.stringify(serviceAccountJson, null, 2);
    setGeneratedJson(jsonString);
    
    toast.success("Service Account JSON이 생성되었습니다!", {
      description: "생성된 JSON을 환경변수에 설정하세요.",
      duration: 4000,
    });
  };

  // 클립보드에 복사
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다!", {
      description,
      duration: 3000,
    });
  };

  // 백업 테스트
  const testBackupConnection = async () => {
    try {
      toast.info("백업 연결 테스트 중...", {
        description: "Google Sheets API 연결을 확인합니다.",
        duration: 3000,
      });

      const result = await api.testBackupConnection();
      
      if (result.success) {
        toast.success("백업 연결 테스트 성공!", {
          description: "Google Sheets 백업이 정상적으로 작동합니다.",
          duration: 4000,
        });
        
        // 설정 상태 다시 확인
        await checkCurrentConfiguration();
      } else {
        toast.error("백업 연결 테스트 실패", {
          description: result.error || "설정을 다시 확인해주세요.",
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error("테스트 중 오류가 발생했습니다", {
        description: error.message,
        duration: 4000,
      });
    }
  };

  const getStatusIcon = (status: boolean, checking: boolean) => {
    if (checking) return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (status: boolean, checking: boolean) => {
    if (checking) return "확인 중";
    return status ? "설정 완료" : "설정 필요";
  };

  const getStatusColor = (status: boolean, checking: boolean) => {
    if (checking) return "text-blue-600";
    return status ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Google Sheets 백업 설정 도우미</h1>
        </div>
        <p className="text-gray-600">HACCP 데이터를 Google Sheets에 자동 백업하기 위한 설정을 도와드립니다.</p>
      </div>

      {/* 현재 설정 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>현재 설정 상태</span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkCurrentConfiguration}
              disabled={configStatus.checking}
            >
              {configStatus.checking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              상태 확인
            </Button>
          </CardTitle>
          <CardDescription>
            Google Sheets 백업에 필요한 환경변수 설정 상태를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">SERVICE_ACCOUNT_JSON</code>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(configStatus.serviceAccount, configStatus.checking)}
                <span className={`text-sm ${getStatusColor(configStatus.serviceAccount, configStatus.checking)}`}>
                  {getStatusText(configStatus.serviceAccount, configStatus.checking)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">SHEETS_SPREADSHEET_ID</code>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(configStatus.spreadsheetId, configStatus.checking)}
                <span className={`text-sm ${getStatusColor(configStatus.spreadsheetId, configStatus.checking)}`}>
                  {getStatusText(configStatus.spreadsheetId, configStatus.checking)}
                </span>
              </div>
            </div>
          </div>

          {configStatus.error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>설정 오류:</strong> {configStatus.error}
              </AlertDescription>
            </Alert>
          )}

          {!configStatus.checking && configStatus.serviceAccount && configStatus.spreadsheetId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">설정 완료!</span>
              </div>
              <p className="text-sm text-green-800">
                모든 환경변수가 올바르게 설정되었습니다. Google Sheets 백업 기능을 사용할 수 있습니다.
              </p>
              <Button
                className="mt-3"
                onClick={testBackupConnection}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                백업 연결 테스트
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="check">설정 확인</TabsTrigger>
          <TabsTrigger value="fix">설정 수정</TabsTrigger>
          <TabsTrigger value="guide">설정 가이드</TabsTrigger>
        </TabsList>

        {/* 설정 확인 */}
        <TabsContent value="check">
          <Card>
            <CardHeader>
              <CardTitle>설정 상태 확인</CardTitle>
              <CardDescription>
                현재 환경변수 설정 상태를 확인하고 문제점을 진단합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!configStatus.checking && (!configStatus.serviceAccount || !configStatus.spreadsheetId) ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p><strong>설정이 완료되지 않았습니다.</strong></p>
                        {!configStatus.serviceAccount && (
                          <p>• GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 올바르게 설정되지 않았습니다.</p>
                        )}
                        {!configStatus.spreadsheetId && (
                          <p>• GOOGLE_SHEETS_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.</p>
                        )}
                        <p>아래 "설정 수정" 탭에서 환경변수를 올바르게 설정해주세요.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : configStatus.checking ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>설정 상태를 확인하고 있습니다...</p>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">모든 설정이 완료되었습니다!</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Google Sheets 자동 백업 기능을 사용할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 설정 수정 */}
        <TabsContent value="fix">
          <div className="space-y-6">
            {/* Service Account JSON 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Service Account JSON 설정</span>
                </CardTitle>
                <CardDescription>
                  Google Cloud Console에서 Service Account를 생성하고 JSON 키를 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project ID *</Label>
                    <Input
                      placeholder="예: my-haccp-project"
                      value={serviceAccountForm.projectId}
                      onChange={(e) => setServiceAccountForm(prev => ({...prev, projectId: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Account Email *</Label>
                    <Input
                      placeholder="예: haccp-backup@my-project.iam.gserviceaccount.com"
                      value={serviceAccountForm.serviceAccountEmail}
                      onChange={(e) => setServiceAccountForm(prev => ({...prev, serviceAccountEmail: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Private Key ID (선택사항)</Label>
                    <Input
                      placeholder="예: 1234567890abcdef"
                      value={serviceAccountForm.privateKeyId}
                      onChange={(e) => setServiceAccountForm(prev => ({...prev, privateKeyId: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client ID (선택사항)</Label>
                    <Input
                      placeholder="예: 1234567890"
                      value={serviceAccountForm.clientId}
                      onChange={(e) => setServiceAccountForm(prev => ({...prev, clientId: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Private Key *</Label>
                  <Textarea
                    placeholder="-----BEGIN PRIVATE KEY-----로 시작하는 전체 Private Key를 입력하세요..."
                    value={serviceAccountForm.privateKey}
                    onChange={(e) => setServiceAccountForm(prev => ({...prev, privateKey: e.target.value}))}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <Button onClick={generateServiceAccountJson} className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Service Account JSON 생성
                </Button>

                {generatedJson && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>생성된 JSON</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedJson, "GOOGLE_SERVICE_ACCOUNT_JSON 환경변수에 붙여넣으세요.")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {generatedJson}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spreadsheet ID 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>Google Sheets Spreadsheet ID</CardTitle>
                <CardDescription>
                  백업할 Google Sheets 스프레드시트의 ID를 입력합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Spreadsheet ID</Label>
                  <Input
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Google Sheets URL의 /d/ 다음에 나오는 ID를 입력하세요.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(spreadsheetId, "GOOGLE_SHEETS_SPREADSHEET_ID 환경변수에 설정하세요.")}
                    disabled={!spreadsheetId}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    복사
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://sheets.google.com/create', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    새 스프레드시트 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 설정 가이드 */}
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets 백업 설정 가이드</CardTitle>
              <CardDescription>
                처음부터 단계별로 Google Sheets 백업을 설정하는 방법을 안내합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">1. Google Cloud Console 설정</h3>
                  <div className="space-y-2 text-sm pl-4">
                    <p>• <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>에 접속</p>
                    <p>• 새 프로젝트 생성 또는 기존 프로젝트 선택</p>
                    <p>• "API 및 서비스" → "라이브러리"에서 "Google Sheets API" 검색 후 사용 설정</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">2. Service Account 생성</h3>
                  <div className="space-y-2 text-sm pl-4">
                    <p>• "IAM 및 관리" → "서비스 계정" 이동</p>
                    <p>• "서비스 계정 만들기" 클릭</p>
                    <p>• 서비스 계정 이름 입력 (예: "haccp-backup")</p>
                    <p>• 생성된 서비스 계정 클릭 → "키" 탭 → "키 추가" → "새 키 만들기" → "JSON" 선택</p>
                    <p>• 다운로드된 JSON 파일의 내용을 전체 복사</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">3. Google Sheets 설정</h3>
                  <div className="space-y-2 text-sm pl-4">
                    <p>• <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Sheets</a>에서 새 스프레드시트 생성</p>
                    <p>• 스프레드시트 URL에서 ID 복사 (예: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)</p>
                    <p>• 스프레드시트 공유 → Service Account 이메일 주소 추가 → "편집자" 권한 부여</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">4. 환경변수 설정</h3>
                  <div className="space-y-2 text-sm pl-4">
                    <p>• <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code>: 다운로드한 JSON 파일의 전체 내용</p>
                    <p>• <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_SHEETS_SPREADSHEET_ID</code>: 스프레드시트 ID</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">주의사항</p>
                      <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                        <li>• Service Account JSON은 전체 내용을 복사해야 합니다 (해시나 ID만으로는 작동하지 않음)</li>
                        <li>• Private Key는 절대 다른 사람과 공유하지 마세요</li>
                        <li>• 스프레드시트는 Service Account와 반드시 공유되어야 합니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}