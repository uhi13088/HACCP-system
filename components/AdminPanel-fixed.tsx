import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";
import { 
  Users, 
  Settings, 
  Database, 
  FileText, 
  Wifi, 
  Bell,
  Shield,
  Activity,
  Trash2,
  Plus,
  Edit,
  Eye,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  Save,
  PlayCircle,
  Loader2,
  ExternalLink,
  Calendar
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { backupScheduler } from "../utils/backupScheduler";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'email';
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

interface Sensor {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'online' | 'offline' | 'error';
  lastUpdate: string;
  batteryLevel?: number;
  calibrationDate: string;
}

interface MenuBackupConfig {
  id: string;
  menuId: string;
  menuName: string;
  spreadsheetId: string;
  isConnected: boolean;
  lastBackup: string | null;
  lastTest: string | null;
}

export function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  
  // 사용자 관리 상태
  const [users, setUsers] = useState<User[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'operator' as const,
    password: ''
  });

  // 시스템 설정 상태
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // 감사 로그 상태
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logFilter, setLogFilter] = useState('all');

  // 센서 관리 상태
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [showSensorDialog, setShowSensorDialog] = useState(false);
  const [newSensor, setNewSensor] = useState({
    name: '',
    type: '',
    location: ''
  });
  
  // 알림 다이얼로그 상태
  const [alertDialog, setAlertDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  // 백업 관련 상태 추가
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

  // 백업 설정
  const [backupConfig, setBackupConfig] = useState({
    spreadsheetId: '',
    serviceAccountJson: ''
  });
  const [configStatus, setConfigStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  // 메뉴별 백업 설정
  const [menuBackupConfigs, setMenuBackupConfigs] = useState<MenuBackupConfig[]>([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [newSpreadsheetId, setNewSpreadsheetId] = useState('');
  const [menuBackupLoading, setMenuBackupLoading] = useState(false);

  // 백업 가능한 메뉴 목록
  const backupableMenus = [
    { id: 'checklist', name: '체크리스트' },
    { id: 'ccp', name: 'CCP 관리' },
    { id: 'monitoring', name: '환경 모니터링' },
    { id: 'analysis', name: '위험 분석' },
    { id: 'production-log', name: '생산일지' },
    { id: 'temperature-log', name: '냉장냉동고 온도기록부' },
    { id: 'cleaning-log', name: '세척·소독 기록부' },
    { id: 'receiving-log', name: '원료입고 검수기록부' },
    { id: 'pest-control', name: '방충·방서 주간점검표' },
    { id: 'facility-inspection', name: '시설점검 주간체크리스트' },
    { id: 'training-record', name: '교육훈련 기록부' },
    { id: 'visitor-log', name: '외부인출입관리대장' },
    { id: 'accident-report', name: '사고보고서' }
  ];
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // 메뉴별 백업 설정 관련 함수들
  const addMenuBackupConfig = () => {
    if (!selectedMenu || !newSpreadsheetId) {
      toast.error('메뉴와 스프레드시트 ID를 모두 입력해주세요.');
      return;
    }

    // 이미 설정된 메뉴인지 확인
    if (menuBackupConfigs.find(config => config.menuId === selectedMenu)) {
      toast.error('이미 설정된 메뉴입니다.');
      return;
    }

    const menuInfo = backupableMenus.find(menu => menu.id === selectedMenu);
    if (!menuInfo) {
      toast.error('유효하지 않은 메뉴입니다.');
      return;
    }

    const newConfig: MenuBackupConfig = {
      id: `menu-backup-${Date.now()}`,
      menuId: selectedMenu,
      menuName: menuInfo.name,
      spreadsheetId: newSpreadsheetId,
      isConnected: false,
      lastBackup: null,
      lastTest: null
    };

    setMenuBackupConfigs(prev => [...prev, newConfig]);
    setSelectedMenu('');
    setNewSpreadsheetId('');
    
    toast.success(`${menuInfo.name} 백업 설정이 추가되었습니다.`);
  };

  const saveMenuBackupConfigs = async () => {
    if (menuBackupConfigs.length === 0) {
      toast.error('저장할 메뉴별 백업 설정이 없습니다.');
      return;
    }

    setMenuBackupLoading(true);
    try {
      // API 호출로 메뉴별 백업 설정 저장
      for (const config of menuBackupConfigs) {
        await api.setMenuBackupConfig({
          menu_id: config.menuId,
          menu_name: config.menuName,
          spreadsheet_id: config.spreadsheetId
        });
      }

      toast.success('메뉴별 백업 설정이 저장되었습니다.');
    } catch (error) {
      console.error('메뉴별 백업 설정 저장 실패:', error);
      toast.error('메뉴별 백업 설정 저장에 실패했습니다.');
    } finally {
      setMenuBackupLoading(false);
    }
  };

  const testMenuConnection = async () => {
    if (!selectedMenu || !newSpreadsheetId) {
      toast.error('메뉴와 스프레드시트 ID를 입력해주세요.');
      return;
    }

    setMenuBackupLoading(true);
    try {
      const result = await api.testMenuBackupConnection({
        menu_id: selectedMenu,
        spreadsheet_id: newSpreadsheetId
      });

      if (result.success) {
        toast.success('연결 테스트 성공!', {
          description: '스프레드시트에 정상적으로 연결되었습니다.'
        });
      } else {
        toast.error('연결 테스트 실패', {
          description: result.error || '스프레드시트 연결을 확인해주세요.'
        });
      }
    } catch (error) {
      console.error('연결 테스트 실패:', error);
      toast.error('연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setMenuBackupLoading(false);
    }
  };

  const testSpecificMenuConnection = async (configId: string) => {
    const config = menuBackupConfigs.find(c => c.id === configId);
    if (!config) return;

    setMenuBackupLoading(true);
    try {
      const result = await api.testMenuBackupConnection({
        menu_id: config.menuId,
        spreadsheet_id: config.spreadsheetId
      });

      const now = new Date().toLocaleString('ko-KR');
      
      setMenuBackupConfigs(prev => prev.map(c => 
        c.id === configId 
          ? { ...c, isConnected: result.success, lastTest: now }
          : c
      ));

      if (result.success) {
        toast.success(`${config.menuName} 연결 테스트 성공!`);
      } else {
        toast.error(`${config.menuName} 연결 테스트 실패`, {
          description: result.error || '스프레드시트 연결을 확인해주세요.'
        });
      }
    } catch (error) {
      console.error('연결 테스트 실패:', error);
      toast.error('연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setMenuBackupLoading(false);
    }
  };

  const removeMenuBackupConfig = (configId: string) => {
    const config = menuBackupConfigs.find(c => c.id === configId);
    if (!config) return;

    setMenuBackupConfigs(prev => prev.filter(c => c.id !== configId));
    toast.success(`${config.menuName} 백업 설정이 삭제되었습니다.`);
  };

  // 메뉴별 백업설정 탭 콘텐츠
  const MenuBackupTabContent = () => (
    <TabsContent value="menu-backup" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>메뉴별 백업설정</h3>
          <p className="text-muted-foreground">각 메뉴별로 개별 스프레드시트 ID를 설정하여 백업합니다</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={addMenuBackupConfig} disabled={menuBackupLoading}>
            <Plus className="w-4 h-4 mr-2" />
            추가
          </Button>
          <Button onClick={saveMenuBackupConfigs} disabled={menuBackupLoading}>
            {menuBackupLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      {/* 새 메뉴 백업 설정 추가 폼 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="menuSelect">메뉴 선택</Label>
              <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                <SelectTrigger>
                  <SelectValue placeholder="백업할 메뉴를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {backupableMenus
                    .filter(menu => !menuBackupConfigs.find(config => config.menuId === menu.id))
                    .map(menu => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="spreadsheetId">구글 스프레드시트 ID</Label>
              <Input
                id="spreadsheetId"
                value={newSpreadsheetId}
                onChange={(e) => setNewSpreadsheetId(e.target.value)}
                placeholder="1DgWjS_suFn60Z_YblWepoEKybycs2wwAwCyOyglVEcc"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={testMenuConnection}
                disabled={!selectedMenu || !newSpreadsheetId || menuBackupLoading}
                variant="outline"
                className="w-full"
              >
                {menuBackupLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                연결테스트
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 설정된 메뉴별 백업 목록 */}
      <div className="space-y-4">
        {menuBackupConfigs.map((config) => (
          <Card key={config.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4>{config.menuName}</h4>
                  <Badge className={config.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {config.isConnected ? '연결완료' : '연결실패'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  스프레드시트 ID: {config.spreadsheetId}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>최근 백업: {config.lastBackup || '없음'}</span>
                  <span>최근 테스트: {config.lastTest || '없음'}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSpecificMenuConnection(config.id)}
                  disabled={menuBackupLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  테스트
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeMenuBackupConfig(config.id)}
                  disabled={menuBackupLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {menuBackupConfigs.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="mb-2">설정된 메뉴별 백업이 없습니다</h4>
            <p className="text-sm">상단의 '추가' 버튼을 클릭하여 메뉴별 백업을 설정하세요.</p>
          </div>
        </Card>
      )}
    </TabsContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>시스템 관리</h1>
          <p className="text-muted-foreground">사용자, 설정, 센서 및 시스템 전반을 관리합니다</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex flex-wrap justify-start gap-1">
          <TabsTrigger value="users" className="flex items-center space-x-2 px-3 py-2 text-sm">
            <Users className="w-4 h-4" />
            <span>사용자 관리</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2 px-3 py-2 text-sm">
            <Settings className="w-4 h-4" />
            <span>시스템 설정</span>
          </TabsTrigger>
          <TabsTrigger value="sensors" className="flex items-center space-x-2 px-3 py-2 text-sm">
            <Wifi className="w-4 h-4" />
            <span>센서 관리</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2 px-3 py-2 text-sm">
            <FileText className="w-4 h-4" />
            <span>감사 로그</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2 px-3 py-2 text-sm">
            <Download className="w-4 h-4" />
            <span>백업 설정</span>
          </TabsTrigger>
          <TabsTrigger value="menu-backup" className="flex items-center space-x-2 px-3 py-2 text-sm">
            <Database className="w-4 h-4" />
            <span>메뉴별 백업설정</span>
          </TabsTrigger>
        </TabsList>

        {MenuBackupTabContent()}
        
        {/* 다른 탭들은 기존 코드 유지 */}
        <TabsContent value="users">
          <div>사용자 관리 내용</div>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}