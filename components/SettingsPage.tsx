import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import {
  User,
  Bell,
  Shield,
  Monitor,
  Globe,
  Database,
  Key,
  Save,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
  Settings as SettingsIcon,
  Thermometer,
  Clock,
  FileText,
  Plus,
  Edit,
  Download,
  Upload
} from "lucide-react";

export function SettingsPage() {
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
    monthlyReports: false
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
    defaultCheckFrequency: '60', // 분
    criticalAlertDelay: '5', // 분
    autoRecordGeneration: true,
    requireSignature: true,
    ccpAutoCheck: true,
    hazardAnalysisInterval: '30', // 일
    reportLanguage: 'ko'
  });

  // CCP 타입 관리
  const [ccpTypes, setCCPTypes] = useState([
    {
      id: 'oven_bread',
      name: '오븐공정_빵류',
      description: '빵류 제품의 오븐 가열 공정 관리',
      fields: [
        { key: 'productName', label: '품명', type: 'text', required: true },
        { key: 'measureTime', label: '측정시각', type: 'datetime-local', required: true },
        { key: 'heatingTemp', label: '가열온도', type: 'number', required: true, unit: '°C' },
        { key: 'heatingTime', label: '가열시간', type: 'number', required: true, unit: '분' },
        { key: 'productTempAfter', label: '가열 후 품온', type: 'number', required: true, unit: '°C' },
        { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
        { key: 'signature', label: '서명', type: 'text', required: true }
      ]
    },
    {
      id: 'cream_manufacturing',
      name: '크림제조 공정',
      description: '크림류 제품의 제조 및 품질 관리',
      fields: [
        { key: 'productName', label: '품명', type: 'text', required: true },
        { key: 'mixingTime', label: '배합시간', type: 'time', required: true },
        { key: 'mixingAmount', label: '배합량', type: 'number', required: true, unit: 'kg' },
        { key: 'tempAfterManufacture', label: '품온(제조직후)', type: 'number', required: true, unit: '°C' },
        { key: 'tempBeforeConsume', label: '품온(소진직전)', type: 'number', required: true, unit: '°C' },
        { key: 'consumeTime', label: '소진시간', type: 'time', required: true },
        { key: 'workplaceTemp', label: '작업장온도', type: 'number', required: true, unit: '°C' },
        { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
        { key: 'signature', label: '서명', type: 'text', required: true }
      ]
    },
    {
      id: 'washing_process',
      name: '세척공정',
      description: '용기 및 기구의 세척 및 위생 관리',
      fields: [
        { key: 'productName', label: '품명', type: 'text', required: true },
        { key: 'measureTime', label: '측정시각', type: 'datetime-local', required: true },
        { key: 'materialAmount', label: '원료량', type: 'number', required: true, unit: 'kg' },
        { key: 'washWaterAmount', label: '세척수량', type: 'number', required: true, unit: 'L' },
        { key: 'washTime', label: '세척시간', type: 'number', required: true, unit: '분' },
        { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
        { key: 'signature', label: '서명', type: 'text', required: true }
      ]
    },
    {
      id: 'metal_detection',
      name: '금속검출공정',
      description: '완제품의 금속 이물질 검출 및 제거',
      fields: [
        { key: 'productName', label: '품명', type: 'text', required: true },
        { key: 'passTime', label: '통과시간', type: 'datetime-local', required: true },
        { key: 'feOnly', label: 'Fe만통과', type: 'checkbox' },
        { key: 'susOnly', label: 'Sus만 통과', type: 'checkbox' },
        { key: 'productOnly', label: '제품만 통과', type: 'checkbox' },
        { key: 'feWithProduct', label: 'Fe+제품통과', type: 'checkbox' },
        { key: 'susWithProduct', label: 'Sus+제품통과', type: 'checkbox' },
        { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
        { key: 'signature', label: '서명', type: 'text', required: true }
      ]
    }
  ]);

  const [showCCPTypeDialog, setShowCCPTypeDialog] = useState(false);
  const [editingCCPType, setEditingCCPType] = useState<any>(null);
  const [ccpTypeForm, setCCPTypeForm] = useState({
    id: '',
    name: '',
    description: '',
    fields: []
  });

  // 백업 관련 상태
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    autoBackup: true
  });

  // 보안 설정
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordRequirements: 'strong',
    sessionSecurity: 'high',
    apiAccess: false,
    auditLogging: true,
    ipWhitelist: ''
  });

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

  const handleAddCCPType = () => {
    setCCPTypeForm({
      id: '',
      name: '',
      description: '',
      fields: []
    });
    setEditingCCPType(null);
    setShowCCPTypeDialog(true);
  };

  const handleEditCCPType = (ccpType: any) => {
    setCCPTypeForm({
      id: ccpType.id,
      name: ccpType.name,
      description: ccpType.description,
      fields: [...ccpType.fields]
    });
    setEditingCCPType(ccpType);
    setShowCCPTypeDialog(true);
  };

  const handleSaveCCPType = () => {
    if (!ccpTypeForm.id || !ccpTypeForm.name) {
      toast.error('필수 필드를 입력해주세요.', {
        description: 'CCP 타입 ID와 이름은 필수입니다.',
        duration: 4000,
      });
      return;
    }

    if (editingCCPType) {
      // 수정
      setCCPTypes(prev => prev.map(type => 
        type.id === editingCCPType.id ? { ...ccpTypeForm } : type
      ));
      toast.success('CCP 타입이 수정되었습니다.', {
        description: `${ccpTypeForm.name} 타입이 업데이트되었습니다.`,
        duration: 3000,
      });
    } else {
      // 추가
      if (ccpTypes.find(type => type.id === ccpTypeForm.id)) {
        toast.error('이미 존재하는 CCP 타입 ID입니다.', {
          description: '다른 ID를 사용해주세요.',
          duration: 4000,
        });
        return;
      }
      setCCPTypes(prev => [...prev, { ...ccpTypeForm }]);
      toast.success('새 CCP 타입이 추가되었습니다.', {
        description: `${ccpTypeForm.name} 타입이 생성되었습니다.`,
        duration: 3000,
      });
    }

    setShowCCPTypeDialog(false);
  };

  const handleDeleteCCPType = (ccpType: any) => {
    if (confirm(`${ccpType.name} CCP 타입을 삭제하시겠습니까?\n이 타입을 사용하는 모든 CCP에 영향을 미칠 수 있습니다.`)) {
      setCCPTypes(prev => prev.filter(type => type.id !== ccpType.id));
      toast.success('CCP 타입이 삭제되었습니다.', {
        description: `${ccpType.name} 타입이 제거되었습니다.`,
        duration: 3000,
      });
    }
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
    setBackupLoading(true);
    try {
      const result = await api.backupCCPRecords();

      if (result.success) {
        setBackupStatus('success');
        setLastBackupTime(new Date().toLocaleString('ko-KR'));
        toast.success('백업이 완료되었습니다.', {
          description: `${result.data.message}`,
          duration: 4000,
        });
        loadBackupLogs(); // 백업 로그 새로고침
      } else {
        setBackupStatus('failed');
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

  const loadBackupLogs = async () => {
    try {
      const result = await api.getBackupLogs();

      if (result.success) {
        setBackupLogs(result.data || []);
        
        // 마지막 백업 정보 설정
        const lastSuccessfulBackup = result.data.find((log: any) => log.status === 'success');
        if (lastSuccessfulBackup) {
          setLastBackupTime(new Date(lastSuccessfulBackup.timestamp).toLocaleString('ko-KR'));
          setBackupStatus('success');
        }
      }
    } catch (error) {
      console.error('Failed to load backup logs:', error);
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
        <TabsList className="grid w-full grid-cols-5">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>시스템 알림</Label>
                      <p className="text-sm text-gray-500">시스템 관련 알림을 받습니다</p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, systemAlerts: checked}))
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
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>체크리스트 알림</Label>
                      <p className="text-sm text-gray-500">체크리스트 미완료 시 알림</p>
                    </div>
                    <Switch
                      checked={notificationSettings.checklistReminders}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, checklistReminders: checked}))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">보고서 알림</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>주간 보고서</Label>
                      <p className="text-sm text-gray-500">매주 자동 생성된 보고서</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, weeklyReports: checked}))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>월간 보고서</Label>
                      <p className="text-sm text-gray-500">매월 자동 생성된 보고서</p>
                    </div>
                    <Switch
                      checked={notificationSettings.monthlyReports}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({...prev, monthlyReports: checked}))
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
                식품안전 관리시스템 관련 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Thermometer className="w-4 h-4" />
                    <span>온도 관리</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>온도 단위</Label>
                      <Select 
                        value={haccpSettings.temperatureUnit} 
                        onValueChange={(value) => setHaccpSettings(prev => ({...prev, temperatureUnit: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="celsius">섭씨 (°C)</SelectItem>
                          <SelectItem value="fahrenheit">화씨 (°F)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>임계 알림 지연시간 (분)</Label>
                      <Input
                        type="number"
                        value={haccpSettings.criticalAlertDelay}
                        onChange={(e) => setHaccpSettings(prev => ({...prev, criticalAlertDelay: e.target.value}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>점검 주기</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>기본 점검 주기 (분)</Label>
                      <Input
                        type="number"
                        value={haccpSettings.defaultCheckFrequency}
                        onChange={(e) => setHaccpSettings(prev => ({...prev, defaultCheckFrequency: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>위험분석 갱신 주기 (일)</Label>
                      <Input
                        type="number"
                        value={haccpSettings.hazardAnalysisInterval}
                        onChange={(e) => setHaccpSettings(prev => ({...prev, hazardAnalysisInterval: e.target.value}))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>CCP 타입 관리</span>
                  </h4>
                  {hasRole('admin') && (
                    <Button size="sm" onClick={handleAddCCPType}>
                      <Plus className="w-4 h-4 mr-2" />
                      새 타입 추가
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {ccpTypes.map((ccpType) => (
                    <div key={ccpType.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-medium">{ccpType.name}</h5>
                          <p className="text-sm text-gray-600">{ccpType.description}</p>
                        </div>
                        {hasRole('admin') && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCCPType(ccpType)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCCPType(ccpType)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        필드 {ccpType.fields.length}개: {ccpType.fields.slice(0, 3).map(f => f.label).join(', ')}
                        {ccpType.fields.length > 3 && ` 외 ${ccpType.fields.length - 3}개`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>기록 관리</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>자동 기록 생성</Label>
                      <p className="text-sm text-gray-500">센서 데이터를 자동으로 기록에 추가</p>
                    </div>
                    <Switch
                      checked={haccpSettings.autoRecordGeneration}
                      onCheckedChange={(checked) => 
                        setHaccpSettings(prev => ({...prev, autoRecordGeneration: checked}))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>서명 필수</Label>
                      <p className="text-sm text-gray-500">모든 기록에 서명을 필수로 요구</p>
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
                      <p className="text-sm text-gray-500">설정된 주기에 따라 자동 점검 실행</p>
                    </div>
                    <Switch
                      checked={haccpSettings.ccpAutoCheck}
                      onCheckedChange={(checked) => 
                        setHaccpSettings(prev => ({...prev, ccpAutoCheck: checked}))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>보고서 언어</Label>
                <Select 
                  value={haccpSettings.reportLanguage} 
                  onValueChange={(value) => setHaccpSettings(prev => ({...prev, reportLanguage: value}))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* CCP 타입 관리 다이얼로그 */}
        {showCCPTypeDialog && (
          <Dialog open={showCCPTypeDialog} onOpenChange={setShowCCPTypeDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCCPType ? 'CCP 타입 수정' : '새 CCP 타입 추가'}
                </DialogTitle>
                <DialogDescription>
                  CCP 타입의 기본 정보와 필드 구성을 설정합니다.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>타입 ID</Label>
                    <Input
                      value={ccpTypeForm.id}
                      onChange={(e) => setCCPTypeForm(prev => ({...prev, id: e.target.value}))}
                      placeholder="예: new_process_type"
                      disabled={!!editingCCPType}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>타입 이름</Label>
                    <Input
                      value={ccpTypeForm.name}
                      onChange={(e) => setCCPTypeForm(prev => ({...prev, name: e.target.value}))}
                      placeholder="예: 새로운 공정"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea
                    value={ccpTypeForm.description}
                    onChange={(e) => setCCPTypeForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="이 CCP 타입에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">필드 구성</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newField = {
                          key: '',
                          label: '',
                          type: 'text',
                          required: false
                        };
                        setCCPTypeForm(prev => ({
                          ...prev,
                          fields: [...prev.fields, newField]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      필드 추가
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {ccpTypeForm.fields.map((field: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <Input
                            value={field.key}
                            onChange={(e) => {
                              const newFields = [...ccpTypeForm.fields];
                              newFields[index] = { ...field, key: e.target.value };
                              setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                            }}
                            placeholder="필드 키"
                            className="text-sm"
                          />
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const newFields = [...ccpTypeForm.fields];
                              newFields[index] = { ...field, label: e.target.value };
                              setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                            }}
                            placeholder="필드 이름"
                            className="text-sm"
                          />
                          <Select
                            value={field.type}
                            onValueChange={(value) => {
                              const newFields = [...ccpTypeForm.fields];
                              newFields[index] = { ...field, type: value };
                              setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                            }}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">텍스트</SelectItem>
                              <SelectItem value="number">숫자</SelectItem>
                              <SelectItem value="datetime-local">날짜시간</SelectItem>
                              <SelectItem value="time">시간</SelectItem>
                              <SelectItem value="select">선택</SelectItem>
                              <SelectItem value="checkbox">체크박스</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFields = ccpTypeForm.fields.filter((_, i) => i !== index);
                              setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                            }}
                            className="h-8 w-8 p-0 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.required}
                              onCheckedChange={(checked) => {
                                const newFields = [...ccpTypeForm.fields];
                                newFields[index] = { ...field, required: checked };
                                setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                              }}
                            />
                            <Label className="text-sm">필수</Label>
                          </div>
                          {field.type === 'number' && (
                            <Input
                              value={field.unit || ''}
                              onChange={(e) => {
                                const newFields = [...ccpTypeForm.fields];
                                newFields[index] = { ...field, unit: e.target.value };
                                setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                              }}
                              placeholder="단위"
                              className="text-sm w-20"
                            />
                          )}
                          {field.type === 'select' && (
                            <Input
                              value={field.options?.join(',') || ''}
                              onChange={(e) => {
                                const newFields = [...ccpTypeForm.fields];
                                newFields[index] = { 
                                  ...field, 
                                  options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                };
                                setCCPTypeForm(prev => ({ ...prev, fields: newFields }));
                              }}
                              placeholder="옵션 (쉼표로 구분)"
                              className="text-sm flex-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCCPTypeDialog(false)}
                  >
                    취소
                  </Button>
                  <Button onClick={handleSaveCCPType}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

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
              <div className="space-y-4">
                <h4 className="font-medium">인증 설정</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>2단계 인증</Label>
                      <p className="text-sm text-gray-500">로그인 시 추가 인증 단계</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({...prev, twoFactorAuth: checked}))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>비밀번호 요구사항</Label>
                    <Select 
                      value={securitySettings.passwordRequirements} 
                      onValueChange={(value) => setSecuritySettings(prev => ({...prev, passwordRequirements: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">기본 (8자 이상)</SelectItem>
                        <SelectItem value="strong">강함 (특수문자, 숫자 포함)</SelectItem>
                        <SelectItem value="very-strong">매우 강함 (대소문자, 특수문자, 숫자)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">세션 관리</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>세션 보안 수준</Label>
                    <Select 
                      value={securitySettings.sessionSecurity} 
                      onValueChange={(value) => setSecuritySettings(prev => ({...prev, sessionSecurity: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">낮음</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="high">높음</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>API 접근 허용</Label>
                      <p className="text-sm text-gray-500">외부 API 접근을 허용합니다</p>
                    </div>
                    <Switch
                      checked={securitySettings.apiAccess}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({...prev, apiAccess: checked}))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">감사 및 로깅</h4>
                <div className="space-y-3">
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
                  <div className="space-y-2">
                    <Label>IP 화이트리스트</Label>
                    <Textarea
                      value={securitySettings.ipWhitelist}
                      onChange={(e) => setSecuritySettings(prev => ({...prev, ipWhitelist: e.target.value}))}
                      placeholder="허용할 IP 주소를 한 줄씩 입력하세요"
                      rows={3}
                    />
                  </div>
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

        {/* 시스템 설정 (관리자만) */}
        {hasRole('admin') && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>시스템 설정</span>
                  <Badge className="bg-red-100 text-red-800">관리자 전용</Badge>
                </CardTitle>
                <CardDescription>
                  시스템 전체 설정을 관리합니다. 신중하게 변경하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">주의사항</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    시스템 설정 변경은 전체 사용자에게 영향을 미칩니다. 변경 전 충분히 검토하세요.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">백업 설정</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>자동 백업</Label>
                        <p className="text-sm text-gray-500">시스템 데이터 자동 백업</p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => 
                          setSystemSettings(prev => ({...prev, autoBackup: checked}))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>백업 주기</Label>
                      <Select 
                        value={systemSettings.backupFrequency} 
                        onValueChange={(value) => setSystemSettings(prev => ({...prev, backupFrequency: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">매시간</SelectItem>
                          <SelectItem value="daily">매일</SelectItem>
                          <SelectItem value="weekly">매주</SelectItem>
                          <SelectItem value="monthly">매월</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>데이터 보존 기간 (일)</Label>
                      <Input
                        type="number"
                        value={systemSettings.dataRetention}
                        onChange={(e) => setSystemSettings(prev => ({...prev, dataRetention: e.target.value}))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">시스템 제어</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>유지보수 모드</Label>
                        <p className="text-sm text-gray-500">시스템 점검을 위해 접근 제한</p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => 
                          setSystemSettings(prev => ({...prev, maintenanceMode: checked}))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>게스트 접근 허용</Label>
                        <p className="text-sm text-gray-500">비회원 사용자의 제한된 접근</p>
                      </div>
                      <Switch
                        checked={systemSettings.allowGuestAccess}
                        onCheckedChange={(checked) => 
                          setSystemSettings(prev => ({...prev, allowGuestAccess: checked}))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>세션 타임아웃 (분)</Label>
                      <Input
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings(prev => ({...prev, sessionTimeout: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>로그 레벨</Label>
                      <Select 
                        value={systemSettings.logLevel} 
                        onValueChange={(value) => setSystemSettings(prev => ({...prev, logLevel: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="destructive" onClick={handleResetToDefaults}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    모든 설정 초기화
                  </Button>
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