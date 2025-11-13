import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import {
  Bug,
  Plus,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  Search,
  Shield
} from "lucide-react";

interface PestControlCheck {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  inspector: string;
  areas: {
    location: string;
    trapNumber: string;
    pestType: 'rodent' | 'insect' | 'flying' | 'none';
    count: number;
    condition: 'good' | 'damaged' | 'missing';
    actionTaken: string;
    nextAction: string;
  }[];
  preventiveMeasures: {
    sealingChecked: boolean;
    wastManagementChecked: boolean;
    cleanlinessChecked: boolean;
    moistureControlChecked: boolean;
    notes: string;
  };
  chemicalUsage: {
    productName: string;
    applicationArea: string;
    amount: string;
    date: string;
    safetyMeasures: string;
  }[];
  observations: string;
  recommendations: string;
  nextInspectionDate: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'submitted' | 'approved';
}

export function PestControlWeeklyCheck() {
  const { user, hasRole } = useAuth();
  const [checks, setChecks] = useState<PestControlCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCheck, setEditingCheck] = useState<PestControlCheck | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [newCheck, setNewCheck] = useState<Partial<PestControlCheck>>({
    weekStartDate: '',
    weekEndDate: '',
    inspector: user?.name || '',
    areas: [],
    preventiveMeasures: {
      sealingChecked: false,
      wastManagementChecked: false,
      cleanlinessChecked: false,
      moistureControlChecked: false,
      notes: ''
    },
    chemicalUsage: [],
    observations: '',
    recommendations: '',
    nextInspectionDate: '',
    status: 'draft'
  });

  // 컴포넌트 로드시 데이터 가져오기
  useEffect(() => {
    loadPestControlData();
  }, []);

  const loadPestControlData = async () => {
    try {
      setLoading(true);
      console.log('🐛 Loading pest control data...');
      
      const response = await api.get('/pest-control');
      if (response.success && response.data && response.data.length > 0) {
        setChecks(response.data);
        console.log('✅ Pest control data loaded:', response.data.length, 'records');
      } else {
        console.log('⚠️ No pest control data found, creating sample data...');
        
        // 샘플 데이터 생성
        try {
          const sampleResponse = await api.createSampleData();
          if (sampleResponse.success) {
            console.log('✅ Sample data created successfully');
            // 생성 후 다시 데이터 로드
            const reloadResponse = await api.get('/pest-control');
            if (reloadResponse.success && reloadResponse.data) {
              setChecks(reloadResponse.data);
              console.log('✅ Pest control data loaded after sample creation:', reloadResponse.data.length, 'records');
              toast.success('샘플 방충방서 데이터가 생성되었습니다.', {
                description: '이제 백업 기능을 사용할 수 있습니다.'
              });
            } else {
              setChecks([]);
            }
          } else {
            console.log('⚠️ Failed to create sample data');
            setChecks([]);
          }
        } catch (sampleError: any) {
          console.error('❌ Error creating sample data:', sampleError);
          setChecks([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading pest control data:', error);
      toast.error('방충방서 데이터 로드 실패', {
        description: error.message || '데이터를 불러오는 중 오류가 발생했습니다.'
      });
      setChecks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChecks = checks.filter(check => {
    const matchesSearch = check.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.areas.some(area => area.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || check.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateCheck = async () => {
    try {
      console.log('🐛 Creating new pest control check...');
      
      const checkToSave = {
        ...newCheck,
        createdBy: user?.name || '',
        createdAt: new Date().toISOString(),
      };

      const response = await api.post('/pest-control', checkToSave);
      
      if (response.success) {
        console.log('✅ Pest control check created successfully');
        await loadPestControlData(); // 데이터 새로고침
        setShowCreateDialog(false);
        resetNewCheck();
        
        toast.success('방충방서 점검표가 생성되었습니다.', {
          description: '새로운 주간 점검표가 저장되었습니다.',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || '점검표 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ Error creating pest control check:', error);
      toast.error('점검표 생성 실패', {
        description: error.message || '점검표를 생성하는 중 오류가 발생했습니다.'
      });
    }
  };

  const resetNewCheck = () => {
    setNewCheck({
      weekStartDate: '',
      weekEndDate: '',
      inspector: user?.name || '',
      areas: [],
      preventiveMeasures: {
        sealingChecked: false,
        wastManagementChecked: false,
        cleanlinessChecked: false,
        moistureControlChecked: false,
        notes: ''
      },
      chemicalUsage: [],
      observations: '',
      recommendations: '',
      nextInspectionDate: '',
      status: 'draft'
    });
  };

  const handleEditCheck = (check: PestControlCheck) => {
    setEditingCheck(check);
    setNewCheck({
      weekStartDate: check.weekStartDate,
      weekEndDate: check.weekEndDate,
      inspector: check.inspector,
      areas: [...check.areas],
      preventiveMeasures: { ...check.preventiveMeasures },
      chemicalUsage: [...check.chemicalUsage],
      observations: check.observations,
      recommendations: check.recommendations,
      nextInspectionDate: check.nextInspectionDate,
      status: check.status
    });
    setShowEditDialog(true);
  };

  const handleUpdateCheck = async () => {
    if (!editingCheck) return;

    try {
      console.log('🐛 Updating pest control check:', editingCheck.id);
      
      const updatedCheck = {
        ...editingCheck,
        ...newCheck,
        id: editingCheck.id,
        createdBy: editingCheck.createdBy,
        createdAt: editingCheck.createdAt,
      };

      const response = await api.put(`/pest-control/${editingCheck.id}`, updatedCheck);
      
      if (response.success) {
        console.log('✅ Pest control check updated successfully');
        await loadPestControlData(); // 데이터 새로고침
        setShowEditDialog(false);
        setEditingCheck(null);
        resetNewCheck();
        
        toast.success('방충방서 점검표가 수정되었습니다.', {
          description: '점검표 정보가 업데이트되었습니다.',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || '점검표 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ Error updating pest control check:', error);
      toast.error('점검표 수정 실패', {
        description: error.message || '점검표를 수정하는 중 오류가 발생했습니다.'
      });
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    if (confirm('이 점검표를 삭제하시겠습니까?')) {
      try {
        console.log('🐛 Deleting pest control check:', checkId);
        
        const response = await api.delete(`/pest-control/${checkId}`);
        
        if (response.success) {
          console.log('✅ Pest control check deleted successfully');
          await loadPestControlData(); // 데이터 새로고침
          toast.success('점검표가 삭제되었습니다.');
        } else {
          throw new Error(response.error || '점검표 삭제에 실패했습니다.');
        }
      } catch (error: any) {
        console.error('❌ Error deleting pest control check:', error);
        toast.error('점검표 삭제 실패', {
          description: error.message || '점검표를 삭제하는 중 오류가 발생했습니다.'
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">임시저장</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800">제출완료</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">승인완료</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPestTypeBadge = (pestType: string) => {
    switch (pestType) {
      case 'rodent':
        return <Badge className="bg-red-100 text-red-800">설치류</Badge>;
      case 'insect':
        return <Badge className="bg-orange-100 text-orange-800">곤충</Badge>;
      case 'flying':
        return <Badge className="bg-purple-100 text-purple-800">비행충</Badge>;
      case 'none':
        return <Badge className="bg-green-100 text-green-800">없음</Badge>;
      default:
        return <Badge variant="secondary">{pestType}</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">양호</Badge>;
      case 'damaged':
        return <Badge className="bg-yellow-100 text-yellow-800">손상</Badge>;
      case 'missing':
        return <Badge className="bg-red-100 text-red-800">분실</Badge>;
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  const addArea = () => {
    setNewCheck(prev => ({
      ...prev,
      areas: [
        ...(prev.areas || []),
        {
          location: '',
          trapNumber: '',
          pestType: 'none' as const,
          count: 0,
          condition: 'good' as const,
          actionTaken: '',
          nextAction: ''
        }
      ]
    }));
  };

  const addChemical = () => {
    setNewCheck(prev => ({
      ...prev,
      chemicalUsage: [
        ...(prev.chemicalUsage || []),
        {
          productName: '',
          applicationArea: '',
          amount: '',
          date: '',
          safetyMeasures: ''
        }
      ]
    }));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-3">
            <Bug className="w-7 h-7 text-green-600" />
            <span>방충방서 주간점검표</span>
          </h1>
          <p className="text-gray-600 mt-1">해충 및 설치류 방제 관리 기록</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          {hasRole(['admin', 'manager', 'operator']) && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              점검표 작성
            </Button>
          )}
        </div>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="점검자, 위치 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="draft">임시저장</SelectItem>
                  <SelectItem value="submitted">제출완료</SelectItem>
                  <SelectItem value="approved">승인완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                }}
                className="w-full"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 점검표 목록 */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">방충방서 데이터를 불러오는 중...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredChecks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">방충방서 점검표가 없습니다</h3>
                <p className="text-gray-600 mb-4">새로운 주간 점검표를 작성해보세요.</p>
                {hasRole(['admin', 'manager', 'operator']) && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 번째 점검표 작성
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredChecks.map((check) => (
            <Card key={check.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span>{check.weekStartDate} ~ {check.weekEndDate}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>점검자: {check.inspector}</span>
                    </span>
                    <span>점검 구역: {check.areas.length}개</span>
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(check.status)}
                  <Button variant="ghost" size="sm" onClick={() => handleEditCheck(check)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCheck(check.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 트랩 점검 현황 */}
              <div>
                <h4 className="font-medium flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>트랩 점검 현황</span>
                </h4>
                <div className="grid gap-3">
                  {check.areas.map((area, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{area.location}</span>
                            <Badge variant="outline">{area.trapNumber}</Badge>
                            {getPestTypeBadge(area.pestType)}
                            {getConditionBadge(area.condition)}
                          </div>
                          {area.count > 0 && (
                            <div className="text-sm text-red-600 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>포획수: {area.count}마리</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">조치사항:</span> {area.actionTaken}</div>
                        <div><span className="font-medium">다음조치:</span> {area.nextAction}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 예방 조치 */}
              <div>
                <h4 className="font-medium flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4" />
                  <span>예방 조치</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">밀폐상태 점검</span>
                    <Badge className={check.preventiveMeasures.sealingChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {check.preventiveMeasures.sealingChecked ? '완료' : '미완료'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">폐기물 관리</span>
                    <Badge className={check.preventiveMeasures.wastManagementChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {check.preventiveMeasures.wastManagementChecked ? '완료' : '미완료'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">청결상태 점검</span>
                    <Badge className={check.preventiveMeasures.cleanlinessChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {check.preventiveMeasures.cleanlinessChecked ? '완료' : '미완료'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">습도 조절</span>
                    <Badge className={check.preventiveMeasures.moistureControlChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {check.preventiveMeasures.moistureControlChecked ? '완료' : '미완료'}
                    </Badge>
                  </div>
                </div>
                {check.preventiveMeasures.notes && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                    <span className="font-medium">참고사항:</span> {check.preventiveMeasures.notes}
                  </div>
                )}
              </div>

              {/* 화학제품 사용 */}
              {check.chemicalUsage.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span>화학제품 사용</span>
                  </h4>
                  <div className="space-y-2">
                    {check.chemicalUsage.map((chemical, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">제품명:</span> {chemical.productName}</div>
                          <div><span className="font-medium">사용일자:</span> {chemical.date}</div>
                          <div><span className="font-medium">적용구역:</span> {chemical.applicationArea}</div>
                          <div><span className="font-medium">사용량:</span> {chemical.amount}</div>
                          <div className="col-span-full">
                            <span className="font-medium">안전조치:</span> {chemical.safetyMeasures}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 관찰사항 및 권고사항 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {check.observations && (
                  <div>
                    <h5 className="font-medium mb-2">관찰사항</h5>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">{check.observations}</p>
                  </div>
                )}
                {check.recommendations && (
                  <div>
                    <h5 className="font-medium mb-2">권고사항</h5>
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">{check.recommendations}</p>
                  </div>
                )}
              </div>

              {/* 다음 점검일 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">다음 점검 예정일</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {new Date(check.nextInspectionDate).toLocaleDateString('ko-KR')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
        )}


      </div>

      {/* 점검표 작성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>방충방서 주간점검표 작성</DialogTitle>
            <DialogDescription>
              해충 및 설치류 방제 상황을 점검하고 기록하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>점검 시작일</Label>
                <Input
                  type="date"
                  value={newCheck.weekStartDate}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, weekStartDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>점검 종료일</Label>
                <Input
                  type="date"
                  value={newCheck.weekEndDate}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, weekEndDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>점검자</Label>
                <Input
                  value={newCheck.inspector}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, inspector: e.target.value }))}
                  placeholder="점검자명"
                />
              </div>
            </div>

            <Separator />

            {/* 트랩 점검 구역 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">트랩 점검 구역</h4>
                <Button variant="outline" size="sm" onClick={addArea}>
                  <Plus className="w-4 h-4 mr-1" />
                  구역 추가
                </Button>
              </div>
              <div className="space-y-3">
                {newCheck.areas?.map((area, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-lg">
                    <Input
                      placeholder="위치"
                      value={area.location}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].location = e.target.value;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                    <Input
                      placeholder="트랩번호"
                      value={area.trapNumber}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].trapNumber = e.target.value;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                    <Select
                      value={area.pestType}
                      onValueChange={(value) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].pestType = value as 'rodent' | 'insect' | 'flying' | 'none';
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        <SelectItem value="rodent">설치류</SelectItem>
                        <SelectItem value="insect">곤충</SelectItem>
                        <SelectItem value="flying">비행충</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="포획수"
                      value={area.count || ''}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].count = parseInt(e.target.value) || 0;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                    <Select
                      value={area.condition}
                      onValueChange={(value) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].condition = value as 'good' | 'damaged' | 'missing';
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">양호</SelectItem>
                        <SelectItem value="damaged">손상</SelectItem>
                        <SelectItem value="missing">분실</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="조치사항"
                      value={area.actionTaken}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].actionTaken = e.target.value;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 예방 조치 */}
            <div>
              <h4 className="font-medium mb-4">예방 조치</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sealing"
                    checked={newCheck.preventiveMeasures?.sealingChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          sealingChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="sealing">밀폐상태 점검</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="waste"
                    checked={newCheck.preventiveMeasures?.wastManagementChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          wastManagementChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="waste">폐기물 관리</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cleanliness"
                    checked={newCheck.preventiveMeasures?.cleanlinessChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          cleanlinessChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="cleanliness">청결상태 점검</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="moisture"
                    checked={newCheck.preventiveMeasures?.moistureControlChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          moistureControlChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="moisture">습도 조절</Label>
                </div>
              </div>
            </div>

            {/* 관찰사항 및 권고사항 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>관찰사항</Label>
                <Textarea
                  placeholder="점검 중 관찰된 사항을 기록하세요..."
                  value={newCheck.observations}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>권고사항</Label>
                <Textarea
                  placeholder="개선이 필요한 사항을 기록하세요..."
                  value={newCheck.recommendations}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, recommendations: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>다음 점검 예정일</Label>
              <Input
                type="date"
                value={newCheck.nextInspectionDate}
                onChange={(e) => setNewCheck(prev => ({ ...prev, nextInspectionDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCheck}>
              점검표 저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 점검표 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>방충방서 주간점검표 수정</DialogTitle>
            <DialogDescription>
              기존 점검표 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>점검 시작일</Label>
                <Input
                  type="date"
                  value={newCheck.weekStartDate}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, weekStartDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>점검 종료일</Label>
                <Input
                  type="date"
                  value={newCheck.weekEndDate}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, weekEndDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>점검자</Label>
                <Input
                  value={newCheck.inspector}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, inspector: e.target.value }))}
                  placeholder="점검자명"
                />
              </div>
            </div>

            <Separator />

            {/* 트랩 점검 구역 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">트랩 점검 구역</h4>
                <Button variant="outline" size="sm" onClick={addArea}>
                  <Plus className="w-4 h-4 mr-1" />
                  구역 추가
                </Button>
              </div>
              <div className="space-y-3">
                {newCheck.areas?.map((area, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-lg">
                    <Input
                      placeholder="위치"
                      value={area.location}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].location = e.target.value;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                    <Input
                      placeholder="트랩번호"
                      value={area.trapNumber}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].trapNumber = e.target.value;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                    <Select
                      value={area.pestType}
                      onValueChange={(value) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].pestType = value as 'rodent' | 'insect' | 'flying' | 'none';
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        <SelectItem value="rodent">설치류</SelectItem>
                        <SelectItem value="insect">곤충</SelectItem>
                        <SelectItem value="flying">비행충</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="포획수"
                      value={area.count || ''}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].count = parseInt(e.target.value) || 0;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                    <Select
                      value={area.condition}
                      onValueChange={(value) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].condition = value as 'good' | 'damaged' | 'missing';
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">양호</SelectItem>
                        <SelectItem value="damaged">손상</SelectItem>
                        <SelectItem value="missing">분실</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="조치사항"
                      value={area.actionTaken}
                      onChange={(e) => {
                        const updatedAreas = [...(newCheck.areas || [])];
                        updatedAreas[index].actionTaken = e.target.value;
                        setNewCheck(prev => ({ ...prev, areas: updatedAreas }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 예방 조치 */}
            <div>
              <h4 className="font-medium mb-4">예방 조치</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-sealing"
                    checked={newCheck.preventiveMeasures?.sealingChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          sealingChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="edit-sealing">밀폐상태 점검</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-waste"
                    checked={newCheck.preventiveMeasures?.wastManagementChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          wastManagementChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="edit-waste">폐기물 관리</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-cleanliness"
                    checked={newCheck.preventiveMeasures?.cleanlinessChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          cleanlinessChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="edit-cleanliness">청결상태 점검</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-moisture"
                    checked={newCheck.preventiveMeasures?.moistureControlChecked}
                    onCheckedChange={(checked) => 
                      setNewCheck(prev => ({
                        ...prev,
                        preventiveMeasures: {
                          ...prev.preventiveMeasures!,
                          moistureControlChecked: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor="edit-moisture">습도 조절</Label>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>참고사항</Label>
                <Textarea
                  placeholder="예방 조치 관련 참고사항을 입력하세요..."
                  value={newCheck.preventiveMeasures?.notes || ''}
                  onChange={(e) => 
                    setNewCheck(prev => ({
                      ...prev,
                      preventiveMeasures: {
                        ...prev.preventiveMeasures!,
                        notes: e.target.value
                      }
                    }))
                  }
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* 화학제품 사용 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">화학제품 사용</h4>
                <Button variant="outline" size="sm" onClick={addChemical}>
                  <Plus className="w-4 h-4 mr-1" />
                  화학제품 추가
                </Button>
              </div>
              <div className="space-y-3">
                {newCheck.chemicalUsage?.map((chemical, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                    <Input
                      placeholder="제품명"
                      value={chemical.productName}
                      onChange={(e) => {
                        const updatedChemicals = [...(newCheck.chemicalUsage || [])];
                        updatedChemicals[index].productName = e.target.value;
                        setNewCheck(prev => ({ ...prev, chemicalUsage: updatedChemicals }));
                      }}
                    />
                    <Input
                      placeholder="적용구역"
                      value={chemical.applicationArea}
                      onChange={(e) => {
                        const updatedChemicals = [...(newCheck.chemicalUsage || [])];
                        updatedChemicals[index].applicationArea = e.target.value;
                        setNewCheck(prev => ({ ...prev, chemicalUsage: updatedChemicals }));
                      }}
                    />
                    <Input
                      placeholder="사용량"
                      value={chemical.amount}
                      onChange={(e) => {
                        const updatedChemicals = [...(newCheck.chemicalUsage || [])];
                        updatedChemicals[index].amount = e.target.value;
                        setNewCheck(prev => ({ ...prev, chemicalUsage: updatedChemicals }));
                      }}
                    />
                    <Input
                      type="date"
                      placeholder="사용일자"
                      value={chemical.date}
                      onChange={(e) => {
                        const updatedChemicals = [...(newCheck.chemicalUsage || [])];
                        updatedChemicals[index].date = e.target.value;
                        setNewCheck(prev => ({ ...prev, chemicalUsage: updatedChemicals }));
                      }}
                    />
                    <Input
                      placeholder="안전조치"
                      value={chemical.safetyMeasures}
                      onChange={(e) => {
                        const updatedChemicals = [...(newCheck.chemicalUsage || [])];
                        updatedChemicals[index].safetyMeasures = e.target.value;
                        setNewCheck(prev => ({ ...prev, chemicalUsage: updatedChemicals }));
                      }}
                      className="md:col-span-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 관찰사항 및 권고사항 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>관찰사항</Label>
                <Textarea
                  placeholder="점검 중 관찰된 사항을 기록하세요..."
                  value={newCheck.observations}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>권고사항</Label>
                <Textarea
                  placeholder="개선이 필요한 사항을 기록하세요..."
                  value={newCheck.recommendations}
                  onChange={(e) => setNewCheck(prev => ({ ...prev, recommendations: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>다음 점검 예정일</Label>
              <Input
                type="date"
                value={newCheck.nextInspectionDate}
                onChange={(e) => setNewCheck(prev => ({ ...prev, nextInspectionDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateCheck}>
              수정 완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}