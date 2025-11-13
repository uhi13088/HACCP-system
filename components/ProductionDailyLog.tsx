import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Checkbox } from "./ui/checkbox";
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  User,
  Package,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  Upload,
  Search
} from "lucide-react";

interface ProductionLog {
  id: string;
  date: string;
  supervisor: string;
  products: {
    name: string;
    quantity: number;
    unit: string;
    worker: string;
  }[];
  hygiene: {
    floorCleaning: boolean;
    wallCleaning: boolean;
    wasteRemoval: boolean;
    workbenchCleaning: boolean;
    equipmentWashing: boolean;
    storageOrganization: boolean;
  };
  incidents: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'submitted' | 'approved';
}

// localStorage 키
const STORAGE_KEY = 'smart-haccp-production-logs';
const DRAFT_STORAGE_KEY = 'smart-haccp-production-log-draft';

// localStorage에서 데이터 로드
const loadLogsFromStorage = (): ProductionLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load logs from localStorage:', error);
  }
  
  // 기본 더미 데이터
  return [
    {
      id: '1',
      date: '2024-01-15',
      supervisor: '김수진',
      products: [
        {
          name: '식빵',
          quantity: 500,
          unit: '개',
          worker: '이영희'
        },
        {
          name: '크로와상',
          quantity: 200,
          unit: '개',
          worker: '박민수'
        }
      ],
      hygiene: {
        floorCleaning: true,
        wallCleaning: true,
        wasteRemoval: true,
        workbenchCleaning: true,
        equipmentWashing: true,
        storageOrganization: true,
      },
      incidents: '',
      createdBy: '김수진',
      createdAt: '2024-01-15T18:00:00Z',
      status: 'approved'
    }
  ];
};

// localStorage에 데이터 저장
const saveLogsToStorage = (logs: ProductionLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save logs to localStorage:', error);
  }
};

// 임시 작성 데이터 저장
const saveDraftToStorage = (draft: Partial<ProductionLog>) => {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
};

// 임시 작성 데이터 로드
const loadDraftFromStorage = (): Partial<ProductionLog> | null => {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load draft from localStorage:', error);
  }
  return null;
};

// 임시 작성 데이터 삭제
const clearDraftFromStorage = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear draft from localStorage:', error);
  }
};

export function ProductionDailyLog() {
  const { user, hasRole } = useAuth();
  const [logs, setLogs] = useState<ProductionLog[]>(loadLogsFromStorage);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const [newLog, setNewLog] = useState<Partial<ProductionLog>>({
    date: new Date().toISOString().split('T')[0],
    supervisor: user?.name || '',
    products: [],
    hygiene: {
      floorCleaning: false,
      wallCleaning: false,
      wasteRemoval: false,
      workbenchCleaning: false,
      equipmentWashing: false,
      storageOrganization: false,
    },
    incidents: '',
    status: 'draft'
  });

  // logs 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveLogsToStorage(logs);
  }, [logs]);

  // 컴포넌트 마운트 시 임시 저장된 데이터 로드
  useEffect(() => {
    const savedDraft = loadDraftFromStorage();
    if (savedDraft) {
      setNewLog(savedDraft);
      setHasDraft(Boolean(savedDraft.supervisor || savedDraft.products?.length || savedDraft.incidents));
    }
  }, []);

  // newLog 상태가 변경될 때마다 임시 저장 (작성 중인 내용 보존)
  useEffect(() => {
    const hasContent = Boolean(newLog.supervisor || newLog.products?.length || newLog.incidents);
    setHasDraft(hasContent);
    
    if (showCreateDialog && newLog && hasContent) {
      saveDraftToStorage(newLog);
    }
  }, [newLog, showCreateDialog]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           p.worker.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesDate = !filterDate || log.date === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCreateLog = async () => {
    if (isSaving) return;
    
    if (!newLog.supervisor || !newLog.products?.length) {
      toast.error('필수 항목을 모두 입력해주세요.', {
        description: '담당자와 생산 제품 정보는 필수입니다.',
        duration: 3000,
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (editingLog) {
        // 수정 모드
        setLogs(prev => prev.map(log => 
          log.id === editingLog.id 
            ? {
                ...newLog as ProductionLog,
                id: editingLog.id,
                createdBy: editingLog.createdBy,
                createdAt: editingLog.createdAt,
                status: editingLog.status === 'approved' ? 'approved' : 'draft'
              }
            : log
        ));
        toast.success('생산일지가 수정되었습니다.', {
          description: '변경사항이 저장되었습니다.',
          duration: 3000,
        });
      } else {
        // 새로 생성
        const logToSave: ProductionLog = {
          ...newLog,
          id: Date.now().toString(),
          createdBy: user?.name || '',
          createdAt: new Date().toISOString(),
          status: 'draft'
        } as ProductionLog;

        setLogs(prev => [logToSave, ...prev]);
        toast.success('생산일지가 생성되었습니다.', {
          description: '새로운 생산일지가 저장되었습니다.',
          duration: 3000,
        });
      }

      // 다이얼로그 초기화
      setShowCreateDialog(false);
      setEditingLog(null);
      clearDraftFromStorage(); // 임시 저장 데이터 삭제
      setHasDraft(false);
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        supervisor: user?.name || '',
        products: [],
        hygiene: {
          floorCleaning: false,
          wallCleaning: false,
          wasteRemoval: false,
          workbenchCleaning: false,
          equipmentWashing: false,
          storageOrganization: false,
        },
        incidents: '',
        status: 'draft'
      });
    } catch (error) {
      toast.error('생산일지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = (logId: string) => {
    setLogs(prev => prev.filter(log => log.id !== logId));
    toast.success('생산일지가 삭제되었습니다.');
  };

  const handleEditLog = (log: ProductionLog) => {
    setEditingLog(log);
    setNewLog({
      ...log,
      products: [...log.products],
      hygiene: { ...log.hygiene }
    });
    setShowCreateDialog(true);
  };

  const handleSubmitForApproval = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'submitted' }
        : log
    ));
    toast.success('생산일지가 제출되었습니다.', {
      description: '매니저 승인을 기다리고 있습니다.',
      duration: 3000,
    });
  };

  const handleApproveLog = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'approved' }
        : log
    ));
    toast.success('생산일지가 승인되었습니다.', {
      description: '승인이 완료되었습니다.',
      duration: 3000,
    });
  };

  const handleRejectLog = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'draft' }
        : log
    ));
    toast.warning('생산일지가 반려되었습니다.', {
      description: '수정 후 다시 제출해주세요.',
      duration: 3000,
    });
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

  const addProduct = () => {
    setNewLog(prev => ({
      ...prev,
      products: [
        ...(prev.products || []),
        {
          name: '',
          quantity: 0,
          unit: '개',
          worker: ''
        }
      ]
    }));
  };

  const removeProduct = (index: number) => {
    setNewLog(prev => ({
      ...prev,
      products: (prev.products || []).filter((_, i) => i !== index)
    }));
  };

  const hygieneLabels = {
    floorCleaning: '바닥이물질 및 얼룩제거',
    wallCleaning: '벽 이물질 및 얼룩제거',
    wasteRemoval: '실내 쓰레기 및 분리수거 제거',
    workbenchCleaning: '작업대 및 싱크대 이물 제거',
    equipmentWashing: '장비 세척',
    storageOrganization: '실온창고, 사무실, 탈의실 정리정돈'
  };

  // 데이터 백업 (JSON 파일로 다운로드)
  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `production-logs-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('생산일지 데이터가 백업되었습니다.', {
        description: '파일이 다운로드 폴더에 저장되었습니다.',
        duration: 3000,
      });
    } catch (error) {
      toast.error('데이터 백업 중 오류가 발생했습니다.');
    }
  };

  // 데이터 복원 (JSON 파일 업로드)
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setLogs(importedData);
          toast.success('생산일지 데이터가 복원되었습니다.', {
            description: `${importedData.length}개의 생산일지가 로드되었습니다.`,
            duration: 3000,
          });
        } else {
          toast.error('올바른 백업 파일이 아닙니다.');
        }
      } catch (error) {
        toast.error('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    
    // 파일 input 초기화
    event.target.value = '';
  };

  // localStorage 초기화
  const handleClearAllData = () => {
    if (window.confirm('모든 생산일지 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem(STORAGE_KEY);
      setLogs(loadLogsFromStorage());
      toast.success('모든 데이터가 삭제되었습니다.');
    }
  };

  // 수동 임시 저장
  const handleSaveDraft = () => {
    saveDraftToStorage(newLog);
    toast.success('작성 중인 내용이 임시 저장되었습니다.', {
      description: '로그아웃 후에도 복원 가능합니다.',
      duration: 3000,
    });
  };

  // 임시 저장 데이터 삭제
  const handleClearDraft = () => {
    clearDraftFromStorage();
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      supervisor: user?.name || '',
      products: [],
      hygiene: {
        floorCleaning: false,
        wallCleaning: false,
        wasteRemoval: false,
        workbenchCleaning: false,
        equipmentWashing: false,
        storageOrganization: false,
      },
      incidents: '',
      status: 'draft'
    });
    setHasDraft(false);
    toast.info('임시 저장된 내용이 삭제되었습니다.');
  };



  // 다이얼로그 닫기 처리
  const handleCloseDialog = () => {
    const hasUnsavedContent = newLog.supervisor || newLog.products?.length || newLog.incidents;
    
    if (hasUnsavedContent && !editingLog) {
      setShowCloseWarning(true);
    } else {
      setShowCreateDialog(false);
      setEditingLog(null);
    }
  };

  // 강제 닫기 (저장 없이)
  const handleForceClose = () => {
    setShowCreateDialog(false);
    setEditingLog(null);
    setShowCloseWarning(false);
  };

  // 임시 저장 후 닫기
  const handleSaveAndClose = () => {
    handleSaveDraft();
    setShowCreateDialog(false);
    setEditingLog(null);
    setShowCloseWarning(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-3">
            <FileText className="w-7 h-7 text-blue-600" />
            <span>생산일지</span>
            <Badge className="bg-green-100 text-green-800 text-xs">
              자동저장됨
            </Badge>
            {hasDraft && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                임시저장 있음
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            일간 생산 현황 및 위생 관리 기록 
            <span className="text-sm text-blue-600 ml-2">
              • 총 {logs.length}건 저장됨
            </span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            백업
          </Button>
          
          {hasRole(['admin', 'manager']) && (
            <>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    복원
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAllData}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                전체삭제
              </Button>
            </>
          )}
          
          {hasRole(['admin', 'manager', 'operator']) && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              생산일지 작성
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
                  placeholder="담당자, 제품명, 작업자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="draft">임시저장</option>
                <option value="submitted">제출완료</option>
                <option value="approved">승인완료</option>
              </select>
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

      {/* 생산일지 목록 */}
      <div className="grid gap-6">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>{log.date}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>담당자: {log.supervisor}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>작성: {new Date(log.createdAt).toLocaleDateString('ko-KR')}</span>
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(log.status)}
                  
                  {/* 수정 버튼 - 승인되지 않은 경우에만 표시 */}
                  {log.status !== 'approved' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditLog(log)}
                      title="수정"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* 상태별 액션 버튼 */}
                  {log.status === 'draft' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSubmitForApproval(log.id)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      제출
                    </Button>
                  )}
                  
                  {log.status === 'submitted' && hasRole(['admin', 'manager']) && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleApproveLog(log.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        승인
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRejectLog(log.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        반려
                      </Button>
                    </>
                  )}
                  
                  {/* 삭제 버튼 - 관리자나 본인만 */}
                  {(hasRole(['admin']) || log.createdBy === user?.name) && log.status !== 'approved' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteLog(log.id)}
                      title="삭제"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 생산 현황 */}
              <div>
                <h4 className="font-medium flex items-center space-x-2 mb-3">
                  <Package className="w-4 h-4" />
                  <span>생산 현황</span>
                </h4>
                <div className="grid gap-3">
                  {log.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center space-x-4">
                          <span>수량: {product.quantity}{product.unit}</span>
                          <span>작업자: {product.worker}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 위생 작업 */}
              <div>
                <h4 className="font-medium flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <span>위생 작업</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(hygieneLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{label}</span>
                      <Badge className={log.hygiene[key as keyof typeof log.hygiene] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {log.hygiene[key as keyof typeof log.hygiene] ? '완료' : '미완료'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 특이사항 */}
              {log.incidents && (
                <div>
                  <Separator className="mb-4" />
                  <div className="mb-3">
                    <h5 className="font-medium text-red-600 mb-1">특이사항</h5>
                    <p className="text-sm text-gray-700 bg-red-50 p-2 rounded">{log.incidents}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">조건에 맞는 생산일지가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 생산일지 작성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        } else {
          setShowCreateDialog(true);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{editingLog ? '생산일지 수정' : '생산일지 작성'}</DialogTitle>
                <DialogDescription>
                  {editingLog ? '생산일지 내용을 수정하세요.' : '일간 생산 현황과 위생 작업 사항을 기록하세요.'}
                </DialogDescription>
              </div>
              
              {!editingLog && (
                <div className="flex items-center space-x-2">
                  {hasDraft && (
                    <Badge className="bg-blue-100 text-blue-800">
                      임시저장됨
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    title="수동 임시저장"
                  >
                    💾 저장
                  </Button>
                  {hasDraft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearDraft}
                      title="임시저장 초기화"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      🗑️ 초기화
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>생산 담당자</Label>
                <Input
                  value={newLog.supervisor}
                  onChange={(e) => setNewLog(prev => ({ ...prev, supervisor: e.target.value }))}
                  placeholder="담당자명"
                />
              </div>
            </div>

            <Separator />

            {/* 생산 제품 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">생산 제품</h4>
                <Button variant="outline" size="sm" onClick={addProduct}>
                  <Plus className="w-4 h-4 mr-1" />
                  제품 추가
                </Button>
              </div>
              <div className="space-y-3">
                {newLog.products?.map((product, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-white space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">제품 {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium mb-1 block">품명</Label>
                        <Input
                          placeholder="제품명 입력"
                          className="font-sans"
                          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif' }}
                          value={product.name}
                          onChange={(e) => {
                            const updatedProducts = [...(newLog.products || [])];
                            updatedProducts[index].name = e.target.value;
                            setNewLog(prev => ({ ...prev, products: updatedProducts }));
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Label className="text-sm font-medium mb-1 block">생산량</Label>
                          <Input
                            type="number"
                            placeholder="수량"
                            value={product.quantity?.toString() || ''}
                            onChange={(e) => {
                              const updatedProducts = [...(newLog.products || [])];
                              const value = e.target.value;
                              updatedProducts[index].quantity = value === '' ? 0 : parseInt(value) || 0;
                              setNewLog(prev => ({ ...prev, products: updatedProducts }));
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1 block">단위</Label>
                          <Input
                            placeholder="개"
                            value={product.unit}
                            onChange={(e) => {
                              const updatedProducts = [...(newLog.products || [])];
                              updatedProducts[index].unit = e.target.value;
                              setNewLog(prev => ({ ...prev, products: updatedProducts }));
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-1 block">작업자 성명</Label>
                        <Input
                          placeholder="작업자 이름을 입력하세요"
                          value={product.worker}
                          onChange={(e) => {
                            const updatedProducts = [...(newLog.products || [])];
                            updatedProducts[index].worker = e.target.value;
                            setNewLog(prev => ({ ...prev, products: updatedProducts }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 위생 작업 체크리스트 */}
            <div>
              <h4 className="font-medium mb-4">위생 작업 체크리스트</h4>
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                {Object.entries(hygieneLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Checkbox
                      id={key}
                      checked={newLog.hygiene?.[key as keyof typeof newLog.hygiene] || false}
                      onCheckedChange={(checked) => {
                        setNewLog(prev => ({
                          ...prev,
                          hygiene: {
                            ...(prev.hygiene || {}),
                            [key]: checked
                          }
                        }));
                      }}
                    />
                    <Label htmlFor={key} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 특이사항 */}
            <div className="space-y-2">
              <Label>특이사항</Label>
              <textarea
                placeholder="특이사항이 있다면 기록하세요..."
                value={newLog.incidents}
                onChange={(e) => setNewLog(prev => ({ ...prev, incidents: e.target.value }))}
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-md resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
            >
              취소
            </Button>
            <Button onClick={handleCreateLog} disabled={isSaving}>
              {isSaving ? '저장 중...' : editingLog ? '수정 완료' : '생산일지 저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 닫기 경고 다이얼로그 */}
      <AlertDialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 중인 내용이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              저장하지 않고 닫으면 작성 중인 내용이 사라질 수 있습니다. 어떻게 하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCloseWarning(false)}>
              계속 작성
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveAndClose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              임시저장 후 닫기
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={handleForceClose}
              className="bg-red-600 hover:bg-red-700"
            >
              저장 안함
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}