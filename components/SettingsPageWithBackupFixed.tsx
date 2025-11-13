import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { BackupTabContent } from "./BackupTabContent";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  User,
  Bell,
  Shield,
  Key,
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  Download,
  Database,
} from "lucide-react";

export function SettingsPageWithBackupFixed() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // 프로필 설정
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: '',
    position: '',
    signature: ''
  });

  // 알림 설정
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    ccpAlerts: true,
    temperatureAlerts: true,
    checklistReminders: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: false,
    smsNotifications: false,
    criticalOnly: false
  });

  // 시스템 설정 (관리자만)
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '365',
    logLevel: 'info',
    maintenanceMode: false,
    allowGuestAccess: false,
    sessionTimeout: '480', // 분
    maxLoginAttempts: '5'
  });

  // HACCP 설정
  const [haccpSettings, setHaccpSettings] = useState({
    temperatureUnit: 'celsius',
    defaultCheckFrequency: '60',
    criticalAlertDelay: '5',
    autoRecordGeneration: true,
    requireSignature: true,
    ccpAutoCheck: true,
    hazardAnalysisInterval: '30',
    reportLanguage: 'ko',
    allowManualEntry: true,
    requireManagerApproval: true,
    autoCorrectiveAction: false
  });

  // 보안 설정
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordRequirements: 'strong',
    sessionSecurity: 'high',
    apiAccess: false,
    auditLogging: true,
    ipWhitelist: '',
    passwordExpiry: '90',
    accountLockout: true,
    loginHistory: true
  });

  // 백업 관련 상태
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    autoBackup: true
  });

  // 백업 설정 상태
  const [backupConfig, setBackupConfig] = useState({
    spreadsheetId: '',
    serviceAccountJson: ''
  });
  const [configStatus, setConfigStatus] = useState<'loading' | 'success' | 'error' | null>(null);

  // 컴포넌트 마운트시 백업 설정 로드
  useEffect(() => {
    loadBackupConfig();
    loadBackupLogs();
  }, []);

  const handleSaveProfile = () => {
    toast.success('프로필이 저장되었습니다.', {
      description: '변경사항이 적용되었습니다.',
      duration: 3000,
    });
  };

  const handleSaveNotifications = () => {
    toast.success('알림 설정이 저장되었습니다.', {
      description: '알림 설정이 업데이트되었습니다.',
      duration: 3000,
    });
  };

  const handleSaveHACCP = () => {
    toast.success('HACCP 설정이 저장되었습니다.', {
      description: 'HACCP 관련 설정이 업데이트되었습니다.',
      duration: 3000,
    });
  };

  const handleSaveSecurity = () => {
    toast.success('보안 설정이 저장되었습니다.', {
      description: '보안 설정이 업데이트되었습니다.',
      duration: 3000,
    });
  };

  const handleSaveSystem = () => {
    if (!hasRole('admin')) {
      toast.error('권한이 없습니다.', {
        description: '관리자만 시스템 설정을 변경할 수 있습니다.',
        duration: 4000,
      });
      return;
    }
    
    toast.success('시스템 설정이 저장되었습니다.', {
      description: '시스템 설정이 업데이트되었습니다.',
      duration: 3000,
    });
  };

  const handleResetToDefaults = () => {
    if (confirm('모든 설정을 기본값으로 재설정하시겠습니까?')) {
      toast.success('설정이 초기화되었습니다.', {
        description: '모든 설정이 기본값으로 복원되었습니다.',
        duration: 3000,
      });
    }
  };

  // 백업 관련 함수들
  const handleManualBackup = async () => {
    // 백업 설정이 되어있는지 먼저 확인
    if (!backupConfig.spreadsheetId || !backupConfig.serviceAccountJson) {
      toast.error('백업 설정을 먼저 완료해주세요.', {
        description: '스프레드시트 ID와 서비스 어카운트 JSON이 필요합니다.',
        duration: 4000,
      });
      return;
    }

    setBackupLoading(true);
    try {
      console.log('🚀 Starting manual backup...');
      const result = await api.backupCCPRecords();
      console.log('Backup result:', result);

      if (result.success) {
        setBackupStatus('success');
        setLastBackupTime(new Date().toLocaleString('ko-KR'));
        toast.success('백업이 완료되었습니다!', {
          description: result.data?.message || 'CCP 데이터가 Google Sheets로 백업되었습니다.',
          duration: 4000,
        });
        await loadBackupLogs(); // 백업 로그 새로고침
      } else {
        setBackupStatus('failed');
        console.error('Backup failed:', result.error);
        toast.error('백업에 실패했습니다.', {
          description: result.error || '알 수 없는 오류가 발생했습니다.',
          duration: 4000,
        });
      }
    } catch (error) {
      setBackupStatus('failed');
      console.error('Manual backup error:', error);
      toast.error('백업 중 오류가 발생했습니다.', {
        description: error.message || '네트워크 연결을 확인해주세요.',
        duration: 4000,
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const loadBackupLogs = async () => {
    try {
      console.log('📄 Loading backup logs...');
      const result = await api.getBackupLogs();
      console.log('Backup logs result:', result);

      if (result.success) {
        setBackupLogs(result.data || []);
        
        // 마지막 백업 정보 설정
        const lastSuccessfulBackup = (result.data || []).find((log: any) => log.status === 'success');
        if (lastSuccessfulBackup) {
          setLastBackupTime(new Date(lastSuccessfulBackup.timestamp).toLocaleString('ko-KR'));
          setBackupStatus('success');
        }
      }
    } catch (error) {
      console.error('Failed to load backup logs:', error);
    }
  };

  // 백업 설정 저장
  const handleSaveBackupConfig = async () => {
    if (!backupConfig.serviceAccountJson) {
      toast.error('필수 설정을 입력해주세요.', {
        description: '서비스 계정 JSON이 필요합니다.',
        duration: 4000,
      });
      return;
    }

    setConfigStatus('loading');
    try {
      // JSON 형식 검증
      let serviceAccountData;
      try {
        serviceAccountData = JSON.parse(backupConfig.serviceAccountJson);
      } catch (error) {
        throw new Error('서비스 어카운트 JSON 형식이 올바르지 않습니다.');
      }

      // 필수 필드 검증
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri'];
      for (const field of requiredFields) {
        if (!serviceAccountData[field]) {
          throw new Error(`서비스 어카운트 JSON에 ${field} 필드가 누락되었습니다.`);
        }
      }

      console.log('💾 Saving backup config...');
      const result = await api.setBackupConfig({
        spreadsheet_id: backupConfig.spreadsheetId,
        service_account_json: backupConfig.serviceAccountJson
      });

      if (result.success) {
        setConfigStatus('success');
        toast.success('백업 설정이 저장되었습니다.', {
          description: '구글 스프레드시트 백업 설정이 완료되었습니다.',
          duration: 4000,
        });
      } else {
        setConfigStatus('error');
        toast.error('백업 설정 저장에 실패했습니다.', {
          description: result.error || '설정을 저장할 수 없습니다.',
          duration: 4000,
        });
      }
    } catch (error) {
      setConfigStatus('error');
      toast.error('백업 설정 오류', {
        description: error.message || '설정을 저장할 수 없습니다.',
        duration: 4000,
      });
    }
  };

  // 현재 백업 설정 로드
  const loadBackupConfig = async () => {
    try {
      console.log('📖 Loading backup config...');
      const result = await api.getBackupConfig();
      console.log('Backup config result:', result);
      
      if (result.success && result.data) {
        setBackupConfig({
          spreadsheetId: result.data.spreadsheet_id || '',
          serviceAccountJson: result.data.service_account_json || ''
        });
        setConfigStatus('success');
      }
    } catch (error) {
      console.error('Failed to load backup config:', error);
    }
  };

  // 백업 설정 테스트
  const handleTestBackupConfig = async () => {
    if (!backupConfig.spreadsheetId || !backupConfig.serviceAccountJson) {
      toast.error('설정을 먼저 저장해주세요.', {
        description: '스프레드시트 ID와 서비스 어카운트가 필요합니다.',
        duration: 4000,
      });
      return;
    }

    setBackupLoading(true);
    try {
      console.log('🔍 Testing backup connection...');
      const result = await api.testBackupConnection();
      console.log('Test connection result:', result);
      
      if (result.success) {
        toast.success('백업 설정 테스트 성공', {
          description: '구글 스프레드시트에 정상적으로 연결되었습니다.',
          duration: 4000,
        });
      } else {
        toast.error('백업 설정 테스트 실패', {
          description: result.error || '스프레드시트 연결을 확인해주세요.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Test backup error:', error);
      toast.error('백업 테스트 오류', {
        description: error.message || '연결 테스트 중 오류가 발생했습니다.',
        duration: 4000,
      });
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">설정</h1>
        </div>
        <p className="text-gray-600">시스템 및 개인 설정을 관리합니다.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${hasRole('admin') ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>프로필</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>알림</span>
          </TabsTrigger>
          <TabsTrigger value="haccp" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>HACCP</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>백업</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>보안</span>
          </TabsTrigger>
          {hasRole('admin') && (
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>시스템</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 프로필 설정 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>사용자 프로필</span>
              </CardTitle>
              <CardDescription>
                개인 정보 및 계정 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {user?.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{user?.name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <Badge className="mt-1">
                    {user?.role === 'admin' ? '관리자' : 
                     user?.role === 'manager' ? '매니저' : '작업자'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>전화번호</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>부서</Label>
                  <Input
                    value={profileForm.department}
                    onChange={(e) => setProfileForm(prev => ({...prev, department: e.target.value}))}
                    placeholder="품질관리팀"
                  />
                </div>
                <div className="space-y-2">
                  <Label>직책</Label>
                  <Input
                    value={profileForm.position}
                    onChange={(e) => setProfileForm(prev => ({...prev, position: e.target.value}))}
                    placeholder="품질관리 담당자"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>서명</Label>
                <Textarea
                  value={profileForm.signature}
                  onChange={(e) => setProfileForm(prev => ({...prev, signature: e.target.value}))}
                  placeholder="이메일 서명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleResetToDefaults}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  초기화
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>알림 설정</span>
              </CardTitle>
              <CardDescription>
                다양한 알림 유형을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">일반 알림</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>이메일 알림</Label>
                      <p className="text-sm text-gray-500">중요한 알림을 이메일로 받습니다</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, emailNotifications: checked}))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>푸시 알림</Label>
                      <p className="text-sm text-gray-500">브라우저 푸시 알림을 받습니다</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, pushNotifications: checked}))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">HACCP 알림</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>CCP 경고 알림</Label>
                      <p className="text-sm text-gray-500">중요관리점 이상 시 알림</p>
                    </div>
                    <Switch
                      checked={notificationSettings.ccpAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, ccpAlerts: checked}))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>온도 알림</Label>
                      <p className="text-sm text-gray-500">온도 이상 시 즉시 알림</p>
                    </div>
                    <Switch
                      checked={notificationSettings.temperatureAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, temperatureAlerts: checked}))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HACCP 설정 */}
        <TabsContent value="haccp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>HACCP 설정</span>
              </CardTitle>
              <CardDescription>
                HACCP 시스템 관련 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>온도 단위</Label>
                  <Input
                    value={haccpSettings.temperatureUnit}
                    onChange={(e) => setHaccpSettings(prev => ({...prev, temperatureUnit: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>기본 점검 주기 (분)</Label>
                  <Input
                    value={haccpSettings.defaultCheckFrequency}
                    onChange={(e) => setHaccpSettings(prev => ({...prev, defaultCheckFrequency: e.target.value}))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>서명 필수</Label>
                    <p className="text-sm text-gray-500">모든 기록에 서명을 필수로 합니다</p>
                  </div>
                  <Switch
                    checked={haccpSettings.requireSignature}
                    onCheckedChange={(checked) => 
                      setHaccpSettings(prev => ({...prev, requireSignature: checked}))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>CCP 자동 점검</Label>
                    <p className="text-sm text-gray-500">설정된 주기로 자동 점검을 수행합니다</p>
                  </div>
                  <Switch
                    checked={haccpSettings.ccpAutoCheck}
                    onCheckedChange={(checked) => 
                      setHaccpSettings(prev => ({...prev, ccpAutoCheck: checked}))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHACCP}>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 백업 설정 탭 */}
        <TabsContent value="backup">
          <BackupTabContent
            backupConfig={backupConfig}
            setBackupConfig={setBackupConfig}
            backupLoading={backupLoading}
            lastBackupTime={lastBackupTime}
            backupStatus={backupStatus}
            backupLogs={backupLogs}
            configStatus={configStatus}
            handleManualBackup={handleManualBackup}
            handleSaveBackupConfig={handleSaveBackupConfig}
            handleTestBackupConfig={handleTestBackupConfig}
            settings={settings}
            setSettings={setSettings}
          />
        </TabsContent>

        {/* 보안 설정 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>보안 설정</span>
              </CardTitle>
              <CardDescription>
                계정 보안 및 접근 권한을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>2단계 인증</Label>
                    <p className="text-sm text-gray-500">추가 보안을 위해 2단계 인증을 활성화합니다</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, twoFactorAuth: checked}))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>감사 로깅</Label>
                    <p className="text-sm text-gray-500">모든 사용자 활동을 기록합니다</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLogging}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, auditLogging: checked}))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity}>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 설정 */}
        {hasRole('admin') && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>시스템 설정</span>
                </CardTitle>
                <CardDescription>
                  관리자 전용 시스템 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>자동 백업</Label>
                      <p className="text-sm text-gray-500">정기적으로 자동 백업을 수행합니다</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({...prev, autoBackup: checked}))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>유지보수 모드</Label>
                      <p className="text-sm text-gray-500">시스템을 유지보수 모드로 전환합니다</p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({...prev, maintenanceMode: checked}))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>데이터 보존 기간 (일)</Label>
                    <Input
                      value={systemSettings.dataRetention}
                      onChange={(e) => setSystemSettings(prev => ({...prev, dataRetention: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>세션 타임아웃 (분)</Label>
                    <Input
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings(prev => ({...prev, sessionTimeout: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSystem}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}