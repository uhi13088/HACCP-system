import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar, Clock, FileText, Plus, CheckCircle2, Trash2, Edit, AlertTriangle, History, CalendarDays, Search } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  notes: string;
}

interface Checklist {
  id: number;
  title: string;
  category: string;
  items: ChecklistItem[];
  dueTime: string;
  status: string;
  date?: string;
  completedAt?: string;
  completedBy?: string;
}

export function ChecklistManager() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [historyChecklists, setHistoryChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [showNewChecklistDialog, setShowNewChecklistDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 새 체크리스트 폼 상태
  const [newChecklist, setNewChecklist] = useState({
    title: "",
    category: "",
    dueTime: "",
    items: [{ text: "", notes: "" }]
  });

  // 오늘 체크리스트 로드
  const loadChecklists = async () => {
    try {
      setLoading(true);
      const response = await api.getChecklists();
      if (response.success && response.data.length > 0) {
        // 오늘 날짜의 체크리스트만 필터링
        const today = new Date().toISOString().split('T')[0];
        const todayChecklists = response.data.filter((checklist: Checklist) => 
          !checklist.date || checklist.date === today
        );
        setChecklists(todayChecklists);
      } else {
        // 백엔드에서 데이터가 없으면 초기 데이터 생성
        console.log('No checklists found, initializing...');
        const initResponse = await api.initializeSystem();
        if (initResponse.success && initResponse.data?.checklists) {
          setChecklists(initResponse.data.checklists);
        } else {
          // 초기화도 실패하면 모의 데이터 사용
          setChecklists([
            {
              id: 1,
              title: "식재료 입고 점검",
              category: "입고 관리",
              items: [
                { id: 1, text: "입고 온도 확인 (냉장: 1-4°C, 냉동: -18°C 이하)", completed: true, notes: "정상 온도 확인됨" },
                { id: 2, text: "포장 상태 및 유통기한 확인", completed: true, notes: "" },
                { id: 3, text: "공급업체 인증서 확인", completed: false, notes: "" },
                { id: 4, text: "입고 수량 대조", completed: false, notes: "" }
              ],
              dueTime: "09:00",
              status: "진행중",
              date: new Date().toISOString().split('T')[0]
            },
            {
              id: 2,
              title: "조리 과정 모니터링",
              category: "조리 관리", 
              items: [
                { id: 1, text: "조리 온도 측정 (75°C 이상)", completed: false, notes: "" },
                { id: 2, text: "조리 시간 기록", completed: false, notes: "" },
                { id: 3, text: "교차오염 방지 확인", completed: false, notes: "" },
                { id: 4, text: "조리 도구 청결 상태 확인", completed: false, notes: "" }
              ],
              dueTime: "11:30",
              status: "대기"
            },
            {
              id: 3,
              title: "보관 온도 점검",
              category: "보관 관리",
              items: [
                { id: 1, text: "냉장고 온도 기록", completed: true, notes: "2.5°C 확인" },
                { id: 2, text: "냉동고 온도 기록", completed: true, notes: "-16°C (경고: 기준치 초과)" },
                { id: 3, text: "보관 용기 청결 상태", completed: true, notes: "" },
                { id: 4, text: "FIFO 원칙 준수 확인", completed: false, notes: "" }
              ],
              dueTime: "14:00",
              status: "진행중"
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load checklists:', error);
      // 에러 발생시에도 모의 데이터 사용
      setChecklists([
        {
          id: 1,
          title: "식재료 입고 점검",
          category: "입고 관리",
          items: [
            { id: 1, text: "입고 온도 확인 (냉장: 1-4°C, 냉동: -18°C 이하)", completed: true, notes: "정상 온도 확인됨" },
            { id: 2, text: "포장 상태 및 유통기한 확인", completed: true, notes: "" },
            { id: 3, text: "공급업체 인증서 확인", completed: false, notes: "" },
            { id: 4, text: "입고 수량 대조", completed: false, notes: "" }
          ],
          dueTime: "09:00",
          status: "진행중"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 이력 체크리스트 로드
  const loadHistoryChecklists = async (date?: string) => {
    try {
      setHistoryLoading(true);
      
      // 모의 이력 데이터 생성
      const mockHistory: Checklist[] = [];
      const today = new Date();
      
      // 지난 7일간의 완료된 체크리스트 생성
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (date && date !== dateStr) continue;
        
        mockHistory.push(
          {
            id: 100 + i * 10,
            title: "식재료 입고 점검",
            category: "입고 관리",
            items: [
              { id: 1, text: "입고 온도 확인 (냉장: 1-4°C, 냉동: -18°C 이하)", completed: true, notes: "정상 온도 확인됨" },
              { id: 2, text: "포장 상태 및 유통기한 확인", completed: true, notes: "" },
              { id: 3, text: "공급업체 인증서 확인", completed: true, notes: "인증서 확인 완료" },
              { id: 4, text: "입고 수량 대조", completed: true, notes: "수량 일치" }
            ],
            dueTime: "09:00",
            status: "완료",
            date: dateStr,
            completedAt: `${dateStr} 09:15:00`,
            completedBy: "김담당자"
          },
          {
            id: 100 + i * 10 + 1,
            title: "조리 과정 모니터링",
            category: "조리 관리",
            items: [
              { id: 1, text: "조리 온도 측정 (75°C 이상)", completed: true, notes: "78°C 측정" },
              { id: 2, text: "조리 시간 기록", completed: true, notes: "25분" },
              { id: 3, text: "교차오염 방지 확인", completed: true, notes: "" },
              { id: 4, text: "조리 도구 청결 상태 확인", completed: true, notes: "" }
            ],
            dueTime: "11:30",
            status: "완료",
            date: dateStr,
            completedAt: `${dateStr} 11:45:00`,
            completedBy: "박요리사"
          },
          {
            id: 100 + i * 10 + 2,
            title: "보관 온도 점검",
            category: "보관 관리",
            items: [
              { id: 1, text: "냉장고 온도 기록", completed: true, notes: "3.2°C 확인" },
              { id: 2, text: "냉동고 온도 기록", completed: true, notes: "-18°C 정상" },
              { id: 3, text: "보관 용기 청결 상태", completed: true, notes: "" },
              { id: 4, text: "FIFO 원칙 준수 확인", completed: true, notes: "" }
            ],
            dueTime: "14:00",
            status: "완료",
            date: dateStr,
            completedAt: `${dateStr} 14:10:00`,
            completedBy: "이관리자"
          }
        );
      }

      // 필터링 적용
      let filteredHistory = mockHistory;
      if (date) {
        filteredHistory = mockHistory.filter(checklist => checklist.date === date);
      }
      if (searchQuery) {
        filteredHistory = filteredHistory.filter(checklist => 
          checklist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          checklist.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (selectedCategory && selectedCategory !== "all") {
        filteredHistory = filteredHistory.filter(checklist => checklist.category === selectedCategory);
      }

      setHistoryChecklists(filteredHistory);
    } catch (error) {
      console.error('Failed to load history checklists:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    loadChecklists();
  }, []);

  // 이력 탭이 활성화될 때 이력 데이터 로드
  useEffect(() => {
    if (activeTab === "history") {
      loadHistoryChecklists(selectedDate);
    }
  }, [activeTab, selectedDate, searchQuery, selectedCategory]);

  // 체크리스트 항목 토글
  const toggleItem = async (checklistId: number, itemId: number) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const item = checklist.items.find(i => i.id === itemId);
    if (!item) return;

    try {
      // 백엔드 업데이트
      await api.updateChecklistItem(checklistId.toString(), itemId.toString(), {
        completed: !item.completed
      });

      // 로컬 상태 업데이트
      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          const updatedItems = checklist.items.map(item => {
            if (item.id === itemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          
          const completedCount = updatedItems.filter(item => item.completed).length;
          const status = completedCount === updatedItems.length ? "완료" : 
                       completedCount > 0 ? "진행중" : "대기";
          
          return { ...checklist, items: updatedItems, status };
        }
        return checklist;
      }));
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      // 에러 발생시에도 로컬 상태만 업데이트
      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          const updatedItems = checklist.items.map(item => {
            if (item.id === itemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          
          const completedCount = updatedItems.filter(item => item.completed).length;
          const status = completedCount === updatedItems.length ? "완료" : 
                       completedCount > 0 ? "진행중" : "대기";
          
          return { ...checklist, items: updatedItems, status };
        }
        return checklist;
      }));
    }
  };

  // 메모 저장
  const saveNotes = async (checklistId: number, itemId: number, notes: string) => {
    try {
      await api.updateChecklistItem(checklistId.toString(), itemId.toString(), {
        notes: notes
      });

      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          return {
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId ? { ...item, notes } : item
            )
          };
        }
        return checklist;
      }));
    } catch (error) {
      console.error('Failed to save notes:', error);
      // 에러 발생시에도 로컬 상태 업데이트
      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          return {
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId ? { ...item, notes } : item
            )
          };
        }
        return checklist;
      }));
    }
  };

  // 체크리스트 확장/축소
  const toggleChecklistExpansion = (checklistId: number) => {
    setExpandedChecklist(prev => prev === checklistId ? null : checklistId);
  };

  // 새 체크리스트 생성
  const createChecklist = async () => {
    if (!newChecklist.title || !newChecklist.category || newChecklist.items.length === 0) {
      toast.error('모든 필수 정보를 입력해주세요.', {
        description: '제목, 카테고리, 체크리스트 항목을 모두 입력해야 합니다.',
        duration: 4000
      });
      return;
    }

    setSaving(true);
    try {
      const checklistData = {
        title: newChecklist.title,
        category: newChecklist.category,
        dueTime: newChecklist.dueTime || "09:00",
        items: newChecklist.items
          .filter(item => item.text.trim() !== "")
          .map((item, index) => ({
            id: index + 1,
            text: item.text,
            completed: false,
            notes: item.notes || ""
          })),
        status: "대기"
      };

      const response = await api.createChecklist(checklistData);
      
      if (response.success) {
        // 새 체크리스트를 목록에 추가
        setChecklists(prev => [...prev, response.data]);
        
        // 폼 초기화
        setNewChecklist({
          title: "",
          category: "",
          dueTime: "",
          items: [{ text: "", notes: "" }]
        });
        
        setShowNewChecklistDialog(false);
      }
    } catch (error) {
      console.error('Failed to create checklist:', error);
      
      // 에러 발생시에도 로컬에 추가 (개발용)
      const newId = Math.max(...checklists.map(c => c.id), 0) + 1;
      const checklistData = {
        id: newId,
        title: newChecklist.title,
        category: newChecklist.category,
        dueTime: newChecklist.dueTime || "09:00",
        items: newChecklist.items
          .filter(item => item.text.trim() !== "")
          .map((item, index) => ({
            id: index + 1,
            text: item.text,
            completed: false,
            notes: item.notes || ""
          })),
        status: "대기"
      };

      setChecklists(prev => [...prev, checklistData]);
      
      setNewChecklist({
        title: "",
        category: "",
        dueTime: "",
        items: [{ text: "", notes: "" }]
      });
      
      setShowNewChecklistDialog(false);
    } finally {
      setSaving(false);
    }
  };

  // 새 항목 추가
  const addNewItem = () => {
    setNewChecklist(prev => ({
      ...prev,
      items: [...prev.items, { text: "", notes: "" }]
    }));
  };

  // 항목 제거
  const removeItem = (index: number) => {
    setNewChecklist(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // 항목 업데이트
  const updateItem = (index: number, field: string, value: string) => {
    setNewChecklist(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // 보고서 생성
  const generateReport = (checklistId: number) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;
    
    const reportData = {
      title: checklist.title,
      category: checklist.category,
      completedAt: new Date().toISOString(),
      items: checklist.items,
      completionRate: Math.round((checklist.items.filter(item => item.completed).length / checklist.items.length) * 100)
    };
    
    // 보고서 창 열기 또는 다운로드 로직
    toast.success('보고서가 생성되었습니다!', {
      description: `${checklist.title} - 완료율: ${reportData.completionRate}%`,
      duration: 5000
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료": return "bg-green-100 text-green-800";
      case "진행중": return "bg-yellow-100 text-yellow-800";
      case "대기": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return "오늘";
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return "어제";
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  // 카테고리 목록
  const categories = ["입고 관리", "조리 관리", "보관 관리", "위생 관리", "설비 관리", "기타"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">체크리스트를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>체크리스트 관리</h1>
          <p className="text-muted-foreground">일일 점검 항목을 관리하고 기록합니다</p>
        </div>
        
        <Dialog open={showNewChecklistDialog} onOpenChange={setShowNewChecklistDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 체크리스트 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 체크리스트 생성</DialogTitle>
              <DialogDescription>
                새로운 체크리스트를 생성하여 점검 항목을 관리하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">체크리스트 제목 *</Label>
                  <Input
                    id="title"
                    value={newChecklist.title}
                    onChange={(e) => setNewChecklist(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 식재료 입고 점검"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={newChecklist.category}
                    onValueChange={(value) => setNewChecklist(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="입고 관리">입고 관리</SelectItem>
                      <SelectItem value="조리 관리">조리 관리</SelectItem>
                      <SelectItem value="보관 관리">보관 관리</SelectItem>
                      <SelectItem value="위생 관리">위생 관리</SelectItem>
                      <SelectItem value="설비 관리">설비 관리</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="dueTime">실행 시간</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={newChecklist.dueTime}
                  onChange={(e) => setNewChecklist(prev => ({ ...prev, dueTime: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* 체크리스트 항목 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>체크리스트 항목 *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    항목 추가
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newChecklist.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={item.text}
                          onChange={(e) => updateItem(index, 'text', e.target.value)}
                          placeholder="점검 항목을 입력하세요"
                          className="flex-1"
                        />
                        {newChecklist.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        placeholder="추가 메모 (선택사항)"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewChecklistDialog(false)}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button onClick={createChecklist} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      생성 중...
                    </>
                  ) : (
                    '체크리스트 생성'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today" className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4" />
            <span>오늘의 체크리스트</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>이력 조회</span>
          </TabsTrigger>
        </TabsList>

        {/* 오늘의 체크리스트 */}
        <TabsContent value="today" className="space-y-6">
          {checklists.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-3">
            <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg">체크리스트가 없습니다</h3>
            <p className="text-muted-foreground">새 체크리스트를 추가하여 점검 항목을 관리해보세요.</p>
            <Button onClick={() => setShowNewChecklistDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              첫 번째 체크리스트 만들기
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {checklists.map((checklist) => {
            const completedCount = checklist.items.filter(item => item.completed).length;
            const completionRate = Math.round((completedCount / checklist.items.length) * 100);
            const isExpanded = expandedChecklist === checklist.id;

            return (
              <Card key={checklist.id} className="p-6">
                <div className="space-y-4">
                  {/* 헤더 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3>{checklist.title}</h3>
                      <Badge className={getStatusColor(checklist.status)}>
                        {checklist.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{checklist.category}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{checklist.dueTime}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>진행률</span>
                        <span>{completedCount}/{checklist.items.length} ({completionRate}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 체크리스트 항목 - 축약 뷰 */}
                  {!isExpanded && (
                    <div className="space-y-2">
                      {checklist.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center space-x-2 p-2 rounded border-l-2 border-gray-200">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(checklist.id, item.id)}
                            className="mt-0.5"
                          />
                          <p className={`text-sm flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text}
                          </p>
                        </div>
                      ))}
                      {checklist.items.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          외 {checklist.items.length - 2}개 항목...
                        </p>
                      )}
                    </div>
                  )}

                  {/* 체크리스트 항목 - 전체 뷰 */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {checklist.items.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 rounded border">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(checklist.id, item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.text}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground bg-gray-50 p-1 rounded">
                                메모: {item.notes}
                              </p>
                            )}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItemId(item.id);
                                  setSelectedNotes(item.notes);
                                }}
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>점검 메모 작성</DialogTitle>
                                <DialogDescription>
                                  점검 결과나 특이사항을 기록하세요.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>점검 항목</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{item.text}</p>
                                </div>
                                <div>
                                  <Label htmlFor="notes">메모</Label>
                                  <Textarea
                                    id="notes"
                                    value={selectedNotes}
                                    onChange={(e) => setSelectedNotes(e.target.value)}
                                    placeholder="점검 결과나 특이사항을 기록하세요..."
                                    className="mt-1"
                                  />
                                </div>
                                <Button 
                                  onClick={() => {
                                    if (selectedItemId) {
                                      saveNotes(checklist.id, selectedItemId, selectedNotes);
                                    }
                                  }}
                                  className="w-full"
                                >
                                  저장
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => toggleChecklistExpansion(checklist.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {completionRate === 100 ? "완료됨" : (isExpanded ? "접기" : "계속하기")}
                    </Button>
                    {completionRate === 100 && (
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => generateReport(checklist.id)}
                      >
                        보고서
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
        </TabsContent>

        {/* 이력 조회 */}
        <TabsContent value="history" className="space-y-6">
          {/* 필터링 옵션 */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>날짜 선택</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체 카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>검색</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="체크리스트 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedDate("");
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="w-full"
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          </Card>

          {historyLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">이력을 불러오는 중...</span>
            </div>
          ) : historyChecklists.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-3">
                <History className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-lg">체크리스트 이력이 없습니다</h3>
                <p className="text-muted-foreground">
                  {selectedDate ? 
                    `${formatDate(selectedDate)} 체크리스트 이력이 없습니다.` :
                    '검색 조건에 맞는 체크리스트 이력이 없습니다.'
                  }
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* 날짜별 그룹핑 */}
              {Object.entries(
                historyChecklists.reduce((groups: { [key: string]: Checklist[] }, checklist) => {
                  const date = checklist.date || '';
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(checklist);
                  return groups;
                }, {})
              ).map(([date, checklists]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium">{formatDate(date)} ({date})</h3>
                    <Badge variant="secondary">{checklists.length}개 완료</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {checklists.map((checklist) => {
                      const completedCount = checklist.items.filter(item => item.completed).length;
                      const completionRate = Math.round((completedCount / checklist.items.length) * 100);
                      
                      return (
                        <Card key={checklist.id} className="p-4 bg-gray-50">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="font-medium">{checklist.title}</h4>
                                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                  <span>{checklist.category}</span>
                                  <span>•</span>
                                  <span>{checklist.dueTime}</span>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                완료
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>완료율</span>
                                <span>{completedCount}/{checklist.items.length} ({completionRate}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                            </div>

                            {checklist.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                <div>완료일시: {new Date(checklist.completedAt).toLocaleString('ko-KR')}</div>
                                {checklist.completedBy && (
                                  <div>완료자: {checklist.completedBy}</div>
                                )}
                              </div>
                            )}

                            {/* 간단한 항목 미리보기 */}
                            <div className="space-y-1">
                              {checklist.items.slice(0, 2).map((item) => (
                                <div key={item.id} className="flex items-center space-x-2 text-sm">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  <span className="text-muted-foreground">
                                    {item.text.length > 30 ? item.text.substring(0, 30) + '...' : item.text}
                                  </span>
                                </div>
                              ))}
                              {checklist.items.length > 2 && (
                                <div className="text-xs text-muted-foreground text-center py-1">
                                  외 {checklist.items.length - 2}개 항목 완료
                                </div>
                              )}
                            </div>

                            {/* 상세보기 버튼 */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                  상세보기
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{checklist.title}</DialogTitle>
                                  <DialogDescription>
                                    {formatDate(date)} 완료된 체크리스트 상세 내용
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">카테고리:</span> {checklist.category}
                                    </div>
                                    <div>
                                      <span className="font-medium">예정 시간:</span> {checklist.dueTime}
                                    </div>
                                    {checklist.completedAt && (
                                      <div>
                                        <span className="font-medium">완료 시간:</span> {new Date(checklist.completedAt).toLocaleString('ko-KR')}
                                      </div>
                                    )}
                                    {checklist.completedBy && (
                                      <div>
                                        <span className="font-medium">완료자:</span> {checklist.completedBy}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-medium">체크리스트 항목</h4>
                                    <div className="space-y-2">
                                      {checklist.items.map((item) => (
                                        <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded border">
                                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                                          <div className="flex-1 space-y-1">
                                            <p className="text-sm">{item.text}</p>
                                            {item.notes && (
                                              <p className="text-xs text-muted-foreground bg-white p-2 rounded">
                                                메모: {item.notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}