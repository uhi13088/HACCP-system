import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { backupScheduler } from "../utils/backupScheduler";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
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
  PlayCircle,
  Calendar,
  History,
  ExternalLink,
  Loader2,
  Monitor,  
  Check,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Droplets
} from "lucide-react";

export function SettingsPageCompleteWithCategoryFixed() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // 서버 상태
  const [serverStatus, setServerStatus] = useState<{ isConnected: boolean; lastChecked: Date | null }>({
    isConnected: false,
    lastChecked: null
  });
  
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

  // 자동 백업 시간 설정 상태
  const [autoBackupSettings, setAutoBackupSettings] = useState({
    enabled: true,
    hour: 18,
    minute: 0
  });
  const [nextBackupTime, setNextBackupTime] = useState<Date | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    lastChecked: null as Date | null
  });
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // CCP 타입별 설정
  const [ccpTypes, setCcpTypes] = useState([
    {
      id: 'oven_bread',
      name: '오븐공정_빵류',
      color: 'orange',
      settings: {
        tempRange: { min: 180, max: 220 },
        timeRange: { min: 15, max: 45 },
        checkInterval: 30,
        requiredFields: ['온도', '시간', '중심온도'],
        alertEnabled: true
      }
    },
    {
      id: 'cream_production',
      name: '크림제조 공정',
      color: 'blue',
      settings: {
        tempRange: { min: 2, max: 8 },
        phRange: { min: 6.0, max: 7.0 },
        checkInterval: 15,
        requiredFields: ['온도', 'pH', '점도'],
        alertEnabled: true
      }
    },
    {
      id: 'cleaning',
      name: '세척공정',
      color: 'green',
      settings: {
        tempRange: { min: 60, max: 80 },
        concentrationRange: { min: 100, max: 200 },
        checkInterval: 60,
        requiredFields: ['온도', '농도', '시간'],
        alertEnabled: true
      }
    },
    {
      id: 'metal_detection',
      name: '금속검출공정',
      color: 'purple',
      settings: {
        sensitivity: 'Fe 1.0mm',
        testInterval: 60,
        checkInterval: 30,
        requiredFields: ['감도', '테스트 결과'],
        alertEnabled: true
      }
    }
  ]);

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

  // CCP 타입 관리 상태
  const [showCCPDialog, setShowCCPDialog] = useState(false);
  const [editingCCPType, setEditingCCPType] = useState<any>(null);
  const [ccpForm, setCcpForm] = useState({
    id: '',
    name: '',
    color: 'blue',
    settings: {
      tempRange: { min: 0, max: 100 },
      phRange: null,
      concentrationRange: null,
      timeRange: null,
      sensitivity: '',
      testInterval: 60,
      checkInterval: 30,
      requiredFields: [],
      alertEnabled: true
    }
  });

  // 컴포넌트 마운트시 백업 설정 로드 및 서버 상태 확인
  useEffect(() => {
    loadBackupConfig();
    loadBackupLogs();
    checkServerStatus();
    loadAutoBackupSettings();

    // 1분마다 다음 백업 시간 및 스케줄러 상태 업데이트
    const updateBackupStatus = setInterval(() => {
      const isRunning = backupScheduler.isSchedulerRunning();
      setSchedulerStatus({
        isRunning,
        lastChecked: new Date()
      });
      
      if (isRunning) {
        setNextBackupTime(backupScheduler.getNextBackupTime());
      } else {
        setNextBackupTime(null);
      }
    }, 60000); // 1분마다

    // 매초마다 현재 시간 업데이트
    const updateCurrentTime = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(updateBackupStatus);
      clearInterval(updateCurrentTime);
    };
  }, []);

  // 자동 백업 설정 로드
  const loadAutoBackupSettings = () => {
    const currentSchedule = backupScheduler.getScheduleTime();
    const isRunning = backupScheduler.isSchedulerRunning();
    
    setAutoBackupSettings({
      enabled: isRunning,
      hour: currentSchedule.hour,
      minute: currentSchedule.minute
    });

    setSchedulerStatus({
      isRunning,
      lastChecked: isRunning ? new Date() : null
    });

    // 다음 백업 시간 계산
    if (isRunning) {
      setNextBackupTime(backupScheduler.getNextBackupTime());
    } else {
      setNextBackupTime(null);
    }
  };

  // 서버 상태 확인
  const checkServerStatus = async () => {
    try {
      const isHealthy = await api.checkServerStatus();
      setServerStatus({
        isConnected: isHealthy,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus({
        isConnected: false,
        lastChecked: new Date()
      });
    }
  };

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

  // 자동 백업 설정 저장
  const handleSaveAutoBackupSettings = () => {
    try {
      if (autoBackupSettings.enabled) {
        // 백업 스케줄러 시간 설정 및 시작
        backupScheduler.setScheduleTime(autoBackupSettings.hour, autoBackupSettings.minute);
        if (!backupScheduler.isSchedulerRunning()) {
          backupScheduler.start();
        }
        setNextBackupTime(backupScheduler.getNextBackupTime());
        setSchedulerStatus({
          isRunning: true,
          lastChecked: new Date()
        });
      } else {
        // 백업 스케줄러 중지
        backupScheduler.stop();
        setNextBackupTime(null);
        setSchedulerStatus({
          isRunning: false,
          lastChecked: null
        });
      }

      const timeStr = String(autoBackupSettings.hour).padStart(2, '0') + ':' + String(autoBackupSettings.minute).padStart(2, '0');
      
      toast.success('자동 백업 설정이 저장되었습니다.', {
        description: autoBackupSettings.enabled 
          ? `매일 ${timeStr}에 자동 백업이 실행됩니다.`
          : '자동 백업이 비활성화되었습니다.',
        duration: 4000,
      });
    } catch (error) {
      toast.error('자동 백업 설정 저장 실패', {
        description: error.message || '설정을 저장할 수 없습니다.',
        duration: 4000,
      });
    }
  };

  // 시간 입력 검증
  const validateTimeInput = (hour: number, minute: number) => {
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
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

  // 백업 관련 함수들
  const handleManualBackup = async () => {
    console.log('🚀 Manual backup button clicked');
    setBackupLoading(true);
    setBackupStatus('pending');
    
    try {
      // 1. 백업 설정 상태 확인
      console.log('🔍 Checking backup configuration...');
      if (!backupConfig.spreadsheetId || !backupConfig.serviceAccountJson) {
        throw new Error('백업 설정이 완료되지 않았습니다. 먼저 스프레드시트 ID와 서비스 계정 JSON을 설정해주세요.');
      }

      // 2. 서버 연결 상태 확인
      console.log('🔍 Checking server status...');
      const serverHealthy = await api.checkServerStatus();
      if (!serverHealthy) {
        throw new Error('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
      }

      console.log('🔄 Starting manual backup...');
      const result = await api.backupCCPRecords();
      console.log('📋 Backup result received:', result);

      if (result && result.success) {
        setBackupStatus('success');
        setLastBackupTime(new Date().toLocaleString('ko-KR'));
        toast.success('백업이 완료되었습니다!', {
          description: result.data?.message || `${result.data?.recordCount || 0}개의 CCP 레코드가 성공적으로 백업되었습니다.`,
          duration: 6000,
        });
        
        // 백업 로그 새로고침
        console.log('🔄 Refreshing backup logs...');
        await loadBackupLogs();
      } else {
        // API에서 success: false를 반환한 경우
        const errorMessage = result?.error || '백업 실패 - 알 수 없는 오류';
        setBackupStatus('failed');
        console.error('❌ Backup failed with API error:', result);
        
        toast.error('백업에 실패했습니다', {
          description: errorMessage,
          duration: 6000,
        });
      }
    } catch (error) {
      setBackupStatus('failed');
      console.error('❌ Manual backup exception:', error);
      
      // 오류 타입에 따른 구체적인 메시지 제공
      let errorMessage = '백업 중 오류가 발생했습니다.';
      let errorDescription = '네트워크 연결을 확인해주세요.';
      
      if (error.message) {
        if (error.message.includes('Server is not available')) {
          errorMessage = '서버 연결 실패';
          errorDescription = '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        } else if (error.message.includes('백업 설정')) {
          errorMessage = '백업 설정 오류';
          errorDescription = error.message;
        } else if (error.message.includes('Request timed out')) {
          errorMessage = '요청 시간 초과';
          errorDescription = '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorDescription = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 8000,
      });
    } finally {
      setBackupLoading(false);
      console.log('🏁 Manual backup process completed');
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

  // CCP 타입 관리 함수들
  const getCCPTypeColorClass = (color: string) => {
    switch (color) {
      case 'orange': return 'border-orange-200 bg-orange-50';
      case 'blue': return 'border-blue-200 bg-blue-50';
      case 'green': return 'border-green-200 bg-green-50';
      case 'purple': return 'border-purple-200 bg-purple-50';
      case 'red': return 'border-red-200 bg-red-50';
      case 'yellow': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCCPTypeBgColor = (color: string) => {
    switch (color) {
      case 'orange': return 'bg-orange-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleEditCCPType = (ccpType: any) => {
    setCcpForm({
      id: ccpType.id,
      name: ccpType.name,
      color: ccpType.color,
      settings: { ...ccpType.settings }
    });
    setEditingCCPType(ccpType);
    setShowCCPDialog(true);
  };

  const handleDeleteCCPType = (ccpTypeId: string) => {
    if (confirm('이 CCP 타입을 삭제하시겠습니까?\n관련된 모든 데이터가 영향을 받을 수 있습니다.')) {
      setCcpTypes(prev => prev.filter(type => type.id !== ccpTypeId));
      toast.success('CCP 타입이 삭제되었습니다.', {
        description: '관련 설정이 제거되었습니다.',
        duration: 3000,
      });
    }
  };

  const handleToggleCCPAlert = (ccpTypeId: string, enabled: boolean) => {
    setCcpTypes(prev => prev.map(type => 
      type.id === ccpTypeId 
        ? { ...type, settings: { ...type.settings, alertEnabled: enabled } }
        : type
    ));
    
    toast.success(`알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`, {
      description: `${ccpTypes.find(t => t.id === ccpTypeId)?.name} 타입`,
      duration: 2000,
    });
  };

  const handleSaveCCPTypes = () => {
    toast.success('CCP 타입 설정이 저장되었습니다.', {
      description: '모든 변경사항이 적용되었습니다.',
      duration: 3000,
    });
  };

  const handleResetCCPTypes = () => {
    if (confirm('모든 CCP 타입을 기본값으로 초기화하시겠습니까?')) {
      // 기본값으로 재설정
      setCcpTypes([
        {
          id: 'oven_bread',
          name: '오븐공정_빵류',
          color: 'orange',
          settings: {
            tempRange: { min: 180, max: 220 },
            timeRange: { min: 15, max: 45 },
            checkInterval: 30,
            requiredFields: ['온도', '시간', '중심온도'],
            alertEnabled: true
          }
        },
        {
          id: 'cream_production',
          name: '크림제조 공정',
          color: 'blue',
          settings: {
            tempRange: { min: 2, max: 8 },
            phRange: { min: 6.0, max: 7.0 },
            checkInterval: 15,
            requiredFields: ['온도', 'pH', '점도'],
            alertEnabled: true
          }
        },
        {
          id: 'cleaning',
          name: '세척공정',
          color: 'green',
          settings: {
            tempRange: { min: 60, max: 80 },
            concentrationRange: { min: 100, max: 200 },
            checkInterval: 60,
            requiredFields: ['온도', '농도', '시간'],
            alertEnabled: true
          }
        },
        {
          id: 'metal_detection',
          name: '금속검출공정',
          color: 'purple',
          settings: {
            sensitivity: 'Fe 1.0mm',
            testInterval: 60,
            checkInterval: 30,
            requiredFields: ['감도', '테스트 결과'],
            alertEnabled: true
          }
        }
      ]);
      
      toast.success('CCP 타입이 기본값으로 초기화되었습니다.', {
        description: '모든 설정이 기본값으로 복원되었습니다.',
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
        <TabsList className={`grid w-full ${hasRole('admin') ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>프로필</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>알림</span>
          </TabsTrigger>
          <TabsTrigger value="ccp-types" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>CCP 타입</span>
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

        {/* 알림 설정 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>알림 설정</span>
              </CardTitle>
              <CardDescription>
                시스템 알림 및 보고서 수신 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">기본 알림</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications">이메일 알림</Label>
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, emailNotifications: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotifications">푸시 알림</Label>
                      <Switch
                        id="pushNotifications"
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, pushNotifications: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsNotifications">SMS 알림</Label>
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, smsNotifications: checked}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">HACCP 관련 알림</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ccpAlerts">CCP 위험 알림</Label>
                      <Switch
                        id="ccpAlerts"
                        checked={notificationSettings.ccpAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, ccpAlerts: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperatureAlerts">온도 이상 알림</Label>
                      <Switch
                        id="temperatureAlerts"
                        checked={notificationSettings.temperatureAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, temperatureAlerts: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="checklistReminders">체크리스트 알림</Label>
                      <Switch
                        id="checklistReminders"
                        checked={notificationSettings.checklistReminders}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, checklistReminders: checked}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">시스템 알림</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemAlerts">시스템 오류 알림</Label>
                      <Switch
                        id="systemAlerts"
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, systemAlerts: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="criticalOnly">긴급 알림만 수신</Label>
                      <Switch
                        id="criticalOnly"
                        checked={notificationSettings.criticalOnly}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, criticalOnly: checked}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">보고서 알림</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weeklyReports">주간 보고서</Label>
                      <Switch
                        id="weeklyReports"
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, weeklyReports: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monthlyReports">월간 보고서</Label>
                      <Switch
                        id="monthlyReports"
                        checked={notificationSettings.monthlyReports}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, monthlyReports: checked}))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleResetToDefaults}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  초기화
                </Button>
                <Button onClick={handleSaveNotifications}>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CCP 타입 관리 */}
        <TabsContent value="ccp-types">
          <div className="space-y-6">
            {/* CCP 타입 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>CCP 타입 관리</span>
                  </div>
                  <Button onClick={() => setShowCCPDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    새 CCP 타입 추가
                  </Button>
                </CardTitle>
                <CardDescription>
                  중요 관리점(CCP) 타입별 상세 설정을 관리하고 모니터링 규칙을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {ccpTypes.map((ccpType, index) => (
                    <Card key={ccpType.id} className={`border-2 ${getCCPTypeColorClass(ccpType.color)} hover:shadow-md transition-shadow`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${getCCPTypeBgColor(ccpType.color)}`}></div>
                            <h3 className="font-semibold">{ccpType.name}</h3>
                            <Badge variant={ccpType.settings.alertEnabled ? "default" : "secondary"}>
                              {ccpType.settings.alertEnabled ? "알림 활성" : "알림 비활성"}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
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
                              onClick={() => handleDeleteCCPType(ccpType.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* 온도 범위 */}
                          {ccpType.settings.tempRange && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Thermometer className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">온도 범위</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {ccpType.settings.tempRange.min}°C ~ {ccpType.settings.tempRange.max}°C
                              </span>
                            </div>
                          )}
                          
                          {/* pH 범위 */}
                          {ccpType.settings.phRange && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Droplets className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">pH 범위</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {ccpType.settings.phRange.min} ~ {ccpType.settings.phRange.max}
                              </span>
                            </div>
                          )}

                          {/* 농도 범위 */}
                          {ccpType.settings.concentrationRange && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">농도 범위</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {ccpType.settings.concentrationRange.min} ~ {ccpType.settings.concentrationRange.max} ppm
                              </span>
                            </div>
                          )}

                          {/* 감도 설정 */}
                          {ccpType.settings.sensitivity && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium">감도 설정</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {ccpType.settings.sensitivity}
                              </span>
                            </div>
                          )}

                          {/* 점검 주기 */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium">점검 주기</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {ccpType.settings.checkInterval}분마다
                            </span>
                          </div>

                          {/* 필수 필드 */}
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">필수 입력 필드</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {ccpType.settings.requiredFields.map((field, fieldIndex) => (
                                <Badge key={fieldIndex} variant="outline" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* 알림 상태 */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Bell className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium">알림 설정</span>
                            </div>
                            <Switch
                              checked={ccpType.settings.alertEnabled}
                              onCheckedChange={(checked) => handleToggleCCPAlert(ccpType.id, checked)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 전체 CCP 통계 */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">CCP 타입 통계</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{ccpTypes.length}</div>
                        <div className="text-sm text-blue-800">총 CCP 타입</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {ccpTypes.filter(t => t.settings.alertEnabled).length}
                        </div>
                        <div className="text-sm text-green-800">알림 활성화</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(ccpTypes.reduce((acc, t) => acc + t.settings.checkInterval, 0) / ccpTypes.length)}
                        </div>
                        <div className="text-sm text-orange-800">평균 점검주기(분)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {ccpTypes.reduce((acc, t) => acc + t.settings.requiredFields.length, 0)}
                        </div>
                        <div className="text-sm text-purple-800">총 필수 필드</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleResetCCPTypes}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    기본값으로 초기화
                  </Button>
                  <Button onClick={handleSaveCCPTypes}>
                    <Save className="w-4 h-4 mr-2" />
                    모든 변경사항 저장
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 체크리스트 카테고리 관리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>체크리스트 카테고리 관리</span>
                </CardTitle>
                <CardDescription>
                  체크리스트 항목을 분류하는 카테고리를 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChecklistCategorySection
                  categories={checklistCategories}
                  onAddCategory={handleAddCategory}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onToggleActive={handleToggleCategoryActive}
                  showDialog={showCategoryDialog}
                  onCloseDialog={() => setShowCategoryDialog(false)}
                  categoryForm={categoryForm}
                  onUpdateForm={setCategoryForm}
                  onSaveCategory={handleSaveCategory}
                  isEditing={!!editingCategory}
                  getCategoryColorClass={getCategoryColorClass}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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

        {/* 보안 설정 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>보안 설정</span>
              </CardTitle>
              <CardDescription>
                시스템 보안 및 접근 제어 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">인증 설정</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="twoFactorAuth">2단계 인증</Label>
                      <Switch
                        id="twoFactorAuth"
                        checked={securitySettings.twoFactorAuth}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, twoFactorAuth: checked}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>비밀번호 정책</Label>
                      <Select 
                        value={securitySettings.passwordRequirements}
                        onValueChange={(value) => setSecuritySettings(prev => ({...prev, passwordRequirements: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="정책 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">기본 (8자 이상)</SelectItem>
                          <SelectItem value="strong">강화 (대소문자, 숫자, 특수문자)</SelectItem>
                          <SelectItem value="enterprise">기업급 (12자 이상, 복합조건)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>세션 보안</Label>
                      <Select 
                        value={securitySettings.sessionSecurity}
                        onValueChange={(value) => setSecuritySettings(prev => ({...prev, sessionSecurity: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="보안 수준 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">낮음 (30일)</SelectItem>
                          <SelectItem value="medium">보통 (7일)</SelectItem>
                          <SelectItem value="high">높음 (1일)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">접근 제어</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="apiAccess">API 접근 허용</Label>
                      <Switch
                        id="apiAccess"
                        checked={securitySettings.apiAccess}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, apiAccess: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auditLogging">감사 로그 기록</Label>
                      <Switch
                        id="auditLogging"
                        checked={securitySettings.auditLogging}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, auditLogging: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accountLockout">계정 잠금 활성화</Label>
                      <Switch
                        id="accountLockout"
                        checked={securitySettings.accountLockout}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, accountLockout: checked}))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="loginHistory">로그인 기록 보관</Label>
                      <Switch
                        id="loginHistory"
                        checked={securitySettings.loginHistory}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, loginHistory: checked}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">고급 설정</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>IP 화이트리스트</Label>
                      <Textarea
                        value={securitySettings.ipWhitelist}
                        onChange={(e) => setSecuritySettings(prev => ({...prev, ipWhitelist: e.target.value}))}
                        placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                        rows={3}
                      />
                      <p className="text-sm text-gray-500">
                        허용할 IP 주소 또는 CIDR 범위를 줄 단위로 입력하세요.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>비밀번호 만료 주기 (일)</Label>
                      <Input
                        type="number"
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => setSecuritySettings(prev => ({...prev, passwordExpiry: e.target.value}))}
                        placeholder="90"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">보안 상태</h4>
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">보안 점수</span>
                      <Badge className="bg-green-100 text-green-800">85/100</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">마지막 보안 검사</span>
                      <span className="text-sm text-gray-500">2024.01.15 14:30</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">활성 세션</span>
                      <span className="text-sm text-gray-500">3개</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">감사 로그</span>
                      <span className="text-sm text-gray-500">1,247건</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleResetToDefaults}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  초기화
                </Button>
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
                </CardTitle>
                <CardDescription>
                  시스템 전체 설정 및 유지보수 옵션을 관리합니다. (관리자 전용)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">백업 설정</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoBackup">자동 백업</Label>
                        <Switch
                          id="autoBackup"
                          checked={systemSettings.autoBackup}
                          onCheckedChange={(checked) => setSystemSettings(prev => ({...prev, autoBackup: checked}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>백업 주기</Label>
                        <Select 
                          value={systemSettings.backupFrequency}
                          onValueChange={(value) => setSystemSettings(prev => ({...prev, backupFrequency: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="주기 선택" />
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
                        <Label>데이터 보관 기간 (일)</Label>
                        <Input
                          type="number"
                          value={systemSettings.dataRetention}
                          onChange={(e) => setSystemSettings(prev => ({...prev, dataRetention: e.target.value}))}
                          placeholder="365"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">시스템 운영</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>로그 레벨</Label>
                        <Select 
                          value={systemSettings.logLevel}
                          onValueChange={(value) => setSystemSettings(prev => ({...prev, logLevel: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="로그 레벨 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="error">오류만</SelectItem>
                            <SelectItem value="warn">경고 이상</SelectItem>
                            <SelectItem value="info">정보 이상</SelectItem>
                            <SelectItem value="debug">디버그 포함</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="maintenanceMode">유지보수 모드</Label>
                        <Switch
                          id="maintenanceMode"
                          checked={systemSettings.maintenanceMode}
                          onCheckedChange={(checked) => setSystemSettings(prev => ({...prev, maintenanceMode: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowGuestAccess">게스트 접근 허용</Label>
                        <Switch
                          id="allowGuestAccess"
                          checked={systemSettings.allowGuestAccess}
                          onCheckedChange={(checked) => setSystemSettings(prev => ({...prev, allowGuestAccess: checked}))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">사용자 관리</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>세션 타임아웃 (분)</Label>
                        <Input
                          type="number"
                          value={systemSettings.sessionTimeout}
                          onChange={(e) => setSystemSettings(prev => ({...prev, sessionTimeout: e.target.value}))}
                          placeholder="480"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>최대 로그인 시도 횟수</Label>
                        <Input
                          type="number"
                          value={systemSettings.maxLoginAttempts}
                          onChange={(e) => setSystemSettings(prev => ({...prev, maxLoginAttempts: e.target.value}))}
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">시스템 상태</h4>
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">시스템 가동시간</span>
                        <span className="text-sm text-gray-500">15일 8시간</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">데이터베이스 크기</span>
                        <span className="text-sm text-gray-500">245 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">백업 상태</span>
                        <Badge className="bg-green-100 text-green-800">정상</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">마지막 업데이트</span>
                        <span className="text-sm text-gray-500">2024.01.10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">주의사항</h4>
                      <p className="text-sm text-yellow-700">
                        시스템 설정 변경은 전체 사용자에게 영향을 미칠 수 있습니다. 
                        변경 전에 반드시 백업을 수행하고, 사용자에게 미리 알려주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleResetToDefaults}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    초기화
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

                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">수동 백업 실행</h4>
                      <p className="text-sm text-gray-500">
                        현재 시점의 모든 CCP 데이터를 구글 스프레드시트에 백업합니다.
                      </p>
                    </div>
                    <Button 
                      onClick={handleManualBackup} 
                      disabled={backupLoading || !backupConfig.spreadsheetId || !backupConfig.serviceAccountJson}
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
                  
                  {/* 백업 전 체크리스트 */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      {backupConfig.spreadsheetId ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
                      )}
                      <span>스프레드시트 ID 설정됨</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backupConfig.serviceAccountJson ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
                      )}
                      <span>서비스 계정 JSON 설정됨</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {serverStatus.isConnected ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
                      )}
                      <span>서버 연결 상태</span>
                    </div>
                  </div>
                  
                  {(!backupConfig.spreadsheetId || !backupConfig.serviceAccountJson) && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ 백업을 실행하기 전에 위의 백업 설정을 완료해주세요.
                    </div>
                  )}
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
                  <SettingsIcon className="w-5 h-5" />
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
                  <span>자동 백업 스케줄</span>
                </CardTitle>
                <CardDescription>
                  매일 정해진 시간에 자동으로 CCP 데이터를 백업합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 자동 백업 활성화 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">자동 백업 활성화</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      매일 지정된 시간에 자동으로 백업을 실행합니다
                    </p>
                  </div>
                  <Switch
                    checked={autoBackupSettings.enabled}
                    onCheckedChange={(checked) => 
                      setAutoBackupSettings(prev => ({...prev, enabled: checked}))
                    }
                  />
                </div>

                {/* 백업 시간 설정 */}
                {autoBackupSettings.enabled && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">백업 시간 설정</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {/* 미리 설정된 시간 옵션 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">빠른 설정</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { label: '오전 6:00', hour: 6, minute: 0 },
                            { label: '정오 12:00', hour: 12, minute: 0 },
                            { label: '오후 6:00', hour: 18, minute: 0 },
                            { label: '자정 0:00', hour: 0, minute: 0 }
                          ].map((preset) => (
                            <Button
                              key={`${preset.hour}-${preset.minute}`}
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => setAutoBackupSettings(prev => ({
                                ...prev,
                                hour: preset.hour,
                                minute: preset.minute
                              }))}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* 상세 시간 설정 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>시간 (0-23)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={autoBackupSettings.hour}
                            onChange={(e) => {
                              const hour = parseInt(e.target.value) || 0;
                              if (validateTimeInput(hour, autoBackupSettings.minute)) {
                                setAutoBackupSettings(prev => ({...prev, hour}));
                              }
                            }}
                            className="text-center"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>분 (0-59)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={autoBackupSettings.minute}
                            onChange={(e) => {
                              const minute = parseInt(e.target.value) || 0;
                              if (validateTimeInput(autoBackupSettings.hour, minute)) {
                                setAutoBackupSettings(prev => ({...prev, minute}));
                              }
                            }}
                            className="text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-white border rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">백업 예정 시간</p>
                      <p className="text-lg font-semibold text-blue-600">
                        매일 {String(autoBackupSettings.hour).padStart(2, '0')}:{String(autoBackupSettings.minute).padStart(2, '0')}
                      </p>
                      {nextBackupTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          다음 백업: {nextBackupTime.toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        현재 시간: {currentTime.toLocaleString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* 백업 상태 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">스케줄러 상태</span>
                    </div>
                    <Badge className={
                      schedulerStatus.isRunning 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }>
                      {schedulerStatus.isRunning ? '실행중' : '중지됨'}
                    </Badge>
                    {schedulerStatus.lastChecked && (
                      <p className="text-xs text-gray-500 mt-1">
                        마지막 확인: {schedulerStatus.lastChecked.toLocaleTimeString('ko-KR')}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">마지막 백업</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {lastBackupTime || '기록 없음'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Database className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">백업 로그</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {backupLogs.length}개 기록
                    </p>
                  </div>
                </div>

                {/* 저장 및 테스트 버튼 */}
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={loadAutoBackupSettings}
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      새로고침
                    </Button>
                    {autoBackupSettings.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info('백업 테스트 실행 중...', {
                            description: '수동 백업 버튼을 사용하여 설정을 테스트하세요.',
                            duration: 3000,
                          });
                        }}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        지금 테스트
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={handleSaveAutoBackupSettings}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    백업 스케줄 저장
                  </Button>
                </div>

                {/* 주의사항 */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-amber-800">백업 설정 안내</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• 자동 백업은 브라우저가 열려있는 동안에만 작동합니다.</li>
                        <li>• 백업 실행을 위해서는 구글 스프레드시트 설정이 완료되어야 합니다.</li>
                        <li>• 설정된 시간은 즉시 적용되며, 다음 백업까지의 시간이 자동 계산됩니다.</li>
                        <li>• 백업 중 오류가 발생하면 알림으로 안내해드립니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 다른 탭들 */}
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

      {/* CCP 타입 편집 다이얼로그 */}
      <Dialog open={showCCPDialog} onOpenChange={setShowCCPDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCCPType ? 'CCP 타입 편집' : '새 CCP 타입 추가'}
            </DialogTitle>
            <DialogDescription>
              CCP 타입의 상세 설정을 관리합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>타입 이름</Label>
                <Input
                  value={ccpForm.name}
                  onChange={(e) => setCcpForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="CCP 타입 이름"
                />
              </div>
              <div className="space-y-2">
                <Label>색상</Label>
                <Select
                  value={ccpForm.color}
                  onValueChange={(value) => setCcpForm(prev => ({...prev, color: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">주황색</SelectItem>
                    <SelectItem value="blue">파란색</SelectItem>
                    <SelectItem value="green">초록색</SelectItem>
                    <SelectItem value="purple">보라색</SelectItem>
                    <SelectItem value="red">빨간색</SelectItem>
                    <SelectItem value="yellow">노란색</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">측정 범위 설정</h4>
              
              {/* 온도 범위 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>최소 온도 (°C)</Label>
                  <Input
                    type="number"
                    value={ccpForm.settings.tempRange?.min || ''}
                    onChange={(e) => setCcpForm(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        tempRange: {
                          ...prev.settings.tempRange,
                          min: Number(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최대 온도 (°C)</Label>
                  <Input
                    type="number"
                    value={ccpForm.settings.tempRange?.max || ''}
                    onChange={(e) => setCcpForm(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        tempRange: {
                          ...prev.settings.tempRange,
                          max: Number(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>

              {/* pH 범위 (선택적) */}
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  checked={!!ccpForm.settings.phRange}
                  onCheckedChange={(checked) => setCcpForm(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      phRange: checked ? { min: 6.0, max: 7.0 } : null
                    }
                  }))}
                />
                <Label>pH 범위 설정</Label>
              </div>
              {ccpForm.settings.phRange && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>최소 pH</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ccpForm.settings.phRange.min}
                      onChange={(e) => setCcpForm(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          phRange: {
                            ...prev.settings.phRange!,
                            min: Number(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>최대 pH</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ccpForm.settings.phRange.max}
                      onChange={(e) => setCcpForm(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          phRange: {
                            ...prev.settings.phRange!,
                            max: Number(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              )}

              {/* 농도 범위 (선택적) */}
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  checked={!!ccpForm.settings.concentrationRange}
                  onCheckedChange={(checked) => setCcpForm(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      concentrationRange: checked ? { min: 100, max: 200 } : null
                    }
                  }))}
                />
                <Label>농도 범위 설정 (ppm)</Label>
              </div>
              {ccpForm.settings.concentrationRange && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>최소 농도 (ppm)</Label>
                    <Input
                      type="number"
                      value={ccpForm.settings.concentrationRange.min}
                      onChange={(e) => setCcpForm(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          concentrationRange: {
                            ...prev.settings.concentrationRange!,
                            min: Number(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>최대 농도 (ppm)</Label>
                    <Input
                      type="number"
                      value={ccpForm.settings.concentrationRange.max}
                      onChange={(e) => setCcpForm(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          concentrationRange: {
                            ...prev.settings.concentrationRange!,
                            max: Number(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              )}

              {/* 감도 설정 (선택적) */}
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  checked={!!ccpForm.settings.sensitivity}
                  onCheckedChange={(checked) => setCcpForm(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      sensitivity: checked ? 'Fe 1.0mm' : ''
                    }
                  }))}
                />
                <Label>감도 설정</Label>
              </div>
              {ccpForm.settings.sensitivity && (
                <div className="space-y-2">
                  <Label>감도 값</Label>
                  <Input
                    value={ccpForm.settings.sensitivity}
                    onChange={(e) => setCcpForm(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        sensitivity: e.target.value
                      }
                    }))}
                    placeholder="예: Fe 1.0mm"
                  />
                </div>
              )}

              {/* 점검 주기 */}
              <div className="space-y-2">
                <Label>점검 주기 (분)</Label>
                <Input
                  type="number"
                  value={ccpForm.settings.checkInterval}
                  onChange={(e) => setCcpForm(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      checkInterval: Number(e.target.value)
                    }
                  }))}
                />
              </div>

              {/* 필수 필드 */}
              <div className="space-y-2">
                <Label>필수 입력 필드 (쉼표로 구분)</Label>
                <Input
                  value={ccpForm.settings.requiredFields.join(', ')}
                  onChange={(e) => setCcpForm(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      requiredFields: e.target.value.split(',').map(field => field.trim()).filter(field => field)
                    }
                  }))}
                  placeholder="예: 온도, 시간, 중심온도"
                />
              </div>

              {/* 알림 활성화 */}
              <div className="flex items-center justify-between">
                <Label>알림 활성화</Label>
                <Switch
                  checked={ccpForm.settings.alertEnabled}
                  onCheckedChange={(checked) => setCcpForm(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      alertEnabled: checked
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCCPDialog(false)}>
              취소
            </Button>
            <Button onClick={() => {
              if (editingCCPType) {
                // 편집
                setCcpTypes(prev => prev.map(type => 
                  type.id === editingCCPType.id 
                    ? { ...ccpForm }
                    : type
                ));
                toast.success('CCP 타입이 수정되었습니다.', {
                  description: `${ccpForm.name} 타입이 업데이트되었습니다.`,
                  duration: 3000,
                });
              } else {
                // 추가
                const newId = `ccp_${Date.now()}`;
                setCcpTypes(prev => [...prev, { ...ccpForm, id: newId }]);
                toast.success('새 CCP 타입이 추가되었습니다.', {
                  description: `${ccpForm.name} 타입이 생성되었습니다.`,
                  duration: 3000,
                });
              }
              setShowCCPDialog(false);
              setEditingCCPType(null);
            }}>
              {editingCCPType ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}