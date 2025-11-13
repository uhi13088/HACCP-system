import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Settings, Shield } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

export function BackupSetupGuide() {
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

  const [activeTab, setActiveTab] = useState("check");

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setConfigStatus(prev => ({ ...prev, checking: true }));
    
    try {
      console.log('Checking backup configuration...');
      const result = await api.getBackupConfigStatus();
      console.log('Backup config result:', result);
      
      if (result && result.success && result.data) {
        setConfigStatus({
          serviceAccount: result.data.serviceAccount || false,
          spreadsheetId: result.data.spreadsheetId || false,
          checking: false,
          error: result.data.error
        });
        
        if (result.data.serviceAccount && result.data.spreadsheetId) {
          toast.success('백업 설정이 완료되었습니다!', {
            description: 'Google Service Account를 통한 백업이 사용 가능합니다.',
            duration: 3000,
          });
        }
      } else {
        console.warn('Invalid backup config response:', result);
        setConfigStatus({
          serviceAccount: false,
          spreadsheetId: false,
          checking: false,
          error: result?.error || "서버에서 설정 정보를 가져올 수 없습니다"
        });
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
      setConfigStatus({
        serviceAccount: false,
        spreadsheetId: false,
        checking: false,
        error: `서버 연결 실패: ${error.message}`
      });
    }
  };

  const testConnection = async () => {
    try {
      toast.info("백업 연결 테스트 중...", {
        description: "Google Service Account를 통한 연결을 확인합니다.",
        duration: 3000,
      });

      const result = await api.testBackupConnection();
      
      if (result.success) {
        toast.success("백업 연결 테스트 성공!", {
          description: "Google Sheets 백업이 정상적으로 작동합니다.",
          duration: 4000,
        });
        
        await checkConfiguration();
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
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Service Account 백업 설정</h1>
        </div>
        <p className="text-gray-600">Google Service Account를 통한 안전하고 자동화된 HACCP 데이터 백업</p>
      </div>

      {/* 현재 설정 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>현재 설정 상태</span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkConfiguration}
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-500" />
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
                <Settings className="w-4 h-4 text-green-500" />
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">SPREADSHEET_ID</code>
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
                <span className="font-medium text-green-900">Service Account 설정 완료!</span>
              </div>
              <p className="text-sm text-green-800 mb-3">
                Google Service Account가 올바르게 구성되어 안전한 백업이 가능합니다.
              </p>
              <Button onClick={testConnection} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                백업 연결 테스트
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check">설정 확인</TabsTrigger>
          <TabsTrigger value="guide">설정 가이드</TabsTrigger>
        </TabsList>

        <TabsContent value="check">
          <Card>
            <CardHeader>
              <CardTitle>설정 상태 확인</CardTitle>
              <CardDescription>
                현재 Service Account 설정 상태를 확인하고 문제점을 진단합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!configStatus.checking && (!configStatus.serviceAccount || !configStatus.spreadsheetId) ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p><strong>Service Account 설정이 완료되지 않았습니다.</strong></p>
                        {!configStatus.serviceAccount && (
                          <p>• GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 올바르게 설정되지 않았습니다.</p>
                        )}
                        {!configStatus.spreadsheetId && (
                          <p>• GOOGLE_SHEETS_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.</p>
                        )}
                        <p>아래 "설정 가이드" 탭에서 Service Account 설정 방법을 확인하세요.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : configStatus.checking ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>Service Account 설정 상태를 확인하고 있습니다...</p>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Service Account 설정이 완료되었습니다!</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Google Service Account를 통한 자동 백업 기능을 사용할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <div className="space-y-6">
            {/* 설정 가이드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Google Service Account 백업 설정 가이드</span>
                </CardTitle>
                <CardDescription>
                  API 키 없이 Service Account만으로 안전한 Google Sheets 백업을 설정하는 방법입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Service Account 방식의 장점</p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          <li>• <strong>보안성:</strong> API 키 없이 JWT 토큰 기반 인증</li>
                          <li>• <strong>자동화:</strong> 별도 OAuth 과정 없이 자동 백업</li>
                          <li>• <strong>안정성:</strong> Google Cloud IAM 기반 권한 관리</li>
                          <li>• <strong>간편성:</strong> 한 번 설정으로 지속적인 백업</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                      <span>Google Cloud Console 설정</span>
                    </h3>
                    <div className="space-y-2 text-sm pl-8">
                      <p>• <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center space-x-1">
                        <span>Google Cloud Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>에 접속하여 프로젝트 생성</p>
                      <p>• <strong>API 및 서비스 → 라이브러리</strong>에서 <strong>Google Sheets API</strong> 활성화</p>
                      <p>• <strong>Google Drive API</strong>도 함께 활성화 (권장)</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                      <span>Service Account 생성 및 키 발급</span>
                    </h3>
                    <div className="space-y-2 text-sm pl-8">
                      <p>• <strong>IAM 및 관리 → 서비스 계정</strong>으로 이동</p>
                      <p>• <strong>서비스 계정 만들기</strong> 클릭</p>
                      <p>• 서비스 계정 이름: <code>haccp-backup-service</code> (예시)</p>
                      <p>• 설명: <code>HACCP 데이터 자동 백업용 서비스 계정</code></p>
                      <p>• 생성된 서비스 계정 클릭 → <strong>키</strong> 탭</p>
                      <p>• <strong>키 추가 → 새 키 만들기 → JSON</strong> 선택</p>
                      <p>• JSON 파일이 자동 다운로드됩니다</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                      <span>Google Sheets 스프레드시트 준비</span>
                    </h3>
                    <div className="space-y-2 text-sm pl-8">
                      <p>• <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center space-x-1">
                        <span>Google Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>에서 새 스프레드시트 생성</p>
                      <p>• 스프레드시트 이름: <code>HACCP 백업 데이터</code> (예시)</p>
                      <p>• URL에서 스프레드시트 ID 복사</p>
                      <p className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        예: https://docs.google.com/spreadsheets/d/<strong>1DgWjS_suFn60Z_YblWepoEKybycs2wwAwCyOyglVEcc</strong>/edit
                      </p>
                      <p>• <strong>공유</strong> 버튼 클릭</p>
                      <p>• Service Account 이메일 주소 추가 (JSON 파일의 client_email)</p>
                      <p>• 권한을 <strong>편집자</strong>로 설정</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
                      <span>환경변수 설정</span>
                    </h3>
                    <div className="space-y-3 pl-8">
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm font-medium mb-1">GOOGLE_SERVICE_ACCOUNT_JSON</p>
                        <p className="text-xs text-gray-600 mb-2">다운로드한 JSON 파일의 <strong>전체 내용</strong> (Private Key 단독이 아님)</p>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                          {`{ "type": "service_account", "project_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n", ... }`}
                        </code>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm font-medium mb-1">GOOGLE_SHEETS_SPREADSHEET_ID</p>
                        <p className="text-xs text-gray-600 mb-2">스프레드시트 URL에서 추출한 ID</p>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                          1DgWjS_suFn60Z_YblWepoEKybycs2wwAwCyOyglVEcc
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">❌ 자주 발생하는 설정 오류</p>
                        <div className="text-sm text-red-800 mt-2 space-y-3">
                          <div>
                            <p><strong>잘못된 방법:</strong> Private Key만 복사</p>
                            <code className="block bg-red-100 p-2 rounded text-xs mt-1">
                              -----BEGIN PRIVATE KEY-----{'\n'}
                              MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSk...{'\n'}
                              -----END PRIVATE KEY-----
                            </code>
                          </div>
                          <div>
                            <p><strong>올바른 방법:</strong> JSON 파일 전체 내용</p>
                            <code className="block bg-green-100 p-2 rounded text-xs mt-1">
                              {`{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}`}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">⚠️ 보안 주의사항</p>
                        <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                          <li>• Service Account JSON 파일은 매우 민감한 정보입니다</li>
                          <li>• JSON 파일을 절대 공개 저장소나 채팅에 공유하지 마세요</li>
                          <li>• 환경변수로만 설정하고 코드에 직접 포함하지 마세요</li>
                          <li>• 정기적으로 키를 갱신하는 것을 권장합니다</li>
                          <li>• 스프레드시트는 Service Account에만 최소 권한으로 공유하세요</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">✅ 설정 완료 후 확인사항</p>
                        <ul className="text-sm text-green-800 mt-2 space-y-1">
                          <li>• 위의 "백업 연결 테스트" 버튼으로 연결 확인</li>
                          <li>• 백업 관리 페이지에서 수동 백업 테스트 실행</li>
                          <li>• Google Sheets에서 데이터가 정상적으로 기록되는지 확인</li>
                          <li>• 자동 백업 스케줄이 정상 작동하는지 확인</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}