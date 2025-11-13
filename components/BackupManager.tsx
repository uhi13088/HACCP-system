import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { Download, RefreshCw, Clock, Save, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { api } from "../utils/api";
import { backupScheduler } from "../utils/backupScheduler";

export function BackupManager() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('18:00');
  const [nextBackupTime, setNextBackupTime] = useState<string>('');
  const [configStatus, setConfigStatus] = useState<{
    serviceAccount: boolean;
    spreadsheetId: boolean;
    checking: boolean;
  }>({
    serviceAccount: false,
    spreadsheetId: false,
    checking: true
  });

  // 컴포넌트 마운트시 백업 로그 로드 및 현재 스케줄 설정 로드
  useEffect(() => {
    loadBackupLogs();
    loadCurrentSchedule();
    updateNextBackupTime();
    setAutoBackupEnabled(backupScheduler.isSchedulerRunning());
    checkConfiguration();
  }, []);

  // 현재 스케줄 설정 로드
  const loadCurrentSchedule = () => {
    const currentSchedule = backupScheduler.getScheduleTime();
    setScheduleTime(currentSchedule.timeString);
  };

  // 다음 백업 시간 업데이트
  const updateNextBackupTime = () => {
    if (autoBackupEnabled && backupScheduler.isSchedulerRunning()) {
      const nextTime = backupScheduler.getNextBackupTime();
      setNextBackupTime(nextTime.toLocaleString('ko-KR'));
    } else {
      setNextBackupTime('비활성화됨');
    }
  };

  // 백업 시간 변경 핸들러
  const handleScheduleTimeChange = (newTime: string) => {
    setScheduleTime(newTime);
  };

  // 백업 시간 저장
  const handleSaveScheduleTime = () => {
    try {
      const [hour, minute] = scheduleTime.split(':').map(Number);
      
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        toast.error('올바른 시간 형식을 입력해주세요.', {
          description: '시간은 00:00 ~ 23:59 범위여야 합니다.',
          duration: 4000,
        });
        return;
      }

      backupScheduler.setScheduleTime(hour, minute);
      updateNextBackupTime();
      
      toast.success('백업 시간이 변경되었습니다.', {
        description: `매일 ${scheduleTime}에 자동 백업이 실행됩니다.`,
        duration: 4000,
      });
    } catch (error) {
      toast.error('백업 시간 설정에 실패했습니다.', {
        description: '올바른 시간 형식(HH:MM)을 입력해주세요.',
        duration: 4000,
      });
    }
  };

  // 자동 백업 토글 핸들러
  const handleAutoBackupToggle = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    
    if (enabled) {
      backupScheduler.start();
      toast.success('자동 백업이 활성화되었습니다.', {
        description: `매일 ${scheduleTime}에 백업이 실행됩니다.`,
        duration: 3000,
      });
    } else {
      backupScheduler.stop();
      toast.info('자동 백업이 비활성화되었습니다.', {
        description: '수동으로만 백업을 실행할 수 있습니다.',
        duration: 3000,
      });
    }
    
    updateNextBackupTime();
  };

  // 수동 백업 실행
  const handleManualBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await backupScheduler.executeManualBackup();

      if (result.success) {
        setBackupStatus('success');
        setLastBackupTime(new Date().toLocaleString('ko-KR'));
        
        // 상세한 성공 정보 표시
        const backupData = result.data;
        let description = `${backupData.recordCount}개의 CCP 기록이 구조화된 형태로 백업되었습니다.`;
        
        if (backupData.spreadsheetTitle) {
          description += `\n📊 스프레드시트: '${backupData.spreadsheetTitle}'`;
        }
        
        if (backupData.sheetsUpdated) {
          description += `\n📋 업데이트된 시트: ${backupData.sheetsUpdated}개`;
        }
        
        if (backupData.structure) {
          description += `\n🗂️ 구조: 연간/월간 대시보드 + ${backupData.ccpTypesCount}개 CCP별 시트`;
        }
        
        if (backupData.verified) {
          description += `\n✅ 백업 데이터 검증 완료`;
        }
        
        toast.success('백업이 완료되었습니다!', {
          description: description,
          duration: 6000,
        });
        
        loadBackupLogs(); // 백업 로그 새로고침
        
        // 백업 성공시 설정 상태 업데이트
        setConfigStatus({
          serviceAccount: true,
          spreadsheetId: true,
          checking: false
        });
      } else {
        setBackupStatus('failed');
        
        // 백업 실패시 설정 상태 업데이트
        if (result.error) {
          const hasServiceAccount = !result.error.includes('GOOGLE_SERVICE_ACCOUNT_JSON') && 
                                  !result.error.includes('Service Account');
          const hasSpreadsheetId = !result.error.includes('GOOGLE_SHEETS_SPREADSHEET_ID') && 
                                 !result.error.includes('Spreadsheet');
          
          setConfigStatus({
            serviceAccount: hasServiceAccount,
            spreadsheetId: hasSpreadsheetId,
            checking: false
          });
        }
        
        toast.error('백업에 실패했습니다.', {
          description: result.error || '알 수 없는 오류가 발생했습니다.',
          duration: 4000,
        });
      }
    } catch (error) {
      setBackupStatus('failed');
      toast.error('백업 중 오류가 발생했습니다.', {
        description: '네트워크 연결을 확인해주세요.',
        duration: 4000,
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Google Sheets 환경 설정 상태 확인
  const checkConfiguration = async () => {
    setConfigStatus(prev => ({ ...prev, checking: true }));
    
    try {
      console.log('Checking backup configuration...');
      
      // 전용 설정 확인 API 호출
      const result = await api.getBackupConfigStatus();
      
      console.log('Configuration check result:', result);
      
      if (result && result.success && result.data) {
        setConfigStatus({
          serviceAccount: result.data.serviceAccount || false,
          spreadsheetId: result.data.spreadsheetId || false,
          checking: false
        });
        
        if (result.data.serviceAccount && result.data.spreadsheetId) {
          toast.success('백업 설정이 완료되었습니다!', {
            description: 'Google Sheets 백업이 사용 가능한 상태입니다.',
            duration: 3000,
          });
        }
      } else {
        console.warn('Invalid configuration check response:', result);
        setConfigStatus({
          serviceAccount: false,
          spreadsheetId: false,
          checking: false
        });
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
      
      // 서버 연결 오류 처리
      setConfigStatus({
        serviceAccount: false,
        spreadsheetId: false,
        checking: false
      });
      
      // 토스트 메시지는 표시하지 않음 (콘솔에만 로그)
      console.warn('Configuration check failed - this is normal if server is not available');
    }
  };

  // 백업 연결 테스트
  const testBackupConnection = async () => {
    setConfigStatus(prev => ({ ...prev, checking: true }));
    
    try {
      console.log('Testing backup connection...');
      
      const result = await api.testBackupConnection();
      
      console.log('Connection test result:', result);
      
      if (result.success) {
        setConfigStatus({
          serviceAccount: true,
          spreadsheetId: true,
          checking: false
        });
        
        const spreadsheetData = result.data?.spreadsheet;
        const writeTestData = result.data?.writeTest;
        const spreadsheetTitle = spreadsheetData?.title || result.data?.spreadsheetTitle || '연결된 스프레드시트';
        
        let description = `스프레드시트 '${spreadsheetTitle}'에 연결되었습니다.`;
        
        if (spreadsheetData?.testWriteConfirmed) {
          description += `\n✅ 실제 쓰기 테스트도 성공했습니다.`;
        }
        
        if (writeTestData) {
          description += `\n📝 ${writeTestData.updatedRows}행, ${writeTestData.updatedCells}셀 업데이트됨`;
          description += `\n📍 테스트 범위: ${writeTestData.range}`;
        }
        
        if (spreadsheetData?.sheets?.length) {
          description += `\n📊 사용 가능한 시트: ${spreadsheetData.sheets.join(', ')}`;
        }
        
        toast.success('백업 연결 테스트 성공!', {
          description: description,
          duration: 6000,
        });
      } else {
        setConfigStatus({
          serviceAccount: false,
          spreadsheetId: false,
          checking: false
        });
        
        // 단계별 오류 메시지 표시
        let errorTitle = '백업 연결 테스트 실패';
        let errorDescription = result.error || '연결 설정을 확인해주세요.';
        
        if (result.step) {
          switch (result.step) {
            case 'environment_check':
              errorTitle = '환경변수 설정 오류';
              break;
            case 'json_format_check':
            case 'json_content_check':
            case 'json_parsing':
              errorTitle = 'Service Account JSON 오류';
              break;
            case 'private_key_processing':
              errorTitle = 'Private Key 처리 오류';
              errorDescription += '\n\n💡 해결 방법: Google Cloud Console에서 새로운 Service Account JSON을 다운로드해주세요.';
              break;
            case 'google_token_request':
              errorTitle = 'Google 인증 실패';
              errorDescription += '\n\n💡 해결 방법: Service Account 설정과 Google Sheets API 활성화 상태를 확인해주세요.';
              break;
            case 'spreadsheet_access':
              errorTitle = '스프레드시트 접근 오류';
              errorDescription += '\n\n💡 해결 방법: 스프레드시트 ID를 확인하고 Service Account 이메일을 편집자로 공유했는지 확인해주세요.';
              break;
          }
        }
        
        toast.error(errorTitle, {
          description: errorDescription,
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      
      setConfigStatus({
        serviceAccount: false,
        spreadsheetId: false,
        checking: false
      });
      
      if (error.message.includes('Network error - 404')) {
        toast.error('백업 API 엔드포인트를 찾을 수 없습니다', {
          description: '서버가 완전히 초기화될 때까지 잠시 기다려주세요.',
          duration: 4000,
        });
      } else {
        toast.error('연결 테스트 중 오류 발생', {
          description: error.message,
          duration: 6000,
        });
      }
    }
  };

  // 백업 로그 로드
  const loadBackupLogs = async () => {
    try {
      // 로컬 스토리지에서 백업 로그 가져오기
      const localLogs = backupScheduler.getBackupLogs();
      
      // 서버에서도 백업 로그 가져오기 시도
      try {
        const result = await api.getBackupLogs();
        if (result.success) {
          // 로컬과 서버 로그 합치기
          const combinedLogs = [...localLogs, ...result.data];
          // 중복 제거 및 시간순 정렬
          const uniqueLogs = combinedLogs.filter((log, index, self) => 
            index === self.findIndex(l => l.id === log.id)
          ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setBackupLogs(uniqueLogs);
        } else {
          setBackupLogs(localLogs);
        }
      } catch (error) {
        // 서버 요청 실패시 로컬 로그만 사용
        setBackupLogs(localLogs);
      }
      
      // 마지막 백업 정보 설정
      const allLogs = backupLogs.length > 0 ? backupLogs : localLogs;
      const lastSuccessfulBackup = allLogs.find((log: any) => log.status === 'success');
      if (lastSuccessfulBackup) {
        setLastBackupTime(new Date(lastSuccessfulBackup.timestamp).toLocaleString('ko-KR'));
        setBackupStatus('success');
      }
    } catch (error) {
      console.error('Failed to load backup logs:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>데이터 백업 관리</span>
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          CCP 기록을 Google Sheets에 자동으로 백업하여 데이터 안전성을 보장합니다.
        </p>
      </div>

      {/* 자동 백업 설정 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-900">Google Sheets 자동 백업</h4>
            <p className="text-sm text-blue-700 mt-1">
              지정된 시간에 CCP 기록을 구글 스프레드시트에 자동으로 백업합니다.
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={autoBackupEnabled}
                onCheckedChange={handleAutoBackupToggle}
              />
              <Label className="text-sm text-blue-900">자동 백업 활성화</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testBackupConnection}
                disabled={configStatus.checking}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {configStatus.checking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    연결 테스트 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    연결 테스트
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualBackup}
                disabled={backupLoading}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {backupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    백업 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    수동 백업 실행
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 백업 시간 설정 */}
          <Card className="p-4 bg-white border-blue-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium text-blue-900">백업 시간 설정</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => handleScheduleTimeChange(e.target.value)}
                  className="w-32 border-blue-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveScheduleTime}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
              
              <p className="text-xs text-blue-600">
                💡 설정한 시간에 매일 자동으로 백업이 실행됩니다.
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">마지막 백업:</span>
              <span className="font-medium text-blue-900">{lastBackupTime || '없음'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">백업 상태:</span>
              <span className={`font-medium ${
                backupStatus === 'success' ? 'text-green-600' : 
                backupStatus === 'failed' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {backupStatus === 'success' ? '성공' : 
                 backupStatus === 'failed' ? '실패' : '대기'}
              </span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="text-blue-700">다음 백업 예정:</span>
              <span className={`font-medium text-xs ${
                nextBackupTime === '비활성화됨' ? 'text-gray-500' : 'text-blue-900'
              }`}>
                {nextBackupTime || '계산 중...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">설정 시간:</span>
              <span className="font-medium text-blue-900">{scheduleTime}</span>
            </div>
          </div>

          {backupStatus === 'failed' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium mb-2">
                ⚠️ 백업 실패: Google Service Account 설정 문제
              </p>
              <p className="text-xs text-red-600 mb-2">
                Google Service Account JSON의 Private Key 처리 중 오류가 발생했습니다.
                "Invalid base64 characters in private key" 오류는 보통 JSON 파싱 과정에서 특수 문자가 잘못 처리되었을 때 발생합니다.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-red-600">
                  <strong>해결방법:</strong>
                </p>
                <ol className="text-xs text-red-600 list-decimal list-inside space-y-1 ml-2">
                  <li>Google Cloud Console에서 Service Account JSON 키를 새로 다운로드</li>
                  <li>다운로드한 JSON 파일을 텍스트 에디터로 열어서 내용 전체를 복사</li>
                  <li>환경변수에 복사한 JSON 전체를 설정 (특수문자 이스케이프 주의)</li>
                  <li>아래 "연결 테스트" 버튼으로 설정 검증</li>
                </ol>
              </div>
            </div>
          )}

          <div className="p-3 bg-white border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">구조화된 백업 정보 및 확인 방법</h5>
            <div className="space-y-2 text-sm text-blue-700">
              <div>• 백업 시간: 매일 {scheduleTime} (사용자 설정 가능)</div>
              <div>• 백업 데이터: 전체 CCP 기록을 구조화하여 저장</div>
              <div>• 저장 위치: Google Sheets 스프레드시트 (다중 시트)</div>
              
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="font-medium text-blue-800 mb-1">🗂️ 백업 시트 구조:</div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>1. <strong>연간 대시보드</strong>: 분기별 CCP 통계 및 연간 요약</div>
                  <div>2. <strong>월간 대시보드</strong>: 월별 CCP 현황 및 일일 추이</div>
                  <div>3. <strong>CCP별 시트</strong>: 각 CCP 유형별 상세 기록</div>
                  <div>   - 오븐공정_빵류, 크림제조공정, 세척공정, 금속검출공정 등</div>
                  <div>   - 각 시트 상단에 월별 필터링 드롭다운 제공</div>
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-green-800 mb-1">📊 사용 방법:</div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>• <strong>연간 분석</strong>: '연간 대시보드' 시트에서 분기별 추이 확인</div>
                  <div>• <strong>월간 분석</strong>: '월간 대시보드' 시트에서 이번 달 현황 확인</div>
                  <div>• <strong>상세 기록</strong>: 각 CCP별 시트에서 월 드롭다운으로 필터링</div>
                  <div>  → 예: 'CCP_오븐공정_빵류' 시트에서 '3월' 선택시 3월 데이터만 표시</div>
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-medium text-yellow-800 mb-1">💡 문제 해결:</div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>• 백업 완료 팝업이 뜨지만 데이터가 보이지 않는 경우:</div>
                  <div>  → 스프레드시트 새로고침 (F5 또는 Ctrl+R)</div>
                  <div>  → 올바른 스프레드시트인지 ID 확인</div>
                  <div>  → Service Account 이메일이 편집자로 공유되었는지 확인</div>
                  <div>• 월별 드롭다운이 작동하지 않는 경우:</div>
                  <div>  → CCP별 시트의 B2 셀 드롭다운 메뉴 확인</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Separator />

      {/* 백업 로그 */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">백업 이력</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBackupLogs}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {backupLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                백업 이력이 없습니다.
              </p>
            ) : (
              backupLogs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' : 
                        log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-sm">
                        {new Date(log.timestamp).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={log.type === 'scheduled' ? 'default' : 'secondary'}>
                        {log.type === 'scheduled' ? '자동' : '수동'}
                      </Badge>
                      <span className={`text-sm ${
                        log.status === 'success' ? 'text-green-600' : 
                        log.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {log.status === 'success' ? '성공' : 
                         log.status === 'failed' ? '실패' : '진행중'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 상세 정보 표시 */}
                  {log.data && (
                    <div className="text-xs text-gray-600 pl-5">
                      {log.status === 'success' && (
                        <div className="space-y-1">
                          <div className="text-green-700 bg-green-50 p-2 rounded border-l-2 border-green-200">
                            <div className="font-medium">✅ {log.data.message || '백업 성공'}</div>
                            {log.data.recordCount && (
                              <div>📋 {log.data.recordCount}개 CCP 기록 백업됨</div>
                            )}
                            {log.data.spreadsheetTitle && (
                              <div>📊 스프레드시트: '{log.data.spreadsheetTitle}'</div>
                            )}
                            {log.data.sheetsUpdated && (
                              <div>📝 {log.data.sheetsUpdated}개 시트 업데이트됨</div>
                            )}
                            {log.data.ccpTypesCount && (
                              <div>🗂️ {log.data.ccpTypesCount}개 CCP 유형별 시트 생성</div>
                            )}
                            {log.data.structure && (
                              <div>📈 구조: 연간/월간 대시보드 + CCP별 시트</div>
                            )}
                            {log.data.rowsWritten && log.data.cellsUpdated && (
                              <div>📝 {log.data.rowsWritten}행, {log.data.cellsUpdated}셀 업데이트됨</div>
                            )}
                            {log.data.updatedRange && (
                              <div>📍 범위: {log.data.updatedRange}</div>
                            )}
                            {log.data.verified && (
                              <div>🔍 백업 데이터 검증 완료</div>
                            )}
                            {log.data.backupTime && (
                              <div>⏰ 백업 시간: {log.data.backupTime}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {log.status === 'failed' && log.data.error && (
                        <div className="text-red-700 bg-red-50 p-2 rounded border-l-2 border-red-200">
                          <div className="font-medium">❌ 백업 실패</div>
                          <div>오류: {log.data.error}</div>
                          {log.data.step && (
                            <div>단계: {log.data.step}</div>
                          )}
                          {log.data.details && (
                            <div className="text-xs text-red-600 mt-1">
                              상세: {log.data.details}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* 설정 안내 */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="space-y-4">
          <h4 className="font-medium text-green-900">🔒 안전한 Google Sheets 백업 설정</h4>
          
          <div className="text-sm text-green-800 space-y-3">
            <div className="p-3 bg-white border border-green-200 rounded">
              <h5 className="font-medium mb-2">✅ 개인 이메일 공유 불필요!</h5>
              <p>Service Account 방식을 사용하여 개인 Google 계정을 공유하지 않고도 안전하게 백업할 수 있습니다.</p>
            </div>

            <div>
              <h5 className="font-medium mb-2">📋 설정 단계:</h5>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  <strong>Google Cloud Console</strong> 접속
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                    <li>console.cloud.google.com 방문</li>
                    <li>새 프로젝트 생성 또는 기존 프로젝트 선택</li>
                  </ul>
                </li>
                <li>
                  <strong>Google Sheets API 활성화</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                    <li>API 및 서비스 → 라이브러리</li>
                    <li>"Google Sheets API" 검색 후 사용 설정</li>
                  </ul>
                </li>
                <li>
                  <strong>Service Account 생성</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                    <li>IAM 및 관리 → 서비스 계정</li>
                    <li>서비스 계정 만들기</li>
                    <li>JSON 키 다운로드</li>
                  </ul>
                </li>
                <li>
                  <strong>Google Sheets 생성 및 공유</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                    <li>새 ��프레드시트 생성</li>
                    <li>서비스 계정 이메일을 편집자로 공유</li>
                    <li>스프레드시트 ID 복사 (URL의 /d/ 다음 부분)</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="p-3 bg-white border border-green-200 rounded">
              <h5 className="font-medium mb-2">🔧 환경변수 설정 상태:</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <code className="bg-green-100 px-2 py-1 rounded text-xs">GOOGLE_SERVICE_ACCOUNT_JSON</code>
                  </div>
                  <div className="flex items-center space-x-1">
                    {configStatus.checking ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : configStatus.serviceAccount ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${
                      configStatus.checking ? 'text-blue-600' :
                      configStatus.serviceAccount ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {configStatus.checking ? '확인 중' :
                       configStatus.serviceAccount ? '설정됨' : '미설정'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <code className="bg-green-100 px-2 py-1 rounded text-xs">GOOGLE_SHEETS_SPREADSHEET_ID</code>
                  </div>
                  <div className="flex items-center space-x-1">
                    {configStatus.checking ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : configStatus.spreadsheetId ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${
                      configStatus.checking ? 'text-blue-600' :
                      configStatus.spreadsheetId ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {configStatus.checking ? '확인 중' :
                       configStatus.spreadsheetId ? '설정됨' : '미설정'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-xs text-gray-600">
                    <strong>상태 설명:</strong>
                    <div className="mt-1 space-y-1">
                      <div>• 설정됨: 환경변수가 올바르게 설정되어 있습니다</div>
                      <div>• 미설정: 환경변수가 설정되지 않았거나 형식이 잘못되었습니다</div>
                      <div>• 확인 중: 서버에서 설정 상태를 확인하고 있습니다</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h5 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h5>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>• Service Account JSON은 민감한 정보입니다. 안전하게 보관하세요.</div>
                <div>• 스프레드시트는 Service Account 이메일과 공유되어야 합니다.</div>
                <div>• 백업 데이터는 기존 데이터를 덮어씁니다.</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}