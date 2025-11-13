import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { 
  Droplets, 
  Plus, 
  Save, 
  Download, 
  Check,
  Calendar,
  Clock,
  Trash2,
  CheckSquare,
  Shield
} from "lucide-react";

interface CleaningRecord {
  id: string;
  date: string;
  time: string;
  area: string;
  cleaningType: 'cleaning' | 'disinfection' | 'both';
  equipment: string[];
  method: string;
  materials: string[];
  inspector: string;
  verifier: string;
  completed: boolean;
  remarks: string;
  beforePhoto?: string;
  afterPhoto?: string;
  createdAt: Date;
}

const cleaningAreas = [
  { id: 'production', name: '생산구역', areas: ['작업대', '믹서', '오븐', '포장대', '계량대'] },
  { id: 'storage', name: '저장구역', areas: ['냉장고', '냉동고', '창고', '원료보관실'] },
  { id: 'preparation', name: '전처리구역', areas: ['세척대', '절단대', '준비대', '해동실'] },
  { id: 'packaging', name: '포장구역', areas: ['포장기계', '라벨링기', '포장재보관대'] },
  { id: 'utility', name: '부대시설', areas: ['화장실', '탈의실', '사무실', '복도', '입구'] }
];

const cleaningMaterials = [
  '중성세제', '알코올 70%', '차아염소산나트륨', '4급암모늄화합물',
  '산성세제', '알칼리세제', '효소세제', '고온수', '스팀'
];

const equipmentList = [
  '스프레이', '걸레', '브러시', '스크러버', '진공청소기', 
  '고압세척기', '스팀청소기', '일회용타올', '소독포'
];

export function CleaningDisinfectionLog() {
  const [records, setRecords] = useState<CleaningRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  
  const [newRecord, setNewRecord] = useState({
    area: '',
    cleaningType: 'both' as 'cleaning' | 'disinfection' | 'both',
    equipment: [] as string[],
    method: '',
    materials: [] as string[],
    inspector: '',
    verifier: '',
    remarks: ''
  });

  useEffect(() => {
    loadRecords();
  }, [selectedDate]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/cleaning-logs?date=${selectedDate}`);
      if (data && Array.isArray(data)) {
        setRecords(data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      }
    } catch (error) {
      console.error('세척소독 기록 로드 실패:', error);
      toast.error('세척소독 기록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.area || !newRecord.method || !newRecord.inspector || newRecord.equipment.length === 0 || newRecord.materials.length === 0) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const recordToAdd: CleaningRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      area: newRecord.area,
      cleaningType: newRecord.cleaningType,
      equipment: newRecord.equipment,
      method: newRecord.method,
      materials: newRecord.materials,
      inspector: newRecord.inspector,
      verifier: newRecord.verifier,
      completed: true,
      remarks: newRecord.remarks,
      createdAt: new Date()
    };

    try {
      await api.post('/cleaning-logs', recordToAdd);
      setRecords(prev => [...prev, recordToAdd]);
      
      // 폼 초기화
      setNewRecord({
        area: '',
        cleaningType: 'both',
        equipment: [],
        method: '',
        materials: [],
        inspector: '',
        verifier: '',
        remarks: ''
      });
      setShowAddForm(false);
      
      toast.success('세척소독 기록이 추가되었습니다.');
    } catch (error) {
      console.error('세척소독 기록 추가 실패:', error);
      toast.error('세척소독 기록 추가에 실패했습니다.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('이 세척소독 기록을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/cleaning-logs/${id}`);
      setRecords(prev => prev.filter(record => record.id !== id));
      toast.success('세척소독 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('세척소독 기록 삭제 실패:', error);
      toast.error('세척소독 기록 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const blob = await api.get(`/cleaning-logs/export?date=${selectedDate}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `세척소독기록부_${selectedDate}.xlsx`;
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

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setNewRecord(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipment]
      }));
    } else {
      setNewRecord(prev => ({
        ...prev,
        equipment: prev.equipment.filter(item => item !== equipment)
      }));
    }
  };

  const handleMaterialChange = (material: string, checked: boolean) => {
    if (checked) {
      setNewRecord(prev => ({
        ...prev,
        materials: [...prev.materials, material]
      }));
    } else {
      setNewRecord(prev => ({
        ...prev,
        materials: prev.materials.filter(item => item !== material)
      }));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      case 'disinfection':
        return 'bg-green-100 text-green-800';
      case 'both':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cleaning':
        return '세척';
      case 'disinfection':
        return '소독';
      case 'both':
        return '세척+소독';
      default:
        return type;
    }
  };

  const todayRecords = records.filter(record => record.date === selectedDate);
  const completedRecords = todayRecords.filter(record => record.completed);
  const areaStats = cleaningAreas.map(areaGroup => ({
    ...areaGroup,
    completed: areaGroup.areas.filter(area => todayRecords.some(record => record.area === area)).length,
    total: areaGroup.areas.length
  }));

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Droplets className="w-6 h-6 text-green-600" />
            세척·소독 기록부
          </h1>
          <p className="text-gray-600 mt-1">일일 시설 및 장비 세척·소독 작업 기록 관리</p>
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
            세척소독 기록
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
            <p className="text-xs text-gray-600 mt-1">오늘 수행된 세척소독 작업</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">완료된 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">검증 완료된 작업</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">세척 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todayRecords.filter(r => r.cleaningType === 'cleaning' || r.cleaningType === 'both').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">세척 작업 수행</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">소독 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {todayRecords.filter(r => r.cleaningType === 'disinfection' || r.cleaningType === 'both').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">소독 작업 수행</p>
          </CardContent>
        </Card>
      </div>

      {/* 구역별 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>구역별 세척소독 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {areaStats.map((areaGroup) => (
              <div key={areaGroup.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{areaGroup.name}</h4>
                  <Badge className={areaGroup.completed === areaGroup.total ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {areaGroup.completed}/{areaGroup.total}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {areaGroup.areas.map(area => {
                    const isCompleted = todayRecords.some(record => record.area === area);
                    return (
                      <div key={area} className="flex items-center text-sm">
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <div className="w-4 h-4 border rounded mr-2"></div>
                        )}
                        <span className={isCompleted ? 'text-green-700' : 'text-gray-600'}>{area}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 세척소독 기록 추가 폼 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 세척소독 기록 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>구역/장소</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="구역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaningAreas.map(areaGroup => (
                      <div key={areaGroup.id}>
                        <div className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-50">
                          {areaGroup.name}
                        </div>
                        {areaGroup.areas.map(area => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="또는 직접 입력"
                  value={newRecord.area}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, area: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>작업 유형</Label>
                <Select value={newRecord.cleaningType} onValueChange={(value: 'cleaning' | 'disinfection' | 'both') => 
                  setNewRecord(prev => ({ ...prev, cleaningType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">세척만</SelectItem>
                    <SelectItem value="disinfection">소독만</SelectItem>
                    <SelectItem value="both">세척+소독</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>사용 장비</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                {equipmentList.map(equipment => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equipment-${equipment}`}
                      checked={newRecord.equipment.includes(equipment)}
                      onCheckedChange={(checked) => handleEquipmentChange(equipment, checked as boolean)}
                    />
                    <Label htmlFor={`equipment-${equipment}`} className="text-sm">{equipment}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>사용 자재</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                {cleaningMaterials.map(material => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${material}`}
                      checked={newRecord.materials.includes(material)}
                      onCheckedChange={(checked) => handleMaterialChange(material, checked as boolean)}
                    />
                    <Label htmlFor={`material-${material}`} className="text-sm">{material}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>작업 방법</Label>
              <Textarea
                placeholder="세척 및 소독 방법을 상세히 기록하세요 (예: 1차 물로 헹굼 → 세제 도포 → 브러싱 → 헹굼 → 소독제 분무 → 자연건조)"
                value={newRecord.method}
                onChange={(e) => setNewRecord(prev => ({ ...prev, method: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>작업자</Label>
                <Input
                  placeholder="작업 수행자 이름"
                  value={newRecord.inspector}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, inspector: e.target.value }))}
                />
              </div>

              <div>
                <Label>확인자</Label>
                <Input
                  placeholder="작업 확인자 이름"
                  value={newRecord.verifier}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, verifier: e.target.value }))}
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

      {/* 세척소독 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedDate} 세척소독 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : todayRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              오늘 기록된 세척소독 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>구역/장소</TableHead>
                    <TableHead>작업유형</TableHead>
                    <TableHead>사용장비</TableHead>
                    <TableHead>사용자재</TableHead>
                    <TableHead>작업자</TableHead>
                    <TableHead>확인자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">
                        {record.time}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.area}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(record.cleaningType)}>
                          {getTypeLabel(record.cleaningType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {record.equipment.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {record.materials.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>{record.inspector}</TableCell>
                      <TableCell>{record.verifier || '-'}</TableCell>
                      <TableCell>
                        {record.completed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />완료
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">진행중</Badge>
                        )}
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

      {/* 세척소독 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>세척·소독 작업 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cleaning" className="w-full">
            <TabsList>
              <TabsTrigger value="cleaning">세척 절차</TabsTrigger>
              <TabsTrigger value="disinfection">소독 절차</TabsTrigger>
              <TabsTrigger value="materials">자재 사용법</TabsTrigger>
            </TabsList>
            <TabsContent value="cleaning" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  기본 세척 절차
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>작업 전 보호구 착용 (장갑, 앞치마 등)</li>
                  <li>육안으로 보이는 오염물질 제거</li>
                  <li>찬물 또는 미지근한 물로 1차 헹굼</li>
                  <li>적정 농도의 세제 용액 준비 및 도포</li>
                  <li>브러시나 스크러버를 이용한 기계적 세척</li>
                  <li>세제 완전 제거를 위한 최종 헹굼</li>
                  <li>물기 제거 및 자연 건조</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="disinfection" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  기본 소독 절차
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>세척 완료 후 완전히 건조된 상태에서 실시</li>
                  <li>소독제 적정 농도 확인 (권장농도 준수)</li>
                  <li>소독제를 고르게 분무 또는 도포</li>
                  <li>권장 접촉시간 준수 (일반적으로 5-10분)</li>
                  <li>식품접촉면은 음용수로 최종 헹굼</li>
                  <li>완전 건조 후 사용 개시</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="materials" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">주요 세척제</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>중성세제:</strong> 일반적인 기름때 제거</p>
                    <p><strong>알칼리세제:</strong> 동물성 기름, 단백질 오염</p>
                    <p><strong>산성세제:</strong> 물때, 광물성 오염물질</p>
                    <p><strong>효소세제:</strong> 단백질, 전분 분해</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">주요 소독제</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>알코올 70%:</strong> 손, 소도구 소독</p>
                    <p><strong>차아염소산나트륨:</strong> 광범위 살균</p>
                    <p><strong>4급암모늄:</strong> 바닥, 벽면 소독</p>
                    <p><strong>고온수/스팀:</strong> 물리적 살균</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}