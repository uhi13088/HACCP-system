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
  Calendar,
  FileSpreadsheet,
  Columns,
  ArrowUp,
  ArrowDown,
  Copy,
  X
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

  // 초기 데이터 로드
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadSettings(),
        loadAuditLogs(),
        loadSensors()
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@company.com',
          name: '시스템 관리자',
          role: 'admin',
          status: 'active',
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          email: 'manager@company.com',
          name: '품질관리팀장',
          role: 'manager',
          status: 'active',
          lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          email: 'operator1@company.com',
          name: '작업자 김철수',
          role: 'operator',
          status: 'active',
          lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const mockSettings: SystemSetting[] = [
        {
          id: '1',
          category: '알림 설정',
          key: 'alert_email_enabled',
          value: 'true',
          description: '이메일 알림 활성화',
          type: 'boolean'
        },
        {
          id: '2',
          category: '시스템',
          key: 'data_retention_days',
          value: '365',
          description: '데이터 보관 기간 (일)',
          type: 'number'
        },
        {
          id: '3',
          category: '모니터링',
          key: 'sensor_check_interval_seconds',
          value: '30',
          description: '센서 체크 간격 (초)',
          type: 'number'
        }
      ];
      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId: '1',
          userEmail: 'admin@company.com',
          action: 'CREATE',
          resource: 'USER',
          details: '새 사용자 생성: operator3@company.com',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.100'
        },
        {
          id: '2',
          userId: '1',
          userEmail: 'admin@company.com',
          action: 'DELETE',
          resource: 'SENSOR',
          details: '센서 제거: TEMP_SENSOR_05',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.100'
        }
      ];
      setAuditLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const loadSensors = async () => {
    try {
      const mockSensors: Sensor[] = [
        {
          id: 'TEMP_01',
          name: '주방 냉장고 온도계',
          type: 'temperature',
          location: '주방',
          status: 'online',
          lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          batteryLevel: 85,
          calibrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'TEMP_02',
          name: '창고 냉동고 온도계',
          type: 'temperature',
          location: '창고',
          status: 'offline',
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          batteryLevel: 15,
          calibrationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'HUM_01',
          name: '창고 습도계',
          type: 'humidity',
          location: '창고',
          status: 'online',
          lastUpdate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          batteryLevel: 92,
          calibrationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'METAL_01',
          name: '포장라인 금속검출기',
          type: 'metal_detector',
          location: '포장실',
          status: 'error',
          lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          calibrationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setSensors(mockSensors);
    } catch (error) {
      console.error('Failed to load sensors:', error);
    }
  };

  // 사용자 추가
  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const user: User = {
        id: Date.now().toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      setUsers(prev => [...prev, user]);
      setNewUser({ email: '', name: '', role: 'operator', password: '' });
      setShowUserDialog(false);
      toast.success("사용자가 추가되었습니다.");
    } catch (error) {
      toast.error("사용자 추가에 실패했습니다.");
    }
  };

  // 센서 추가
  const handleAddSensor = async () => {
    if (!newSensor.name || !newSensor.type || !newSensor.location) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const sensor: Sensor = {
        id: `SENSOR_${Date.now()}`,
        name: newSensor.name,
        type: newSensor.type,
        location: newSensor.location,
        status: 'online',
        lastUpdate: new Date().toISOString(),
        batteryLevel: 100,
        calibrationDate: new Date().toISOString()
      };

      setSensors(prev => [...prev, sensor]);
      setNewSensor({ name: '', type: '', location: '' });
      setShowSensorDialog(false);
      toast.success("센서가 추가되었습니다.");
    } catch (error) {
      toast.error("센서 추가에 실패했습니다.");
    }
  };

  // 센서 삭제
  const handleDeleteSensor = (sensorId: string) => {
    setSensors(prev => prev.filter(s => s.id !== sensorId));
    toast.success("센서가 삭제되었습니다.");
  };

  // 설정 저장
  const handleSaveSettings = async () => {
    try {
      // 실제로는 API 호출
      setSettingsChanged(false);
      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      toast.error("설정 저장에 실패했습니다.");
    }
  };

  // 설정값 변경
  const handleSettingChange = (settingId: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId ? { ...setting, value } : setting
    ));
    setSettingsChanged(true);
  };

  // 상태 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">온라인</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">오프라인</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">오류</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활성</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold">시스템 관리</h1>
          <p className="text-sm text-gray-600">사용자, 설정, 백업, 센서, 로그, 데이터를 관리합니다.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            사용자
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            백업
          </TabsTrigger>
          <TabsTrigger value="sensors">
            <Activity className="w-4 h-4 mr-2" />
            센서
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="w-4 h-4 mr-2" />
            로그
          </TabsTrigger>
          <TabsTrigger value="data">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            데이터
          </TabsTrigger>
        </TabsList>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">사용자 관리</h2>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  사용자 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 사용자 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="사용자 이름"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">역할</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">관리자</SelectItem>
                        <SelectItem value="manager">매니저</SelectItem>
                        <SelectItem value="operator">작업자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddUser}>추가</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>마지막 로그인</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role === 'admin' ? '관리자' : 
                         user.role === 'manager' ? '매니저' : '작업자'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{new Date(user.lastLogin).toLocaleString('ko-KR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 시스템 설정 탭 */}
        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">시스템 설정</h2>
            {settingsChanged && (
              <Button onClick={handleSaveSettings}>
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {settings.map((setting) => (
              <Card key={setting.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{setting.description}</Label>
                    <Badge variant="outline">{setting.category}</Badge>
                  </div>
                  
                  {setting.type === 'boolean' ? (
                    <Switch
                      checked={setting.value === 'true'}
                      onCheckedChange={(checked) => 
                        handleSettingChange(setting.id, checked.toString())
                      }
                    />
                  ) : (
                    <Input
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                    />
                  )}
                  
                  <p className="text-xs text-gray-500">{setting.key}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 백업 관리 탭 */}
        <TabsContent value="backup" className="space-y-4">
          <h2 className="font-medium">백업 관리</h2>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              백업 기능이 구현 중입니다. 현재는 모의 데이터를 표시합니다.
            </AlertDescription>
          </Alert>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">자동 백업</h3>
                  <p className="text-sm text-gray-600">정기적으로 데이터를 백업합니다</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>백업 주기</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">매 시간</SelectItem>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>백업 시간</Label>
                  <Input type="time" defaultValue="02:00" />
                </div>
              </div>
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                수동 백업 실행
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 센서 관리 탭 */}
        <TabsContent value="sensors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">센서 관리</h2>
            <Dialog open={showSensorDialog} onOpenChange={setShowSensorDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  센서 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 센서 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sensor-name">센서 이름</Label>
                    <Input
                      id="sensor-name"
                      value={newSensor.name}
                      onChange={(e) => setNewSensor(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="예: 주방 온도계"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sensor-type">센서 타입</Label>
                    <Select value={newSensor.type} onValueChange={(value) => setNewSensor(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="센서 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temperature">온도계</SelectItem>
                        <SelectItem value="humidity">습도계</SelectItem>
                        <SelectItem value="pressure">압력계</SelectItem>
                        <SelectItem value="metal_detector">금속검출기</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sensor-location">설치 위치</Label>
                    <Input
                      id="sensor-location"
                      value={newSensor.location}
                      onChange={(e) => setNewSensor(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="예: 주방, 창고, 포장실"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSensorDialog(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddSensor}>추가</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {sensors.map((sensor) => (
              <Card key={sensor.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{sensor.name}</h3>
                      {getStatusBadge(sensor.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>ID: {sensor.id}</span>
                      <span>타입: {sensor.type}</span>
                      <span>위치: {sensor.location}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>마지막 업데이트: {new Date(sensor.lastUpdate).toLocaleString('ko-KR')}</span>
                      {sensor.batteryLevel && (
                        <span>배터리: {sensor.batteryLevel}%</span>
                      )}
                      <span>보정일: {new Date(sensor.calibrationDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteSensor(sensor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 감사 로그 탭 */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">감사 로그</h2>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="CREATE">생성</SelectItem>
                <SelectItem value="UPDATE">수정</SelectItem>
                <SelectItem value="DELETE">삭제</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>작업</TableHead>
                  <TableHead>리소스</TableHead>
                  <TableHead>세부사항</TableHead>
                  <TableHead>IP 주소</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs
                  .filter(log => logFilter === 'all' || log.action === logFilter)
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString('ko-KR')}
                      </TableCell>
                      <TableCell>{log.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === 'CREATE' ? 'default' :
                          log.action === 'UPDATE' ? 'secondary' :
                          log.action === 'DELETE' ? 'destructive' : 'outline'
                        }>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.details}
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 데이터 관리 탭 */}
        <TabsContent value="data" className="space-y-4">
          <h2 className="font-medium">데이터 관리</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">데이터 가져오기</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Excel 또는 CSV 파일에서 데이터를 가져옵니다.
                </p>
                <Button className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  파일 선택
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">데이터 내보내기</h3>
                </div>
                <p className="text-sm text-gray-600">
                  시스템 데이터를 Excel 또는 CSV 형식으로 내보냅니다.
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  데이터 내보내기
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-medium text-red-600">위험 영역</h3>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  아래 작업들은 되돌릴 수 없습니다. 신중하게 진행하세요.
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-4">
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  모든 로그 삭제
                </Button>
                <Button variant="destructive" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  시스템 초기화
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}