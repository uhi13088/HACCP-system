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
import { SignaturePad } from "./SignaturePad";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { 
  Building, 
  Plus, 
  Save, 
  Download, 
  Check,
  Calendar,
  Clock,
  Trash2,
  AlertTriangle,
  X,
  Wrench,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Lightbulb,
  Droplets,
  Wind,
  Zap
} from "lucide-react";

interface FacilityInspection {
  id: string;
  week: string;
  startDate: string;
  endDate: string;
  inspector: string;
  inspectionDate: string;
  areas: {
    [areaId: string]: {
      items: {
        [itemId: string]: {
          status: 'good' | 'caution' | 'poor' | 'na';
          remarks: string;
          actionRequired?: string;
        };
      };
      completed: boolean;
    };
  };
  signature?: string;
  overallStatus: 'excellent' | 'good' | 'needs_attention' | 'poor';
  totalItems: number;
  goodItems: number;
  cautionItems: number;
  poorItems: number;
  createdAt: Date;
}

const inspectionAreas = [
  {
    id: 'building',
    name: '건물 구조',
    icon: Building,
    items: [
      { id: 'walls', name: '벽면 상태', description: '균열, 페인트 벗겨짐, 곰팡이 등' },
      { id: 'floors', name: '바닥 상태', description: '손상, 물고임, 청결도 등' },
      { id: 'ceiling', name: '천장 상태', description: '누수, 균열, 이물질 낙하 가능성' },
      { id: 'doors', name: '문 상태', description: '개폐 상태, 밀폐성, 손상 여부' },
      { id: 'windows', name: '창문 상태', description: '유리 파손, 밀폐성, 방충망 상태' }
    ]
  },
  {
    id: 'plumbing',
    name: '급수/배수 시설',
    icon: Droplets,
    items: [
      { id: 'water_supply', name: '급수 시설', description: '수압, 수질, 배관 누수' },
      { id: 'drainage', name: '배수 시설', description: '배수구 막힘, 역류 방지, 청결도' },
      { id: 'sewage', name: '하수 처리', description: '맨홀 덮개, 냄새 차단, 역류 방지' },
      { id: 'grease_trap', name: '그리스 트랩', description: '청소 상태, 기능, 냄새' }
    ]
  },
  {
    id: 'electrical',
    name: '전기 시설',
    icon: Zap,
    items: [
      { id: 'lighting', name: '조명 시설', description: '조도, 전구 교체 필요성, 스위치 작동' },
      { id: 'outlets', name: '콘센트/배선', description: '손상, 누전 위험, 접지 상태' },
      { id: 'panels', name: '전기 패널', description: '차단기 상태, 안전 표시, 접근성' },
      { id: 'emergency', name: '비상 전원', description: '비상등, 비상 전원 테스트' }
    ]
  },
  {
    id: 'ventilation',
    name: '환기 시설',
    icon: Wind,
    items: [
      { id: 'exhaust_fans', name: '배기팬', description: '작동 상태, 소음, 청소 필요성' },
      { id: 'air_ducts', name: '덕트', description: '막힘, 청소 상태, 손상 여부' },
      { id: 'filters', name: '필터', description: '교체 필요성, 청소 상태' },
      { id: 'air_flow', name: '공기 순환', description: '환기량, 공기 흐름 방향' }
    ]
  },
  {
    id: 'safety',
    name: '안전 시설',
    icon: Shield,
    items: [
      { id: 'fire_safety', name: '소방 시설', description: '소화기, 화재 탐지기, 비상구' },
      { id: 'first_aid', name: '응급처치', description: '구급상자, 응급처치 용품' },
      { id: 'safety_signs', name: '안전 표지', description: '경고판, 비상구 표시, 안전 수칙' },
      { id: 'emergency_contact', name: '비상연락망', description: '연락처 게시, 비상 절차 안내' }
    ]
  },
  {
    id: 'hygiene',
    name: '위생 시설',
    icon: Droplets,
    items: [
      { id: 'handwash', name: '손 세척 시설', description: '비누, 타올, 소독제, 온수 공급' },
      { id: 'restrooms', name: '화장실', description: '청결도, 환기, 소모품' },
      { id: 'changing_room', name: '탈의실', description: '청결도, 환기, 개인 보관함' },
      { id: 'waste_disposal', name: '폐기물 처리', description: '분리수거, 냄새 차단, 해충 방지' }
    ]
  }
];

export function FacilityWeeklyInspection() {
  const [inspections, setInspections] = useState<FacilityInspection[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeArea, setActiveArea] = useState('building');
  
  const [newInspection, setNewInspection] = useState({
    inspector: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    areas: {} as any,
    signature: ''
  });

  useEffect(() => {
    // 초기 areas 설정
    const initialAreas: any = {};
    inspectionAreas.forEach(area => {
      initialAreas[area.id] = {
        items: {},
        completed: false
      };
      area.items.forEach(item => {
        initialAreas[area.id].items[item.id] = {
          status: 'good',
          remarks: '',
          actionRequired: ''
        };
      });
    });
    setNewInspection(prev => ({ ...prev, areas: initialAreas }));
    
    loadInspections();
  }, [selectedWeek]);

  const loadInspections = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/facility-inspections?week=${selectedWeek}`);
      if (data && Array.isArray(data)) {
        setInspections(data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      }
    } catch (error) {
      console.error('시설점검 기록 로드 실패:', error);
      toast.error('시설점검 기록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallStatus = (areas: any): 'excellent' | 'good' | 'needs_attention' | 'poor' => {
    let totalItems = 0;
    let goodItems = 0;
    let cautionItems = 0;
    let poorItems = 0;

    Object.values(areas).forEach((area: any) => {
      Object.values(area.items).forEach((item: any) => {
        if (item.status !== 'na') {
          totalItems++;
          if (item.status === 'good') goodItems++;
          else if (item.status === 'caution') cautionItems++;
          else if (item.status === 'poor') poorItems++;
        }
      });
    });

    const goodPercentage = totalItems > 0 ? (goodItems / totalItems) * 100 : 100;
    
    if (poorItems > 0) return 'poor';
    if (cautionItems > totalItems * 0.3) return 'needs_attention';
    if (goodPercentage >= 90) return 'excellent';
    return 'good';
  };

  const handleAddInspection = async () => {
    if (!newInspection.inspector || !newInspection.inspectionDate) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const overallStatus = calculateOverallStatus(newInspection.areas);
    let totalItems = 0;
    let goodItems = 0;
    let cautionItems = 0;
    let poorItems = 0;

    Object.values(newInspection.areas).forEach((area: any) => {
      Object.values(area.items).forEach((item: any) => {
        if (item.status !== 'na') {
          totalItems++;
          if (item.status === 'good') goodItems++;
          else if (item.status === 'caution') cautionItems++;
          else if (item.status === 'poor') poorItems++;
        }
      });
    });

    // 주차 계산
    const [year, week] = selectedWeek.split('-W');
    const startDate = getDateFromWeek(parseInt(year), parseInt(week));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const inspectionToAdd: FacilityInspection = {
      id: Date.now().toString(),
      week: selectedWeek,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      inspector: newInspection.inspector,
      inspectionDate: newInspection.inspectionDate,
      areas: newInspection.areas,
      signature: newInspection.signature,
      overallStatus,
      totalItems,
      goodItems,
      cautionItems,
      poorItems,
      createdAt: new Date()
    };

    try {
      await api.post('/facility-inspections', inspectionToAdd);
      setInspections(prev => [...prev, inspectionToAdd]);
      
      // 폼 초기화
      const initialAreas: any = {};
      inspectionAreas.forEach(area => {
        initialAreas[area.id] = {
          items: {},
          completed: false
        };
        area.items.forEach(item => {
          initialAreas[area.id].items[item.id] = {
            status: 'good',
            remarks: '',
            actionRequired: ''
          };
        });
      });
      
      setNewInspection({
        inspector: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        areas: initialAreas,
        signature: ''
      });
      setShowAddForm(false);
      
      toast.success('시설점검 기록이 추가되었습니다.');
      
      if (overallStatus === 'poor') {
        toast.error('위험! 즉시 조치가 필요한 시설이 있습니다.');
      } else if (overallStatus === 'needs_attention') {
        toast.warning('주의! 일부 시설에 관리가 필요합니다.');
      }
    } catch (error) {
      console.error('시설점검 기록 추가 실패:', error);
      toast.error('시설점검 기록 추가에 실패했습니다.');
    }
  };

  const handleDeleteInspection = async (id: string) => {
    if (!confirm('이 시설점검 기록을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/facility-inspections/${id}`);
      setInspections(prev => prev.filter(inspection => inspection.id !== id));
      toast.success('시설점검 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('시설점검 기록 삭제 실패:', error);
      toast.error('시설점검 기록 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const blob = await api.get(`/facility-inspections/export?week=${selectedWeek}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `시설점검표_${selectedWeek}.xlsx`;
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

  const getDateFromWeek = (year: number, week: number) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    return new Date(year, 0, 1 + daysToAdd);
  };

  const handleItemStatusChange = (areaId: string, itemId: string, status: string) => {
    setNewInspection(prev => ({
      ...prev,
      areas: {
        ...prev.areas,
        [areaId]: {
          ...prev.areas[areaId],
          items: {
            ...prev.areas[areaId].items,
            [itemId]: {
              ...prev.areas[areaId].items[itemId],
              status
            }
          }
        }
      }
    }));
  };

  const handleItemRemarksChange = (areaId: string, itemId: string, remarks: string) => {
    setNewInspection(prev => ({
      ...prev,
      areas: {
        ...prev.areas,
        [areaId]: {
          ...prev.areas[areaId],
          items: {
            ...prev.areas[areaId].items,
            [itemId]: {
              ...prev.areas[areaId].items[itemId],
              remarks
            }
          }
        }
      }
    }));
  };

  const handleItemActionChange = (areaId: string, itemId: string, actionRequired: string) => {
    setNewInspection(prev => ({
      ...prev,
      areas: {
        ...prev.areas,
        [areaId]: {
          ...prev.areas[areaId],
          items: {
            ...prev.areas[areaId].items,
            [itemId]: {
              ...prev.areas[areaId].items[itemId],
              actionRequired
            }
          }
        }
      }
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'caution':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'na':
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">우수</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">양호</Badge>;
      case 'needs_attention':
        return <Badge className="bg-yellow-100 text-yellow-800">주의</Badge>;
      case 'poor':
        return <Badge className="bg-red-100 text-red-800">불량</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const currentInspections = inspections.filter(inspection => inspection.week === selectedWeek);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="w-6 h-6 text-orange-600" />
            시설점검 주간체크리스트
          </h1>
          <p className="text-gray-600 mt-1">주간 시설 안전 및 위생 상태 점검</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            점검 기록
          </Button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 점검 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentInspections.length}</div>
            <p className="text-xs text-gray-600 mt-1">주간 시설점검 횟수</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">우수 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentInspections.length > 0 
                ? Math.round(currentInspections.filter(i => i.overallStatus === 'excellent').length / currentInspections.length * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-600 mt-1">우수 등급 비율</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">주의 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {currentInspections.reduce((sum, inspection) => sum + inspection.cautionItems, 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">관리 필요 항목</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">불량 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currentInspections.reduce((sum, inspection) => sum + inspection.poorItems, 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">즉시 조치 필요</p>
          </CardContent>
        </Card>
      </div>

      {/* 시설점검 추가 폼 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 시설점검 기록 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>점검자</Label>
                <Input
                  placeholder="점검 담당자"
                  value={newInspection.inspector}
                  onChange={(e) => setNewInspection(prev => ({ ...prev, inspector: e.target.value }))}
                />
              </div>

              <div>
                <Label>점검일</Label>
                <Input
                  type="date"
                  value={newInspection.inspectionDate}
                  onChange={(e) => setNewInspection(prev => ({ ...prev, inspectionDate: e.target.value }))}
                />
              </div>
            </div>

            {/* 구역별 점검 */}
            <Tabs value={activeArea} onValueChange={setActiveArea}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {inspectionAreas.map((area) => {
                  const Icon = area.icon;
                  return (
                    <TabsTrigger key={area.id} value={area.id} className="text-xs">
                      <Icon className="w-4 h-4 mr-1" />
                      {area.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {inspectionAreas.map((area) => (
                <TabsContent key={area.id} value={area.id} className="space-y-4">
                  <div className="space-y-4">
                    {area.items.map((item) => {
                      const currentItem = newInspection.areas[area.id]?.items[item.id];
                      return (
                        <Card key={item.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              {getStatusIcon(currentItem?.status)}
                              {item.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label>점검 결과</Label>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant={currentItem?.status === 'good' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleItemStatusChange(area.id, item.id, 'good')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  양호
                                </Button>
                                <Button
                                  variant={currentItem?.status === 'caution' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleItemStatusChange(area.id, item.id, 'caution')}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  주의
                                </Button>
                                <Button
                                  variant={currentItem?.status === 'poor' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleItemStatusChange(area.id, item.id, 'poor')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  불량
                                </Button>
                                <Button
                                  variant={currentItem?.status === 'na' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleItemStatusChange(area.id, item.id, 'na')}
                                >
                                  해당없음
                                </Button>
                              </div>
                            </div>

                            <div>
                              <Label>비고</Label>
                              <Textarea
                                placeholder="특이사항이나 세부 내용"
                                value={currentItem?.remarks || ''}
                                onChange={(e) => handleItemRemarksChange(area.id, item.id, e.target.value)}
                              />
                            </div>

                            {(currentItem?.status === 'caution' || currentItem?.status === 'poor') && (
                              <div>
                                <Label className="text-red-600">조치 계획</Label>
                                <Textarea
                                  placeholder="필요한 조치 계획을 입력하세요"
                                  value={currentItem?.actionRequired || ''}
                                  onChange={(e) => handleItemActionChange(area.id, item.id, e.target.value)}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* 서명 */}
            <div>
              <Label>점검자 서명</Label>
              <SignaturePad
                onSignature={(signature) => setNewInspection(prev => ({ ...prev, signature }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                취소
              </Button>
              <Button onClick={handleAddInspection}>
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 점검 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedWeek} 시설점검 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : currentInspections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이번 주 시설점검 기록이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>점검일</TableHead>
                    <TableHead>점검자</TableHead>
                    <TableHead>총 점검항목</TableHead>
                    <TableHead>양호</TableHead>
                    <TableHead>주의</TableHead>
                    <TableHead>불량</TableHead>
                    <TableHead>종합평가</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-mono">
                        {inspection.inspectionDate}
                      </TableCell>
                      <TableCell className="font-medium">
                        {inspection.inspector}
                      </TableCell>
                      <TableCell className="text-center">
                        {inspection.totalItems}
                      </TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {inspection.goodItems}
                      </TableCell>
                      <TableCell className="text-center text-yellow-600 font-medium">
                        {inspection.cautionItems}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-medium">
                        {inspection.poorItems}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inspection.overallStatus)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteInspection(inspection.id)}
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
    </div>
  );
}