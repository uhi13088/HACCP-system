import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { 
  Thermometer, 
  Plus, 
  Save, 
  Download, 
  AlertTriangle, 
  Check,
  Snowflake,
  Calendar,
  Clock,
  Trash2
} from "lucide-react";

interface TemperatureRecord {
  id: string;
  date: string;
  time: string;
  location: string;
  equipmentType: 'refrigerator' | 'freezer';
  targetTemp: number;
  actualTemp: number;
  status: 'normal' | 'warning' | 'critical';
  inspector: string;
  remarks: string;
  correctionAction?: string;
  createdAt: Date;
}

const temperatureStandards = {
  refrigerator: { min: 0, max: 4, target: 2 },
  freezer: { min: -20, max: -18, target: -19 }
};

const predefinedLocations = [
  "냉장고 1호기 (식자재)",
  "냉장고 2호기 (완제품)",
  "냉장고 3호기 (유제품)",
  "냉동고 1호기 (원료)",
  "냉동고 2호기 (완제품)",
  "쇼케이스 (진열용)",
  "임시보관고"
];

export function RefrigeratorTemperatureLog() {
  const [records, setRecords] = useState<TemperatureRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newRecord, setNewRecord] = useState({
    location: '',
    equipmentType: 'refrigerator' as 'refrigerator' | 'freezer',
    actualTemp: '',
    inspector: '',
    remarks: '',
    correctionAction: ''
  });

  useEffect(() => {
    loadRecords();
  }, [selectedDate]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/temperature-logs?date=${selectedDate}`);
      if (data && Array.isArray(data)) {
        setRecords(data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      }
    } catch (error) {
      console.error('온도 기록 로드 실패:', error);
      toast.error('온도 기록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTemperatureStatus = (temp: number, equipmentType: 'refrigerator' | 'freezer'): 'normal' | 'warning' | 'critical' => {
    const standard = temperatureStandards[equipmentType];
    if (temp >= standard.min && temp <= standard.max) {
      return 'normal';
    } else if (Math.abs(temp - standard.target) <= 2) {
      return 'warning';
    } else {
      return 'critical';
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.location || !newRecord.actualTemp || !newRecord.inspector) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const actualTemp = parseFloat(newRecord.actualTemp);
    const standard = temperatureStandards[newRecord.equipmentType];
    const status = getTemperatureStatus(actualTemp, newRecord.equipmentType);

    const recordToAdd: TemperatureRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      location: newRecord.location,
      equipmentType: newRecord.equipmentType,
      targetTemp: standard.target,
      actualTemp,
      status,
      inspector: newRecord.inspector,
      remarks: newRecord.remarks,
      correctionAction: status !== 'normal' ? newRecord.correctionAction : '',
      createdAt: new Date()
    };

    try {
      await api.post('/temperature-logs', recordToAdd);
      setRecords(prev => [...prev, recordToAdd]);
      
      // 폼 초기화
      setNewRecord({
        location: '',
        equipmentType: 'refrigerator',
        actualTemp: '',
        inspector: '',
        remarks: '',
        correctionAction: ''
      });
      setShowAddForm(false);
      
      toast.success('온도 기록이 추가되었습니다.');
      
      // 이상 온도시 알림
      if (status === 'critical') {
        toast.error(`위험! ${newRecord.location} 온도가 기준을 벗어났습니다.`);
      } else if (status === 'warning') {
        toast.warning(`주의! ${newRecord.location} 온도를 확인해주세요.`);
      }
    } catch (error) {
      console.error('온도 기록 추가 실패:', error);
      toast.error('온도 기록 추가에 실패했습니다.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('이 온도 기록을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/temperature-logs/${id}`);
      setRecords(prev => prev.filter(record => record.id !== id));
      toast.success('온도 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('온도 기록 삭제 실패:', error);
      toast.error('온도 기록 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const blob = await api.get(`/temperature-logs/export?date=${selectedDate}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `냉장냉동고_온도기록부_${selectedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('엑셀 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
      toast.error('엑셀 내보내기에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />정상</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />주의</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />위험</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEquipmentIcon = (type: string) => {
    return type === 'freezer' ? <Snowflake className="w-4 h-4" /> : <Thermometer className="w-4 h-4" />;
  };

  const todayRecords = records.filter(record => record.date === selectedDate);
  const criticalRecords = todayRecords.filter(record => record.status === 'critical');
  const warningRecords = todayRecords.filter(record => record.status === 'warning');

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Thermometer className="w-6 h-6 text-blue-600" />
            냉장냉동고 온도기록부
          </h1>
          <p className="text-gray-600 mt-1">일일 냉장냉동 설비 온도 모니터링 및 기록 관리</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            온도 기록
          </Button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 기록 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">오늘 기록된 온도 측정</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">정상 범위</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {todayRecords.filter(r => r.status === 'normal').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">기준 온도 범위 내</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">주의 필요</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {warningRecords.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">온도 확인 필요</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">위험 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalRecords.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">즉시 조치 필요</p>
          </CardContent>
        </Card>
      </div>

      {/* 위험 알림 */}
      {criticalRecords.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalRecords.length}개 설비의 온도가 위험 범위에 있습니다. 즉시 확인하고 조치하세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 온도 기록 추가 폼 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 온도 기록 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>설비 위치</Label>
                <Select value={newRecord.location} onValueChange={(value) => 
                  setNewRecord(prev => ({ ...prev, location: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="설비 위치 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedLocations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>설비 타입</Label>
                <Select value={newRecord.equipmentType} onValueChange={(value: 'refrigerator' | 'freezer') => 
                  setNewRecord(prev => ({ ...prev, equipmentType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refrigerator">냉장고 (0~4°C)</SelectItem>
                    <SelectItem value="freezer">냉동고 (-20~-18°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>측정 온도 (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="예: 2.5"
                  value={newRecord.actualTemp}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, actualTemp: e.target.value }))}
                />
              </div>

              <div>
                <Label>측정자</Label>
                <Input
                  placeholder="측정자 이름"
                  value={newRecord.inspector}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, inspector: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>비고</Label>
              <Textarea
                placeholder="특이사항이나 추가 메모"
                value={newRecord.remarks}
                onChange={(e) => setNewRecord(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </div>

            {/* 온도가 기준을 벗어날 경우 시정조치 입력 */}
            {newRecord.actualTemp && (
              (() => {
                const temp = parseFloat(newRecord.actualTemp);
                const status = getTemperatureStatus(temp, newRecord.equipmentType);
                if (status !== 'normal') {
                  return (
                    <div>
                      <Label className="text-red-600">시정조치 계획 (필수)</Label>
                      <Textarea
                        placeholder="온도 이상에 대한 시정조치 방법을 입력하세요"
                        value={newRecord.correctionAction}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, correctionAction: e.target.value }))}
                      />
                    </div>
                  );
                }
                return null;
              })()
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                취소
              </Button>
              <Button onClick={handleAddRecord}>
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 온도 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedDate} 온도 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : todayRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              오늘 기록된 온도 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>설비 위치</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>기준온도</TableHead>
                    <TableHead>측정온도</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>측정자</TableHead>
                    <TableHead>비고</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">
                        {record.time}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEquipmentIcon(record.equipmentType)}
                          {record.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.equipmentType === 'refrigerator' ? '냉장고' : '냉동고'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.targetTemp}°C
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {record.actualTemp}°C
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>{record.inspector}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {record.remarks && (
                            <p className="text-sm text-gray-600 mb-1">{record.remarks}</p>
                          )}
                          {record.correctionAction && (
                            <div className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-400">
                              <strong>시정조치:</strong> {record.correctionAction}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 온도 기준 참고표 */}
      <Card>
        <CardHeader>
          <CardTitle>온도 기준 참고표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                냉장고 기준
              </h4>
              <div className="space-y-1 text-sm">
                <p>• 목표 온도: 2°C</p>
                <p>• 정상 범위: 0°C ~ 4°C</p>
                <p>• 주의 범위: 0°C 미만 또는 4°C 초과 (±2°C 이내)</p>
                <p>• 위험 범위: ±2°C 초과</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Snowflake className="w-4 h-4" />
                냉동고 기준
              </h4>
              <div className="space-y-1 text-sm">
                <p>• 목표 온도: -19°C</p>
                <p>• 정상 범위: -20°C ~ -18°C</p>
                <p>• 주의 범위: -22°C ~ -17°C (±2°C 이내)</p>
                <p>• 위험 범위: ±2°C 초과</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}