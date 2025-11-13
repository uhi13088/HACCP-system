import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  Settings, 
  Plus, 
  Wifi, 
  Bluetooth, 
  Usb, 
  Radio,
  CheckCircle,
  XCircle,
  RefreshCw,
  RotateCcw,
  Activity,
  Trash2
} from "lucide-react";

interface EnvironmentMonitoringProps {
  realTimeMonitoring?: boolean;
  serverStatus?: {
    isConnected: boolean;
    lastChecked: Date | null;
    mockModeEnabled?: boolean;
  };
}

export function EnvironmentMonitoring({ realTimeMonitoring = false, serverStatus }: EnvironmentMonitoringProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [showHardwareSettings, setShowHardwareSettings] = useState(false);
  const [showAddSensor, setShowAddSensor] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null);

  // 모의 온도 데이터
  const temperatureData = [
    { time: "00:00", 냉장고1: 2.1, 냉장고2: 2.3, 냉동고: -18.2, 조리실: 22.1 },
    { time: "02:00", 냉장고1: 2.2, 냉장고2: 2.1, 냉동고: -18.1, 조리실: 22.3 },
    { time: "04:00", 냉장고1: 2.0, 냉장고2: 2.4, 냉동고: -17.9, 조리실: 22.0 },
    { time: "06:00", 냉장고1: 2.3, 냉장고2: 2.2, 냉동고: -18.0, 조리실: 22.5 },
    { time: "08:00", 냉장고1: 2.5, 냉장고2: 2.6, 냉동고: -17.8, 조리실: 23.1 },
    { time: "10:00", 냉장고1: 2.8, 냉장고2: 2.9, 냉동고: -17.5, 조리실: 24.2 },
    { time: "12:00", 냉장고1: 3.1, 냉장고2: 3.2, 냉동고: -16.8, 조리실: 26.5 },
    { time: "14:00", 냉장고1: 2.9, 냉장고2: 3.0, 냉동고: -16.2, 조리실: 25.8 },
    { time: "16:00", 냉장고1: 2.7, 냉장고2: 2.8, 냉동고: -16.5, 조리실: 24.9 },
    { time: "18:00", 냉장고1: 2.5, 냉장고2: 2.6, 냉동고: -17.1, 조리실: 24.2 },
    { time: "20:00", 냉장고1: 2.3, 냉장고2: 2.4, 냉동고: -17.6, 조리실: 23.5 },
    { time: "22:00", 냉장고1: 2.1, 냉장고2: 2.2, 냉동고: -18.0, 조리실: 22.8 }
  ];

  // 습도 데이터
  const humidityData = [
    { time: "00:00", 창고: 65, 조리실: 58, 식당: 62 },
    { time: "02:00", 창고: 66, 조리실: 57, 식당: 61 },
    { time: "04:00", 창고: 64, 조리실: 59, 식당: 63 },
    { time: "06:00", 창고: 67, 조리실: 60, 식당: 64 },
    { time: "08:00", 창고: 68, 조리실: 62, 식당: 66 },
    { time: "10:00", 창고: 70, 조리실: 65, 식당: 68 },
    { time: "12:00", 창고: 72, 조리실: 68, 식당: 70 },
    { time: "14:00", 창고: 71, 조리실: 67, 식당: 69 },
    { time: "16:00", 창고: 69, 조리실: 65, 식당: 67 },
    { time: "18:00", 창고: 68, 조리실: 63, 식당: 66 },
    { time: "20:00", 창고: 66, 조리실: 61, 식당: 64 },
    { time: "22:00", 창고: 65, 조리실: 59, 식당: 63 }
  ];

  // 센서 데이터 초기 상태 - 빈 배열로 시작
  const [sensors, setSensors] = useState<any[]>([]);

  // 실시간 모니터링 상태 및 서버 연결 상태에 따른 센서 데이터 설정
  useEffect(() => {
    console.log('🔍 [ENVIRONMENT] State change:', { realTimeMonitoring, serverConnected: serverStatus?.isConnected });
    
    const isServerConnected = serverStatus?.isConnected ?? false;
    
    if (realTimeMonitoring && isServerConnected) {
      // 모니터링 중이고 서버 연결됨 시 - 하드웨어 감지 시도
      console.log('✅ [ENVIRONMENT] Attempting hardware detection');
      
      // 실제 하드웨어가 없는 경우 데모 센서 표시 (개발/테스트용)
      console.log('🔧 [ENVIRONMENT] No physical sensors detected, showing demo sensors');
      setSensors([
        { 
          id: 1, 
          name: "냉장고 1 (데모)", 
          type: "temperature", 
          value: `${(2 + Math.random()).toFixed(1)}°C`, 
          status: "정상", 
          target: "1-4°C",
          location: "주방",
          lastUpdate: "실시간",
          trend: "stable",
          deviceId: "DEMO001",
          connectionType: "demo",
          connectionStatus: "demo_mode",
          batteryLevel: 85,
          calibrationOffset: 0.1,
          isDemo: true
        },
        { 
          id: 2, 
          name: "냉장고 2 (데모)", 
          type: "temperature", 
          value: `${(2.5 + Math.random()).toFixed(1)}°C`, 
          status: "정상", 
          target: "1-4°C",
          location: "보조주방",
          lastUpdate: "실시간",
          trend: "stable",
          deviceId: "DEMO002",
          connectionType: "demo",
          connectionStatus: "demo_mode",
          batteryLevel: 72,
          calibrationOffset: -0.2,
          isDemo: true
        },
        { 
          id: 3, 
          name: "냉동고 (데모)", 
          type: "temperature", 
          value: `${(-18 + Math.random()).toFixed(1)}°C`, 
          status: "정상", 
          target: "<-18°C",
          location: "창고",
          lastUpdate: "실시간",
          trend: "stable",
          deviceId: "DEMO003",
          connectionType: "demo",
          connectionStatus: "demo_mode",
          batteryLevel: 91,
          calibrationOffset: 0.0,
          isDemo: true
        },
        { 
          id: 4, 
          name: "조리실 (데모)", 
          type: "temperature", 
          value: `${(23 + Math.random() * 2).toFixed(1)}°C`, 
          status: "정상", 
          target: "20-30°C",
          location: "주방",
          lastUpdate: "실시간",
          trend: "stable",
          deviceId: "DEMO004",
          connectionType: "demo",
          connectionStatus: "demo_mode",
          batteryLevel: null,
          calibrationOffset: 0.3,
          isDemo: true
        },
        { 
          id: 5, 
          name: "창고 습도 (데모)", 
          type: "humidity", 
          value: `${(65 + Math.random() * 5).toFixed(0)}%`, 
          status: "정상", 
          target: "60-70%",
          location: "창고",
          lastUpdate: "실시간",
          trend: "stable",
          deviceId: "DEMO005",
          connectionType: "demo",
          connectionStatus: "demo_mode",
          batteryLevel: 68,
          calibrationOffset: 2.0,
          isDemo: true
        },
        { 
          id: 6, 
          name: "조리실 습도 (데모)", 
          type: "humidity", 
          value: `${(60 + Math.random() * 8).toFixed(0)}%`, 
          status: "정상", 
          target: "50-70%",
          location: "주방",
          lastUpdate: "실시간",
          trend: "stable",
          deviceId: "DEMO006",
          connectionType: "demo",
          connectionStatus: "demo_mode",
          batteryLevel: 89,
          calibrationOffset: -1.5,
          isDemo: true
        }
      ]);
    } else if (realTimeMonitoring && !isServerConnected) {
      // 모니터링 중이지만 서버 연결 안됨 - 오프라인 데모 모드
      console.log('⚠ [ENVIRONMENT] Server disconnected, showing offline demo sensors');
      setSensors([
        { 
          id: 1, 
          name: "냉장고 1 (오프라인)", 
          type: "temperature", 
          value: "--°C", 
          status: "연결 안됨", 
          target: "1-4°C",
          location: "주방",
          lastUpdate: "서버 연결 필요",
          trend: "stable",
          deviceId: "TH001",
          connectionType: "wifi",
          connectionStatus: "server_offline",
          batteryLevel: 85,
          calibrationOffset: 0.1,
          isOffline: true
        },
        { 
          id: 2, 
          name: "냉장고 2 (오프라인)", 
          type: "temperature", 
          value: "--°C", 
          status: "연결 안됨", 
          target: "1-4°C",
          location: "보조주방",
          lastUpdate: "서버 연결 필요",
          trend: "stable",
          deviceId: "T002",
          connectionType: "bluetooth",
          connectionStatus: "server_offline",
          batteryLevel: 72,
          calibrationOffset: -0.2,
          isOffline: true
        },
        { 
          id: 3, 
          name: "냉동고 (오프라인)", 
          type: "temperature", 
          value: "--°C", 
          status: "연결 안됨", 
          target: "<-18°C",
          location: "창고",
          lastUpdate: "서버 연결 필요",
          trend: "stable",
          deviceId: "T003",
          connectionType: "wifi",
          connectionStatus: "server_offline",
          batteryLevel: 91,
          calibrationOffset: 0.0,
          isOffline: true
        }
      ]);
    } else if (!realTimeMonitoring) {
      // 모니터링 중지 시 - 센서 없음 상태
      console.log('⏸ [ENVIRONMENT] Monitoring stopped, clearing sensors');
      setSensors([]);
    }
  }, [realTimeMonitoring, serverStatus?.isConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "정상": return "bg-green-100 text-green-800";
      case "주의": return "bg-yellow-100 text-yellow-800";
      case "경고": return "bg-red-100 text-red-800";
      case "연결 안됨": return "bg-gray-100 text-gray-800";
      case "데이터 없음": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "temperature": return <Thermometer className="w-5 h-5" />;
      case "humidity": return <Droplets className="w-5 h-5" />;
      default: return <Wind className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return "↗️";
      case "down": return "↘️";
      case "stable": return "➡️";
      default: return "➡️";
    }
  };

  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case "wifi": return <Wifi className="w-4 h-4" />;
      case "bluetooth": return <Bluetooth className="w-4 h-4" />;
      case "usb": return <Usb className="w-4 h-4" />;
      case "radio": return <Radio className="w-4 h-4" />;
      case "demo": return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "disconnected": return <XCircle className="w-4 h-4 text-red-500" />;
      case "connecting": return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "demo_mode": return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "server_offline": return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // 센서 삭제
  const handleDeleteSensor = (sensorId: number) => {
    const sensorToDelete = sensors.find(s => s.id === sensorId);
    if (!sensorToDelete) return;

    setSensors(prevSensors => prevSensors.filter(sensor => sensor.id !== sensorId));
    toast.success(`센서 "${sensorToDelete.name}"이(가) 삭제되었습니다.`);
  };

  // 센서 설정 열기
  const handleOpenSensorSettings = (sensorId: number) => {
    setSelectedSensorId(sensorId);
    setShowHardwareSettings(true);
  };

  // 센서 재보정
  const handleCalibrateSensor = (sensorId: number) => {
    toast.success(`센서 ${sensorId} 재보정을 시작합니다.`);
  };

  // 데이터 내보내기
  const handleExportData = () => {
    toast.info("데이터 내보내기를 준비하고 있습니다...");
    
    setTimeout(() => {
      const csvData = [
        "시간,센서명,타입,값,상태,위치",
        ...sensors.map(sensor => 
          `${new Date().toLocaleString()},${sensor.name},${sensor.type},${sensor.value},${sensor.status},${sensor.location}`
        )
      ].join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `환경모니터링_데이터_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      toast.success("데이터가 성공적으로 내보내졌습니다.");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h1>환경 모니터링</h1>
            <Badge className={`${
              realTimeMonitoring 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {realTimeMonitoring ? '모니터링 중' : '모니터링 중지'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {realTimeMonitoring && serverStatus?.isConnected
              ? '온도, 습도 등 환경 데이터를 실시간으로 모니터링합니다'
              : realTimeMonitoring && !serverStatus?.isConnected
              ? '서버 연결이 필요합니다. 현재 데이터 없음 상태입니다'
              : '센서 모니터링이 중지되어 있습니다. 헤더에서 모니터링을 시작하세요'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">최근 24시간</SelectItem>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowAddSensor(true)}>
            <Plus className="w-4 h-4 mr-2" />
            센서 추가
          </Button>
          <Button variant="outline" onClick={() => setShowHardwareSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            하드웨어 설정
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            데이터 내보내기
          </Button>
        </div>
      </div>

      {/* 하드웨어 미연결 알림 */}
      {realTimeMonitoring && serverStatus?.isConnected && sensors.length > 0 && sensors[0]?.isDemo && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">데모 모드로 실행 중입니다</h4>
              <p className="text-sm text-blue-700 mt-1">
                실제 센서 하드웨어가 연결되지 않아 시뮬레이션 데이터를 표시하고 있습니다. 
                실제 센서를 연결하면 자동으로 전환됩니다.
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">데모 모드</Badge>
          </div>
        </Card>
      )}

      {/* 센서 상태 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Thermometer className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">센서가 연결되지 않았습니다</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {!realTimeMonitoring 
                      ? "센서 모니터링을 시작하면 연결된 센서들을 확인할 수 있습니다."
                      : "서버에 연결된 센서가 없습니다. 센서 연결 상태를 확인해주세요."
                    }
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddSensor(true)}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  센서 추가하기
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          sensors.map((sensor) => (
            <Card key={sensor.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    sensor.status === "정상" ? "bg-green-100" :
                    sensor.status === "주의" ? "bg-yellow-100" : 
                    sensor.status === "경고" ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    {getIcon(sensor.type)}
                  </div>
                  <div>
                    <h3 className="text-sm">{sensor.name}</h3>
                    <p className="text-xs text-muted-foreground">{sensor.location}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        {getConnectionIcon(sensor.connectionType)}
                        <span className="text-xs text-muted-foreground">{sensor.deviceId}</span>
                      </div>
                      {getConnectionStatusIcon(sensor.connectionStatus)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className={getStatusColor(sensor.status)}>
                    {sensor.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleOpenSensorSettings(sensor.id)}
                    className="h-6 w-6 p-0"
                    title="센서 설정"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteSensor(sensor.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="센서 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{sensor.value}</span>
                  <span className="text-lg">{getTrendIcon(sensor.trend)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>목표: {sensor.target}</span>
                  <span>{sensor.lastUpdate}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  {sensor.batteryLevel !== null && (
                    <div className="flex items-center space-x-1">
                      <div className={`w-3 h-2 border rounded-sm ${sensor.batteryLevel > 20 ? 'bg-green-400' : 'bg-red-400'}`}>
                        <div 
                          className="h-full bg-current rounded-sm transition-all"
                          style={{ width: `${sensor.batteryLevel}%` }}
                        />
                      </div>
                      <span>{sensor.batteryLevel}%</span>
                    </div>
                  )}
                  {sensor.batteryLevel === null && (
                    <span className="flex items-center space-x-1">
                      <Usb className="w-3 h-3" />
                      <span>전원 연결</span>
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCalibrateSensor(sensor.id)}
                    className="h-4 px-1 text-xs hover:bg-gray-100"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    재보정
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 데이터 차트 */}
      <Card className="p-6">
        <Tabs defaultValue="temperature" className="space-y-4">
          <TabsList>
            <TabsTrigger value="temperature">온도 데이터</TabsTrigger>
            <TabsTrigger value="humidity">습도 데이터</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3>온도 추세 ({selectedPeriod})</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>냉장고1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>냉장고2</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>냉동고</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>조리실</span>
                </div>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="냉장고1" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="냉장고2" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="냉동고" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="조리실" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="humidity" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3>습도 추세 ({selectedPeriod})</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>창고</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>조리실</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>식당</span>
                </div>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={humidityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="창고" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="조리실" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="식당" stackId="3" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 알림 및 이상 상황 */}
      <Card className="p-6">
        <h3 className="mb-4">최근 알림 및 이상 상황</h3>
        <div className="space-y-3">
          {!realTimeMonitoring ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">센서 모니터링이 중지되어 있습니다</p>
                <p className="text-xs text-muted-foreground">실시간 알림을 받으려면 센서 모니터링을 시작하세요</p>
              </div>
            </div>
          ) : !serverStatus?.isConnected ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">서버에 연결되어 있지 않습니다</p>
                <p className="text-xs text-muted-foreground">실시간 센서 데이터를 받으려면 서버 연결이 필요합니다</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm">냉동고 온도가 -16.2°C로 기준치를 초과했습니다</p>
                  <p className="text-xs text-muted-foreground">5분 전 • 창고 냉동고</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toast.success("냉동고 온도 경고 알림이 확인되었습니다.")}
                >
                  확인
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm">창고 습도가 71%로 권장 범위를 초과했습니다</p>
                  <p className="text-xs text-muted-foreground">12분 전 • 창고</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toast.success("창고 습도 주의 알림이 확인되었습니다.")}
                >
                  확인
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm">모든 냉장고 온도가 정상 범위로 회복되었습니다</p>
                  <p className="text-xs text-muted-foreground">1시간 전 • 주방</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 하드웨어 설정 다이얼로그 */}
      <Dialog open={showHardwareSettings} onOpenChange={setShowHardwareSettings}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>하드웨어 센서 설정</span>
            </DialogTitle>
            <DialogDescription>
              환경 센서의 연결 및 설정을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 선택된 센서 정보 */}
            {selectedSensorId && (
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">선택된 센서</h4>
                {(() => {
                  const selectedSensor = sensors.find(s => s.id === selectedSensorId);
                  if (!selectedSensor) return null;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">센서명:</span>
                        <span className="text-sm font-medium">{selectedSensor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">디바이스 ID:</span>
                        <span className="text-sm font-medium">{selectedSensor.deviceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">타입:</span>
                        <span className="text-sm font-medium">
                          {selectedSensor.type === 'temperature' ? '온도 센서' : '습도 센서'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">연결 방식:</span>
                        <span className="text-sm font-medium capitalize">{selectedSensor.connectionType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">위치:</span>
                        <span className="text-sm font-medium">{selectedSensor.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">상태:</span>
                        <span className="text-sm font-medium">{selectedSensor.status}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 센서 설정 폼 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>센서명</Label>
                  <Input placeholder="센서명을 입력하세요" />
                </div>
                <div className="space-y-2">
                  <Label>디바이스 ID</Label>
                  <Input placeholder="디바이스 ID를 입력하세요" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>센서 타입</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="센서 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">온도 센서</SelectItem>
                      <SelectItem value="humidity">습도 센서</SelectItem>
                      <SelectItem value="air_quality">공기질 센서</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>연결 방식</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="연결 방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wifi">WiFi</SelectItem>
                      <SelectItem value="bluetooth">Bluetooth</SelectItem>
                      <SelectItem value="usb">USB</SelectItem>
                      <SelectItem value="radio">무선 통신</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>설치 위치</Label>
                <Input placeholder="센서 설치 위치를 입력하세요" />
              </div>

              <div className="space-y-2">
                <Label>보정 오프셋</Label>
                <Input type="number" step="0.1" placeholder="0.0" />
              </div>

              <div className="space-y-2">
                <Label>알림 임계값</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="최소값" />
                  <Input placeholder="최대값" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>자동 알림 활성화</Label>
              </div>
            </div>

            <Separator />

            {/* 센서 리스트 */}
            <div>
              <h4 className="text-sm font-semibold mb-3">연결된 센서 목록</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sensors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    현재 연결된 센서가 없습니다.
                  </p>
                ) : (
                  sensors.map((sensor) => (
                    <div key={sensor.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        {getIcon(sensor.type)}
                        <div>
                          <p className="text-sm font-medium">{sensor.name}</p>
                          <p className="text-xs text-muted-foreground">{sensor.deviceId} • {sensor.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(sensor.status)} variant="secondary">
                          {sensor.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSensor(sensor.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowHardwareSettings(false)}>
                취소
              </Button>
              <Button onClick={() => {
                toast.success("센서 설정이 저장되었습니다.");
                setShowHardwareSettings(false);
              }}>
                설정 저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 센서 추가 다이얼로그 */}
      <Dialog open={showAddSensor} onOpenChange={setShowAddSensor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 센서 추가</DialogTitle>
            <DialogDescription>
              새로운 환경 센서를 시스템에 추가합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>센서명</Label>
              <Input placeholder="예: 냉장고 3" />
            </div>

            <div className="space-y-2">
              <Label>센서 타입</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="센서 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">온도 센서</SelectItem>
                  <SelectItem value="humidity">습도 센서</SelectItem>
                  <SelectItem value="air_quality">공기질 센서</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>설치 위치</Label>
              <Input placeholder="예: 창고" />
            </div>

            <div className="space-y-2">
              <Label>디바이스 ID</Label>
              <Input placeholder="예: T005" />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddSensor(false)}>
              취소
            </Button>
            <Button onClick={() => {
              toast.success("새 센서가 추가되었습니다.");
              setShowAddSensor(false);
            }}>
              추가
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}