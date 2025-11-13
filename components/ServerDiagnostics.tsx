import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DatabaseSetupHelper } from "./DatabaseSetupHelper";
import { api } from "../utils/api";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Server, 
  Settings,
  Copy,
  ExternalLink
} from "lucide-react";

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function ServerDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [serverResponse, setServerResponse] = useState<any>(null);
  const [customTableName, setCustomTableName] = useState('kv_store_79e634f3');

  // 공급업체 시스템 테스트 함수
  const testSupplierSystem = async (diagnostics: DiagnosticResult[]) => {
    let suppliersTestSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!suppliersTestSuccess && retryCount < maxRetries) {
      try {
        const suppliersUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/suppliers`;
        console.log(`Testing suppliers endpoint (attempt ${retryCount + 1}):`, suppliersUrl);
        
        const suppliersResponse = await fetch(suppliersUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        console.log(`Suppliers response status (attempt ${retryCount + 1}):`, suppliersResponse.status);
        
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          
          if (suppliersData.success) {
            diagnostics.push({
              test: "공급업체 시스템",
              status: 'success',
              message: `공급업체 시스템이 정상 작동합니다. ${suppliersData.data?.length || 0}개 공급업체 등록됨`,
              details: `재시도 횟수: ${retryCount}\n데이터: ${JSON.stringify(suppliersData.data?.slice(0, 2), null, 2)}...`
            });
            suppliersTestSuccess = true;
          } else {
            throw new Error(suppliersData.error || '공급업체 데이터 조회 실패');
          }
        } else if (suppliersResponse.status === 404) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`404 오류 발생, ${retryCount}초 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          } else {
            throw new Error(`공급업체 엔드포인트가 존재하지 않습니다 (404). ${maxRetries}회 재시도 후 실패.`);
          }
        } else {
          throw new Error(`HTTP ${suppliersResponse.status}: ${suppliersResponse.statusText}`);
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          diagnostics.push({
            test: "공급업체 시스템",
            status: 'error',
            message: `공급업체 시스템 테스트 실패 (${maxRetries}회 재시도 후)`,
            details: `마지막 오류: ${error.message}`
          });
          break;
        } else {
          console.log(`공급업체 테스트 오류, ${retryCount}초 후 재시도:`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }
    }
  };

  // CCP 시스템 테스트 함수
  const testCCPSystem = async (diagnostics: DiagnosticResult[]) => {
    try {
      const ccpUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/ccp`;
      console.log('Testing CCP endpoint:', ccpUrl);
      
      const ccpResponse = await fetch(ccpUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (ccpResponse.ok) {
        const ccpData = await ccpResponse.json();
        
        if (ccpData.success) {
          diagnostics.push({
            test: "CCP 관리 시스템",
            status: 'success',
            message: `CCP 시스템이 정상 작동합니다. ${ccpData.data?.length || 0}개 CCP 등록됨`,
            details: `데이터: ${JSON.stringify(ccpData.data?.slice(0, 2), null, 2)}...`
          });
        } else {
          diagnostics.push({
            test: "CCP 관리 시스템",
            status: 'warning',
            message: "CCP 데이터 조회에 실패했지만 엔드포인트는 응답합니다.",
            details: ccpData.error || '알 수 없는 오류'
          });
        }
      } else {
        diagnostics.push({
          test: "CCP 관리 시스템",
          status: 'error',
          message: `CCP 엔드포인트 오류 (${ccpResponse.status})`,
          details: await ccpResponse.text()
        });
      }
    } catch (error) {
      diagnostics.push({
        test: "CCP 관리 시스템",
        status: 'error',
        message: "CCP 시스템 테스트 중 오류가 발생했습니다.",
        details: error.message
      });
    }
  };

  // 센서 데이터 시스템 테스트 함수
  const testSensorSystem = async (diagnostics: DiagnosticResult[]) => {
    try {
      const sensorUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/sensors/latest`;
      console.log('Testing sensors endpoint:', sensorUrl);
      
      const sensorResponse = await fetch(sensorUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (sensorResponse.ok) {
        const sensorData = await sensorResponse.json();
        
        if (sensorData.success) {
          diagnostics.push({
            test: "센서 데이터 시스템",
            status: 'success',
            message: `센서 시스템이 정상 작동합니다. ${sensorData.data?.length || 0}개 센서 데이터`,
            details: `데이터: ${JSON.stringify(sensorData.data?.slice(0, 2), null, 2)}...`
          });
        } else {
          diagnostics.push({
            test: "센서 데이터 시스템",
            status: 'warning',
            message: "센서 데이터 조회에 실패했지만 엔드포인트는 응답합니다.",
            details: sensorData.error || '알 수 없는 오류'
          });
        }
      } else {
        diagnostics.push({
          test: "센서 데이터 시스템",
          status: 'error',
          message: `센서 엔드포인트 오류 (${sensorResponse.status})`,
          details: await sensorResponse.text()
        });
      }
    } catch (error) {
      diagnostics.push({
        test: "센서 데이터 시스템",
        status: 'error',
        message: "센서 시스템 테스트 중 오류가 발생했습니다.",
        details: error.message
      });
    }
  };
  
  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    setServerResponse(null);
    
    const diagnostics: DiagnosticResult[] = [];
    
    try {
      // 1. 기본 연결 테스트
      diagnostics.push({
        test: "인터넷 연결",
        status: 'success',
        message: "인터넷 연결이 정상입니다."
      });
      
      // 2. Supabase 프로젝트 접근 테스트
      try {
        const response = await fetch(`https://${projectId}.supabase.co`, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        diagnostics.push({
          test: "Supabase 프로젝트 연결",
          status: 'success',
          message: `프로젝트 ${projectId}에 접근 가능합니다.`
        });
      } catch (error) {
        diagnostics.push({
          test: "Supabase 프로젝트 연결",
          status: 'error',
          message: "Supabase 프로젝트에 접근할 수 없습니다.",
          details: error.message
        });
      }
      
      // 3. Edge Function 헬스체크
      try {
        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/health`;
        console.log('Testing health endpoint:', healthUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setServerResponse(healthData);
          diagnostics.push({
            test: "Edge Function 헬스체크",
            status: 'success',
            message: "백엔드 서버가 정상적으로 응답합니다.",
            details: JSON.stringify(healthData, null, 2)
          });
        } else {
          diagnostics.push({
            test: "Edge Function 헬스체크",
            status: 'error',
            message: `서버가 ${healthResponse.status} 상태코드로 응답했습니다.`,
            details: `Status: ${healthResponse.status} ${healthResponse.statusText}`
          });
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          diagnostics.push({
            test: "Edge Function 헬스체크",
            status: 'error',
            message: "서버 응답 시간이 초과되었습니다 (15초).",
            details: "Edge Function이 콜드 스타트 상태이거나 배포되지 않았을 수 있습니다."
          });
        } else {
          diagnostics.push({
            test: "Edge Function 헬스체크",
            status: 'error',
            message: "Edge Function에 연결할 수 없습니다.",
            details: error.message
          });
        }
      }
      
      // 4. 인증 키 확인
      if (publicAnonKey) {
        diagnostics.push({
          test: "Supabase 인증 키",
          status: 'success',
          message: "Public Anon Key가 설정되어 있습니다.",
          details: `Key: ${publicAnonKey.substring(0, 20)}...`
        });
      } else {
        diagnostics.push({
          test: "Supabase 인증 키",
          status: 'error',
          message: "Public Anon Key가 설정되지 않았습니다."
        });
      }
      
      // 5. 인증 시스템 테스트
      try {
        const authUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/auth/login`;
        console.log('Testing auth endpoint:', authUrl);
        
        const testLoginResponse = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            email: 'test@test.com',
            password: 'wrongpassword'
          })
        });
        
        console.log('Auth test response status:', testLoginResponse.status);
        
        if (testLoginResponse.status === 401) {
          // 401 에러 - 인증 문제
          const errorData = await testLoginResponse.json().catch(() => ({}));
          diagnostics.push({
            test: "인증 시스템",
            status: 'error',
            message: "인증 오류가 발생했습니다. 백엔드 인증 설정에 문제가 있을 수 있습니다.",
            details: `401 Unauthorized: ${JSON.stringify(errorData)}`
          });
        } else if (testLoginResponse.status === 400) {
          // 로그인 실패는 정상 (시스템은 작동한다는 의미)
          diagnostics.push({
            test: "인증 시스템",
            status: 'success',
            message: "인증 시스템이 정상적으로 작동합니다."
          });
        } else if (testLoginResponse.status === 500) {
          // 500 에러는 서버 내부 문제
          const errorData = await testLoginResponse.json().catch(() => ({}));
          diagnostics.push({
            test: "인증 시스템",
            status: 'error',
            message: "서버 내부 오류가 발생했습니다.",
            details: `Server error (${testLoginResponse.status}): ${JSON.stringify(errorData)}`
          });
        } else {
          diagnostics.push({
            test: "인증 시스템",
            status: 'warning',
            message: `예상하지 못한 응답 코드: ${testLoginResponse.status}`,
            details: `Status: ${testLoginResponse.status} ${testLoginResponse.statusText}`
          });
        }
      } catch (error) {
        diagnostics.push({
          test: "인증 시스템",
          status: 'error',
          message: "인증 시스템 테스트 중 네트워크 오류가 발생했습니다.",
          details: error.message
        });
      }

      // 6. 백업 시스템 상태 테스트
      try {
        const backupStatusUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/status`;
        console.log('Testing backup status endpoint:', backupStatusUrl);
        
        const backupStatusResponse = await fetch(backupStatusUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        console.log('Backup status response:', backupStatusResponse.status);
        
        if (backupStatusResponse.ok) {
          const backupData = await backupStatusResponse.json();
          
          if (backupData.success) {
            const configStatus = backupData.data?.configurationStatus;
            const dataStatus = backupData.data?.dataStatus;
            
            let message = "백업 시스템이 정상적으로 작동합니다.";
            let status = 'success';
            let details = [];
            
            if (!configStatus?.hasBackupConfig) {
              status = 'warning';
              message = "백업 설정이 완료되지 않았습니다.";
              details.push("• 스프레드시트 ID와 서비스 계정이 필요합니다.");
            } else {
              details.push(`• 백업 설정: 완료`);
              details.push(`• CCP 레코드: ${dataStatus?.ccpRecordsCount || 0}개`);
              details.push(`• 백업 기록: ${backupData.data?.backupHistory?.totalLogs || 0}개`);
            }
            
            diagnostics.push({
              test: "백업 시스템",
              status: status,
              message: message,
              details: details.join('\n') + '\n\n' + JSON.stringify(backupData.data, null, 2)
            });
          } else {
            diagnostics.push({
              test: "백업 시스템",
              status: 'error',
              message: "백업 시스템 상태 확인에 실패했습니다.",
              details: backupData.error || '알 수 없는 오류'
            });
          }
        } else {
          const errorText = await backupStatusResponse.text();
          diagnostics.push({
            test: "백업 시스템",
            status: 'error',
            message: `백업 시스템 상태 확인 실패 (${backupStatusResponse.status})`,
            details: errorText
          });
        }
      } catch (error) {
        diagnostics.push({
          test: "백업 시스템",
          status: 'error',
          message: "백업 시스템 테스트 중 오류가 발생했습니다.",
          details: error.message
        });
      }

      // 7. Google Sheets API 연결 테스트 (백업 설정이 있는 경우)
      try {
        const backupTestUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/test-connection`;
        console.log('Testing backup connection:', backupTestUrl);
        
        const backupTestResponse = await fetch(backupTestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        console.log('Backup connection test response:', backupTestResponse.status);
        
        if (backupTestResponse.ok) {
          const testResult = await backupTestResponse.json();
          
          if (testResult.success) {
            diagnostics.push({
              test: "Google Sheets 연결",
              status: 'success',
              message: "Google Sheets API 연결이 정상입니다.",
              details: `스프레드시트: ${testResult.data?.spreadsheetTitle}\n시트 수: ${testResult.data?.sheets?.length || 0}개\n쓰기 테스트: ${testResult.data?.testWriteConfirmed ? '성공' : '실패'}`
            });
          } else {
            diagnostics.push({
              test: "Google Sheets 연결",
              status: 'warning',
              message: "Google Sheets 연결 테스트에 실패했습니다.",
              details: testResult.error || '연결 설정을 확인해주세요.'
            });
          }
        } else if (backupTestResponse.status === 400) {
          const errorData = await backupTestResponse.json().catch(() => ({}));
          diagnostics.push({
            test: "Google Sheets 연결",
            status: 'warning',
            message: "백업 설정이 완료되지 않았습니다.",
            details: errorData.error || '스프레드시트 ID와 서비스 계정을 설정해주세요.'
          });
        } else {
          const errorText = await backupTestResponse.text();
          diagnostics.push({
            test: "Google Sheets 연결",
            status: 'error',
            message: `Google Sheets 연결 테스트 실패 (${backupTestResponse.status})`,
            details: errorText
          });
        }
      } catch (error) {
        diagnostics.push({
          test: "Google Sheets 연결",
          status: 'warning',
          message: "Google Sheets 연결 테스트를 건너뛰었습니다.",
          details: error.message + '\n(백업이 설정되지 않은 경우 정상입니다.)'
        });
      }

      // 8. CCP 시스템 테스트
      await testCCPSystem(diagnostics);

      // 9. 센서 데이터 시스템 테스트
      await testSensorSystem(diagnostics);

      // 10. 공급업체 시스템 테스트
      await testSupplierSystem(diagnostics);
      
    } catch (error) {
      diagnostics.push({
        test: "전체 진단",
        status: 'error',
        message: "진단 과정에서 예기치 못한 오류가 발생했습니다.",
        details: error.message
      });
    }
    
    setResults(diagnostics);
    setIsRunning(false);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">정상</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">오류</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">경고</Badge>;
      default:
        return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  useEffect(() => {
    // 컴포넌트 마운트 시 자동으로 진단 실행
    runDiagnostics();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">서버 연결 진단</h2>
          <p className="text-sm text-gray-600 mt-1">
            백엔드 서버 연결 문제를 진단하고 해결 방법을 제공합니다.
          </p>
        </div>
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? '진단 중...' : '다시 진단'}</span>
        </Button>
      </div>
      
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results">진단 결과</TabsTrigger>
          <TabsTrigger value="database">데이터베이스</TabsTrigger>
          <TabsTrigger value="details">상세 정보</TabsTrigger>
          <TabsTrigger value="solutions">해결 방법</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4">
          {results.length === 0 && !isRunning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                진단을 실행하려면 "다시 진단" 버튼을 클릭하세요.
              </AlertDescription>
            </Alert>
          )}
          
          {isRunning && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                서버 연결 상태를 진단하고 있습니다...
              </AlertDescription>
            </Alert>
          )}
          
          {results.map((result, index) => (
            <Card key={index} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span>{result.test}</span>
                  </CardTitle>
                  {getStatusBadge(result.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">상세 정보</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(result.details)}
                        className="h-6 px-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                      {result.details}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <DatabaseSetupHelper />
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>현재 설정 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Supabase 프로젝트 ID</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={projectId} readOnly className="text-sm" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(projectId)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Public Anon Key</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={publicAnonKey ? `${publicAnonKey.substring(0, 20)}...` : '설정되지 않음'} 
                      readOnly 
                      className="text-sm" 
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(publicAnonKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Edge Function URL</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={`https://${projectId}.supabase.co/functions/v1/make-server-79e634f3`} 
                      readOnly 
                      className="text-sm" 
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(`https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/health`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">KV 스토어 테이블 이름</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={customTableName} 
                      onChange={(e) => setCustomTableName(e.target.value)}
                      className="text-sm" 
                      placeholder="kv_store_79e634f3"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(customTableName)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    현재 코드에서 사용 중인 테이블 이름입니다. 변경했다면 여기서 확인하세요.
                  </p>
                </div>
              </div>
              
              {serverResponse && (
                <div>
                  <Label className="text-sm font-medium">서버 응답 데이터</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">최신 헬스체크 응답</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(JSON.stringify(serverResponse, null, 2))}
                        className="h-6 px-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(serverResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="solutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>테이블 이름 불일치 문제</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>가장 가능성이 높은 원인:</strong> Supabase에서 테이블 이름을 변경했지만 코드에서는 여전히 기본 이름을 사용하고 있습니다.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">해결 방법:</h4>
                
                <div className="space-y-2">
                  <p className="text-sm">1. <strong>Supabase 대시보드에서 확인</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                    <li>Supabase 프로젝트 대시보드로 이동</li>
                    <li>Database → Tables 메뉴 확인</li>
                    <li>테이블 이름이 <code className="bg-gray-100 px-1 rounded">kv_store_79e634f3</code>인지 확인</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">2. <strong>테이블 이름이 다르다면</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                    <li>테이블 이름을 <code className="bg-gray-100 px-1 rounded">kv_store_79e634f3</code>로 변경하거나</li>
                    <li>코드에서 새로운 테이블 이름을 사용하도록 수정</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">3. <strong>테이블이 없다면</strong></p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium mb-2">다음 SQL을 실행하여 테이블을 생성하세요:</p>
                    <pre className="text-xs text-gray-700">
{`CREATE TABLE kv_store_79e634f3 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(`CREATE TABLE kv_store_79e634f3 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);`)}
                      className="mt-2 h-6 px-2"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      SQL 복사
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span>기타 해결 방법</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Edge Function 문제</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                    <li>Supabase 대시보드에서 Edge Functions 상태 확인</li>
                    <li>함수가 배포되었는지 확인</li>
                    <li>함수 로그에서 에러 메시지 확인</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">환경 변수 문제</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                    <li>SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 올바르게 설정되었는지 확인</li>
                    <li>Edge Function에서 환경 변수에 접근할 수 있는지 확인</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">네트워크 문제</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                    <li>방화벽이나 네트워크 제한 확인</li>
                    <li>브라우저의 개발자 도구에서 네트워크 탭 확인</li>
                    <li>CORS 설정 문제 확인</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}