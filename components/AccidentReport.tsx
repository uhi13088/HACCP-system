import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SignaturePad } from "./SignaturePad";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { 
  AlertTriangle, 
  Plus, 
  Save, 
  Download, 
  Calendar,
  Clock,
  Trash2,
  FileText,
  User,
  MapPin,
  Activity,
  Shield,
  Clipboard,
  CheckCircle,
  XCircle,
  Eye,
  Users
} from "lucide-react";

interface AccidentReport {
  id: string;
  reportNumber: string;
  date: string;
  time: string;
  location: string;
  accidentType: 'injury' | 'contamination' | 'equipment' | 'fire' | 'chemical' | 'other';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  reporter: string;
  reporterPosition: string;
  reporterContact: string;
  involvedPersons: {
    name: string;
    position: string;
    injuryType?: string;
    medicalTreatment?: string;
  }[];
  description: string;
  immediateCause: string;
  rootCause: string;
  immediateActions: string;
  correctiveActions: string;
  preventiveActions: string;
  responsiblePerson: string;
  dueDate: string;
  followUpRequired: boolean;
  followUpDate?: string;
  status: 'reported' | 'investigating' | 'action_taken' | 'closed';
  attachments?: string[];
  reporterSignature?: string;
  supervisorSignature?: string;
  createdAt: Date;
}

const accidentTypes = [
  { value: 'injury', label: '인체상해', color: 'bg-red-100 text-red-800' },
  { value: 'contamination', label: '오염사고', color: 'bg-orange-100 text-orange-800' },
  { value: 'equipment', label: '장비고장', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'fire', label: '화재', color: 'bg-red-100 text-red-800' },
  { value: 'chemical', label: '화학물질', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: '기타', color: 'bg-gray-100 text-gray-800' }
];

const severityLevels = [
  { value: 'minor', label: '경미', color: 'bg-green-100 text-green-800' },
  { value: 'moderate', label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'severe', label: '심각', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: '위험', color: 'bg-red-100 text-red-800' }
];

const statusTypes = [
  { value: 'reported', label: '신고됨', color: 'bg-blue-100 text-blue-800' },
  { value: 'investigating', label: '조사중', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'action_taken', label: '조치완료', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: '종료', color: 'bg-gray-100 text-gray-800' }
];

export function AccidentReport() {
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newReport, setNewReport] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
    location: '',
    accidentType: 'injury' as 'injury' | 'contamination' | 'equipment' | 'fire' | 'chemical' | 'other',
    severity: 'minor' as 'minor' | 'moderate' | 'severe' | 'critical',
    reporter: '',
    reporterPosition: '',
    reporterContact: '',
    involvedPersons: [{
      name: '',
      position: '',
      injuryType: '',
      medicalTreatment: ''
    }],
    description: '',
    immediateCause: '',
    rootCause: '',
    immediateActions: '',
    correctiveActions: '',
    preventiveActions: '',
    responsiblePerson: '',
    dueDate: '',
    followUpRequired: false,
    followUpDate: '',
    reporterSignature: '',
    supervisorSignature: ''
  });

  useEffect(() => {
    loadReports();
  }, [selectedMonth]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/accident-reports?month=${selectedMonth}`);
      if (data && Array.isArray(data)) {
        setReports(data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      }
    } catch (error) {
      console.error('사고보고서 로드 실패:', error);
      toast.error('사고보고서를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReportNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const sequence = (reports.length + 1).toString().padStart(3, '0');
    return `ACC-${year}${month}${day}-${sequence}`;
  };

  const handleAddReport = async () => {
    if (isSaving) return; // 중복 클릭 방지
    
    if (!newReport.date || !newReport.location || !newReport.reporter || !newReport.description) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);

    const reportToAdd: AccidentReport = {
      id: Date.now().toString(),
      reportNumber: generateReportNumber(),
      date: newReport.date,
      time: newReport.time,
      location: newReport.location,
      accidentType: newReport.accidentType,
      severity: newReport.severity,
      reporter: newReport.reporter,
      reporterPosition: newReport.reporterPosition,
      reporterContact: newReport.reporterContact,
      involvedPersons: newReport.involvedPersons.filter(person => person.name),
      description: newReport.description,
      immediateCause: newReport.immediateCause,
      rootCause: newReport.rootCause,
      immediateActions: newReport.immediateActions,
      correctiveActions: newReport.correctiveActions,
      preventiveActions: newReport.preventiveActions,
      responsiblePerson: newReport.responsiblePerson,
      dueDate: newReport.dueDate,
      followUpRequired: newReport.followUpRequired,
      followUpDate: newReport.followUpDate,
      status: 'reported',
      reporterSignature: newReport.reporterSignature,
      supervisorSignature: newReport.supervisorSignature,
      createdAt: new Date()
    };

    try {
      await api.post('/accident-reports', reportToAdd);
      setReports(prev => [...prev, reportToAdd]);
      
      // 폼 초기화
      setNewReport({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        location: '',
        accidentType: 'injury',
        severity: 'minor',
        reporter: '',
        reporterPosition: '',
        reporterContact: '',
        involvedPersons: [{
          name: '',
          position: '',
          injuryType: '',
          medicalTreatment: ''
        }],
        description: '',
        immediateCause: '',
        rootCause: '',
        immediateActions: '',
        correctiveActions: '',
        preventiveActions: '',
        responsiblePerson: '',
        dueDate: '',
        followUpRequired: false,
        followUpDate: '',
        reporterSignature: '',
        supervisorSignature: ''
      });
      setShowAddForm(false);
      
      toast.success(`사고보고서가 접수되었습니다. (보고서 번호: ${reportToAdd.reportNumber})`);
      
      // 심각도에 따른 알림
      if (newReport.severity === 'critical') {
        toast.error('긴급! 위험 등급 사고가 보고되었습니다. 즉시 대응이 필요합니다.');
      } else if (newReport.severity === 'severe') {
        toast.warning('주의! 심각한 사고가 보고되었습니다.');
      }
    } catch (error) {
      console.error('사고보고서 추가 실패:', error);
      toast.error('사고보고서 추가에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('이 사고보고서를 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/accident-reports/${id}`);
      setReports(prev => prev.filter(report => report.id !== id));
      toast.success('사고보고서가 삭제되었습니다.');
    } catch (error) {
      console.error('사고보고서 삭제 실패:', error);
      toast.error('사고보고서 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const blob = await api.get(`/accident-reports/export?month=${selectedMonth}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `사고보고서_${selectedMonth}.xlsx`;
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

  const addInvolvedPerson = () => {
    setNewReport(prev => ({
      ...prev,
      involvedPersons: [...prev.involvedPersons, {
        name: '',
        position: '',
        injuryType: '',
        medicalTreatment: ''
      }]
    }));
  };

  const removeInvolvedPerson = (index: number) => {
    setNewReport(prev => ({
      ...prev,
      involvedPersons: prev.involvedPersons.filter((_, i) => i !== index)
    }));
  };

  const updateInvolvedPerson = (index: number, field: string, value: string) => {
    setNewReport(prev => ({
      ...prev,
      involvedPersons: prev.involvedPersons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };

  const getTypeBadge = (type: string) => {
    const typeObj = accidentTypes.find(t => t.value === type);
    return (
      <Badge className={typeObj?.color || 'bg-gray-100 text-gray-800'}>
        {typeObj?.label || type}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityObj = severityLevels.find(s => s.value === severity);
    return (
      <Badge className={severityObj?.color || 'bg-gray-100 text-gray-800'}>
        {severityObj?.label || severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusObj = statusTypes.find(s => s.value === status);
    return (
      <Badge className={statusObj?.color || 'bg-gray-100 text-gray-800'}>
        {statusObj?.label || status}
      </Badge>
    );
  };

  const currentReports = reports.filter(report => report.date.startsWith(selectedMonth));
  const criticalReports = currentReports.filter(report => report.severity === 'critical');
  const openReports = currentReports.filter(report => report.status !== 'closed');

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            사고보고서
          </h1>
          <p className="text-gray-600 mt-1">사고 및 사건 발생시 보고 및 조치 관리</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            사고보고서 작성
          </Button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 보고 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentReports.length}</div>
            <p className="text-xs text-gray-600 mt-1">이번 달 사고보고서</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">위험 사고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalReports.length}</div>
            <p className="text-xs text-gray-600 mt-1">위험 등급 사고</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">진행 중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{openReports.length}</div>
            <p className="text-xs text-gray-600 mt-1">조치 진행 중</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">완료율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentReports.length > 0 
                ? Math.round((currentReports.length - openReports.length) / currentReports.length * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-600 mt-1">조치 완료율</p>
          </CardContent>
        </Card>
      </div>

      {/* 위험 사고 알림 */}
      {criticalReports.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {criticalReports.length}건의 위험 등급 사고가 있습니다. 즉시 조치가 필요합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 사고보고서 추가 폼 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 사고보고서 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                기본 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>사고 발생일</Label>
                  <Input
                    type="date"
                    value={newReport.date}
                    onChange={(e) => setNewReport(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>사고 발생시간</Label>
                  <Input
                    type="time"
                    value={newReport.time}
                    onChange={(e) => setNewReport(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>사고 발생장소</Label>
                  <Input
                    placeholder="구체적인 장소명"
                    value={newReport.location}
                    onChange={(e) => setNewReport(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>사고 유형</Label>
                  <Select value={newReport.accidentType} onValueChange={(value: any) => 
                    setNewReport(prev => ({ ...prev, accidentType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accidentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>심각도</Label>
                  <Select value={newReport.severity} onValueChange={(value: any) => 
                    setNewReport(prev => ({ ...prev, severity: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map(severity => (
                        <SelectItem key={severity.value} value={severity.value}>
                          {severity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 보고자 정보 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                보고자 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>보고자 이름</Label>
                  <Input
                    placeholder="보고자 이름"
                    value={newReport.reporter}
                    onChange={(e) => setNewReport(prev => ({ ...prev, reporter: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>직책/부서</Label>
                  <Input
                    placeholder="직책 또는 소속 부서"
                    value={newReport.reporterPosition}
                    onChange={(e) => setNewReport(prev => ({ ...prev, reporterPosition: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>연락처</Label>
                  <Input
                    placeholder="전화번호"
                    value={newReport.reporterContact}
                    onChange={(e) => setNewReport(prev => ({ ...prev, reporterContact: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* 관련자 정보 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  사고 관련자
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addInvolvedPerson}>
                  <Plus className="w-4 h-4 mr-1" />
                  관련자 추가
                </Button>
              </div>
              
              {newReport.involvedPersons.map((person, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">관련자 {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvolvedPerson(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>이름</Label>
                      <Input
                        placeholder="관련자 이름"
                        value={person.name}
                        onChange={(e) => updateInvolvedPerson(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>직책/부서</Label>
                      <Input
                        placeholder="직책 또는 부서"
                        value={person.position}
                        onChange={(e) => updateInvolvedPerson(index, 'position', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>부상 유형</Label>
                      <Input
                        placeholder="부상 부위 및 정도"
                        value={person.injuryType}
                        onChange={(e) => updateInvolvedPerson(index, 'injuryType', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>의료 조치</Label>
                      <Input
                        placeholder="응급처치, 병원 이송 등"
                        value={person.medicalTreatment}
                        onChange={(e) => updateInvolvedPerson(index, 'medicalTreatment', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 사고 상세 내용 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Clipboard className="w-4 h-4" />
                사고 상세 내용
              </h3>
              
              <div>
                <Label>사고 상황 설명</Label>
                <Textarea
                  placeholder="사고가 어떻게 발생했는지 구체적으로 설명하세요"
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>직접 원인</Label>
                  <Textarea
                    placeholder="사고의 직접적인 원인"
                    value={newReport.immediateCause}
                    onChange={(e) => setNewReport(prev => ({ ...prev, immediateCause: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>근본 원인</Label>
                  <Textarea
                    placeholder="사고의 근본적인 원인"
                    value={newReport.rootCause}
                    onChange={(e) => setNewReport(prev => ({ ...prev, rootCause: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* 조치 사항 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                조치 사항
              </h3>
              
              <div>
                <Label>즉시 조치 사항</Label>
                <Textarea
                  placeholder="사고 직후 취한 즉시 조치 사항"
                  value={newReport.immediateActions}
                  onChange={(e) => setNewReport(prev => ({ ...prev, immediateActions: e.target.value }))}
                />
              </div>

              <div>
                <Label>시정 조치 계획</Label>
                <Textarea
                  placeholder="사고 원인 제거를 위한 시정 조치 계획"
                  value={newReport.correctiveActions}
                  onChange={(e) => setNewReport(prev => ({ ...prev, correctiveActions: e.target.value }))}
                />
              </div>

              <div>
                <Label>예방 조치 계획</Label>
                <Textarea
                  placeholder="유사 사고 재발 방지를 위한 예방 조치"
                  value={newReport.preventiveActions}
                  onChange={(e) => setNewReport(prev => ({ ...prev, preventiveActions: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>조치 책임자</Label>
                  <Input
                    placeholder="조치 계획 실행 책임자"
                    value={newReport.responsiblePerson}
                    onChange={(e) => setNewReport(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>완료 예정일</Label>
                  <Input
                    type="date"
                    value={newReport.dueDate}
                    onChange={(e) => setNewReport(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={newReport.followUpRequired}
                  onChange={(e) => setNewReport(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                />
                <Label htmlFor="followUp">추후 점검 필요</Label>
              </div>

              {newReport.followUpRequired && (
                <div>
                  <Label>점검 예정일</Label>
                  <Input
                    type="date"
                    value={newReport.followUpDate}
                    onChange={(e) => setNewReport(prev => ({ ...prev, followUpDate: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* 서명 */}
            <div className="space-y-4">
              <h3 className="font-medium">서명</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>보고자 서명</Label>
                  <SignaturePad
                    onSignature={(signature) => setNewReport(prev => ({ ...prev, reporterSignature: signature }))}
                  />
                </div>
                <div>
                  <Label>확인자(관리자) 서명</Label>
                  <SignaturePad
                    onSignature={(signature) => setNewReport(prev => ({ ...prev, supervisorSignature: signature }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                취소
              </Button>
              <Button onClick={handleAddReport} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '저장 중...' : '보고서 제출'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사고보고서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedMonth} 사고보고서 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : currentReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이번 달 사고보고서가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>보고서번호</TableHead>
                    <TableHead>발생일시</TableHead>
                    <TableHead>장소</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>심각도</TableHead>
                    <TableHead>보고자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono">
                        {report.reportNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.date}</div>
                          <div className="text-sm text-gray-500">{report.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {report.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(report.accidentType)}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(report.severity)}
                      </TableCell>
                      <TableCell>{report.reporter}</TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
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