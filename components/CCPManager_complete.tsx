import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { SignaturePad } from "./SignaturePad";
import { toast } from "sonner@2.0.3";
import { 
  Shield, 
  AlertTriangle, 
  Eye,
  Plus,
  Edit,
  Save,
  Search,
  Trash2,
  RefreshCw,
  List
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

// CCP 타입별 필드 정의
interface CCPFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'datetime-local' | 'select' | 'checkbox' | 'time';
  required?: boolean;
  options?: string[];
  unit?: string;
}

interface CCPTypeConfig {
  id: string;
  name: string;
  fields: CCPFieldConfig[];
  description: string;
}

// CCP 타입별 설정
const CCP_TYPES: CCPTypeConfig[] = [
  {
    id: 'oven_bread',
    name: '오븐공정_빵류',
    description: '빵류 제품의 오븐 가열 공정 관리',
    fields: [
      { key: 'productName', label: '품명', type: 'text', required: true },
      { key: 'measureTime', label: '측정시각', type: 'datetime-local', required: true },
      { key: 'heatingTemp', label: '가열온도', type: 'number', required: true, unit: '°C' },
      { key: 'heatingTime', label: '가열시간', type: 'number', required: true, unit: '분' },
      { key: 'productTempAfter', label: '가열 후 품온', type: 'number', required: true, unit: '°C' },
      { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
      { key: 'signature', label: '서명', type: 'text', required: true }
    ]
  },
  {
    id: 'cream_manufacturing',
    name: '크림제조 공정',
    description: '크림류 제품의 제조 및 품질 관리',
    fields: [
      { key: 'productName', label: '품명', type: 'text', required: true },
      { key: 'mixingTime', label: '배합시간', type: 'time', required: true },
      { key: 'mixingAmount', label: '배합량', type: 'number', required: true, unit: 'kg' },
      { key: 'tempAfterManufacture', label: '품온(제조직후)', type: 'number', required: true, unit: '°C' },
      { key: 'tempBeforeConsume', label: '품온(소진직전)', type: 'number', required: true, unit: '°C' },
      { key: 'consumeTime', label: '소진시간', type: 'time', required: true },
      { key: 'workplaceTemp', label: '작업장온도', type: 'number', required: true, unit: '°C' },
      { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
      { key: 'signature', label: '서명', type: 'text', required: true }
    ]
  },
  {
    id: 'washing_process',
    name: '세척공정',
    description: '용기 및 기구의 세척 및 위생 관리',
    fields: [
      { key: 'productName', label: '품명', type: 'text', required: true },
      { key: 'measureTime', label: '측정시각', type: 'datetime-local', required: true },
      { key: 'materialAmount', label: '원료량', type: 'number', required: true, unit: 'kg' },
      { key: 'washWaterAmount', label: '세척수량', type: 'number', required: true, unit: 'L' },
      { key: 'washTime', label: '세척시간', type: 'number', required: true, unit: '분' },
      { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
      { key: 'signature', label: '서명', type: 'text', required: true }
    ]
  },
  {
    id: 'metal_detection',
    name: '금속검출공정',
    description: '완제품의 금속 이물질 검출 및 제거',
    fields: [
      { key: 'productName', label: '품명', type: 'text', required: true },
      { key: 'passTime', label: '통과시간', type: 'datetime-local', required: true },
      { key: 'feOnly', label: 'Fe만통과', type: 'checkbox' },
      { key: 'susOnly', label: 'Sus만 통과', type: 'checkbox' },
      { key: 'productOnly', label: '제품만 통과', type: 'checkbox' },
      { key: 'feWithProduct', label: 'Fe+제품통과', type: 'checkbox' },
      { key: 'susWithProduct', label: 'Sus+제품통과', type: 'checkbox' },
      { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
      { key: 'signature', label: '서명', type: 'text', required: true }
    ]
  }
];

interface CCPRecord {
  id: number;
  timestamp: string;
  ccpType: string;
  data: Record<string, any>;
  status: 'normal' | 'warning' | 'critical';
  operator: string;
}

interface CCP {
  id: string;
  name: string;
  process: string;
  ccpType: string;
  hazard: string;
  criticalLimit: { min: number; max: number };
  unit: string;
  monitoringMethod: string;
  frequency: string;
  currentValue: number;
  status: 'normal' | 'warning' | 'critical';
  lastChecked: string;
  records: CCPRecord[];
}

export function CCPManager() {
  const { user, hasRole } = useAuth();
  const [ccps, setCCPs] = useState<CCP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCCP, setSelectedCCP] = useState<CCP | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [recordFormData, setRecordFormData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMode, setAdminMode] = useState(false);

  // 관리자 모드 상태들
  const [showNewCCPDialog, setShowNewCCPDialog] = useState(false);
  const [showEditCCPDialog, setShowEditCCPDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ccpToDelete, setCCPToDelete] = useState<CCP | null>(null);
  const [ccpToEdit, setCCPToEdit] = useState<CCP | null>(null);

  // 폼 상태들
  const [newCCPForm, setNewCCPForm] = useState({
    id: '',
    name: '',
    process: '',
    ccpType: '',
    hazard: '',
    criticalLimit: { min: 0, max: 0 },
    unit: '',
    monitoringMethod: '',
    frequency: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    process: '',
    ccpType: '',
    hazard: '',
    criticalLimit: { min: 0, max: 0 },
    unit: '',
    monitoringMethod: '',
    frequency: ''
  });

  // 초기 CCP 데이터
  const initializeCCPs = (): CCP[] => {
    const now = new Date();
    
    return [
      {
        id: 'CCP-1B-1',
        name: 'CCP-1B [오븐(굽기)공정-과자]',
        process: '과자류 오븐 굽기',
        ccpType: 'oven_bread',
        hazard: '병원성 미생물 생존',
        criticalLimit: { min: 180, max: 220 },
        unit: '°C',
        monitoringMethod: '적외선 온도계를 이용하여 오븐 내부 온도를 측정하고, 제품 중심부 온도를 확인합니다. 설정 온도와 실제 온도의 차이가 ±5°C 이내인지 확인하며, 온도 기록지에 시간별로 기록합니다.',
        frequency: '30분마다',
        currentValue: 200,
        status: 'normal',
        lastChecked: new Date(now.getTime() - 15 * 60000).toISOString(),
        records: []
      },
      {
        id: 'CCP-1B-2',
        name: 'CCP-1B [오븐(굽기)공정-빵류]',
        process: '빵류 오븐 굽기',
        ccpType: 'oven_bread',
        hazard: '병원성 미생물 생존',
        criticalLimit: { min: 200, max: 240 },
        unit: '°C',
        monitoringMethod: '디지털 온도계를 이용하여 오븐의 온도를 실시간으로 모니터링하고, 빵 내부 온도가 충분히 상승했는지 확인합니다. 온도 기록은 자동화 시스템을 통해 기록되며, 이상 온도 감지시 즉시 알림이 발생합니다.',
        frequency: '30분마다',
        currentValue: 220,
        status: 'normal',
        lastChecked: new Date(now.getTime() - 25 * 60000).toISOString(),
        records: []
      },
      {
        id: 'CCP-2B',
        name: 'CCP-2B [크림제조(휘핑)공정]',
        process: '크림 휘핑 제조',
        ccpType: 'cream_manufacturing',
        hazard: '병원성 미생물 증식',
        criticalLimit: { min: 2, max: 8 },
        unit: '°C',
        monitoringMethod: '냉장실 온도계와 제품 내부 온도계를 이용하여 크림 제조 전후의 온도를 측정합니다. 제조 환경의 온도와 습도도 함께 모니터링하며, 모든 데이터는 실시간으로 기록 시스템에 저장됩니다.',
        frequency: '1시간마다',
        currentValue: 4,
        status: 'normal',
        lastChecked: new Date(now.getTime() - 45 * 60000).toISOString(),
        records: []
      },
      {
        id: 'CCP-4B',
        name: 'CCP-4B [세척공정]',
        process: '용기 및 기구 세척',
        ccpType: 'washing_process',
        hazard: '화학적 위해요소 잔류',
        criticalLimit: { min: 200, max: 500 },
        unit: 'ppm',
        monitoringMethod: '염소 테스트 스트립을 이용하여 세척수의 염소 농도를 측정하고, pH 미터로 세척수의 pH를 확인합니다. 세척 후 잔류 세제 여부는 TDS 미터로 측정하며, 모든 결과는 세척 기록지에 작성합니다.',
        frequency: '세척시마다',
        currentValue: 350,
        status: 'normal',
        lastChecked: new Date(now.getTime() - 30 * 60000).toISOString(),
        records: []
      },
      {
        id: 'CCP-5P',
        name: 'CCP-5P [금속검출공정]',
        process: '완제품 금속검출',
        ccpType: 'metal_detection',
        hazard: '물리적 위해요소 (금속이물)',
        criticalLimit: { min: 0, max: 0 },
        unit: 'mm',
        monitoringMethod: '금속검출기의 감도를 매일 테스트 샘플(Fe 1.5mm, SUS 2.0mm)로 점검하고, 모든 제품이 금속검출기를 통과하도록 합니다. 검출기 이상시 즉시 생산을 중단하고 점검 후 재가동하며, 모든 검사 결과는 자동으로 기록됩니다.',
        frequency: '제품별 전수검사',
        currentValue: 0,
        status: 'normal',
        lastChecked: new Date(now.getTime() - 10 * 60000).toISOString(),
        records: []
      }
    ];
  };

  // CCP 타입별 설정 가져오기
  const getCCPTypeConfig = (ccpType: string): CCPTypeConfig | undefined => {
    return CCP_TYPES.find(type => type.id === ccpType);
  };

  // 데이터 로드
  const loadCCPs = async () => {
    try {
      setLoading(true);
      const response = await api.getCCPs();
      
      if (response.success && response.data) {
        setCCPs(response.data);
      } else {
        const initialCCPs = initializeCCPs();
        setCCPs(initialCCPs);
      }
    } catch (error) {
      console.error('Failed to load CCPs:', error);
      const initialCCPs = initializeCCPs();
      setCCPs(initialCCPs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCCPs();
  }, []);

  // 기록 폼 초기화
  const initializeRecordForm = (ccpType: string) => {
    const typeConfig = getCCPTypeConfig(ccpType);
    if (!typeConfig) return;

    const initialData: Record<string, any> = {};
    typeConfig.fields.forEach(field => {
      if (field.key === 'signature') {
        initialData[field.key] = ''; // 서명패드는 빈 값으로 시작
      } else if (field.key === 'measureTime' || field.key === 'passTime') {
        // 현재 시간을 기본값으로 설정
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        initialData[field.key] = `${year}-${month}-${day}T${hours}:${minutes}`;
      } else if (field.type === 'checkbox') {
        initialData[field.key] = false;
      } else {
        initialData[field.key] = '';
      }
    });
    
    setRecordFormData(initialData);
  };

  // 필드 값 업데이트
  const updateFieldValue = (key: string, value: any) => {
    setRecordFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 기록 추가 버튼 핸들러
  const handleAddRecord = (ccp: CCP) => {
    setSelectedCCP(ccp);
    initializeRecordForm(ccp.ccpType);
    setShowRecordDialog(true);
  };

  // 기록 추가
  const addRecord = async () => {
    if (!selectedCCP) return;

    const typeConfig = getCCPTypeConfig(selectedCCP.ccpType);
    if (!typeConfig) return;

    // 필수 필드 검증
    const requiredFields = typeConfig.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => 
      !recordFormData[field.key] || recordFormData[field.key] === ''
    );

    if (missingFields.length > 0) {
      toast.error('필수 필드를 입력해주세요.', {
        description: `다음 항목이 필요합니다: ${missingFields.map(f => f.label).join(', ')}`,
        duration: 4000,
      });
      return;
    }

    const newRecord: CCPRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ccpType: selectedCCP.ccpType,
      data: { ...recordFormData },
      status: 'normal',
      operator: user?.name || '알 수 없음'
    };

    try {
      await api.addCCPRecord(selectedCCP.id, newRecord);

      // 로컬 상태 업데이트
      setCCPs(prev => prev.map(ccp => 
        ccp.id === selectedCCP.id 
          ? { ...ccp, records: [...ccp.records, newRecord] }
          : ccp
      ));

      // 선택된 CCP 업데이트 (상세보기가 열려있는 경우)
      if (selectedCCP) {
        setSelectedCCP(prev => prev ? {
          ...prev,
          records: [...prev.records, newRecord]
        } : null);
      }

      setShowRecordDialog(false);
      setRecordFormData({});
      toast.success('기록이 성공적으로 추가되었습니다.', {
        description: `${selectedCCP.name}에 새 기록이 저장되었습니다.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to add record:', error);
      // 에러 발생시에도 로컬에는 추가
      setCCPs(prev => prev.map(ccp => 
        ccp.id === selectedCCP.id 
          ? { ...ccp, records: [...ccp.records, newRecord] }
          : ccp
      ));
      
      if (selectedCCP) {
        setSelectedCCP(prev => prev ? {
          ...prev,
          records: [...prev.records, newRecord]
        } : null);
      }

      setShowRecordDialog(false);
      setRecordFormData({});
      toast.success('기록이 추가되었습니다.', {
        description: `${selectedCCP.name}에 새 기록이 로컬에 저장되었습니다.`,
        duration: 3000,
      });
    }
  };

  // 필터링된 CCP 목록
  const filteredCCPs = ccps.filter(ccp =>
    ccp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ccp.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ccp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CCP 추가
  const addCCP = async () => {
    if (!newCCPForm.id || !newCCPForm.name || !newCCPForm.ccpType) {
      toast.error('필수 필드를 모두 입력해주세요.', {
        description: 'CCP ID, CCP 명, CCP 타입은 필수 입력 항목입니다.',
        duration: 4000,
      });
      return;
    }

    const newCCP: CCP = {
      id: newCCPForm.id,
      name: newCCPForm.name,
      process: newCCPForm.process,
      ccpType: newCCPForm.ccpType,
      hazard: newCCPForm.hazard,
      criticalLimit: newCCPForm.criticalLimit,
      unit: newCCPForm.unit,
      monitoringMethod: newCCPForm.monitoringMethod,
      frequency: newCCPForm.frequency,
      currentValue: 0,
      status: 'normal',
      lastChecked: new Date().toISOString(),
      records: []
    };

    try {
      await api.addCCP(newCCP);
      setCCPs(prev => [...prev, newCCP]);
      setShowNewCCPDialog(false);
      setNewCCPForm({
        id: '',
        name: '',
        process: '',
        ccpType: '',
        hazard: '',
        criticalLimit: { min: 0, max: 0 },
        unit: '',
        monitoringMethod: '',
        frequency: ''
      });
      toast.success('새 CCP가 추가되었습니다.', {
        description: `${newCCP.name}이(가) 성공적으로 추가되었습니다.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to add CCP:', error);
      setCCPs(prev => [...prev, newCCP]);
      setShowNewCCPDialog(false);
      toast.success('CCP가 추가되었습니다.', {
        description: `${newCCP.name}이(가) 로컬에 저장되었습니다.`,
        duration: 3000,
      });
    }
  };

  // CCP 수정
  const updateCCP = async () => {
    if (!ccpToEdit) return;

    // 관리자가 아닌 경우 CCP 타입 변경 불가
    if (!hasRole('admin') && editForm.ccpType !== ccpToEdit.ccpType) {
      toast.error('권한이 없습니다.', {
        description: '관리자만 CCP 타입을 변경할 수 있습니다.',
        duration: 4000,
      });
      return;
    }

    const updatedCCP: CCP = {
      ...ccpToEdit,
      name: editForm.name,
      process: editForm.process,
      ccpType: editForm.ccpType,
      hazard: editForm.hazard,
      criticalLimit: editForm.criticalLimit,
      unit: editForm.unit,
      monitoringMethod: editForm.monitoringMethod,
      frequency: editForm.frequency
    };

    try {
      await api.updateCCP(ccpToEdit.id, updatedCCP);
      setCCPs(prev => prev.map(ccp => ccp.id === ccpToEdit.id ? updatedCCP : ccp));
      setShowEditCCPDialog(false);
      setCCPToEdit(null);
      toast.success('CCP가 수정되었습니다.', {
        description: `${updatedCCP.name}의 정보가 업데이트되었습니다.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to update CCP:', error);
      setCCPs(prev => prev.map(ccp => ccp.id === ccpToEdit.id ? updatedCCP : ccp));
      setShowEditCCPDialog(false);
      toast.success('CCP가 수정되었습니다.', {
        description: `${updatedCCP.name}의 정보가 로컬에서 업데이트되었습니다.`,
        duration: 3000,
      });
    }
  };

  // CCP 삭제
  const deleteCCP = async () => {
    if (!ccpToDelete) return;

    try {
      await api.deleteCCP(ccpToDelete.id);
      setCCPs(prev => prev.filter(ccp => ccp.id !== ccpToDelete.id));
      setShowDeleteDialog(false);
      setCCPToDelete(null);
      toast.success('CCP가 삭제되었습니다.', {
        description: `${ccpToDelete.name}이(가) 성공적으로 삭제되었습니다.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to delete CCP:', error);
      setCCPs(prev => prev.filter(ccp => ccp.id !== ccpToDelete.id));
      setShowDeleteDialog(false);
      toast.success('CCP가 삭제되었습니다.', {
        description: `${ccpToDelete.name}이(가) 로컬에서 삭제되었습니다.`,
        duration: 3000,
      });
    }
  };

  // 필드 입력 렌더링 (서명패드 포함)
  const renderFieldInput = (field: CCPFieldConfig) => {
    const value = recordFormData[field.key] || '';

    // 서명 필드인 경우 SignaturePad 사용
    if (field.key === 'signature') {
      return (
        <div className="col-span-2">
          <SignaturePad
            value={value}
            onChange={(signature) => updateFieldValue(field.key, signature)}
            width={400}
            height={200}
            label=""
            required={field.required}
          />
        </div>
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            placeholder={`${field.label}을(를) 입력하세요`}
            required={field.required}
          />
        );

      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              placeholder="숫자 입력"
              required={field.required}
              className="flex-1"
            />
            {field.unit && (
              <span className="text-sm text-gray-500 whitespace-nowrap">{field.unit}</span>
            )}
          </div>
        );

      case 'datetime-local':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            required={field.required}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            required={field.required}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => updateFieldValue(field.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => updateFieldValue(field.key, checked)}
            />
            <Label className="text-sm">예</Label>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>CCP 데이터를 로드하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">CCP 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            중요 관리점(Critical Control Point) 모니터링 및 기록 관리
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="CCP 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* 관리자 모드 토글 */}
          {hasRole('admin') && (
            <div className="flex items-center space-x-2">
              <Switch 
                checked={adminMode} 
                onCheckedChange={setAdminMode}
              />
              <Label className="text-sm">관리자 모드</Label>
            </div>
          )}

          <Button onClick={loadCCPs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>

          {adminMode && (
            <Button onClick={() => setShowNewCCPDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 CCP 추가
            </Button>
          )}
        </div>
      </div>

      {/* CCP 카드 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCCPs.map((ccp) => (
          <Card key={ccp.id} className="hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              {/* 카드 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{ccp.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ccp.process}</p>
                  <Badge 
                    variant={ccp.status === 'normal' ? 'default' : 'destructive'}
                    className={
                      ccp.status === 'normal' 
                        ? 'bg-green-100 text-green-800' 
                        : ccp.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {ccp.status === 'normal' ? '정상' : 
                     ccp.status === 'warning' ? '경고' : '위험'}
                  </Badge>
                </div>

                {adminMode && (
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCCPToEdit(ccp);
                        setEditForm({
                          name: ccp.name,
                          process: ccp.process,
                          ccpType: ccp.ccpType,
                          hazard: ccp.hazard,
                          criticalLimit: { ...ccp.criticalLimit },
                          unit: ccp.unit,
                          monitoringMethod: ccp.monitoringMethod,
                          frequency: ccp.frequency
                        });
                        setShowEditCCPDialog(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCCPToDelete(ccp);
                        setShowDeleteDialog(true);
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 현재 값 및 한계기준 */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">현재 값</span>
                  <span className="font-semibold">
                    {ccp.currentValue} {ccp.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">한계기준</span>
                  <span className="text-sm">
                    {ccp.criticalLimit.min} - {ccp.criticalLimit.max} {ccp.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">기록 수</span>
                  <span className="text-sm">{ccp.records.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">마지막 점검</span>
                  <span className="text-sm">
                    {new Date(ccp.lastChecked).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCCP(ccp)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  상세보기
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAddRecord(ccp)}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  기록 추가
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCCPs.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">CCP가 없습니다</h4>
              <p className="text-gray-500">
                {searchTerm ? '검색 조건에 맞는 CCP가 없습니다.' : '새로운 CCP를 추가해보세요.'}
              </p>
            </div>
            {adminMode && !searchTerm && (
              <Button onClick={() => setShowNewCCPDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                첫 번째 CCP 추가
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* CCP 상세보기 다이얼로그 */}
      {selectedCCP && !showRecordDialog && (
        <Dialog open={!!selectedCCP} onOpenChange={(open) => !open && setSelectedCCP(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>{selectedCCP.name}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedCCP.process} - {getCCPTypeConfig(selectedCCP.ccpType)?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* CCP 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">CCP ID</Label>
                  <p className="text-sm">{selectedCCP.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">공정</Label>
                  <p className="text-sm">{selectedCCP.process}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">위험요소</Label>
                  <p className="text-sm">{selectedCCP.hazard}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">한계기준</Label>
                  <p className="text-sm">
                    {selectedCCP.criticalLimit.min} - {selectedCCP.criticalLimit.max} {selectedCCP.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">현재 값</Label>
                  <p className="text-sm font-semibold">
                    {selectedCCP.currentValue} {selectedCCP.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">상태</Label>
                  <Badge 
                    className={
                      selectedCCP.status === 'normal' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedCCP.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {selectedCCP.status === 'normal' ? '정상' : 
                     selectedCCP.status === 'warning' ? '경고' : '위험'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">모니터링 방법</Label>
                  <p className="text-sm bg-white p-3 rounded border min-h-[80px]">
                    {selectedCCP.monitoringMethod}
                  </p>
                </div>
              </div>

              {/* 기록 목록 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">기록 목록 ({selectedCCP.records.length}개)</h3>
                  <Button 
                    size="sm"
                    onClick={() => handleAddRecord(selectedCCP)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 기록 추가
                  </Button>
                </div>
                
                {selectedCCP.records.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>아직 기록이 없습니다.</p>
                    <p className="text-sm">첫 번째 기록을 추가해보세요.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedCCP.records.map((record) => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {new Date(record.timestamp).toLocaleString('ko-KR')}
                          </span>
                          <Badge 
                            className={
                              record.status === 'normal' 
                                ? 'bg-green-100 text-green-800' 
                                : record.status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {record.status === 'normal' ? '정상' : 
                             record.status === 'warning' ? '경고' : '위험'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(record.data).map(([key, value]) => {
                            const field = getCCPTypeConfig(record.ccpType)?.fields.find(f => f.key === key);
                            if (!field || key === 'signature') return null;
                            return (
                              <div key={key}>
                                <span className="text-gray-600">{field.label}:</span>
                                <span className="ml-1">
                                  {field.type === 'checkbox' ? (value ? '예' : '아니오') : 
                                   typeof value === 'string' && value.includes('T') ? 
                                   new Date(value).toLocaleString('ko-KR') : 
                                   `${value}${field.unit ? ` ${field.unit}` : ''}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          작업자: {record.operator}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 기록 추가 다이얼로그 */}
      {showRecordDialog && selectedCCP && (
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>기록 추가 - {selectedCCP.name}</DialogTitle>
              <DialogDescription>
                {getCCPTypeConfig(selectedCCP.ccpType)?.description}
              </DialogDescription>
            </DialogHeader>
            
            {(() => {
              const typeConfig = getCCPTypeConfig(selectedCCP.ccpType);
              if (!typeConfig) return <p>CCP 타입 설정을 찾을 수 없습니다.</p>;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {typeConfig.fields.map((field) => (
                      <div 
                        key={field.key} 
                        className={field.key === 'signature' ? 'col-span-2' : 'col-span-1'}
                      >
                        <Label className="block text-sm font-medium mb-2">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowRecordDialog(false);
                        setRecordFormData({});
                      }}
                    >
                      취소
                    </Button>
                    <Button onClick={addRecord}>
                      <Save className="w-4 h-4 mr-2" />
                      기록 저장
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* 새 CCP 추가 다이얼로그 */}
      {showNewCCPDialog && (
        <Dialog open={showNewCCPDialog} onOpenChange={setShowNewCCPDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 CCP 추가</DialogTitle>
              <DialogDescription>
                새로운 중요관리점을 시스템에 추가합니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CCP ID *</Label>
                  <Input
                    value={newCCPForm.id}
                    onChange={(e) => setNewCCPForm(prev => ({...prev, id: e.target.value}))}
                    placeholder="예: CCP-1B-3"
                  />
                </div>
                <div>
                  <Label>CCP 명 *</Label>
                  <Input
                    value={newCCPForm.name}
                    onChange={(e) => setNewCCPForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="예: CCP-1B [냉각공정]"
                  />
                </div>
              </div>

              <div>
                <Label>CCP 타입 *</Label>
                <Select 
                  value={newCCPForm.ccpType} 
                  onValueChange={(value) => {
                    setNewCCPForm(prev => ({...prev, ccpType: value}));
                    // CCP 타입에 따라 기본값 설정
                    const typeConfig = getCCPTypeConfig(value);
                    if (typeConfig) {
                      setNewCCPForm(prev => ({
                        ...prev,
                        process: prev.process || typeConfig.description
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="CCP 타입을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CCP_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newCCPForm.ccpType && (
                  <p className="text-sm text-gray-600 mt-1">
                    선택된 타입: {getCCPTypeConfig(newCCPForm.ccpType)?.name}
                  </p>
                )}
              </div>

              <div>
                <Label>공정 설명</Label>
                <Input
                  value={newCCPForm.process}
                  onChange={(e) => setNewCCPForm(prev => ({...prev, process: e.target.value}))}
                  placeholder="공정에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <Label>위험요소</Label>
                <Input
                  value={newCCPForm.hazard}
                  onChange={(e) => setNewCCPForm(prev => ({...prev, hazard: e.target.value}))}
                  placeholder="예: 병원성 미생물 생존"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>최소 한계</Label>
                  <Input
                    type="number"
                    value={newCCPForm.criticalLimit.min}
                    onChange={(e) => setNewCCPForm(prev => ({
                      ...prev, 
                      criticalLimit: { ...prev.criticalLimit, min: Number(e.target.value) }
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>최대 한계</Label>
                  <Input
                    type="number"
                    value={newCCPForm.criticalLimit.max}
                    onChange={(e) => setNewCCPForm(prev => ({
                      ...prev, 
                      criticalLimit: { ...prev.criticalLimit, max: Number(e.target.value) }
                    }))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>단위</Label>
                  <Input
                    value={newCCPForm.unit}
                    onChange={(e) => setNewCCPForm(prev => ({...prev, unit: e.target.value}))}
                    placeholder="°C, ppm, mm"
                  />
                </div>
              </div>

              <div>
                <Label>모니터링 방법</Label>
                <Input
                  value={newCCPForm.monitoringMethod}
                  onChange={(e) => setNewCCPForm(prev => ({...prev, monitoringMethod: e.target.value}))}
                  placeholder="예: 적외선 온도계를 이용한 온도 측정"
                />
              </div>

              <div>
                <Label>점검 주기</Label>
                <Input
                  value={newCCPForm.frequency}
                  onChange={(e) => setNewCCPForm(prev => ({...prev, frequency: e.target.value}))}
                  placeholder="예: 30분마다, 1시간마다"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowNewCCPDialog(false)}>
                  취소
                </Button>
                <Button onClick={addCCP}>
                  <Save className="w-4 h-4 mr-2" />
                  CCP 추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CCP 수정 다이얼로그 */}
      {showEditCCPDialog && ccpToEdit && (
        <Dialog open={showEditCCPDialog} onOpenChange={setShowEditCCPDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>CCP 수정 - {ccpToEdit.name}</DialogTitle>
              <DialogDescription>
                CCP의 기본 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CCP ID</Label>
                  <Input value={ccpToEdit.id} disabled className="bg-gray-100" />
                  <p className="text-sm text-gray-500 mt-1">CCP ID는 변경할 수 없습니다.</p>
                </div>
                <div>
                  <Label>CCP 명 *</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <Label>CCP 타입 *</Label>
                <Select 
                  value={editForm.ccpType} 
                  onValueChange={(value) => {
                    setEditForm(prev => ({...prev, ccpType: value}));
                    // CCP 타입에 따라 기본값 설정
                    const typeConfig = getCCPTypeConfig(value);
                    if (typeConfig && !editForm.process) {
                      setEditForm(prev => ({
                        ...prev,
                        process: typeConfig.description
                      }));
                    }
                  }}
                  disabled={!hasRole('admin')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CCP_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editForm.ccpType && (
                  <p className="text-sm text-gray-600 mt-1">
                    선택된 타입: {getCCPTypeConfig(editForm.ccpType)?.name}
                  </p>
                )}
                {!hasRole('admin') && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ 관리자만 CCP 타입을 변경할 수 있습니다.
                  </p>
                )}
              </div>

              <div>
                <Label>공정 설명</Label>
                <Input
                  value={editForm.process}
                  onChange={(e) => setEditForm(prev => ({...prev, process: e.target.value}))}
                />
              </div>

              <div>
                <Label>위험요소</Label>
                <Input
                  value={editForm.hazard}
                  onChange={(e) => setEditForm(prev => ({...prev, hazard: e.target.value}))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>최소 한계</Label>
                  <Input
                    type="number"
                    value={editForm.criticalLimit.min}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev, 
                      criticalLimit: { ...prev.criticalLimit, min: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label>최대 한계</Label>
                  <Input
                    type="number"
                    value={editForm.criticalLimit.max}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev, 
                      criticalLimit: { ...prev.criticalLimit, max: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label>단위</Label>
                  <Input
                    value={editForm.unit}
                    onChange={(e) => setEditForm(prev => ({...prev, unit: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <Label>모니터링 방법</Label>
                <Input
                  value={editForm.monitoringMethod}
                  onChange={(e) => setEditForm(prev => ({...prev, monitoringMethod: e.target.value}))}
                />
              </div>

              <div>
                <Label>점검 주기</Label>
                <Input
                  value={editForm.frequency}
                  onChange={(e) => setEditForm(prev => ({...prev, frequency: e.target.value}))}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowEditCCPDialog(false)}>
                  취소
                </Button>
                <Button onClick={updateCCP}>
                  <Save className="w-4 h-4 mr-2" />
                  수정 저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CCP 삭제 확인 다이얼로그 */}
      {showDeleteDialog && ccpToDelete && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>CCP 삭제 확인</span>
              </DialogTitle>
              <DialogDescription>
                이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800">{ccpToDelete.name}</h4>
                <p className="text-sm text-red-600 mt-1">{ccpToDelete.process}</p>
                <p className="text-sm text-red-600 mt-2">
                  현재 {ccpToDelete.records.length}개의 기록이 있습니다. 
                  CCP를 삭제하면 모든 기록도 함께 삭제됩니다.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  취소
                </Button>
                <Button variant="destructive" onClick={deleteCCP}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}