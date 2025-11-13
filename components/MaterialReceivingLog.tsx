import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { 
  Package, 
  Plus, 
  Save, 
  Download, 
  Check,
  Calendar,
  Clock,
  Trash2,
  AlertTriangle,
  X,
  Truck,
  ShieldCheck,
  Thermometer,
  Eye
} from "lucide-react";

interface ReceivingRecord {
  id: string;
  date: string;
  time: string;
  supplier: string;
  materialName: string;
  materialType: 'raw' | 'packaging' | 'additive' | 'other';
  quantity: number;
  unit: string;
  temperature?: number;
  packaging: string;
  visualInspection: 'pass' | 'fail';
  temperatureCheck: 'pass' | 'fail' | 'na';
  documentCheck: 'pass' | 'fail';
  overallResult: 'accept' | 'reject' | 'conditional';
  inspector: string;
  remarks: string;
  rejectionReason?: string;
  createdAt: Date;
}

const materialTypes = [
  { value: 'raw', label: '원료' },
  { value: 'packaging', label: '포장재' },
  { value: 'additive', label: '첨가물' },
  { value: 'other', label: '기타' }
];

const units = ['kg', 'g', 'L', 'mL', '개', '박스', '포'];

export function MaterialReceivingLog() {
  const [records, setRecords] = useState<ReceivingRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  // 공급업체 목록은 API에서 동적으로 로드
  const [commonSuppliers, setCommonSuppliers] = useState<string[]>([]);
  
  const [newRecord, setNewRecord] = useState({
    supplier: '',
    materialName: '',
    materialType: 'raw' as 'raw' | 'packaging' | 'additive' | 'other',
    quantity: '',
    unit: 'kg',
    temperature: '',
    packaging: '',
    visualInspection: 'pass' as 'pass' | 'fail',
    temperatureCheck: 'pass' as 'pass' | 'fail' | 'na',
    documentCheck: 'pass' as 'pass' | 'fail',
    inspector: '',
    remarks: '',
    rejectionReason: ''
  });

  useEffect(() => {
    loadRecords();
    loadSuppliers();
  }, [selectedDate]);

  // 공급업체 목록 로드
  const loadSuppliers = async () => {
    try {
      const data = await api.get('/suppliers');
      if (data && Array.isArray(data)) {
        const activeSuppliers = data.filter(supplier => supplier.status === 'active');
        const supplierNames = activeSuppliers.map(supplier => supplier.name);
        setCommonSuppliers(supplierNames);
      }
    } catch (error) {
      console.error('공급업체 목록 로드 실패:', error);
      // 기본 공급업체 목록 사용
      setCommonSuppliers([
        '○○식품유통',
        '△△농산물', 
        '□□유업',
        '◇◇포장재',
        '※※첨가물',
        '직접입고'
      ]);
    }
  };

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/receiving-logs?date=${selectedDate}`);
      if (data && Array.isArray(data)) {
        setRecords(data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      }
    } catch (error) {
      console.error('검수 기록 로드 실패:', error);
      toast.error('검수 기록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallResult = (): 'accept' | 'reject' | 'conditional' => {
    const { visualInspection, temperatureCheck, documentCheck } = newRecord;
    
    if (visualInspection === 'fail') return 'reject';
    if (temperatureCheck === 'fail') return 'reject';
    if (documentCheck === 'fail') return 'conditional';
    
    return 'accept';
  };

  const handleAddRecord = async () => {
    if (!newRecord.supplier || !newRecord.materialName || !newRecord.quantity || 
        !newRecord.inspector) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const overallResult = calculateOverallResult();
    
    const recordToAdd: ReceivingRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      supplier: newRecord.supplier,
      materialName: newRecord.materialName,
      materialType: newRecord.materialType,
      quantity: parseFloat(newRecord.quantity),
      unit: newRecord.unit,
      temperature: newRecord.temperature ? parseFloat(newRecord.temperature) : undefined,
      packaging: newRecord.packaging,
      visualInspection: newRecord.visualInspection,
      temperatureCheck: newRecord.temperatureCheck,
      documentCheck: newRecord.documentCheck,
      overallResult,
      inspector: newRecord.inspector,
      remarks: newRecord.remarks,
      rejectionReason: overallResult === 'reject' ? newRecord.rejectionReason : undefined,
      createdAt: new Date()
    };

    try {
      await api.post('/receiving-logs', recordToAdd);
      setRecords(prev => [...prev, recordToAdd]);
      
      // 폼 초기화
      setNewRecord({
        supplier: '',
        materialName: '',
        materialType: 'raw',
        quantity: '',
        unit: 'kg',
        temperature: '',
        packaging: '',
        visualInspection: 'pass',
        temperatureCheck: 'pass',
        documentCheck: 'pass',
        inspector: '',
        remarks: '',
        rejectionReason: ''
      });
      setShowAddForm(false);
      
      toast.success('검수 기록이 추가되었습니다.');
      
      // 결과에 따른 알림
      if (overallResult === 'reject') {
        toast.error('반품 처리: 검수 기준 미달로 반품 처리되었습니다.');
      } else if (overallResult === 'conditional') {
        toast.warning('조건부 승인: 서류 확인 후 최종 결정 필요');
      }
    } catch (error) {
      console.error('검수 기록 추가 실패:', error);
      toast.error('검수 기록 추가에 실패했습니다.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('이 검수 기록을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/receiving-logs/${id}`);
      setRecords(prev => prev.filter(record => record.id !== id));
      toast.success('검수 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('검수 기록 삭제 실패:', error);
      toast.error('검수 기록 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const blob = await api.get(`/receiving-logs/export?date=${selectedDate}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `원료입고검수기록부_${selectedDate}.xlsx`;
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

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'accept':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />승인</Badge>;
      case 'reject':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />반품</Badge>;
      case 'conditional':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />조건부</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  const getCheckBadge = (check: string) => {
    switch (check) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">적합</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">부적합</Badge>;
      case 'na':
        return <Badge className="bg-gray-100 text-gray-800">해당없음</Badge>;
      default:
        return <Badge variant="secondary">{check}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = materialTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const todayRecords = records.filter(record => record.date === selectedDate);
  const acceptedRecords = todayRecords.filter(record => record.overallResult === 'accept');
  const rejectedRecords = todayRecords.filter(record => record.overallResult === 'reject');
  const conditionalRecords = todayRecords.filter(record => record.overallResult === 'conditional');

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            원료입고 검수기록부
          </h1>
          <p className="text-gray-600 mt-1">원료 및 부재료 입고 시 품질 검수 기록 관리</p>
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
            검수 기록
          </Button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 입고 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">오늘 검수된 항목</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">승인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">검수 통과</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">조건부</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{conditionalRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">추가 확인 필요</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">반품</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">검수 미통과</p>
          </CardContent>
        </Card>
      </div>

      {/* 검수 기록 추가 폼 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 검수 기록 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>공급업체</Label>
                <Select value={newRecord.supplier} onValueChange={(value) => 
                  setNewRecord(prev => ({ ...prev, supplier: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="공급업체 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonSuppliers.map(supplier => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="또는 직접 입력"
                  value={newRecord.supplier}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, supplier: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>원료명</Label>
                <Input
                  placeholder="원료/자재명"
                  value={newRecord.materialName}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, materialName: e.target.value }))}
                />
              </div>

              <div>
                <Label>분류</Label>
                <Select value={newRecord.materialType} onValueChange={(value: any) => 
                  setNewRecord(prev => ({ ...prev, materialType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>수량</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="수량"
                    value={newRecord.quantity}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                  <Select value={newRecord.unit} onValueChange={(value) => 
                    setNewRecord(prev => ({ ...prev, unit: value }))
                  }>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>



              <div>
                <Label>온도 (°C) - 냉장/냉동 제품만</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="측정 온도"
                  value={newRecord.temperature}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, temperature: e.target.value }))}
                />
              </div>

              <div>
                <Label>포장상태</Label>
                <Input
                  placeholder="포장 상태 및 재질"
                  value={newRecord.packaging}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, packaging: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  외관검사
                </Label>
                <Select value={newRecord.visualInspection} onValueChange={(value: any) => 
                  setNewRecord(prev => ({ ...prev, visualInspection: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">적합</SelectItem>
                    <SelectItem value="fail">부적합</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  온도검사
                </Label>
                <Select value={newRecord.temperatureCheck} onValueChange={(value: any) => 
                  setNewRecord(prev => ({ ...prev, temperatureCheck: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">적합</SelectItem>
                    <SelectItem value="fail">부적합</SelectItem>
                    <SelectItem value="na">해당없음</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  서류검사
                </Label>
                <Select value={newRecord.documentCheck} onValueChange={(value: any) => 
                  setNewRecord(prev => ({ ...prev, documentCheck: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">적합</SelectItem>
                    <SelectItem value="fail">부적합</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>검수자</Label>
              <Input
                placeholder="검수 담당자"
                value={newRecord.inspector}
                onChange={(e) => setNewRecord(prev => ({ ...prev, inspector: e.target.value }))}
              />
            </div>

            {/* 부적합 시 반품사유 */}
            {(newRecord.visualInspection === 'fail' || newRecord.temperatureCheck === 'fail') && (
              <div>
                <Label className="text-red-600">반품사유 (필수)</Label>
                <Textarea
                  placeholder="부적합 사유를 상세히 기록하세요"
                  value={newRecord.rejectionReason}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, rejectionReason: e.target.value }))}
                />
              </div>
            )}

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

      {/* 검수 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedDate} 검수 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : todayRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              오늘 기록된 검수 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>공급업체</TableHead>
                    <TableHead>원료명</TableHead>
                    <TableHead>분류</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>검사결과</TableHead>
                    <TableHead>최종결과</TableHead>
                    <TableHead>검수자</TableHead>
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
                          <Truck className="w-4 h-4 text-gray-400" />
                          {record.supplier}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.materialName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(record.materialType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.quantity} {record.unit}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <span>외관:</span>
                            {getCheckBadge(record.visualInspection)}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span>온도:</span>
                            {getCheckBadge(record.temperatureCheck)}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span>서류:</span>
                            {getCheckBadge(record.documentCheck)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getResultBadge(record.overallResult)}
                      </TableCell>
                      <TableCell>{record.inspector}</TableCell>
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
    </div>
  );
}