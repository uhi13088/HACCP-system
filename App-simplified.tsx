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
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Toaster } from "./components/ui/sonner";
import { mockDataGenerator } from "./utils/mockData";
import { api } from "./utils/api";
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
  Database,
  Upload,
  UserCog,
  LogOut,
  Crown,
  Users,
  AlertTriangle
} from "lucide-react";

function AppContent() {
  const { user, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mockDataStatus, setMockDataStatus] = useState(mockDataGenerator.getStatus());
  const [serverStatus, setServerStatus] = useState<{ isConnected: boolean; lastChecked: Date | null }>({ 
    isConnected: false, 
    lastChecked: null 
  });

  // 네비게이션 아이템들
  const navigation = [
    { id: "dashboard", name: "대시보드", icon: LayoutDashboard, component: Dashboard, roles: ['admin', 'manager', 'operator'] },
    { id: "checklist", name: "체크리스트", icon: CheckSquare, component: ChecklistManager, roles: ['admin', 'manager', 'operator'] },
    { id: "ccp", name: "CCP 관리", icon: Shield, component: CCPManager, roles: ['admin', 'manager', 'operator'] },
    { id: "monitoring", name: "환경 모니터링", icon: Thermometer, component: EnvironmentMonitoring, roles: ['admin', 'manager', 'operator'] },
    { id: "analysis", name: "위험 분석", icon: FileText, component: HazardAnalysis, roles: ['admin', 'manager'] },
    { id: "excel-import", name: "엑셀 가져오기", icon: Upload, component: ExcelImporter, roles: ['admin', 'manager'] },
    { id: "admin", name: "시스템 관리", icon: UserCog, component: AdminPanel, roles: ['admin'] }
  ].filter(nav => nav.roles.includes(user?.role || 'operator'));

  const ActiveComponent = navigation.find(nav => nav.id === activeTab)?.component || Dashboard;

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

  // 서버 상태 확인
  useEffect(() => {
    let healthCheckInterval: NodeJS.Timeout | undefined;
    let mockDataInterval: NodeJS.Timeout | undefined;

    const performHealthCheck = async () => {
      try {
        const isHealthy = await api.checkServerStatus();
        setServerStatus({
          isConnected: isHealthy,
          lastChecked: new Date()
        });
      } catch (error: any) {
        console.warn('⚠ Server health check failed:', error?.message || error);
        setServerStatus({
          isConnected: false,
          lastChecked: new Date()
        });
      }
    };

    // 모의 데이터 상태 업데이트
    mockDataInterval = setInterval(() => {
      setMockDataStatus(mockDataGenerator.getStatus());
    }, 5000);

    // 초기 서버 상태 확인
    setTimeout(async () => {
      await performHealthCheck();
      healthCheckInterval = setInterval(performHealthCheck, 30000);
    }, 1000);

    return () => {
      if (mockDataInterval) clearInterval(mockDataInterval);
      if (healthCheckInterval) clearInterval(healthCheckInterval);
    };
  }, []);

  // 모의 데이터 제어
  const handleMockDataToggle = async () => {
    if (!hasRole('admin')) {
      window.alert('관리자만 모의 데이터를 제어할 수 있습니다.');
      return;
    }

    if (mockDataStatus.isRunning) {
      mockDataGenerator.stop();
    } else {
      if (!serverStatus.isConnected) {
        const isHealthy = await api.checkServerStatus();
        if (!isHealthy) {
          window.alert('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
          return;
        }
      }
      mockDataGenerator.start(2);
    }
    setMockDataStatus(mockDataGenerator.getStatus());
  };

  // 로그아웃 처리
  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
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

          {/* 모의 데이터 상태 (관리자만) */}
          {hasRole('admin') && (
            <div className="hidden md:flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-500" />
              <Badge variant={mockDataStatus.isRunning ? "default" : "secondary"}>
                {mockDataStatus.isRunning ? "데이터 생성중" : "데이터 중지"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleMockDataToggle}>
                {mockDataStatus.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* 알림 */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              2
            </Badge>
          </Button>

          {/* 설정 (매니저 이상) */}
          {hasRole(['admin', 'manager']) && (
            <Button variant="ghost" size="sm">
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
            {/* 상태 요약 */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">시스템 상태</span>
                  <Badge className="bg-green-100 text-green-800">정상</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">백엔드 연결</span>
                  <Badge className={`text-xs ${
                    serverStatus.isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {serverStatus.isConnected ? '활성' : '비활성'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
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
                  );
                })}
              </div>
            </nav>

            {/* 하단 정보 */}
            <div className="p-4 border-t border-gray-200">
              <Card className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">권한</span>
                    <span className="text-xs text-gray-500">
                      {user?.role === 'admin' ? '관리자' : 
                       user?.role === 'manager' ? '매니저' : '작업자'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">시스템 버전</span>
                    <span className="text-xs text-gray-500">v2.1.0</span>
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
            {/* 서버 연결 상태 알림 */}
            {!serverStatus.isConnected && (
              <Alert className="mb-6 border-red-500 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p><strong>서버 연결 오류</strong></p>
                    <p>백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        마지막 확인: {serverStatus.lastChecked ? serverStatus.lastChecked.toLocaleTimeString() : '확인 안됨'}
                      </span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <ActiveComponent />
          </div>
        </main>
      </div>
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
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <AppContent />;
}