import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  FileSpreadsheet,
  Shield,
  CheckCircle2,
  X,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner@2.0.3";

// 백업 필드 인터페이스
interface BackupField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  order: number;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// CCP 공정별 시트 관리를 위한 인터페이스
interface CCPProcessSheet {
  id: string;
  processType: string;
  processName: string;
  sheetName: string;
  spreadsheetId: string;
  fields: BackupField[];
  enabled: boolean;
  lastModified: string;
  isConnected?: boolean;
  lastTest?: string | null;
}

// CCP 공정 타입 정의
interface CCPProcessType {
  id: string;
  name: string;
  description: string;
  defaultFields: BackupField[];
}

interface CCPMultiSheetManagerProps {
  ccpSpreadsheetId: string;
  onClose: () => void;
}

export function CCPMultiSheetManager({ ccpSpreadsheetId, onClose }: CCPMultiSheetManagerProps) {
  const [processSheets, setProcessSheets] = useState<CCPProcessSheet[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSheet, setEditingSheet] = useState<CCPProcessSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<BackupField | null>(null);
  const [editingFields, setEditingFields] = useState<BackupField[]>([]);

  // CCP 공정 타입 정의
  const CCP_PROCESS_TYPES: CCPProcessType[] = [
    {
      id: 'oven_baking',
      name: '오븐공정_빵류',
      description: '빵류 제품의 오븐 가열 공정',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: true, order: 2 },
        { id: 'product_name', name: '제품명', type: 'text', required: true, order: 3 },
        { id: 'batch_number', name: '배치번호', type: 'text', required: true, order: 4 },
        { id: 'oven_temp', name: '오븐온도(°C)', type: 'number', required: true, order: 5 },
        { id: 'core_temp', name: '중심온도(°C)', type: 'number', required: true, order: 6 },
        { id: 'baking_time', name: '굽기시간(분)', type: 'number', required: true, order: 7 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 8 },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 9 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 10 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 11 }
      ]
    },
    {
      id: 'cream_production',
      name: '크림제조 공정',
      description: '크림 제조 및 가공 공정',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: true, order: 2 },
        { id: 'cream_type', name: '크림종류', type: 'text', required: true, order: 3 },
        { id: 'batch_number', name: '배치번호', type: 'text', required: true, order: 4 },
        { id: 'pasteurization_temp', name: '살균온도(°C)', type: 'number', required: true, order: 5 },
        { id: 'pasteurization_time', name: '살균시간(분)', type: 'number', required: true, order: 6 },
        { id: 'fat_content', name: '지방함량(%)', type: 'number', required: true, order: 7 },
        { id: 'ph_level', name: 'pH', type: 'number', required: true, order: 8 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 9 },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 10 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 11 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 12 }
      ]
    },
    {
      id: 'washing_process',
      name: '세척공정',
      description: '원료 및 기구 세척 공정',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: true, order: 2 },
        { id: 'wash_target', name: '세척대상', type: 'text', required: true, order: 3 },
        { id: 'wash_method', name: '세척방법', type: 'text', required: true, order: 4 },
        { id: 'detergent', name: '세제종류', type: 'text', required: true, order: 5 },
        { id: 'water_temp', name: '물온도(°C)', type: 'number', required: true, order: 6 },
        { id: 'wash_time', name: '세척시간(분)', type: 'number', required: true, order: 7 },
        { id: 'rinse_count', name: '헹굼횟수', type: 'number', required: true, order: 8 },
        { id: 'sanitizer', name: '소독제', type: 'text', required: false, order: 9 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 10 },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 11 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 12 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 13 }
      ]
    },
    {
      id: 'metal_detection',
      name: '금속검출공정',
      description: '제품 내 금속 이물질 검출 공정',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: true, order: 2 },
        { id: 'product_name', name: '제품명', type: 'text', required: true, order: 3 },
        { id: 'batch_number', name: '배치번호', type: 'text', required: true, order: 4 },
        { id: 'detector_model', name: '검출기모델', type: 'text', required: true, order: 5 },
        { id: 'sensitivity_fe', name: '철감도(mm)', type: 'number', required: true, order: 6 },
        { id: 'sensitivity_non_fe', name: '비철감도(mm)', type: 'number', required: true, order: 7 },
        { id: 'sensitivity_sus', name: '스테인리스감도(mm)', type: 'number', required: true, order: 8 },
        { id: 'test_result', name: '테스트결과', type: 'boolean', required: true, order: 9 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 10 },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 11 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 12 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 13 }
      ]
    },
    {
      id: 'cold_storage',
      name: '냉장보관공정',
      description: '냉장 온도에서의 제품 보관 공정',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: true, order: 2 },
        { id: 'storage_location', name: '보관위치', type: 'text', required: true, order: 3 },
        { id: 'product_name', name: '제품명', type: 'text', required: true, order: 4 },
        { id: 'storage_temp', name: '보관온도(°C)', type: 'number', required: true, order: 5 },
        { id: 'humidity', name: '습도(%)', type: 'number', required: false, order: 6 },
        { id: 'storage_duration', name: '보관기간(시간)', type: 'number', required: true, order: 7 },
        { id: 'packaging_condition', name: '포장상태', type: 'text', required: true, order: 8 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 9 },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 10 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 11 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 12 }
      ]
    }
  ];

  // 데이터 타입 정의
  const DATA_TYPES = [
    { value: 'text', label: '텍스트' },
    { value: 'number', label: '숫자' },
    { value: 'date', label: '날짜' },
    { value: 'datetime', label: '날짜/시간' },
    { value: 'boolean', label: '예/아니오' },
    { value: 'email', label: '이메일' },
    { value: 'url', label: 'URL' }
  ];

  // 초기 데이터 로드
  useEffect(() => {
    loadProcessSheets();
  }, [ccpSpreadsheetId]);

  const loadProcessSheets = async () => {
    setLoading(true);
    try {
      // 실제 환경에서는 API 호출
      // const result = await api.getCCPProcessSheets(ccpSpreadsheetId);
      
      // 모의 데이터 생성 - 기본 공정들로 초기화
      const mockSheets: CCPProcessSheet[] = CCP_PROCESS_TYPES.map((processType, index) => ({
        id: `sheet_${processType.id}`,
        processType: processType.id,
        processName: processType.name,
        sheetName: processType.name.replace(/[^\w가-힣]/g, '_'),
        spreadsheetId: ccpSpreadsheetId,
        fields: [...processType.defaultFields],
        enabled: true,
        lastModified: new Date().toISOString(),
        isConnected: false,
        lastTest: null
      }));
      
      setProcessSheets(mockSheets);
    } catch (error) {
      console.error('Failed to load CCP process sheets:', error);
      toast.error('CCP 공정 시트 데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 새 공정 시트 추가
  const handleAddProcessSheet = () => {
    const newSheet: CCPProcessSheet = {
      id: `sheet_${Date.now()}`,
      processType: '',
      processName: '',
      sheetName: '',
      spreadsheetId: ccpSpreadsheetId,
      fields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: true, order: 2 }
      ],
      enabled: true,
      lastModified: new Date().toISOString()
    };
    
    setEditingSheet(newSheet);
    setEditingFields([...newSheet.fields]);
    setShowEditDialog(true);
  };

  // 공정 시트 편집
  const handleEditProcessSheet = (sheet: CCPProcessSheet) => {
    setEditingSheet(sheet);
    setEditingFields([...sheet.fields]);
    setShowEditDialog(true);
  };

  // 공정 시트 삭제
  const handleDeleteProcessSheet = (sheetId: string) => {
    if (confirm('이 공정 시트를 삭제하시겠습니까?')) {
      setProcessSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
      toast.success('공정 시트가 삭제되었습니다');
    }
  };

  // 공정 타입 변경 시 기본 필드 로드
  const handleProcessTypeChange = (processTypeId: string) => {
    if (!editingSheet) return;
    
    const processType = CCP_PROCESS_TYPES.find(p => p.id === processTypeId);
    if (processType) {
      const updatedSheet = {
        ...editingSheet,
        processType: processTypeId,
        processName: processType.name,
        sheetName: processType.name.replace(/[^\w가-힣]/g, '_')
      };
      
      setEditingSheet(updatedSheet);
      setEditingFields([...processType.defaultFields]);
    }
  };

  // 필드 추가
  const handleAddField = () => {
    const newField: BackupField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      required: false,
      order: Math.max(...editingFields.map(f => f.order), 0) + 1
    };
    
    setEditingField(newField);
    setFieldDialogOpen(true);
  };

  // 필드 편집
  const handleEditField = (field: BackupField) => {
    setEditingField({ ...field });
    setFieldDialogOpen(true);
  };

  // 필드 삭제
  const handleDeleteField = (fieldId: string) => {
    setEditingFields(prev => prev.filter(field => field.id !== fieldId));
  };

  // 필드 순서 변경
  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = editingFields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...editingFields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
      
      // 순서 번호 재정렬
      newFields.forEach((field, index) => {
        field.order = index + 1;
      });
      
      setEditingFields(newFields);
    }
  };

  // 필드 저장
  const handleSaveField = () => {
    if (!editingField) return;
    
    if (!editingField.name.trim()) {
      toast.error('필드명을 입력해주세요');
      return;
    }
    
    const existingFieldIndex = editingFields.findIndex(f => f.id === editingField.id);
    
    if (existingFieldIndex >= 0) {
      // 기존 필드 수정
      const updatedFields = [...editingFields];
      updatedFields[existingFieldIndex] = editingField;
      setEditingFields(updatedFields);
    } else {
      // 새 필드 추가
      setEditingFields(prev => [...prev, editingField]);
    }
    
    setFieldDialogOpen(false);
    setEditingField(null);
  };

  // 공정 시트 저장
  const handleSaveProcessSheet = async () => {
    if (!editingSheet) return;
    
    if (!editingSheet.processName.trim()) {
      toast.error('공정명을 입력해주세요');
      return;
    }
    
    if (!editingSheet.sheetName.trim()) {
      toast.error('시트명을 입력해주세요');
      return;
    }
    
    if (editingFields.length === 0) {
      toast.error('최소 1개 이상의 필드가 필요합니다');
      return;
    }
    
    setLoading(true);
    try {
      const updatedSheet = {
        ...editingSheet,
        fields: editingFields.map((field, index) => ({ ...field, order: index + 1 })),
        lastModified: new Date().toISOString()
      };
      
      // 실제 환경에서는 API 호출
      // await api.saveCCPProcessSheet(updatedSheet);
      
      const existingIndex = processSheets.findIndex(s => s.id === updatedSheet.id);
      
      if (existingIndex >= 0) {
        // 기존 시트 수정
        setProcessSheets(prev => {
          const updated = [...prev];
          updated[existingIndex] = updatedSheet;
          return updated;
        });
        toast.success('공정 시트가 수정되었습니다');
      } else {
        // 새 시트 추가
        setProcessSheets(prev => [...prev, updatedSheet]);
        toast.success('새 공정 시트가 추가되었습니다');
      }
      
      setShowEditDialog(false);
      setEditingSheet(null);
      setEditingFields([]);
    } catch (error) {
      console.error('Failed to save CCP process sheet:', error);
      toast.error('공정 시트 저장 실패');
    } finally {
      setLoading(false);
    }
  };

  // 연결 테스트
  const handleTestConnection = async (sheetId: string) => {
    setLoading(true);
    try {
      // 실제 환경에서는 API 호출
      // const result = await api.testCCPSheetConnection(sheetId);
      
      // 모의 연결 테스트
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessSheets(prev => prev.map(sheet => 
        sheet.id === sheetId 
          ? { ...sheet, isConnected: true, lastTest: new Date().toISOString() }
          : sheet
      ));
      
      toast.success('연결 테스트 성공');
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('연결 테스트 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg">CCP 공정별 다중 시트 관리</h3>
          <p className="text-sm text-gray-500">
            스프레드시트 ID: {ccpSpreadsheetId}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddProcessSheet} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>새 공정 추가</span>
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            닫기
          </Button>
        </div>
      </div>

      {/* 공정 시트 목록 */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            로딩 중...
          </div>
        ) : processSheets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 CCP 공정이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>공정명</TableHead>
                <TableHead>시트명</TableHead>
                <TableHead>필드 수</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>연결 상태</TableHead>
                <TableHead>마지막 수정</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processSheets.map((sheet) => (
                <TableRow key={sheet.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>{sheet.processName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {sheet.sheetName}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sheet.fields.length}개 필드
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={sheet.enabled}
                        onCheckedChange={(enabled) => {
                          setProcessSheets(prev => prev.map(s => 
                            s.id === sheet.id ? { ...s, enabled } : s
                          ));
                        }}
                      />
                      <span className="text-sm">
                        {sheet.enabled ? '활성화' : '비활성화'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {sheet.isConnected ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          연결됨
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          미연결
                        </Badge>
                      )}
                      {sheet.lastTest && (
                        <span className="text-xs text-gray-500">
                          {new Date(sheet.lastTest).toLocaleString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(sheet.lastModified).toLocaleString('ko-KR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestConnection(sheet.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProcessSheet(sheet)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProcessSheet(sheet.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 공정 시트 편집 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingSheet?.id.startsWith('sheet_') && !processSheets.some(s => s.id === editingSheet.id)
                ? 'CCP 공정 시트 추가' 
                : 'CCP 공정 시트 편집'
              }
            </DialogTitle>
            <DialogDescription>
              CCP 공정별 백업 시트의 구조를 설정합니다.
            </DialogDescription>
          </DialogHeader>

          {editingSheet && (
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="processType">공정 타입</Label>
                  <Select 
                    value={editingSheet.processType} 
                    onValueChange={handleProcessTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="공정 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CCP_PROCESS_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="processName">공정명</Label>
                  <Input
                    id="processName"
                    value={editingSheet.processName}
                    onChange={(e) => setEditingSheet(prev => prev ? { ...prev, processName: e.target.value } : null)}
                    placeholder="공정명을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sheetName">시트명</Label>
                <Input
                  id="sheetName"
                  value={editingSheet.sheetName}
                  onChange={(e) => setEditingSheet(prev => prev ? { ...prev, sheetName: e.target.value } : null)}
                  placeholder="구글 스프레드시트의 시트명"
                />
              </div>

              <Separator />

              {/* 필드 관리 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4>백업 필드 설정</h4>
                  <Button onClick={handleAddField} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    필드 추가
                  </Button>
                </div>

                {editingFields.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed rounded">
                    필드가 없습니다. 필드를 추가해주세요.
                  </div>
                ) : (
                  <div className="border rounded overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-12">순서</TableHead>
                          <TableHead>필드명</TableHead>
                          <TableHead>타입</TableHead>
                          <TableHead>필수여부</TableHead>
                          <TableHead>기본값</TableHead>
                          <TableHead>작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editingFields
                          .sort((a, b) => a.order - b.order)
                          .map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm font-mono">{field.order}</span>
                                  <div className="flex flex-col">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveField(field.id, 'up')}
                                      disabled={index === 0}
                                      className="h-5 w-5 p-0"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveField(field.id, 'down')}
                                      disabled={index === editingFields.length - 1}
                                      className="h-5 w-5 p-0"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{field.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {DATA_TYPES.find(t => t.value === field.type)?.label || field.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {field.required ? (
                                  <Badge className="bg-red-100 text-red-800">필수</Badge>
                                ) : (
                                  <Badge variant="outline">선택</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-500">
                                  {field.defaultValue || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditField(field)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteField(field.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveProcessSheet} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 필드 편집 다이얼로그 */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField?.name ? '필드 편집' : '새 필드 추가'}
            </DialogTitle>
            <DialogDescription>
              백업 필드의 속성을 설정합니다.
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fieldName">필드명</Label>
                <Input
                  id="fieldName"
                  value={editingField.name}
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="필드명을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="fieldType">데이터 타입</Label>
                <Select 
                  value={editingField.type} 
                  onValueChange={(type) => setEditingField(prev => prev ? { ...prev, type } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="fieldRequired"
                  checked={editingField.required}
                  onCheckedChange={(required) => setEditingField(prev => prev ? { ...prev, required } : null)}
                />
                <Label htmlFor="fieldRequired">필수 필드</Label>
              </div>

              <div>
                <Label htmlFor="fieldDefault">기본값 (선택사항)</Label>
                <Input
                  id="fieldDefault"
                  value={editingField.defaultValue || ''}
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, defaultValue: e.target.value } : null)}
                  placeholder="기본값을 입력하세요"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveField}>
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}