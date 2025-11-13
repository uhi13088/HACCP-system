import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginForm } from "./components/LoginForm";
import { Dashboard } from "./components/Dashboard";
import { ChecklistManager } from "./components/ChecklistManager";
import { CCPManager } from "./components/CCPManager";
import { EnvironmentMonitoring } from "./components/EnvironmentMonitoring";
import { HazardAnalysis } from "./components/HazardAnalysis";
import { ExcelImporter } from "./components/ExcelImporter";
import { AdminPanel } from "./components/AdminPanel";
import { SettingsMinimal } from "./components/SettingsMinimal";
import { ProductionDailyLog } from "./components/ProductionDailyLog";
import { PestControlWeeklyCheck } from "./components/PestControlWeeklyCheck";
import { VisitorManagementLog } from "./components/VisitorManagementLog";
import { RefrigeratorTemperatureLog } from "./components/RefrigeratorTemperatureLog";
import { CleaningDisinfectionLog } from "./components/CleaningDisinfectionLog";
import { MaterialReceivingLog } from "./components/MaterialReceivingLog";
import { FacilityWeeklyInspection } from "./components/FacilityWeeklyInspection";
import { AccidentReport } from "./components/AccidentReport";
import { TrainingRecord } from "./components/TrainingRecord";
import { ServerDiagnostics } from "./components/ServerDiagnostics";
import { SupplierManager } from "./components/SupplierManager";

import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./components/ui/alert-dialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { backupScheduler } from "./utils/backupScheduler";
import { api } from "./utils/api-sensor-fixed";
import { initializeSensorData, getSensorDataStats } from "./utils/sensorDataUtils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Shield,
  Thermometer, 
  FileText, 
  Settings, 
  Bell, 
  User,
  Menu,
  X,
  Play,
  Pause,
  Upload,
  UserCog,
  LogOut,
  Crown,
  Users,
  AlertTriangle,
  Calendar,
  Bug,
  Snowflake,
  Droplets,
  Package,
  Building,
  GraduationCap,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  Truck
} from "lucide-react";

function AppContent() {
  const { user, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ 
    isConnected: boolean; 
    lastChecked: Date | null;
    mockModeEnabled?: boolean;
  }>({ isConnected: false, lastChecked: null, mockModeEnabled: true }); // 기본값을 모킹 모드로 설정
  
  // 실시간 센서 모니터링 상태
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);
  const [sensorInterval, setSensorInterval] = useState<number | null>(null);
  
  // 다이얼로그 상태 관리
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // 카테고리별 접힘 상태 관리
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    "메인": false,
    "일간문서": false,
    "주간문서": false,
    "월간문서": false,
    "각종문서": false,
    "시스템": false
  });

  // 네비게이션 구조 - 카테고리별로 그룹화
  const navigationStructure = [
    {
      category: "메인",
      items: [
        { id: "dashboard", name: "대시보드", icon: LayoutDashboard, component: Dashboard, roles: ['admin', 'manager', 'operator'] },
        { id: "checklist", name: "체크리스트", icon: CheckSquare, component: ChecklistManager, roles: ['admin', 'manager', 'operator'] },
        { id: "ccp", name: "CCP 관리", icon: Shield, component: CCPManager, roles: ['admin', 'manager', 'operator'] },
        { id: "monitoring", name: "환경 모니터링", icon: Thermometer, component: EnvironmentMonitoring, roles: ['admin', 'manager', 'operator'] },
        { id: "analysis", name: "위험 분석", icon: FileText, component: HazardAnalysis, roles: ['admin', 'manager'] },
      ]
    },
    {
      category: "일간문서",
      items: [
        { id: "production-log", name: "생산일지", icon: Calendar, component: ProductionDailyLog, roles: ['admin', 'manager', 'operator'] },
        { id: "temperature-log", name: "냉장냉동고 온도기록부", icon: Snowflake, component: RefrigeratorTemperatureLog, roles: ['admin', 'manager', 'operator'] },
        { id: "cleaning-log", name: "세척·소독 기록부", icon: Droplets, component: CleaningDisinfectionLog, roles: ['admin', 'manager', 'operator'] },
        { id: "receiving-log", name: "원료입고 검수기록부", icon: Package, component: MaterialReceivingLog, roles: ['admin', 'manager', 'operator'] },
      ]
    },
    {
      category: "주간문서", 
      items: [
        { id: "pest-control", name: "방충·방서 주간점검표", icon: Bug, component: PestControlWeeklyCheck, roles: ['admin', 'manager', 'operator'] },
        { id: "facility-inspection", name: "시설점검 주간체크리스트", icon: Building, component: FacilityWeeklyInspection, roles: ['admin', 'manager', 'operator'] },
      ]
    },
    {
      category: "월간문서",
      items: [
        { id: "training-record", name: "교육훈련 기록부", icon: GraduationCap, component: TrainingRecord, roles: ['admin', 'manager'] },
      ]
    },
    {
      category: "각종문서",
      items: [
        { id: "visitor-log", name: "외부인출입관리대장", icon: Users, component: VisitorManagementLog, roles: ['admin', 'manager', 'operator'] },
        { id: "accident-report", name: "사고보고서", icon: AlertTriangle, component: AccidentReport, roles: ['admin', 'manager', 'operator'] },
        { id: "supplier", name: "공급업체 관리", icon: Truck, component: SupplierManager, roles: ['admin', 'manager'] },
      ]
    },
    {
      category: "시스템",
      items: [
        { id: "excel-import", name: "엑셀 가져오기", icon: Upload, component: ExcelImporter, roles: ['admin', 'manager'] },
        { id: "diagnostics", name: "서버 진단", icon: Stethoscope, component: ServerDiagnostics, roles: ['admin', 'manager'] },
        { id: "admin", name: "시스템 관리", icon: UserCog, component: AdminPanel, roles: ['admin'] }
      ]
    }
  ];

  // 사용자 역할에 따른 네비게이션 필터링
  const filteredNavigation = navigationStructure.map(category => ({
    ...category,
    items: category.items.filter(item => item.roles.includes(user?.role || 'operator'))
  })).filter(category => category.items.length > 0);

  // 모든 네비게이션 아이템을 플랫 배열로 변환 (컴포넌트 찾기용)
  const allNavigationItems = navigationStructure.flatMap(category => category.items);
  const navigation = allNavigationItems.filter(nav => 
    nav.roles.includes(user?.role || 'operator')
  );

  const ActiveComponent = navigation.find(nav => nav.id === activeTab)?.component || Dashboard;

  // 카테고리 접기/펼치기 토글
  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // 사용자 역할에 따른 배지 색상
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800"><Crown className="w-3 h-3 mr-1" />관리자</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800"><Users className="w-3 h-3 mr-1" />매니저</Badge>;
      case 'operator':
        return <Badge className="bg-green-100 text-green-800"><User className="w-3 h-3 mr-1" />작업자</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  // 서버 상태 업데이트
  useEffect(() => {
    let healthCheckInterval: number | undefined;

    // 초기 시스템 설정
    const initializeSystem = async () => {
      console.log('🚀 [APP] Initializing Smart HACCP system...');
      
      // 1. 센서 데이터 초기화
      initializeSensorData();
      
      // 2. 서버 상태 확인
      console.log('🔍 [APP] Checking initial server health...');
      
      try {
        // 실제 서버 연결 시도
        const isConnected = await api.checkServerStatus();
        const status = api.getServerStatus();
        
        console.log('📊 [APP] Server check result:', { isConnected, status });
        
        const newServerStatus = {
          isConnected: status.isConnected,
          lastChecked: status.lastChecked,
          mockModeEnabled: status.mockModeEnabled
        };
        
        setServerStatus(newServerStatus);
        console.log('🔄 [APP] Updated React state:', newServerStatus);
        
        if (status.isConnected) {
          console.log('✅ [APP] Real server is connected! UI should show "연결됨"');
        } else {
          console.log('❌ [APP] Server offline, using mock mode. UI should show "오프라인"');
        }
        
        // 30초마다 정기적으로 서버 상태 확인
        healthCheckInterval = window.setInterval(async () => {
          console.log('🔄 [APP] Periodic server check...');
          const isHealthy = await api.checkServerStatus();
          const currentStatus = api.getServerStatus();
          const updatedStatus = {
            isConnected: currentStatus.isConnected,
            lastChecked: currentStatus.lastChecked,
            mockModeEnabled: currentStatus.mockModeEnabled
          };
          console.log('🔄 [APP] Periodic update:', updatedStatus);
          setServerStatus(updatedStatus);
        }, 30000);
        
      } catch (error) {
        console.warn('❌ [APP] Initial server check failed:', error);
        const errorStatus = {
          isConnected: false,
          lastChecked: new Date(),
          mockModeEnabled: true
        };
        setServerStatus(errorStatus);
        console.log('🔄 [APP] Error state set:', errorStatus);
      }
    };

    initializeSystem();

    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, []);

  // 센서 모니터링 정리
  useEffect(() => {
    return () => {
      if (sensorInterval) {
        clearInterval(sensorInterval);
      }
    };
  }, [sensorInterval]);

  // 실시간 센서 모니터링 제어
  const handleRealTimeMonitoringToggle = async () => {
    if (!hasRole(['admin', 'manager'])) {
      toast.error("매니저 이상 권한이 필요합니다.");
      return;
    }

    if (realTimeMonitoring) {
      // 모니터링 중지
      if (sensorInterval) {
        clearInterval(sensorInterval);
        setSensorInterval(null);
      }
      setRealTimeMonitoring(false);
      
      toast.success("센서 모니터링이 중지되었습니다", {
        description: "센서 데이터 수집이 중단되었습니다.",
        duration: 3000
      });
    } else {
      // 모니터링 시작 로직
      console.log('🔍 [MONITORING] Starting sensor monitoring...');
      
      // 현재 서버 상태 확인
      const currentStatus = api.getServerStatus();
      console.log('📊 [MONITORING] Current server status:', currentStatus);

      // 모니터링 시작
      try {
        const sensorData = await api.getLatestSensorData();
        console.log('🔍 [MONITORING] Initial sensor data response:', sensorData);
        
        // 5초마다 센서 데이터 업데이트
        const interval = setInterval(async () => {
          try {
            const latestData = await api.getLatestSensorData();
            console.log('📡 [MONITORING] Real-time sensor update:', latestData);
            
            // 센서 데이터가 있을 때만 기록
            if (latestData?.success && latestData?.data?.length > 0) {
              console.log(`📋 [MONITORING] Recording data for ${latestData.data.length} sensors`);
              
              // 각 센서에 대해 순차적으로 처리 (병렬 처리 시 과부하 방지)
              for (const sensor of latestData.data) {
                try {
                  // 센서 데이터 기록 시도 (에러는 무시하고 모니터링 계속)
                  try {
                    const result = await api.recordSensorData({
                      sensorId: sensor.sensorId,
                      type: sensor.type,
                      value: sensor.value,
                      location: sensor.location,
                      timestamp: new Date().toISOString()
                    });
                    
                    // 성공적으로 기록됨
                    console.log(`✅ [MONITORING] Successfully recorded ${sensor.sensorId}: ${sensor.value}`)
                    
                  } catch (recordApiError: any) {
                    // API 호출 에러는 무시하고 계속 모니터링
                    console.log(`📋 [MONITORING] API call handled for ${sensor.sensorId} (errors ignored for stability)`)
                  }
                } catch (recordError: any) {
                  console.warn(`⚠ [MONITORING] Error recording ${sensor.sensorId}: ${recordError.message || 'Unknown error'}`);
                  // 개별 센서 에러는 무시하고 계속 진행
                }
              }
            } else {
              console.log('📋 [MONITORING] No valid sensor data received, continuing monitoring...');
            }
          } catch (updateError: any) {
            console.warn(`⚠ [MONITORING] Update cycle failed: ${updateError.message || 'Unknown error'}, retrying next cycle...`);
            // 전체 업데이트 사이클 에러도 무시하고 계속 모니터링
          }
        }, 5000);
        
        setSensorInterval(interval);
        setRealTimeMonitoring(true);
        
        const sensorCount = sensorData?.data?.length || 0;
        console.log(`✅ [MONITORING] Monitoring started with ${sensorCount} sensors`);
        
        toast.success("센서 모니터링이 시작되었습니다", {
          description: `${sensorCount}개 센서 감지, 5초 간격으로 수집 중`,
          duration: 3000
        });
        
      } catch (error) {
        console.error('❌ [MONITORING] Failed to start sensor monitoring:', error);
        
        toast.error("센서 모니터링 시작 실패", {
          description: "센서 연결을 확인하고 다시 시도해주세요.",
          duration: 5000,
          action: {
            label: "진단",
            onClick: () => setActiveTab('diagnostics')
          }
        });
      }
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    // 센서 모니터링 중지
    if (sensorInterval) {
      clearInterval(sensorInterval);
      setSensorInterval(null);
    }
    setRealTimeMonitoring(false);
    
    logout();
    setShowLogoutDialog(false);
  };

  // 권한 없는 탭 접근시 대시보드로 리다이렉트
  useEffect(() => {
    const currentNav = navigation.find(nav => nav.id === activeTab);
    if (!currentNav) {
      setActiveTab("dashboard");
    }
  }, [activeTab, navigation, user?.role]);

  // 알림 클릭 핸들러
  const handleNotificationClick = () => {
    toast.info("알림 기능이 곧 제공될 예정입니다.", {
      description: "현재 2개의 새로운 알림이 있습니다."
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">H</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg text-gray-900">Smart HACCP</h1>
              <p className="text-sm text-gray-500">식품안전관리시스템</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* 사용자 정보 */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            {getRoleBadge(user?.role || 'operator')}
          </div>

          {/* 실시간 센서 모니터링 상태 (매니저 이상) */}
          {hasRole(['admin', 'manager']) && (
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-lg border ${
              realTimeMonitoring 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <Thermometer className={`w-4 h-4 ${
                realTimeMonitoring ? 'text-green-600' : 'text-gray-600'
              }`} />
              <Badge className={`text-xs ${
                realTimeMonitoring
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {realTimeMonitoring ? '센서 모니터링 중' : '센서 모니터링 중지'}
              </Badge>
              <Button
                variant={realTimeMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={handleRealTimeMonitoringToggle}
                title={realTimeMonitoring ? "센서 모니터링 중지" : "센서 모니터링 시작"}
                className="h-7 px-2"
              >
                {realTimeMonitoring ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span className="ml-1 text-xs">
                  {realTimeMonitoring ? "중지" : "시작"}
                </span>
              </Button>
            </div>
          )}

          {/* 알림 */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={handleNotificationClick}
          >
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              2
            </Badge>
          </Button>

          {/* 설정 (매니저 이상) */}
          {hasRole(['admin', 'manager']) && (
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-5 h-5" />
            </Button>
          )}

          {/* 로그아웃 */}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        `}>
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            {/* 사용자 정보 (모바일) */}
            <div className="md:hidden p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">{user?.name ? user.name.charAt(0) : 'U'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  {getRoleBadge(user?.role || 'operator')}
                </div>
              </div>
            </div>

            {/* 상태 요약 */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">시스템 상태</span>
                  {serverStatus.isConnected ? (
                    <Badge className="bg-green-100 text-green-800">연결됨</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">오프라인</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">활성 알림</span>
                  <Badge className="bg-yellow-100 text-yellow-800">2개</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">오늘 점검</span>
                  <Badge className="bg-blue-100 text-blue-800">8/12</Badge>
                </div>
                
                {/* 모바일용 센서 모니터링 상태 (매니저 이상) */}
                {hasRole(['admin', 'manager']) && (
                  <div className={`md:hidden p-3 rounded-lg border-l-4 ${
                    realTimeMonitoring 
                      ? 'bg-green-50 border-green-400' 
                      : 'bg-gray-50 border-gray-400'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Thermometer className={`w-4 h-4 ${
                          realTimeMonitoring ? 'text-green-600' : 'text-gray-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          realTimeMonitoring ? 'text-green-800' : 'text-gray-800'
                        }`}>센서 모니터링</span>
                      </div>
                      <Badge variant={realTimeMonitoring ? "default" : "secondary"} className="text-xs">
                        {realTimeMonitoring ? "실행중" : "중지됨"}
                      </Badge>
                    </div>
                    <Button
                      variant={realTimeMonitoring ? "destructive" : "default"}
                      size="sm"
                      onClick={handleRealTimeMonitoringToggle}
                      className="w-full h-8 text-sm"
                    >
                      {realTimeMonitoring ? (
                        <>
                          <Pause className="w-3 h-3 mr-2" />
                          모니터링 중지
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-2" />
                          모니터링 시작
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {filteredNavigation.map((category) => {
                  const isCollapsed = collapsedCategories[category.category];
                  return (
                    <div key={category.category} className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-2 py-1 h-auto text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100"
                        onClick={() => toggleCategory(category.category)}
                      >
                        <span>{category.category}</span>
                        {isCollapsed ? (
                          <ChevronRight className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </Button>
                      
                      {!isCollapsed && (
                        <ul className="space-y-1 pl-2">
                          {category.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <li key={item.id}>
                                <Button
                                  variant={activeTab === item.id ? "default" : "ghost"}
                                  className={`w-full justify-start ${
                                    activeTab === item.id 
                                      ? "bg-blue-600 text-white" 
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                  onClick={() => {
                                    setActiveTab(item.id);
                                    setSidebarOpen(false);
                                  }}
                                >
                                  <Icon className="w-4 h-4 mr-3" />
                                  <span className="text-sm">{item.name}</span>
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* 하단 정보 */}
            <div className="p-4 border-t border-gray-200">
              <Card className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">서버 연결</span>
                    <Badge className={`text-xs ${
                      serverStatus.isConnected
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {serverStatus.isConnected ? '연결됨' : '오프라인'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">마지막 확인</span>
                    <span className="text-xs text-gray-500">
                      {serverStatus.lastChecked ? serverStatus.lastChecked.toLocaleTimeString('ko-KR') : '확인 안됨'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">센서 모니터링</span>
                    <Badge className={`text-xs ${
                      realTimeMonitoring 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {realTimeMonitoring ? '실행중' : '중지됨'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">활성 센서</span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const stats = getSensorDataStats();
                        return `${stats.uniqueSensors}개`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">사용자 권한</span>
                    <span className="text-xs text-gray-500">
                      {user?.role === 'admin' ? '관리자' : 
                       user?.role === 'manager' ? '매니저' : '작업자'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">시스템 버전</span>
                    <span className="text-xs text-gray-500">v2.1.1</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-h-screen">
          {/* 오버레이 (모바일) */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          <div className="p-4 lg:p-8">
            {/* 설정 페이지 오버레이 */}
            {showSettings && (
              <div className="fixed inset-0 z-50 bg-white flex flex-col">
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">H</span>
                    </div>
                    <span className="font-semibold">Smart HACCP 설정</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <SettingsMinimal />
                </div>
              </div>
            )}

            {/* 서버 연결 상태 표시 */}
            {serverStatus.isConnected ? (
              <Alert className="mb-6 border-green-500 bg-green-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p><strong>✅ 서버 연결됨</strong> - 실제 백엔드 서버와 연동 중입니다.</p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-6 border-gray-500 bg-gray-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p><strong>⚪ 서버 오프라인</strong> - 모킹 모드로 작동 중입니다.</p>
                </AlertDescription>
              </Alert>
            )}

            {/* 권한 부족 알림 */}
            {!hasRole(['admin', 'manager']) && (activeTab === 'analysis' || activeTab === 'excel-import') && (
              <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  이 기능은 매니저 이상 권한이 필요합니다. 현재 권한: {user?.role}
                </AlertDescription>
              </Alert>
            )}
            
            {!hasRole(['admin']) && activeTab === 'admin' && (
              <Alert className="mb-6 border-red-500 bg-red-50">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  이 기능은 관리자 권한이 필요합니다. 현재 권한: {user?.role}
                </AlertDescription>
              </Alert>
            )}

            <ActiveComponent 
              realTimeMonitoring={realTimeMonitoring}
              serverStatus={serverStatus}
            />
          </div>
        </main>
      </div>

      {/* 로그아웃 확인 다이얼로그 */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃</AlertDialogTitle>
            <AlertDialogDescription>
              정말 로그아웃 하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>로그아웃</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

function AppWrapper() {
  const { isAuthenticated, login, user } = useAuth();

  // 로그인 후 백업 스케줄러 시작
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated, starting backup scheduler...');
      backupScheduler.start();
    } else {
      console.log('User logged out, stopping backup scheduler...');
      backupScheduler.stop();
    }

    return () => {
      backupScheduler.stop();
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <AppContent />;
}