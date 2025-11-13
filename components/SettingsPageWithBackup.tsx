import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { BackupConfigurePage } from "./BackupConfigurePage";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  User,
  Bell,
  Shield,
  Key,
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  Thermometer,
  Clock,
  FileText,
  Download,
  Users,
  Database,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
} from "lucide-react";

export function SettingsPageWithBackup() {
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

  const handleResetToDefaults = () => {
    if (confirm('모든 설정을 기본값으로 재설정하시겠습니까?')) {
      toast.success('설정이 초기화되었습니다.', {
        description: '모든 설정이 기본값으로 복원되었습니다.',
        duration: 3000,
      });
    }
  };

  // CCP 타입 관리 함수들
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
                <span>HACCP 기본 설정</span>
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
                      <select 
                        value={haccpSettings.temperatureUnit} 
                        onChange={(e) => setHaccpSettings(prev => ({...prev, temperatureUnit: e.target.value}))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="celsius">섭씨 (°C)</option>
                        <option value="fahrenheit">화씨 (°F)</option>
                      </select>
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
                      <Label>위험 분석 주기 (일)</Label>
                      <Input
                        type="number"
                        value={haccpSettings.hazardAnalysisInterval}
                        onChange={(e) => setHaccpSettings(prev => ({...prev, hazardAnalysisInterval: e.target.value}))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>기록 관리</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>자동 기록 생성</Label>
                      <p className="text-sm text-gray-500">센서 데이터를 자동으로 기록</p>
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
                      <p className="text-sm text-gray-500">모든 기록에 서명 필수</p>
                    </div>
                    <Switch
                      checked={haccpSettings.requireSignature}
                      onCheckedChange={(checked) => 
                        setHaccpSettings(prev => ({...prev, requireSignature: checked}))
                      }
                    />
                  </div>
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

        {/* 백업 설정 */}
        <TabsContent value="backup">
          <BackupConfigurePage />
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
                계정 보안 및 인증 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">인증 설정</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>2단계 인증</Label>
                      <p className="text-sm text-gray-500">로그인 시 추가 보안 단계</p>
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
                      <Label>계정 잠금</Label>
                      <p className="text-sm text-gray-500">로그인 실패 시 계정 잠금</p>
                    </div>
                    <Switch
                      checked={securitySettings.accountLockout}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({...prev, accountLockout: checked}))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>감사 로깅</Label>
                      <p className="text-sm text-gray-500">사용자 활동 로그 기록</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({...prev, auditLogging: checked}))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">비밀번호 설정</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>비밀번호 만료 기간 (일)</Label>
                    <Input
                      type="number"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings(prev => ({...prev, passwordExpiry: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>비밀번호 강도</Label>
                    <select 
                      value={securitySettings.passwordRequirements} 
                      onChange={(e) => setSecuritySettings(prev => ({...prev, passwordRequirements: e.target.value}))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="weak">약함</option>
                      <option value="medium">보통</option>
                      <option value="strong">강함</option>
                    </select>
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
                  <span>시스템 관리</span>
                </CardTitle>
                <CardDescription>
                  시스템 전반의 설정을 관리합니다. (관리자만 접근 가능)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    🔧 시스템 관리 기능은 개발 중입니다. 추후 업데이트를 통해 제공될 예정입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}