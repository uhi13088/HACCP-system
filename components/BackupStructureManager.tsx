import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";
import { 
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  Loader2,
  X,
  Copy,
  ArrowUp,
  ArrowDown,
  Check,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner@2.0.3";

// 백업 구조 관리를 위한 인터페이스
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

interface BackupSheet {
  id: string;
  name: string;
  fields: BackupField[];
  enabled: boolean;
}

interface BackupStructure {
  id?: string;
  documentType: string;
  processType?: string; // CCP 공정 타입
  spreadsheetId: string;
  sheets: BackupSheet[]; // 단일 시트에서 복수 시트로 변경
  enabled: boolean;
  lastModified: string;
  createdBy: string;
  useDefaultSpreadsheet?: boolean;
}

// CCP 공정 타입 정의
interface CCPProcessType {
  id: string;
  name: string;
  description: string;
  defaultFields: BackupField[];
}

interface BackupStructureManagerProps {
  onStructureChange?: (structures: BackupStructure[]) => void;
}

export function BackupStructureManager({ onStructureChange }: BackupStructureManagerProps) {
  const [backupStructures, setBackupStructures] = useState<BackupStructure[]>([]);
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [editingStructure, setEditingStructure] = useState<BackupStructure | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);
  
  // 다이얼로그 상태
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedProcessType, setSelectedProcessType] = useState('');
  const [structureSheets, setStructureSheets] = useState<BackupSheet[]>([]);
  const [editingSheetIndex, setEditingSheetIndex] = useState<number | null>(null);
  const [newSheetName, setNewSheetName] = useState('');

  // 문서 타입 정의
  const DOCUMENT_TYPES = [
    { id: 'dashboard', name: '대시보드', icon: '📊', category: '메인', allowMultipleSheets: false },
    { id: 'checklist', name: '체크리스트', icon: '✅', category: '메인', allowMultipleSheets: false },
    { id: 'ccp', name: 'CCP 관리', icon: '🛡️', category: '메인', allowMultipleSheets: true },
    { id: 'monitoring', name: '환경 모니터링', icon: '🌡️', category: '메인', allowMultipleSheets: false },
    { id: 'analysis', name: '위험 분석', icon: '📝', category: '메인', allowMultipleSheets: false },
    { id: 'production-log', name: '생산일지', icon: '📅', category: '일간문서', allowMultipleSheets: false },
    { id: 'temperature-log', name: '냉장냉동고 온도기록부', icon: '❄️', category: '일간문서', allowMultipleSheets: false },
    { id: 'cleaning-log', name: '세척·소독 기록부', icon: '💧', category: '일간문서', allowMultipleSheets: false },
    { id: 'receiving-log', name: '원료입고 검수기록부', icon: '📦', category: '일간문서', allowMultipleSheets: false },
    { id: 'pest-control', name: '방충·방서 주간점검표', icon: '🐛', category: '주간문서', allowMultipleSheets: false },
    { id: 'facility-inspection', name: '시설점검 주간체크리스트', icon: '🏢', category: '주간문서', allowMultipleSheets: false },
    { id: 'training-record', name: '교육훈련 기록부', icon: '🎓', category: '월간문서', allowMultipleSheets: false },
    { id: 'visitor-log', name: '외부인출입관리대장', icon: '👥', category: '각종문서', allowMultipleSheets: false },
    { id: 'accident-report', name: '사고보고서', icon: '⚠️', category: '각종문서', allowMultipleSheets: false },
    { id: 'supplier', name: '공급업체 관리', icon: '🚚', category: '각종문서', allowMultipleSheets: false },
  ];

  // CCP 공정 타입 정의
  const CCP_PROCESS_TYPES: CCPProcessType[] = [
    {
      id: 'oven_bread',
      name: '오븐공정_빵류',
      description: '빵류 제품의 오븐 공정 CCP 관리',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: false, order: 2 },
        { id: 'product_name', name: '제품명', type: 'text', required: true, order: 3 },
        { id: 'batch_number', name: '배치번호', type: 'text', required: true, order: 4 },
        { id: 'oven_temp', name: '오븐온도(°C)', type: 'number', required: true, order: 5 },
        { id: 'core_temp', name: '중심온도(°C)', type: 'number', required: true, order: 6 },
        { id: 'baking_time', name: '굽는시간(분)', type: 'number', required: true, order: 7 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 8, defaultValue: '중심온도 75°C 이상' },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 9 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 10 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 11 }
      ]
    },
    {
      id: 'cream_production',
      name: '크림제조 공정',
      description: '크림류 제품의 제조 공정 CCP 관리',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: false, order: 2 },
        { id: 'cream_type', name: '크림종류', type: 'text', required: true, order: 3 },
        { id: 'batch_number', name: '배치번호', type: 'text', required: true, order: 4 },
        { id: 'pasteurization_temp', name: '살균온도(°C)', type: 'number', required: true, order: 5 },
        { id: 'pasteurization_time', name: '살균시간(분)', type: 'number', required: true, order: 6 },
        { id: 'cooling_temp', name: '냉각온도(°C)', type: 'number', required: true, order: 7 },
        { id: 'ph_level', name: 'pH값', type: 'number', required: true, order: 8 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 9, defaultValue: '살균: 85°C 15초, pH 4.0-6.5' },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 10 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 11 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 12 }
      ]
    },
    {
      id: 'cleaning_process',
      name: '세척공정',
      description: '장비 및 시설의 세척 공정 CCP 관리',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: false, order: 2 },
        { id: 'equipment_name', name: '설비명', type: 'text', required: true, order: 3 },
        { id: 'cleaning_agent', name: '세척제', type: 'text', required: true, order: 4 },
        { id: 'concentration', name: '농도(%)', type: 'number', required: true, order: 5 },
        { id: 'water_temp', name: '세척수온도(°C)', type: 'number', required: true, order: 6 },
        { id: 'contact_time', name: '접촉시간(분)', type: 'number', required: true, order: 7 },
        { id: 'rinse_cycles', name: '헹굼횟수', type: 'number', required: true, order: 8 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 9, defaultValue: '염소계: 200ppm, 접촉시간 2분 이상' },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 10 },
        { id: 'verification_method', name: '검증방법', type: 'text', required: false, order: 11 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 12 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 13 }
      ]
    },
    {
      id: 'metal_detection',
      name: '금속검출공정',
      description: '완제품의 금속 이물질 검출 CCP 관리',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: false, order: 2 },
        { id: 'product_name', name: '제품명', type: 'text', required: true, order: 3 },
        { id: 'lot_number', name: '로트번호', type: 'text', required: true, order: 4 },
        { id: 'detector_model', name: '검출기모델', type: 'text', required: true, order: 5 },
        { id: 'sensitivity_fe', name: '철 감도(mm)', type: 'number', required: true, order: 6 },
        { id: 'sensitivity_sus', name: '스테인리스 감도(mm)', type: 'number', required: true, order: 7 },
        { id: 'test_piece_result', name: '테스트피스 결과', type: 'boolean', required: true, order: 8 },
        { id: 'detection_result', name: '검출결과', type: 'boolean', required: true, order: 9 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 10, defaultValue: '철: 1.5mm, 스테인리스: 2.0mm' },
        { id: 'reject_action', name: '배제조치', type: 'text', required: false, order: 11 },
        { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 12 },
        { id: 'inspector', name: '점검자', type: 'text', required: true, order: 13 }
      ]
    },
    {
      id: 'refrigeration',
      name: '냉장보관공정',
      description: '완제품 및 원료의 냉장보관 CCP 관리',
      defaultFields: [
        { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
        { id: 'time', name: '시간', type: 'datetime', required: false, order: 2 },
        { id: 'storage_area', name: '보관구역', type: 'text', required: true, order: 3 },
        { id: 'product_type', name: '제품/원료명', type: 'text', required: true, order: 4 },
        { id: 'current_temp', name: '현재온도(°C)', type: 'number', required: true, order: 5 },
        { id: 'humidity', name: '습도(%)', type: 'number', required: false, order: 6 },
        { id: 'storage_duration', name: '보관기간', type: 'text', required: true, order: 7 },
        { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 8, defaultValue: '0-4°C, 상대습도 85% 이하' },
        { id: 'result', name: '적합성', type: 'boolean', required: true, order: 9 },
        { id: 'alarm_status', name: '알람상태', type: 'boolean', required: false, order: 10 },
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

  // 기본 필드 템플릿
  const getDefaultFields = (documentType: string): BackupField[] => {
    const baseFields = [
      { id: 'date', name: '날짜', type: 'date', required: true, order: 1 },
      { id: 'time', name: '시간', type: 'datetime', required: false, order: 2 }
    ];

    switch (documentType) {
      case 'ccp':
        return [...baseFields,
          { id: 'ccp_number', name: 'CCP 번호', type: 'text', required: true, order: 3 },
          { id: 'process', name: '공정명', type: 'text', required: true, order: 4 },
          { id: 'temperature', name: '온도(°C)', type: 'number', required: true, order: 5 },
          { id: 'critical_limit', name: '한계기준', type: 'text', required: true, order: 6 },
          { id: 'result', name: '적합성', type: 'boolean', required: true, order: 7 },
          { id: 'corrective_action', name: '개선조치', type: 'text', required: false, order: 8 },
          { id: 'inspector', name: '점검자', type: 'text', required: true, order: 9 }
        ];
      case 'checklist':
        return [...baseFields,
          { id: 'category', name: '카테고리', type: 'text', required: true, order: 3 },
          { id: 'item', name: '점검항목', type: 'text', required: true, order: 4 },
          { id: 'result', name: '점검결과', type: 'boolean', required: true, order: 5 },
          { id: 'note', name: '비고', type: 'text', required: false, order: 6 },
          { id: 'inspector', name: '점검자', type: 'text', required: true, order: 7 }
        ];
      default:
        return [...baseFields,
          { id: 'value', name: '값', type: 'text', required: true, order: 3 },
          { id: 'note', name: '비고', type: 'text', required: false, order: 4 }
        ];
    }
  };

  // 초기 백업 구조 로드
  useEffect(() => {
    loadBackupStructures();
  }, []);

  const loadBackupStructures = async () => {
    try {
      // 예시 데이터 로드 (실제로는 API 호출)
      const mockStructures: BackupStructure[] = [
        {
          id: '1',
          documentType: 'checklist',
          spreadsheetId: '',
          sheets: [
            {
              id: 'sheet1',
              name: '체크리스트',
              fields: getDefaultFields('checklist'),
              enabled: true
            }
          ],
          enabled: true,
          lastModified: new Date().toISOString(),
          createdBy: 'admin@company.com'
        }
      ];
      setBackupStructures(mockStructures);
      onStructureChange?.(mockStructures);
    } catch (error) {
      console.error('Failed to load backup structures:', error);
    }
  };

  // 다이얼로그 열기
  const handleCreateStructure = () => {
    setEditingStructure(null);
    setSelectedDocumentType('');
    setSelectedProcessType('');
    setStructureSheets([]);
    setNewSheetName('');
    setShowStructureDialog(true);
  };

  const handleEditStructure = (structure: BackupStructure) => {
    setEditingStructure(structure);
    setSelectedDocumentType(structure.documentType);
    setSelectedProcessType(structure.processType || '');
    setStructureSheets([...structure.sheets]);
    setShowStructureDialog(true);
  };

  // 문서 타입 변경 시
  const handleDocumentTypeChange = (documentType: string) => {
    setSelectedDocumentType(documentType);
    setSelectedProcessType('');
    
    const docType = DOCUMENT_TYPES.find(d => d.id === documentType);
    
    if (documentType === 'ccp') {
      // CCP의 경우 기본 시트를 하나 추가
      setStructureSheets([
        {
          id: 'default',
          name: 'CCP 관리',
          fields: getDefaultFields('ccp'),
          enabled: true
        }
      ]);
    } else {
      // 다른 문서 타입의 경우 기본 시트 하나만
      setStructureSheets([
        {
          id: 'default',
          name: docType?.name || documentType,
          fields: getDefaultFields(documentType),
          enabled: true
        }
      ]);
    }
  };

  // CCP 공정별 시트 추가
  const handleAddCCPProcessSheet = () => {
    if (!selectedProcessType) {
      toast.error('공정 타입을 선택해주세요.');
      return;
    }

    const processType = CCP_PROCESS_TYPES.find(p => p.id === selectedProcessType);
    if (!processType) return;

    // 이미 같은 공정의 시트가 있는지 확인
    const existingSheet = structureSheets.find(sheet => 
      sheet.name === processType.name
    );

    if (existingSheet) {
      toast.error('이미 해당 공정의 시트가 존재합니다.');
      return;
    }

    const newSheet: BackupSheet = {
      id: `sheet_${Date.now()}`,
      name: processType.name,
      fields: processType.defaultFields,
      enabled: true
    };

    setStructureSheets(prev => [...prev, newSheet]);
    setSelectedProcessType('');
    toast.success(`${processType.name} 시트가 추가되었습니다.`);
  };

  // 일반 시트 추가
  const handleAddGeneralSheet = () => {
    if (!newSheetName.trim()) {
      toast.error('시트 이름을 입력해주세요.');
      return;
    }

    // 이미 같은 이름의 시트가 있는지 확인
    const existingSheet = structureSheets.find(sheet => 
      sheet.name === newSheetName.trim()
    );

    if (existingSheet) {
      toast.error('이미 같은 이름의 시트가 존재합니다.');
      return;
    }

    const newSheet: BackupSheet = {
      id: `sheet_${Date.now()}`,
      name: newSheetName.trim(),
      fields: getDefaultFields(selectedDocumentType),
      enabled: true
    };

    setStructureSheets(prev => [...prev, newSheet]);
    setNewSheetName('');
    toast.success(`${newSheetName} 시트가 추가되었습니다.`);
  };

  // 시트 삭제
  const handleDeleteSheet = (sheetId: string) => {
    if (structureSheets.length <= 1) {
      toast.error('최소 하나의 시트는 필요합니다.');
      return;
    }

    setStructureSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
    toast.success('시트가 삭제되었습니다.');
  };

  // 시트 복제
  const handleDuplicateSheet = (sheetId: string) => {
    const sourceSheet = structureSheets.find(sheet => sheet.id === sheetId);
    if (!sourceSheet) return;

    const newSheet: BackupSheet = {
      id: `sheet_${Date.now()}`,
      name: `${sourceSheet.name} (복사본)`,
      fields: [...sourceSheet.fields],
      enabled: true
    };

    setStructureSheets(prev => [...prev, newSheet]);
    toast.success('시트가 복제되었습니다.');
  };

  // 백업 구조 저장
  const handleSaveStructure = async () => {
    if (!selectedDocumentType) {
      toast.error('문서 타입을 선택해주세요.');
      return;
    }

    if (structureSheets.length === 0) {
      toast.error('최소 하나의 시트가 필요합니다.');
      return;
    }

    setStructureLoading(true);
    try {
      const newStructure: BackupStructure = {
        id: editingStructure?.id || `structure_${Date.now()}`,
        documentType: selectedDocumentType,
        processType: selectedProcessType || undefined,
        spreadsheetId: '',
        sheets: structureSheets,
        enabled: true,
        lastModified: new Date().toISOString(),
        createdBy: 'admin@company.com'
      };

      if (editingStructure) {
        setBackupStructures(prev => 
          prev.map(s => s.id === editingStructure.id ? newStructure : s)
        );
        toast.success('백업 구조가 수정되었습니다.');
      } else {
        setBackupStructures(prev => [...prev, newStructure]);
        toast.success('백업 구조가 생성되었습니다.');
      }

      setShowStructureDialog(false);
      onStructureChange?.(backupStructures);
    } catch (error) {
      console.error('Error saving structure:', error);
      toast.error('백업 구조 저장 중 오류가 발생했습니다.');
    } finally {
      setStructureLoading(false);
    }
  };

  // 백업 구조 삭제
  const handleDeleteStructure = async (structureId: string) => {
    try {
      setBackupStructures(prev => prev.filter(s => s.id !== structureId));
      toast.success('백업 구조가 삭제되었습니다.');
      onStructureChange?.(backupStructures);
    } catch (error) {
      console.error('Error deleting structure:', error);
      toast.error('백업 구조 삭제 중 오류가 발생했습니다.');
    }
  };

  const selectedDocType = DOCUMENT_TYPES.find(d => d.id === selectedDocumentType);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3>백업 구조 관리</h3>
            <p className="text-sm text-muted-foreground mt-1">
              각 문서 타입별 백업 구조와 시트를 관리합니다. CCP 관리는 공정별로 여러 시트를 설정할 수 있습니다.
            </p>
          </div>
          <Button onClick={handleCreateStructure} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            새 구조 추가
          </Button>
        </div>

        <div className="space-y-4">
          {backupStructures.map((structure) => (
            <Card key={structure.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {DOCUMENT_TYPES.find(t => t.id === structure.documentType)?.icon || '📄'}
                    </span>
                    <div>
                      <p className="font-medium">
                        {DOCUMENT_TYPES.find(t => t.id === structure.documentType)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        시트 {structure.sheets.length}개 • 마지막 수정: {new Date(structure.lastModified).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {structure.sheets.map((sheet) => (
                      <Badge key={sheet.id} variant="outline" className="text-xs">
                        {sheet.name} ({sheet.fields.length}필드)
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditStructure(structure)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => structure.id && handleDeleteStructure(structure.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {backupStructures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>백업 구조가 없습니다.</p>
              <p className="text-sm">새 구조를 추가하여 시작하세요.</p>
            </div>
          )}
        </div>
      </Card>

      {/* 백업 구조 다이얼로그 */}
      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStructure ? '백업 구조 수정' : '새 백업 구조 생성'}
            </DialogTitle>
            <DialogDescription>
              문서 타입별 백업 구조를 설정하고 필요한 시트를 추가하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 문서 타입 선택 */}
            <div className="space-y-2">
              <Label htmlFor="documentType">문서 타입</Label>
              <Select 
                value={selectedDocumentType} 
                onValueChange={handleDocumentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="문서 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    DOCUMENT_TYPES.reduce((acc, doc) => {
                      if (!acc[doc.category]) acc[doc.category] = [];
                      acc[doc.category].push(doc);
                      return acc;
                    }, {} as Record<string, typeof DOCUMENT_TYPES[0][]>)
                  ).map(([category, docs]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                        {category}
                      </div>
                      {docs.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center space-x-2">
                            <span>{doc.icon}</span>
                            <span>{doc.name}</span>
                            {doc.allowMultipleSheets && (
                              <Badge variant="secondary" className="text-xs">
                                다중시트
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 시트 관리 */}
            {selectedDocumentType && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4>시트 구성</h4>
                  <div className="flex items-center space-x-2">
                    {selectedDocType?.allowMultipleSheets && (
                      <>
                        {/* CCP 공정별 시트 추가 */}
                        {selectedDocumentType === 'ccp' && (
                          <div className="flex items-center space-x-2">
                            <Select 
                              value={selectedProcessType} 
                              onValueChange={setSelectedProcessType}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="CCP 공정 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {CCP_PROCESS_TYPES.map((process) => (
                                  <SelectItem key={process.id} value={process.id}>
                                    <div>
                                      <p className="font-medium">{process.name}</p>
                                      <p className="text-sm text-muted-foreground">{process.description}</p>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              onClick={handleAddCCPProcessSheet}
                              size="sm"
                              disabled={!selectedProcessType}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              공정 추가
                            </Button>
                          </div>
                        )}
                        
                        {/* 일반 시트 추가 */}
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="시트 이름"
                            value={newSheetName}
                            onChange={(e) => setNewSheetName(e.target.value)}
                            className="w-32"
                          />
                          <Button 
                            onClick={handleAddGeneralSheet}
                            size="sm"
                            disabled={!newSheetName.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            시트 추가
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 시트 목록 */}
                <div className="space-y-3">
                  {structureSheets.map((sheet, index) => (
                    <Card key={sheet.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{sheet.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {sheet.fields.length}개 필드 • {sheet.enabled ? '활성화' : '비활성화'}
                              </p>
                            </div>
                          </div>
                          
                          {/* 필드 미리보기 */}
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {sheet.fields.slice(0, 6).map((field) => (
                              <div key={field.id} className="flex items-center space-x-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${field.required ? 'bg-red-400' : 'bg-gray-300'}`} />
                                <span>{field.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {DATA_TYPES.find(t => t.value === field.type)?.label}
                                </Badge>
                              </div>
                            ))}
                            {sheet.fields.length > 6 && (
                              <div className="text-xs text-muted-foreground">
                                +{sheet.fields.length - 6}개 더
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDuplicateSheet(sheet.id)}
                            title="시트 복제"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {structureSheets.length > 1 && (
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteSheet(sheet.id)}
                              title="시트 삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {structureSheets.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>시트가 없습니다.</p>
                    <p className="text-sm">위에서 시트를 추가하세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStructureDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSaveStructure} 
              disabled={structureLoading || !selectedDocumentType || structureSheets.length === 0}
            >
              {structureLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStructure ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}