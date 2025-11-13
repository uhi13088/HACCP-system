import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Thermometer, Droplets, AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api-sensor-fixed";

interface DashboardProps {
  realTimeMonitoring?: boolean;
  serverStatus?: { 
    isConnected: boolean; 
    lastChecked: Date | null;
    mockModeEnabled?: boolean;
  };
}

export function Dashboard({ realTimeMonitoring = false, serverStatus }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 기본 데이터 설정 (연결된 센서 없음)
  const setDefaultData = () => {
    setDashboardData({
      stats: {
        totalSensors: 0, criticalSensors: 0, warningSensors: 0,
        totalChecklists: 12, completedChecklists: 8, inProgressChecklists: 4,
        totalCCPs: 6, criticalCCPs: 1, warningCCPs: 1,
        totalAlerts: 0, criticalAlerts: 0
      },
      systemStatus: 'warning',
      latestSensors: [],
      recentAlerts: [],
      todayChecklists: [],
      ccpOverview: []
    });
    
    setSensorData([]); // 연결된 센서 없음
    
    setAlerts([]); // 센서 없으므로 알림도 없음
  };

  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 순차적으로 API 호출하여 에러 발생 지점 파악
      let dashboardResponse, sensorResponse, alertsResponse;
      
      try {
        console.log('Calling dashboard API...');
        dashboardResponse = await api.getDashboardData();
        console.log('Dashboard API response:', dashboardResponse);
        
        if (dashboardResponse && dashboardResponse.success && dashboardResponse.data) {
          setDashboardData(dashboardResponse.data);
          console.log('Dashboard data loaded successfully');
          setError(''); // 성공 시 에러 메시지 클리어
        } else {
          throw new Error(dashboardResponse?.error || 'Invalid dashboard response');
        }
      } catch (dashError) {
        console.error('Dashboard API error:', dashError.message || dashError);
        setError('서버 연결 실패 - 데모 데이터로 표시 중입니다. 서버 상태를 확인해주세요.');
        
        // 대시보드 데이터 실패 시 기본값 사용 (센서 없음)
        setDashboardData({
          stats: {
            totalSensors: 0, criticalSensors: 0, warningSensors: 0,
            totalChecklists: 12, completedChecklists: 8, inProgressChecklists: 4,
            totalCCPs: 6, criticalCCPs: 1, warningCCPs: 1,
            totalAlerts: 0, criticalAlerts: 0
          },
          systemStatus: 'warning',
          latestSensors: [],
          recentAlerts: [],
          todayChecklists: [],
          ccpOverview: []
        });
      }

      try {
        console.log('Calling sensor data API...');
        sensorResponse = await api.getLatestSensorData();
        console.log('Sensor API response:', sensorResponse);
        
        if (sensorResponse && sensorResponse.success && sensorResponse.data && Array.isArray(sensorResponse.data)) {
          // 센서 데이터를 모니터링 상태에 따라 처리
          let processedSensorData = sensorResponse.data;
          
          if (!realTimeMonitoring) {
            // 모니터링 중지 시 모든 센서 상태를 "disconnected"로 변경
            processedSensorData = sensorResponse.data.map(sensor => ({
              ...sensor,
              status: 'disconnected',
              lastUpdate: sensor.timestamp || new Date().toISOString()
            }));
            console.log('Sensor monitoring stopped - setting all sensors to disconnected');
          }
          
          setSensorData(processedSensorData);
          console.log('Sensor data loaded successfully');
        } else {
          throw new Error('No sensor data or invalid format');
        }
      } catch (sensorError) {
        console.error('Sensor API error:', sensorError.message || sensorError);
        // 센서 데이터 실패 시 빈 배열 사용 (연결된 센서 없음)
        setSensorData([]);
      }

      try {
        console.log('Calling alerts API...');
        alertsResponse = await api.getAlerts(false);
        console.log('Alerts API response:', alertsResponse);
        
        if (alertsResponse && alertsResponse.success && alertsResponse.data && Array.isArray(alertsResponse.data)) {
          setAlerts(alertsResponse.data);
          console.log('Alerts data loaded successfully');
        } else {
          throw new Error('No alerts data or invalid format');
        }
      } catch (alertError) {
        console.error('Alerts API error:', alertError.message || alertError);
        // 알림 데이터 실패 시 빈 배열 사용 (센서 없으므로 알림 없음)
        setAlerts([]);
      }

      setLastUpdate(new Date().toLocaleString('ko-KR'));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('일부 데이터를 불러오는데 실패했습니다. 데모 데이터를 표시합니다.');
      setDefaultData();
      setLastUpdate(new Date().toLocaleString('ko-KR'));
    } finally {
      setLoading(false);
    }
  };

  // 알림 확인 처리
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      // 에러 발생시에도 로컬에서 제거 (UI 개선)
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }
  };

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    loadDashboardData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 모니터링 상태 변화 감지
  useEffect(() => {
    console.log('🔄 [DASHBOARD] Monitoring status changed:', realTimeMonitoring);
    
    // 모니터링 상태가 변경되면 센서 데이터 즉시 업데이트
    if (sensorData.length > 0) {
      const updatedSensorData = sensorData.map(sensor => ({
        ...sensor,
        status: realTimeMonitoring ? (sensor.status === 'disconnected' ? 'normal' : sensor.status) : 'disconnected',
        lastUpdate: new Date().toISOString()
      }));
      
      setSensorData(updatedSensorData);
      console.log('🔄 [DASHBOARD] Updated sensor statuses based on monitoring state');
    }
  }, [realTimeMonitoring]);

  // 센서 아이콘 가져오기
  const getSensorIcon = (type: string) => {
    if (type.includes('temp')) return <Thermometer className="w-5 h-5" />;
    if (type.includes('humidity')) return <Droplets className="w-5 h-5" />;
    return <TrendingUp className="w-5 h-5" />;
  };

  // 센서 이름 변환
  const getSensorName = (sensorId: string, type: string) => {
    const sensorNames: Record<string, string> = {
      'fridge1': '냉장고 1',
      'fridge2': '냉장고 2', 
      'freezer1': '냉동고',
      'kitchen': '조리실 온도',
      'storage': '창고 습도',
      'kitchen_humid': '조리실 습도'
    };
    return sensorNames[sensorId] || `${type} 센서`;
  };

  // 센서 값 포맷팅
  const formatSensorValue = (value: string, type: string) => {
    if (type.includes('temp')) return `${value}°C`;
    if (type.includes('humidity')) return `${value}%`;
    return value;
  };

  // 시간 경과 계산
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  // 긴급 점검 시작
  const handleEmergencyCheck = () => {
    alert("긴급 점검 프로세스를 시작합니다.\n\n1. 모든 센서 상태 확인\n2. CCP 점검 실행\n3. 긴급 체크리스트 활성화");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">데이터를 불러오는 중...</span>
      </div>
    );
  }

  // 안전한 데이터 접근을 위한 헬퍼 함수
  const getStats = () => {
    if (dashboardData?.stats) {
      return dashboardData.stats;
    }
    // 레거시 형식 지원
    return {
      totalSensors: dashboardData?.sensors?.total || 0,
      criticalSensors: dashboardData?.sensors?.critical || 0,
      warningSensors: dashboardData?.sensors?.warning || 0,
      totalChecklists: dashboardData?.checklists?.total || 0,
      completedChecklists: dashboardData?.checklists?.completed || 0,
      totalCCPs: dashboardData?.ccps?.total || 0,
      criticalCCPs: dashboardData?.ccps?.critical || 0,
      warningCCPs: dashboardData?.ccps?.warning || 0,
      totalAlerts: dashboardData?.alerts?.unacknowledged || 0
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Smart HACCP 관리 시스템</h1>
          <p className="text-muted-foreground">마지막 업데이트: {lastUpdate}</p>
          {error && <p className="text-sm text-yellow-600 mt-1">{error}</p>}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button onClick={handleEmergencyCheck}>
            <CheckCircle className="w-4 h-4 mr-2" />
            긴급 점검 시작
          </Button>
        </div>
      </div>

      {/* 연결 상태 알림 */}
      {error && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error} 시스템은 계속 사용할 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 알림 섹션 */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={alert.type === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{alert.message}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{getTimeAgo(alert.timestamp)}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    확인
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 주요 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className={`w-5 h-5 ${realTimeMonitoring ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-muted-foreground">
                {realTimeMonitoring ? "정상 센서" : "센서 상태 (비활성)"}
              </p>
              <p className="text-2xl">
                {realTimeMonitoring 
                  ? `${sensorData.filter(s => s.status === 'normal').length}/${sensorData.length}`
                  : `0/${sensorData.length}`
                }
              </p>
              {!realTimeMonitoring && (
                <p className="text-xs text-gray-500">모니터링 중지됨</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">알림</p>
              <p className="text-2xl">{stats.totalAlerts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">일일 진행률</p>
              <p className="text-2xl">
                {stats.totalChecklists > 0 
                  ? Math.round((stats.completedChecklists / stats.totalChecklists) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">CCP 정상률</p>
              <p className="text-2xl">
                {stats.totalCCPs > 0 
                  ? Math.round(((stats.totalCCPs - stats.criticalCCPs - stats.warningCCPs) / stats.totalCCPs) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 중요 관리점 모니터링 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2>센서 모니터링 상태</h2>
          <Badge variant={realTimeMonitoring ? "default" : "outline"} className="ml-2">
            {realTimeMonitoring ? (
              <>✅ 실시간 모니터링 중{serverStatus?.mockModeEnabled ? ' (모킹)' : ''}</>
            ) : (
              <>⏸️ 모니터링 중지됨</>
            )}
          </Badge>
        </div>
        
        {!realTimeMonitoring && (
          <Alert className="mb-4 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              실시간 센서 모니터링이 중지된 상태입니다. 센서 데이터는 마지막 수집된 값으로 표시되며, 실시간 상태가 아닙니다.
            </AlertDescription>
          </Alert>
        )}
        
        {sensorData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensorData.map((sensor) => (
              <div key={sensor.sensorId} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3>{getSensorName(sensor.sensorId, sensor.type)}</h3>
                  <Badge variant={
                    !realTimeMonitoring || sensor.status === "disconnected" ? "outline" : 
                    sensor.status === "normal" ? "default" : 
                    sensor.status === "warning" ? "secondary" : "destructive"
                  }>
                    {!realTimeMonitoring || sensor.status === "disconnected" ? "연결 안됨" : 
                     sensor.status === "normal" ? "정상" : 
                     sensor.status === "warning" ? "주의" : "경고"}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getSensorIcon(sensor.type)}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span>현재값: {formatSensorValue(sensor.value, sensor.type)}</span>
                      <span className="text-sm text-muted-foreground">{sensor.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {realTimeMonitoring && sensor.status !== "disconnected" ? "실시간 상태" : "연결 중단됨"}
                  </span>
                  <span className={`flex items-center ${
                    !realTimeMonitoring || sensor.status === "disconnected" ? "text-gray-500" :
                    sensor.status === "critical" ? "text-red-500" : 
                    sensor.status === "warning" ? "text-yellow-500" : "text-green-500"
                  }`}>
                    {!realTimeMonitoring || sensor.status === "disconnected" ? "⚪" : 
                     sensor.status === "normal" ? "✓" : 
                     sensor.status === "warning" ? "⚠" : "✗"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Thermometer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">연결된 센서가 없습니다</h3>
            <p className="text-gray-500 mb-4">
              {realTimeMonitoring 
                ? "센서 모니터링이 실행 중이지만 아직 데이터가 수집되지 않았습니다."
                : "센서 모니터링을 시작하거나 모의 데이터 생성을 활성화하세요."
              }
            </p>
            {!realTimeMonitoring && (
              <p className="text-sm text-gray-400">
                💡 관리자 권한으로 헤더의 '모의 데이터' 버튼을 클릭하여 가상 센서 데이터를 생성할 수 있습니다.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* 일일 점검 진행상황 */}
      <Card className="p-6">
        <h2 className="mb-4">일일 점검 진행상황</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>완료된 항목: {stats.completedChecklists}/{stats.totalChecklists}</span>
            <span>
              {stats.totalChecklists > 0 
                ? Math.round((stats.completedChecklists / stats.totalChecklists) * 100)
                : 0}%
            </span>
          </div>
          <Progress 
            value={stats.totalChecklists > 0 
              ? (stats.completedChecklists / stats.totalChecklists) * 100
              : 0} 
            className="w-full" 
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>남은 항목: {stats.totalChecklists - stats.completedChecklists}개</span>
            <Button variant="outline" size="sm">
              점검 계속하기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}