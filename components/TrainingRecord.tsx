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
  GraduationCap, 
  Plus, 
  Save, 
  Download, 
  Check,
  Calendar,
  Clock,
  Trash2,
  Users,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Star,
  Award
} from "lucide-react";

interface TrainingRecord {
  id: string;
  trainingId: string;
  title: string;
  category: 'haccp' | 'hygiene' | 'safety' | 'quality' | 'operation' | 'other';
  type: 'internal' | 'external' | 'online' | 'certification';
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // 분 단위
  location: string;
  instructor: string;
  instructorQualification: string;
  description: string;
  objectives: string[];
  attendees: {
    name: string;
    position: string;
    department: string;
    attendance: 'present' | 'absent' | 'late';
    score?: number;
    evaluation: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
    comments?: string;
    signature?: string;
  }[];
  materials: string[];
  evaluation: {
    contentRating: number;
    instructorRating: number;
    facilityRating: number;
    overallSatisfaction: number;
    suggestions: string;
  };
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  certificateIssued: boolean;
  certificateNumbers: string[];
  trainingCost: number;
  organizer: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: Date;
}

const trainingCategories = [
  { value: 'haccp', label: 'HACCP', color: 'bg-blue-100 text-blue-800' },
  { value: 'hygiene', label: '위생관리', color: 'bg-green-100 text-green-800' },
  { value: 'safety', label: '안전교육', color: 'bg-red-100 text-red-800' },
  { value: 'quality', label: '품질관리', color: 'bg-purple-100 text-purple-800' },
  { value: 'operation', label: '작업표준', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: '기타', color: 'bg-gray-100 text-gray-800' }
];

const trainingTypes = [
  { value: 'internal', label: '사내교육' },
  { value: 'external', label: '외부교육' },
  { value: 'online', label: '온라인교육' },
  { value: 'certification', label: '자격교육' }
];

const evaluationOptions = [
  { value: 'excellent', label: '우수' },
  { value: 'good', label: '양호' },
  { value: 'satisfactory', label: '보통' },
  { value: 'needs_improvement', label: '개선필요' }
];

export function TrainingRecord() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newRecord, setNewRecord] = useState({
    title: '',
    category: 'haccp' as 'haccp' | 'hygiene' | 'safety' | 'quality' | 'operation' | 'other',
    type: 'internal' as 'internal' | 'external' | 'online' | 'certification',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    location: '',
    instructor: '',
    instructorQualification: '',
    description: '',
    objectives: [''],
    attendees: [{
      name: '',
      position: '',
      department: '',
      attendance: 'present' as 'present' | 'absent' | 'late',
      score: 0,
      evaluation: 'good' as 'excellent' | 'good' | 'satisfactory' | 'needs_improvement',
      comments: '',
      signature: ''
    }],
    materials: [''],
    evaluation: {
      contentRating: 5,
      instructorRating: 5,
      facilityRating: 5,
      overallSatisfaction: 5,
      suggestions: ''
    },
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    certificateIssued: false,
    certificateNumbers: [''],
    trainingCost: 0,
    organizer: ''
  });

  useEffect(() => {
    loadRecords();
  }, [selectedMonth]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/training-records?month=${selectedMonth}`);
      if (data && Array.isArray(data)) {
        setRecords(data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      }
    } catch (error) {
      console.error('교육훈련 기록 로드 실패:', error);
      toast.error('교육훈련 기록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrainingId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = (records.length + 1).toString().padStart(3, '0');
    return `TR-${year}${month}-${sequence}`;
  };

  const calculateDuration = () => {
    if (newRecord.startTime && newRecord.endTime) {
      const start = new Date(`2000-01-01T${newRecord.startTime}`);
      const end = new Date(`2000-01-01T${newRecord.endTime}`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      return Math.max(0, duration);
    }
    return 0;
  };

  const handleAddRecord = async () => {
    if (isSaving) return; // 중복 클릭 방지
    
    if (!newRecord.title || !newRecord.instructor || !newRecord.location) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);
    const duration = calculateDuration();
    
    const recordToAdd: TrainingRecord = {
      id: Date.now().toString(),
      trainingId: generateTrainingId(),
      title: newRecord.title,
      category: newRecord.category,
      type: newRecord.type,
      date: newRecord.date,
      startTime: newRecord.startTime,
      endTime: newRecord.endTime,
      duration,
      location: newRecord.location,
      instructor: newRecord.instructor,
      instructorQualification: newRecord.instructorQualification,
      description: newRecord.description,
      objectives: newRecord.objectives.filter(obj => obj.trim()),
      attendees: newRecord.attendees.filter(attendee => attendee.name.trim()),
      materials: newRecord.materials.filter(material => material.trim()),
      evaluation: newRecord.evaluation,
      followUpRequired: newRecord.followUpRequired,
      followUpDate: newRecord.followUpDate,
      followUpNotes: newRecord.followUpNotes,
      certificateIssued: newRecord.certificateIssued,
      certificateNumbers: newRecord.certificateNumbers.filter(cert => cert.trim()),
      trainingCost: newRecord.trainingCost,
      organizer: newRecord.organizer,
      status: 'completed',
      createdAt: new Date()
    };

    try {
      await api.post('/training-records', recordToAdd);
      setRecords(prev => [...prev, recordToAdd]);
      
      // 폼 초기화
      setNewRecord({
        title: '',
        category: 'haccp',
        type: 'internal',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
        location: '',
        instructor: '',
        instructorQualification: '',
        description: '',
        objectives: [''],
        attendees: [{
          name: '',
          position: '',
          department: '',
          attendance: 'present',
          score: 0,
          evaluation: 'good',
          comments: '',
          signature: ''
        }],
        materials: [''],
        evaluation: {
          contentRating: 5,
          instructorRating: 5,
          facilityRating: 5,
          overallSatisfaction: 5,
          suggestions: ''
        },
        followUpRequired: false,
        followUpDate: '',
        followUpNotes: '',
        certificateIssued: false,
        certificateNumbers: [''],
        trainingCost: 0,
        organizer: ''
      });
      setShowAddForm(false);
      
      toast.success(`교육훈련 기록이 추가되었습니다. (ID: ${recordToAdd.trainingId})`);
    } catch (error) {
      console.error('교육훈련 기록 추가 실패:', error);
      toast.error('교육훈련 기록 추가에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('이 교육훈련 기록을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/training-records/${id}`);
      setRecords(prev => prev.filter(record => record.id !== id));
      toast.success('교육훈련 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('교육훈련 기록 삭제 실패:', error);
      toast.error('교육훈련 기록 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const blob = await api.get(`/training-records/export?month=${selectedMonth}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `교육훈련기록부_${selectedMonth}.xlsx`;
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

  const addObjective = () => {
    setNewRecord(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    setNewRecord(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setNewRecord(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const addAttendee = () => {
    setNewRecord(prev => ({
      ...prev,
      attendees: [...prev.attendees, {
        name: '',
        position: '',
        department: '',
        attendance: 'present',
        score: 0,
        evaluation: 'good',
        comments: '',
        signature: ''
      }]
    }));
  };

  const removeAttendee = (index: number) => {
    setNewRecord(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }));
  };

  const updateAttendee = (index: number, field: string, value: any) => {
    setNewRecord(prev => ({
      ...prev,
      attendees: prev.attendees.map((attendee, i) => 
        i === index ? { ...attendee, [field]: value } : attendee
      )
    }));
  };

  const addMaterial = () => {
    setNewRecord(prev => ({
      ...prev,
      materials: [...prev.materials, '']
    }));
  };

  const removeMaterial = (index: number) => {
    setNewRecord(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index: number, value: string) => {
    setNewRecord(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => i === index ? value : material)
    }));
  };

  const getCategoryBadge = (category: string) => {
    const categoryObj = trainingCategories.find(c => c.value === category);
    return (
      <Badge className={categoryObj?.color || 'bg-gray-100 text-gray-800'}>
        {categoryObj?.label || category}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeObj = trainingTypes.find(t => t.value === type);
    return (
      <Badge variant="outline">
        {typeObj?.label || type}
      </Badge>
    );
  };

  const getEvaluationBadge = (evaluation: string) => {
    switch (evaluation) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">우수</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">양호</Badge>;
      case 'satisfactory':
        return <Badge className="bg-yellow-100 text-yellow-800">보통</Badge>;
      case 'needs_improvement':
        return <Badge className="bg-red-100 text-red-800">개선필요</Badge>;
      default:
        return <Badge variant="secondary">{evaluation}</Badge>;
    }
  };

  const currentRecords = records.filter(record => record.date.startsWith(selectedMonth));
  const totalAttendees = currentRecords.reduce((sum, record) => sum + record.attendees.length, 0);
  const avgSatisfaction = currentRecords.length > 0 
    ? (currentRecords.reduce((sum, record) => sum + record.evaluation.overallSatisfaction, 0) / currentRecords.length).toFixed(1)
    : '0';

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            교육훈련 기록부
          </h1>
          <p className="text-gray-600 mt-1">직원 교육 및 훈련 프로그램 관리</p>
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
            교육 기록
          </Button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 교육 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentRecords.length}</div>
            <p className="text-xs text-gray-600 mt-1">이번 달 실시된 교육</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 수강인원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalAttendees}</div>
            <p className="text-xs text-gray-600 mt-1">교육 이수 인원</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">평균 만족도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
              {avgSatisfaction}
              <Star className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-600 mt-1">5점 만점 기준</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">자격증 발급</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentRecords.filter(r => r.certificateIssued).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">자격증 발급 교육</p>
          </CardContent>
        </Card>
      </div>

      {/* 교육훈련 기록 추가 폼 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 교육훈련 기록 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                교육 기본 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>교육 제목</Label>
                  <Input
                    placeholder="교육 프로그램 명"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>교육 분야</Label>
                  <Select value={newRecord.category} onValueChange={(value: any) => 
                    setNewRecord(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trainingCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>교육 유형</Label>
                  <Select value={newRecord.type} onValueChange={(value: any) => 
                    setNewRecord(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trainingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>교육 일자</Label>
                  <Input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>교육 장소</Label>
                  <Input
                    placeholder="교육 실시 장소"
                    value={newRecord.location}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={newRecord.startTime}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={newRecord.endTime}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>강사명</Label>
                  <Input
                    placeholder="교육 담당 강사"
                    value={newRecord.instructor}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, instructor: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>강사 자격</Label>
                  <Input
                    placeholder="강사 보유 자격"
                    value={newRecord.instructorQualification}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, instructorQualification: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>주관 기관</Label>
                  <Input
                    placeholder="교육 주관 기관/부서"
                    value={newRecord.organizer}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, organizer: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>교육 비용 (원)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newRecord.trainingCost}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, trainingCost: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label>교육 내용</Label>
                <Textarea
                  placeholder="교육 내용 및 프로그램 상세 설명"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* 교육 목표 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">교육 목표</h3>
                <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                  <Plus className="w-4 h-4 mr-1" />
                  목표 추가
                </Button>
              </div>
              
              {newRecord.objectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`교육 목표 ${index + 1}`}
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* 수강자 정보 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  수강자 정보
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addAttendee}>
                  <Plus className="w-4 h-4 mr-1" />
                  수강자 추가
                </Button>
              </div>
              
              {newRecord.attendees.map((attendee, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">수강자 {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>이름</Label>
                      <Input
                        placeholder="수강자 이름"
                        value={attendee.name}
                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>직책</Label>
                      <Input
                        placeholder="직책/직급"
                        value={attendee.position}
                        onChange={(e) => updateAttendee(index, 'position', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>부서</Label>
                      <Input
                        placeholder="소속 부서"
                        value={attendee.department}
                        onChange={(e) => updateAttendee(index, 'department', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>출석</Label>
                      <Select value={attendee.attendance} onValueChange={(value: any) => 
                        updateAttendee(index, 'attendance', value)
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">출석</SelectItem>
                          <SelectItem value="absent">결석</SelectItem>
                          <SelectItem value="late">지각</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>점수</Label>
                      <Input
                        type="number"
                        max="100"
                        min="0"
                        placeholder="100"
                        value={attendee.score}
                        onChange={(e) => updateAttendee(index, 'score', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>평가</Label>
                      <Select value={attendee.evaluation} onValueChange={(value: any) => 
                        updateAttendee(index, 'evaluation', value)
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {evaluationOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label>코멘트</Label>
                      <Textarea
                        placeholder="개별 평가 및 코멘트"
                        value={attendee.comments}
                        onChange={(e) => updateAttendee(index, 'comments', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 교육 평가 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Star className="w-4 h-4" />
                교육 평가 (5점 만점)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>교육 내용</Label>
                  <Input
                    type="number"
                    max="5"
                    min="1"
                    value={newRecord.evaluation.contentRating}
                    onChange={(e) => setNewRecord(prev => ({
                      ...prev,
                      evaluation: { ...prev.evaluation, contentRating: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label>강사 만족도</Label>
                  <Input
                    type="number"
                    max="5"
                    min="1"
                    value={newRecord.evaluation.instructorRating}
                    onChange={(e) => setNewRecord(prev => ({
                      ...prev,
                      evaluation: { ...prev.evaluation, instructorRating: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label>교육 환경</Label>
                  <Input
                    type="number"
                    max="5"
                    min="1"
                    value={newRecord.evaluation.facilityRating}
                    onChange={(e) => setNewRecord(prev => ({
                      ...prev,
                      evaluation: { ...prev.evaluation, facilityRating: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label>전반적 만족도</Label>
                  <Input
                    type="number"
                    max="5"
                    min="1"
                    value={newRecord.evaluation.overallSatisfaction}
                    onChange={(e) => setNewRecord(prev => ({
                      ...prev,
                      evaluation: { ...prev.evaluation, overallSatisfaction: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>개선 제안</Label>
                <Textarea
                  placeholder="교육 개선을 위한 제안 사항"
                  value={newRecord.evaluation.suggestions}
                  onChange={(e) => setNewRecord(prev => ({
                    ...prev,
                    evaluation: { ...prev.evaluation, suggestions: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* 후속 조치 */}
            <div className="space-y-4">
              <h3 className="font-medium">후속 조치</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={newRecord.followUpRequired}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                />
                <Label htmlFor="followUp">추가 교육 또는 후속 조치 필요</Label>
              </div>

              {newRecord.followUpRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>후속 조치 일정</Label>
                    <Input
                      type="date"
                      value={newRecord.followUpDate}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>후속 조치 내용</Label>
                    <Textarea
                      placeholder="후속 조치 계획"
                      value={newRecord.followUpNotes}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 자격증 정보 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="certificate"
                  checked={newRecord.certificateIssued}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, certificateIssued: e.target.checked }))}
                />
                <Label htmlFor="certificate" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  수료증/자격증 발급
                </Label>
              </div>

              {newRecord.certificateIssued && (
                <div>
                  <Label>수료증 번호</Label>
                  <Input
                    placeholder="수료증 또는 자격증 번호"
                    value={newRecord.certificateNumbers[0] || ''}
                    onChange={(e) => setNewRecord(prev => ({
                      ...prev,
                      certificateNumbers: [e.target.value]
                    }))}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                취소
              </Button>
              <Button onClick={handleAddRecord} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 교육훈련 기록 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedMonth} 교육훈련 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : currentRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이번 달 교육훈련 기록이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>교육ID</TableHead>
                    <TableHead>교육명</TableHead>
                    <TableHead>분야</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>일자</TableHead>
                    <TableHead>수강인원</TableHead>
                    <TableHead>만족도</TableHead>
                    <TableHead>자격증</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">
                        {record.trainingId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.title}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(record.category)}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(record.type)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{record.date}</div>
                          <div className="text-sm text-gray-500">
                            {record.startTime} - {record.endTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {record.attendees.length}명
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {record.evaluation.overallSatisfaction}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.certificateIssued ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300" />
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
    </div>
  );
}