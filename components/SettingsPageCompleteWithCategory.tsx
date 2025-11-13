import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { BackupConfigurePage } from "./BackupConfigurePage";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChecklistCategorySection } from "./ChecklistCategorySection";
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
  Monitor,
  Globe,
  CheckSquare,
  PlayCircle,
  Calendar,
  History,
  ExternalLink,
  Loader2
} from "lucide-react";

export function SettingsPageCompleteWithCategory() {
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

  // 체크리스트 카테고리 관리
  const [checklistCategories, setChecklistCategories] = useState([
    { id: 1, name: '입고 관리', description: '식재료 및 원료 입고 관련 점검 항목', color: 'blue', active: true },
    { id: 2, name: '조리 관리', description: '조리 과정 및 온도 관리 점검 항목', color: 'green', active: true },
    { id: 3, name: '보관 관리', description: '냉장/냉동 보관 상태 점검 항목', color: 'purple', active: true },
    { id: 4, name: '위생 관리', description: '개인위생 및 작업장 청결 점검 항목', color: 'yellow', active: true },
    { id: 5, name: '설비 관리', description: '장비 및 설비 점검 항목', color: 'red', active: true },
    { id: 6, name: '기타', description: '기타 일반 점검 항목', color: 'gray', active: true }
  ]);
  
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    description: '',
    color: 'blue',
    active: true
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

  // 체크리스트 카테고리 관리 함수들
  const handleAddCategory = () => {
    setCategoryForm({
      id: null,
      name: '',
      description: '',
      color: 'blue',
      active: true
    });
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (category: any) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      active: category.active
    });
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.', {
        description: '카테고리 이름은 필수입니다.',
        duration: 4000,
      });
      return;
    }

    if (editingCategory) {
      // 수정
      setChecklistCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? { ...categoryForm, id: editingCategory.id } : cat
      ));
      toast.success('카테고리가 수정되었습니다.', {
        description: `${categoryForm.name} 카테고리가 업데이트되었습니다.`,
        duration: 3000,
      });
    } else {
      // 추가
      const newId = Math.max(...checklistCategories.map(cat => cat.id), 0) + 1;
      setChecklistCategories(prev => [...prev, { ...categoryForm, id: newId }]);
      toast.success('새 카테고리가 추가되었습니다.', {
        description: `${categoryForm.name} 카테고리가 생성되었습니다.`,
        duration: 3000,
      });
    }

    setShowCategoryDialog(false);
  };

  const handleDeleteCategory = (category: any) => {
    if (confirm(`${category.name} 카테고리를 삭제하시겠습니까?\n이 카테고리를 사용하는 모든 체크리스트에 영향을 미칠 수 있습니다.`)) {
      setChecklistCategories(prev => prev.filter(cat => cat.id !== category.id));
      toast.success('카테고리가 삭제되었습니다.', {
        description: `${category.name} 카테고리가 제거되었습니다.`,
        duration: 3000,
      });
    }
  };

  const handleToggleCategoryActive = (categoryId: number) => {
    setChecklistCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, active: !cat.active } : cat
    ));
  };

  const getCategoryColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // 백업 관련 함수들
  const handleManualBackup = async () => {
    setBackupLoading(true);
    setBackupStatus('pending');
    
    try {
      console.log('🔄 수동 백업 시작...');
      const result = await api.backupCCPRecords();
      console.log('📋 백업 결과:', result);

      if (result.success) {
        setBackupStatus('success');
        setLastBackupTime(new Date().toLocaleString('ko-KR'));
        toast.success('백업이 완료되었습니다.', {
          description: result.data?.message || '모든 데이터가 성공적으로 백업되었습니다.',
          duration: 4000,
        });
        await loadBackupLogs(); // 백업 로그 새로고침
      } else {
        setBackupStatus('failed');
        console.error('❌ 백업 실패:', result.error);
        toast.error('백업에 실패했습니다.', {
          description: result.error || '알 수 없는 오류가 발생했습니다.',
          duration: 4000,
        });
      }
    } catch (error) {
      setBackupStatus('failed');
      console.error('❌ 백업 중 예외 발생:', error);
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
      console.log('📝 백업 로그 로드 중...');
      const result = await api.getBackupLogs();
      console.log('📋 백업 로그 결과:', result);

      if (result.success) {
        setBackupLogs(result.data || []);
        
        // 마지막 백업 정보 설정
        const logs = result.data || [];
        const lastSuccessfulBackup = logs.find((log: any) => log.status === 'success');
        if (lastSuccessfulBackup) {
          setLastBackupTime(new Date(lastSuccessfulBackup.timestamp).toLocaleString('ko-KR'));
          setBackupStatus('success');
        }
      } else {
        console.warn('⚠ 백업 로그 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 백업 로그 로드 중 오류:', error);
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
      const result = await api.getBackupConfig();
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
      const result = await api.testBackupConnection();
      
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
      toast.error('백업 테스트 오류', {
        description: '연결 테스트 중 오류가 발생했습니다.',
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

        {/* 백업 설정 */}
        <TabsContent value="backup">
          <div className="space-y-6">
            {/* 백업 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>백업 현황</span>
                </CardTitle>
                <CardDescription>
                  시스템 데이터 백업 상태를 확인하고 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">마지막 백업</span>
                    </div>
                    <p className="font-semibold">
                      {lastBackupTime || '백업 기록 없음'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">백업 상태</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backupStatus === 'success' && (
                        <Badge className="bg-green-100 text-green-800">성공</Badge>
                      )}
                      {backupStatus === 'failed' && (
                        <Badge className="bg-red-100 text-red-800">실패</Badge>
                      )}
                      {backupStatus === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-800">진행중</Badge>
                      )}
                      {!backupStatus && (
                        <Badge variant="secondary">미실행</Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <History className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">백업 로그</span>
                    </div>
                    <p className="font-semibold">{backupLogs.length}개 기록</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">수동 백업 실행</h4>
                    <p className="text-sm text-gray-500">
                      현재 시점의 모든 CCP 데이터를 구글 스프레드시트에 백업합니다.
                    </p>
                  </div>
                  <Button 
                    onClick={handleManualBackup} 
                    disabled={backupLoading}
                    className="ml-4"
                  >
                    {backupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        백업 중...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        수동 백업 실행
                      </>
                    )}
                  </Button>
                </div>

                {/* 백업 로그 */}
                {backupLogs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">최근 백업 로그</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {backupLogs.slice(0, 10).map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              className={
                                log.status === 'success' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {log.status === 'success' ? '성공' : '실패'}
                            </Badge>
                            <span className="text-sm">
                              {new Date(log.timestamp).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {log.recordCount ? `${log.recordCount}건` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 백업 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>구글 스프레드시트 백업 설정</span>
                </CardTitle>
                <CardDescription>
                  백업할 구글 스프레드시트 정보를 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>스프레드시트 ID</Label>
                    <Input
                      placeholder="1DgWjS_suFn60Z_YblWepoEKybycs2wwAwCyOyglVEcc"
                      value={backupConfig.spreadsheetId}
                      onChange={(e) => setBackupConfig(prev => ({
                        ...prev,
                        spreadsheetId: e.target.value
                      }))}
                    />
                    <p className="text-sm text-gray-500">
                      구글 스프레드시트 URL에서 추출한 ID를 입력하세요.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>서비스 어카운트 JSON</Label>
                    <Textarea
                      placeholder="구글 서비스 어카운트 JSON 키를 붙여넣기 하세요..."
                      value={backupConfig.serviceAccountJson}
                      onChange={(e) => setBackupConfig(prev => ({
                        ...prev,
                        serviceAccountJson: e.target.value
                      }))}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Google Cloud Console에서 생성한 서비스 어카운트 JSON 키를 입력하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={handleSaveBackupConfig}
                    disabled={configStatus === 'loading'}
                  >
                    {configStatus === 'loading' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    설정 저장
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleTestBackupConfig}
                    disabled={backupLoading || !backupConfig.spreadsheetId || !backupConfig.serviceAccountJson}
                  >
                    {backupLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    연결 테스트
                  </Button>

                  {backupConfig.spreadsheetId && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${backupConfig.spreadsheetId}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      스프레드시트 열기
                    </Button>
                  )}
                </div>

                {configStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        백업 설정이 저장되었습니다.
                      </span>
                    </div>
                  </div>
                )}

                {configStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        백업 설정에 오류가 있습니다. 설정을 확인해주세요.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 자동 백업 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>자동 백업 설정</span>
                </CardTitle>
                <CardDescription>
                  정기적인 자동 백업을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 백업 활성화</Label>
                    <p className="text-sm text-gray-500">매일 자정에 자동으로 백업을 실행합니다</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({...prev, autoBackup: checked}))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>백업 주기</Label>
                    <Select value={systemSettings.backupFrequency} onValueChange={(value) => 
                      setSystemSettings(prev => ({...prev, backupFrequency: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">매일</SelectItem>
                        <SelectItem value="weekly">매주</SelectItem>
                        <SelectItem value="monthly">매월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>데이터 보관 기간</Label>
                    <Select value={systemSettings.dataRetention} onValueChange={(value) => 
                      setSystemSettings(prev => ({...prev, dataRetention: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30일</SelectItem>
                        <SelectItem value="90">3개월</SelectItem>
                        <SelectItem value="180">6개월</SelectItem>
                        <SelectItem value="365">1년</SelectItem>
                        <SelectItem value="-1">무제한</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSystem}>
                    <Save className="w-4 h-4 mr-2" />
                    백업 설정 저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 다른 탭들 - 알림, HACCP, 보안, 시스템 설정은 기존 코드를 유지하면서 간단히 구현 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>다양한 알림 유형을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="haccp">
          <Card>
            <CardHeader>
              <CardTitle>HACCP 설정</CardTitle>
              <CardDescription>HACCP 시스템 관련 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ChecklistCategorySection 
                  categories={checklistCategories}
                  onAdd={handleAddCategory}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onToggleActive={handleToggleCategoryActive}
                  getCategoryColorClass={getCategoryColorClass}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveHACCP}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>보안 설정</CardTitle>
              <CardDescription>시스템 보안 관련 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>2단계 인증</Label>
                    <p className="text-sm text-gray-500">계정 보안을 강화합니다</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, twoFactorAuth: checked}))
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveSecurity}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {hasRole('admin') && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
                <CardDescription>시스템 전반적인 설정을 관리합니다. (관리자 전용)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>유지보수 모드</Label>
                      <p className="text-sm text-gray-500">시스템 점검 시 활성화합니다</p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({...prev, maintenanceMode: checked}))
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSystem}>
                      <Save className="w-4 h-4 mr-2" />
                      저장
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}