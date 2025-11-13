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
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { SignaturePad } from "./SignaturePad";
import {
  Users,
  Plus,
  Calendar,
  Building,
  Phone,
  Edit,
  Trash2,
  Download,
  Search,
  LogIn,
  LogOut,
  PenTool
} from "lucide-react";

interface VisitorEntry {
  id: string;
  date: string;
  entryTime: string;
  exitTime?: string;
  companyDepartment: string; // 업체명/부서
  namePosition: string; // 성명/직위
  contactNumber: string; // 전화번호
  purpose: string; // 출입목적
  privacyConsent: boolean; // 개인 정보 활용 동의
  signature: string; // 서명 데이터 (base64)
  status: 'visiting' | 'exited';
  createdBy: string;
  createdAt: string;
}

export function VisitorManagementLog() {
  const { user, hasRole } = useAuth();
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VisitorEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [signatureViewDialog, setSignatureViewDialog] = useState(false);
  const [viewingSignature, setViewingSignature] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [newEntry, setNewEntry] = useState<Partial<VisitorEntry>>({
    date: new Date().toISOString().split('T')[0],
    entryTime: '',
    companyDepartment: '',
    namePosition: '',
    contactNumber: '',
    purpose: '',
    privacyConsent: false,
    signature: '',
    status: 'visiting'
  });

  // 컴포넌트 로드시 데이터 가져오기
  useEffect(() => {
    loadVisitorData();
  }, []);

  const loadVisitorData = async () => {
    try {
      setLoading(true);
      console.log('👥 Loading visitor data...');
      
      const response = await api.get('/visitor-logs');
      if (response.success && response.data && response.data.length > 0) {
        setEntries(response.data);
        console.log('✅ Visitor data loaded:', response.data.length, 'records');
      } else {
        console.log('⚠️ No visitor data found, creating sample data...');
        
        // 샘플 데이터 생성
        try {
          const sampleResponse = await api.createSampleData();
          if (sampleResponse.success) {
            console.log('✅ Sample data created successfully');
            // 생성 후 다시 데이터 로드
            const reloadResponse = await api.get('/visitor-logs');
            if (reloadResponse.success && reloadResponse.data) {
              setEntries(reloadResponse.data);
              console.log('✅ Visitor data loaded after sample creation:', reloadResponse.data.length, 'records');
              toast.success('샘플 외부인출입 데이터가 생성되었습니다.', {
                description: '이제 백업 기능을 사용할 수 있습니다.'
              });
            } else {
              setEntries([]);
            }
          } else {
            console.log('⚠️ Failed to create sample data');
            setEntries([]);
          }
        } catch (sampleError: any) {
          console.error('❌ Error creating sample data:', sampleError);
          setEntries([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading visitor data:', error);
      toast.error('외부인출입 데이터 로드 실패', {
        description: error.message || '데이터를 불러오는 중 오류가 발생했습니다.'
      });
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.namePosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.companyDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    const matchesDate = !filterDate || entry.date === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const resetForm = () => {
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      entryTime: '',
      companyDepartment: '',
      namePosition: '',
      contactNumber: '',
      purpose: '',
      privacyConsent: false,
      signature: '',
      status: 'visiting'
    });
    setEditingEntry(null);
  };

  const handleCreateEntry = async () => {
    if (isSaving) return; // 중복 클릭 방지
    
    setIsSaving(true);
    
    try {
      console.log('👥 Creating new visitor entry...');
      
      const entryToSave = {
        ...newEntry,
        createdBy: user?.name || '',
        createdAt: new Date().toISOString(),
      };

      const response = await api.post('/visitor-logs', entryToSave);
      
      if (response.success) {
        console.log('✅ Visitor entry created successfully');
        await loadVisitorData(); // 데이터 새로고침
        setShowCreateDialog(false);
        resetForm();
        
        toast.success('외부인 출입 기록이 생성되었습니다.', {
          description: '새로운 출입 기록이 저장되었습니다.',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || '출입 기록 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ Error creating visitor entry:', error);
      toast.error('기록 저장 실패', {
        description: error.message || '기록을 저장하는 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEntry = (entry: VisitorEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      date: entry.date,
      entryTime: entry.entryTime,
      exitTime: entry.exitTime,
      companyDepartment: entry.companyDepartment,
      namePosition: entry.namePosition,
      contactNumber: entry.contactNumber,
      purpose: entry.purpose,
      privacyConsent: entry.privacyConsent,
      signature: entry.signature,
      status: entry.status
    });
    setShowCreateDialog(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || isSaving) return; // 중복 클릭 방지
    
    setIsSaving(true);
    
    try {
      console.log('👥 Updating visitor entry:', editingEntry.id);
      
      const updatedEntry = {
        ...editingEntry,
        ...newEntry,
        id: editingEntry.id,
        createdBy: editingEntry.createdBy,
        createdAt: editingEntry.createdAt,
      };

      const response = await api.put(`/visitor-logs/${editingEntry.id}`, updatedEntry);
      
      if (response.success) {
        console.log('✅ Visitor entry updated successfully');
        await loadVisitorData(); // 데이터 새로고침
        setShowCreateDialog(false);
        resetForm();
        
        toast.success('출입 기록이 수정되었습니다.', {
          description: '기록이 성공적으로 업데이트되었습니다.',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || '출입 기록 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ Error updating visitor entry:', error);
      toast.error('기록 수정 실패', {
        description: error.message || '기록을 수정하는 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEntry = async () => {
    if (entryToDelete) {
      try {
        console.log('👥 Deleting visitor entry:', entryToDelete);
        
        const response = await api.delete(`/visitor-logs/${entryToDelete}`);
        
        if (response.success) {
          console.log('✅ Visitor entry deleted successfully');
          await loadVisitorData(); // 데이터 새로고침
          toast.success('출입 기록이 삭제되었습니다.');
        } else {
          throw new Error(response.error || '출입 기록 삭제에 실패했습니다.');
        }
      } catch (error: any) {
        console.error('❌ Error deleting visitor entry:', error);
        toast.error('기록 삭제 실패', {
          description: error.message || '기록을 삭제하는 중 오류가 발생했습니다.'
        });
      } finally {
        setDeleteDialogOpen(false);
        setEntryToDelete(null);
      }
    }
  };

  const handleCheckOut = (entryId: string) => {
    const exitTime = new Date().toTimeString().slice(0, 5);
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, status: 'exited' as const, exitTime }
        : entry
    ));
    toast.success('퇴실 처리가 완료되었습니다.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'visiting':
        return <Badge className="bg-blue-100 text-blue-800">방문중</Badge>;
      case 'exited':
        return <Badge className="bg-green-100 text-green-800">퇴실완료</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    resetForm();
  };

  const viewSignature = (signature: string) => {
    setViewingSignature(signature);
    setSignatureViewDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-3">
            <Users className="w-7 h-7 text-purple-600" />
            <span>외부인출입관리대장</span>
          </h1>
          <p className="text-gray-600 mt-1">외부 방문자 출입 현황 및 관리 기록 (방문중 → 퇴실완료)</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          {entries.length === 0 && hasRole(['admin', 'manager']) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const response = await api.createSampleData();
                  if (response.success) {
                    await loadVisitorData();
                    toast.success('샘플 데이터가 생성되었습니다.');
                  }
                } catch (error) {
                  toast.error('샘플 데이터 생성 실패');
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              샘플 데이터 생성
            </Button>
          )}
          {hasRole(['admin', 'manager', 'operator']) && (
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              출입 기록
            </Button>
          )}
        </div>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="성명, 업체명, 목적 검색..."
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
                  <SelectItem value="visiting">방문중</SelectItem>
                  <SelectItem value="exited">퇴실완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterDate("");
                }}
                className="w-full"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 출입 기록 목록 */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">외부인출입 데이터를 불러오는 중...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">외부인출입 기록이 없습니다</h3>
                <p className="text-gray-600 mb-4">새로운 출입 기록을 작성해보세요.</p>
                {hasRole(['admin', 'manager', 'operator']) && (
                  <Button onClick={() => {
                    resetForm();
                    setShowCreateDialog(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 번째 출입 기록
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>{entry.date}</span>
                    <span className="flex items-center space-x-1 text-sm text-gray-600">
                      <LogIn className="w-4 h-4" />
                      <span>입실: {entry.entryTime}</span>
                      {entry.exitTime && (
                        <>
                          <LogOut className="w-4 h-4 ml-2" />
                          <span>퇴실: {entry.exitTime}</span>
                        </>
                      )}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{entry.namePosition}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>{entry.companyDepartment}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{entry.contactNumber}</span>
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(entry.status)}
                  {entry.status !== 'exited' && (
                    <Button variant="outline" size="sm" onClick={() => handleCheckOut(entry.id)}>
                      <LogOut className="w-4 h-4 mr-1" />
                      퇴실
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 방문 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">방문 목적:</span>
                    <span>{entry.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">개인정보 동의:</span>
                    <Badge className={entry.privacyConsent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {entry.privacyConsent ? '동의함' : '동의하지 않음'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">서명 여부:</span>
                    <div className="flex items-center space-x-2">
                      <Badge className={entry.signature ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {entry.signature ? '서명 완료' : '서명 없음'}
                      </Badge>
                      {entry.signature && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => viewSignature(entry.signature)}
                        >
                          <PenTool className="w-3 h-3 text-green-600" />
                          보기
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">작성자:</span>
                    <span>{entry.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">작성일시:</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* 출입 기록 작성/수정 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg">
              {editingEntry ? '외부인 출입 기�� 수정' : '외부인 출입 기록'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingEntry 
                ? '외부 방문자의 출입 정보를 수정하세요.' 
                : '외부 방문자의 출입 정보를 기록하세요. 신규 등록시 \'방문중\' 상태로 저장됩니다.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 기본 정보 - 더 컴팩트한 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">방문 날짜</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">방문 시간</Label>
                <Input
                  type="time"
                  value={newEntry.entryTime}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, entryTime: e.target.value }))}
                  className="text-sm"
                />
              </div>
              {/* 수정 모드에서 퇴실 시간 */}
              {editingEntry && editingEntry.status === 'exited' && (
                <div className="space-y-1">
                  <Label className="text-sm">퇴실 시간</Label>
                  <Input
                    type="time"
                    value={newEntry.exitTime || ''}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, exitTime: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* 방문자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">업체명/부서</Label>
                <Input
                  value={newEntry.companyDepartment}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, companyDepartment: e.target.value }))}
                  placeholder="(주)회사명 / 부서명"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">성명/직위</Label>
                <Input
                  value={newEntry.namePosition}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, namePosition: e.target.value }))}
                  placeholder="홍길동 / 과장"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">전화번호</Label>
                <Input
                  value={newEntry.contactNumber}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, contactNumber: e.target.value }))}
                  placeholder="010-0000-0000"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">출입목적</Label>
                <Input
                  value={newEntry.purpose}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="방문 목적"
                  className="text-sm"
                />
              </div>
            </div>

            {/* 수정 모드에서 상태 변경 */}
            {editingEntry && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">상태</Label>
                  <Select value={newEntry.status} onValueChange={(value) => setNewEntry(prev => ({ ...prev, status: value as 'visiting' | 'exited' }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visiting">방문중</SelectItem>
                      <SelectItem value="exited">퇴실완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* 개인정보 동의 및 서명 - 더 컴팩트하게 */}
            <div className="space-y-3 border-t pt-3">
              <h4 className="text-sm font-medium">개인정보 동의 및 서명</h4>
              
              {/* 개인정보 동의 - 더 컴팩트하게 */}
              <div className="p-3 bg-gray-50 rounded text-sm">
                <p className="text-gray-700 mb-2">
                  본인은 출입 관리 목적으로 개인정보(성명, 연락처 등)가 수집·이용되는 것에 동의합니다.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    checked={newEntry.privacyConsent}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                    className="w-3 h-3"
                  />
                  <Label htmlFor="privacyConsent" className="text-xs">
                    개인정보 수집·이용에 동의합니다.
                  </Label>
                </div>
              </div>

              {/* 서명패드 - 더 작게 */}
              <div className="space-y-2">
                <SignaturePad
                  value={newEntry.signature || ''}
                  onChange={(signature) => setNewEntry(prev => ({ ...prev, signature }))}
                  width={320}
                  height={120}
                  label="방문자 서명"
                  required={true}
                />
                <p className="text-xs text-gray-500">
                  개인정보 수집·이용 동의 확인을 위해 위 영역에 서명해주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="border-t pt-3 mt-4">
            <div className="flex justify-between items-center">
              {/* 저장 버튼 비활성화 안내 */}
              <div className="flex-1">
                {(!newEntry.privacyConsent || !newEntry.signature) && (
                  <p className="text-xs text-red-600">
                    {!newEntry.privacyConsent && !newEntry.signature && "개인정보 동의 및 서명 필요"}
                    {!newEntry.privacyConsent && newEntry.signature && "개인정보 동의 필요"}
                    {newEntry.privacyConsent && !newEntry.signature && "서명 필요"}
                  </p>
                )}
              </div>
              
              {/* 버튼들 */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleDialogClose}>
                  취소
                </Button>
                <Button 
                  size="sm"
                  onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}
                  disabled={
                    isSaving ||
                    !newEntry.privacyConsent || 
                    !newEntry.signature ||
                    !newEntry.namePosition ||
                    !newEntry.companyDepartment ||
                    !newEntry.contactNumber ||
                    !newEntry.purpose ||
                    !newEntry.entryTime
                  }
                >
                  {isSaving ? '저장 중...' : (editingEntry ? '기록 수정' : '출입 기록 저장')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>출입 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 출입 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEntry}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 서명 보기 다이얼로그 */}
      <Dialog open={signatureViewDialog} onOpenChange={setSignatureViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <PenTool className="w-5 h-5" />
              <span>방문자 서명</span>
            </DialogTitle>
            <DialogDescription>
              방문자가 작성한 서명을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {viewingSignature && (
              <div className="p-4 border border-gray-200 rounded-lg bg-white flex justify-center">
                <img 
                  src={viewingSignature} 
                  alt="방문자 서명" 
                  className="max-w-full h-auto border border-gray-100 rounded"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setSignatureViewDialog(false)}>
                닫기
              </Button>
              <Button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `visitor_signature_${new Date().getTime()}.png`;
                  link.href = viewingSignature;
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}