import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Download,
  Save,
  RefreshCw,
  PlayCircle,
  Clock,
  Check,
  AlertTriangle,
  Database,
  FileText,
  Globe,
  Monitor
} from "lucide-react";

interface BackupTabContentProps {
  backupConfig: {
    spreadsheetId: string;
    serviceAccountJson: string;
  };
  setBackupConfig: (config: { spreadsheetId: string; serviceAccountJson: string }) => void;
  backupLoading: boolean;
  lastBackupTime: string | null;
  backupStatus: 'success' | 'failed' | 'pending' | null;
  backupLogs: any[];
  configStatus: 'loading' | 'success' | 'error' | null;
  handleManualBackup: () => Promise<void>;
  handleSaveBackupConfig: () => Promise<void>;
  handleTestBackupConfig: () => Promise<void>;
  settings: { autoBackup: boolean };
  setSettings: (settings: { autoBackup: boolean }) => void;
}

export function BackupTabContent({
  backupConfig,
  setBackupConfig,
  backupLoading,
  lastBackupTime,
  backupStatus,
  backupLogs,
  configStatus,
  handleManualBackup,
  handleSaveBackupConfig,
  handleTestBackupConfig,
  settings,
  setSettings
}: BackupTabContentProps) {
  const [showJsonInput, setShowJsonInput] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">성공</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">실패</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">진행중</Badge>;
      default:
        return <Badge variant="secondary">알림</Badge>;
    }
  };

  const formatBackupTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      {/* 백업 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>백업 현황</span>
          </CardTitle>
          <CardDescription>
            데이터 백업 상태와 히스토리를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">마지막 백업</p>
                  <p className="font-medium">
                    {lastBackupTime || '백업 없음'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">백업 상태</p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(backupStatus || 'none')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">백업 로그</p>
                  <p className="font-medium">{backupLogs.length}개 기록</p>
                </div>
              </div>
            </div>
          </div>

          {/* 자동 백업 설정 */}
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">자동 백업 설정</h4>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>자동 백업 활성화</Label>
                <p className="text-sm text-gray-500">매일 정해진 시간에 자동으로 백업을 수행합니다</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, autoBackup: checked })
                }
              />
            </div>
          </div>

          {/* 수동 백업 실행 */}
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">수동 백업</h4>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleManualBackup}
                disabled={backupLoading || !backupConfig.spreadsheetId || !backupConfig.serviceAccountJson}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {backupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    백업 진행중...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    지금 백업 실행
                  </>
                )}
              </Button>
              
              {(!backupConfig.spreadsheetId || !backupConfig.serviceAccountJson) && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    백업을 실행하려면 먼저 백업 설정을 완료해주세요.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 백업 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Google Sheets 백업 설정</span>
          </CardTitle>
          <CardDescription>
            Google Sheets로 데이터를 백업하기 위한 설정을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 스프레드시트 ID 입력 */}
          <div className="space-y-2">
            <Label>스프레드시트 ID</Label>
            <Input
              value={backupConfig.spreadsheetId}
              onChange={(e) => 
                setBackupConfig({ ...backupConfig, spreadsheetId: e.target.value })
              }
              placeholder="1DgWjS_suFn60Z_YblWepoEKybycs2wwAwCyOyglVEcc"
              disabled={configStatus === 'loading'}
            />
            <p className="text-sm text-gray-500">
              백업 대상 Google Sheets의 스프레드시트 ID를 입력하세요.
            </p>
          </div>

          {/* 서비스 어카운트 JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Google Service Account JSON</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJsonInput(!showJsonInput)}
              >
                {showJsonInput ? '입력 숨기기' : 'JSON 입력하기'}
              </Button>
            </div>
            
            {showJsonInput && (
              <div className="space-y-2">
                <div className="w-full">
                  <Textarea
                    value={backupConfig.serviceAccountJson}
                    onChange={(e) => 
                      setBackupConfig({ ...backupConfig, serviceAccountJson: e.target.value })
                    }
                    placeholder={`{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}`}
                    rows={12}
                    className="font-mono text-sm h-80 w-full resize-none"
                    disabled={configStatus === 'loading'}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Google Cloud Console에서 다운로드한 Service Account JSON 키를 붙여넣으세요.
                </p>
              </div>
            )}
            
            {!showJsonInput && backupConfig.serviceAccountJson && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Service Account JSON이 설정되었습니다</span>
                </div>
              </div>
            )}
          </div>

          {/* 설정 저장 및 테스트 버튼 */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={handleSaveBackupConfig}
              disabled={configStatus === 'loading' || !backupConfig.spreadsheetId || !backupConfig.serviceAccountJson}
              className="bg-green-600 hover:bg-green-700"
            >
              {configStatus === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  저장중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  설정 저장
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTestBackupConfig}
              disabled={backupLoading || !backupConfig.spreadsheetId || !backupConfig.serviceAccountJson}
            >
              {backupLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  테스트중...
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4 mr-2" />
                  연결 테스트
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 백업 히스토리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>백업 히스토리</span>
          </CardTitle>
          <CardDescription>
            최근 백업 기록을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>백업 기록이 없습니다.</p>
              <p className="text-sm">첫 번째 백업을 실행해보세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupLogs.slice(0, 10).map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'failed' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">
                        {log.data?.message || '백업 실행'}
                        {log.data?.recordCount && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({log.data.recordCount}개 레코드)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatBackupTime(log.timestamp)}
                        {log.type && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {log.type === 'manual' ? '수동' : '자동'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              ))}
              
              {backupLogs.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="ghost" size="sm">
                    더보기 ({backupLogs.length - 10}개)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 백업 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>백업 설정 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium">1. Google Sheets 생성</h4>
            <p className="text-sm text-gray-600">
              백업 데이터를 저장할 Google Sheets를 생성하고, 스프레드시트 ID를 복사하세요.
            </p>
            
            <h4 className="font-medium">2. Service Account 생성</h4>
            <p className="text-sm text-gray-600">
              Google Cloud Console에서 Service Account를 생성하고 JSON 키를 다운로드하세요.
            </p>
            
            <h4 className="font-medium">3. 권한 설정</h4>
            <p className="text-sm text-gray-600">
              생성된 Service Account의 이메일 주소를 Google Sheets에 편집자로 공유하세요.
            </p>
            
            <h4 className="font-medium">4. 설정 테스트</h4>
            <p className="text-sm text-gray-600">
              설정을 저장한 후 '연결 테스트' 버튼을 클릭하여 정상 작동을 확인하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}