import { useState } from "react";
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

export function EnvironmentMonitoring() {
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

  const [sensors, setSensors] = useState([
    { 
      id: 1, 
      name: "냉장고 1", 
      type: "temperature", 
      value: "2.5°C", 
      status: "정상", 
      target: "1-4°C",
      location: "주방",
      lastUpdate: "1분 전",
      trend: "stable",
      deviceId: "TH001",
      connectionType: "wifi",
      connectionStatus: "connected",
      batteryLevel: 85,
      calibrationOffset: 0.1
    },
    { 
      id: 2, 
      name: "냉장고 2", 
      type: "temperature", 
      value: "2.8°C", 
      status: "정상", 
      target: "1-4°C",
      location: "보조주방",
      lastUpdate: "1분 전",
      trend: "up",
      deviceId: "T002",
      connectionType: "bluetooth",
      connectionStatus: "connected",
      batteryLevel: 72,
      calibrationOffset: -0.2
    },
    { 
      id: 3, 
      name: "냉동고", 
      type: "temperature", 
      value: "-16.2°C", 
      status: "경고", 
      target: "<-18°C",
      location: "창고",
      lastUpdate: "1분 전",
      trend: "up",
      deviceId: "T003",
      connectionType: "wifi",
      connectionStatus: "connected",
      batteryLevel: 91,
      calibrationOffset: 0.0
    },
    { 
      id: 4, 
      name: "조리실", 
      type: "temperature", 
      value: "25.8°C", 
      status: "정상", 
      target: "20-30°C",
      location: "주방",
      lastUpdate: "2분 전",
      trend: "down",
      deviceId: "T004",
      connectionType: "usb",
      connectionStatus: "connected",
      batteryLevel: null,
      calibrationOffset: 0.3
    },
    { 
      id: 5, 
      name: "창고 습도", 
      type: "humidity", 
      value: "71%", 
      status: "주의", 
      target: "60-70%",
      location: "창고",
      lastUpdate: "1분 전",
      trend: "up",
      deviceId: "H003",
      connectionType: "wifi",
      connectionStatus: "connected",
      batteryLevel: 68,
      calibrationOffset: 2.0
    },
    { 
      id: 6, 
      name: "조리실 습도", 
      type: "humidity", 
      value: "67%", 
      status: "정상", 
      target: "50-70%",
      location: "주방",
      lastUpdate: "1분 전",
      trend: "stable",
      deviceId: "H004",
      connectionType: "bluetooth",
      connectionStatus: "connected",
      batteryLevel: 89,
      calibrationOffset: -1.5
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "정상": return "bg-green-100 text-green-800";
      case "주의": return "bg-yellow-100 text-yellow-800";
      case "경고": return "bg-red-100 text-red-800";
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
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "disconnected": return <XCircle className="w-4 h-4 text-red-500" />;
      case "connecting": return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
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
          <h1>환경 모니터링</h1>
          <p className="text-muted-foreground">온도, 습도 등 환경 데이터를 실시간으로 모니터링합니다</p>
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

      {/* 센서 상태 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((sensor) => (
          <Card key={sensor.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  sensor.status === "정상" ? "bg-green-100" :
                  sensor.status === "주의" ? "bg-yellow-100" : "bg-red-100"
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
        ))}
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
            <div className="text-center py-8 text-muted-foreground">
              <p>습도 데이터 차트는 개발 중입니다.</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 알림 및 이상 상황 */}
      <Card className="p-6">
        <h3 className="mb-4">최근 알림 및 이상 상황</h3>
        <div className="space-y-3">
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
        </div>
      </Card>
    </div>
  );
}