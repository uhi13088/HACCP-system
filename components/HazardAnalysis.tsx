import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertTriangle, Shield, FileText, Plus, Eye, Download, Calendar } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function HazardAnalysis() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // 새 보고서 작성
  const handleNewReport = () => {
    toast.info("새 보고서 작성", {
      description: "새 보고서 작성 기능이 곧 제공될 예정입니다.",
      duration: 3000
    });
  };

  // HACCP 플랜 다운로드
  const handleDownloadPlan = () => {
    toast.success("HACCP 플랜 다운로드", {
      description: "HACCP 플랜 다운로드를 시작합니다.",
      duration: 3000
    });
  };

  // 보고서 보기
  const handleViewReport = (reportId: string) => {
    setSelectedReport(reportId);
    toast.info("보고서 조회", {
      description: `보고서 ${reportId}를 조회합니다.`,
      duration: 3000
    });
  };

  // 보고서 다운로드
  const handleDownloadReport = (reportId: string, title: string) => {
    toast.success("보고서 다운로드", {
      description: `"${title}" 보고서를 다운로드합니다.`,
      duration: 3000
    });
  };

  const hazards = [
    {
      id: 1,
      process: "식재료 입고",
      hazard: "병원성 미생물 오염",
      riskLevel: "높음",
      ccp: "온도 확인",
      criticalLimit: "냉장: 1-4°C, 냉동: -18°C 이하",
      monitoring: "입고시 온도 측정",
      corrective: "기준 초과시 반품 또는 격리",
      verification: "주간 온도계 검증",
      lastReview: "2024-08-20"
    },
    {
      id: 2,
      process: "조리",
      hazard: "가열 부족으로 인한 미생물 생존",
      riskLevel: "높음",
      ccp: "조리 온도",
      criticalLimit: "중심온도 75°C 이상",
      monitoring: "조리시 온도 측정",
      corrective: "재가열 또는 폐기",
      verification: "일일 온도계 점검",
      lastReview: "2024-08-18"
    },
    {
      id: 3,
      process: "보관",
      hazard: "온도 상승으로 인한 미생물 증식",
      riskLevel: "중간",
      ccp: "보관 온도",
      criticalLimit: "냉장: 1-4°C, 냉동: -18°C 이하",
      monitoring: "2시간마다 온도 확인",
      corrective: "온도 조정 또는 이전",
      verification: "일일 기록 검토",
      lastReview: "2024-08-19"
    },
    {
      id: 4,
      process: "배식",
      hazard: "교차오염",
      riskLevel: "중간",
      ccp: "위생 관리",
      criticalLimit: "손 세정, 도구 구분 사용",
      monitoring: "배식 전 위생 점검",
      corrective: "재교육 및 즉시 개선",
      verification: "주간 위생 감사",
      lastReview: "2024-08-17"
    }
  ];

  const reports = [
    {
      id: 1,
      title: "8월 HACCP 월간 보고서",
      period: "2024-08-01 ~ 2024-08-31",
      type: "월간",
      status: "작성중",
      progress: 75,
      createdDate: "2024-08-25",
      summary: "8월 한달간의 HACCP 관리 현황 및 개선사항"
    },
    {
      id: 2,
      title: "냉동고 온도 이상 보고서",
      period: "2024-08-24",
      type: "사고",
      status: "완료",
      progress: 100,
      createdDate: "2024-08-24",
      summary: "냉동고 온도 상승 사고에 대한 원인 분석 및 대응 보고"
    },
    {
      id: 3,
      title: "7월 HACCP 월간 보고서",
      period: "2024-07-01 ~ 2024-07-31",
      type: "월간",
      status: "완료",
      progress: 100,
      createdDate: "2024-08-01",
      summary: "7월 한달간의 HACCP 관리 현황 종합 보고"
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "높음": return "bg-red-100 text-red-800";
      case "중간": return "bg-yellow-100 text-yellow-800";
      case "낮음": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료": return "bg-green-100 text-green-800";
      case "작성중": return "bg-yellow-100 text-yellow-800";
      case "검토중": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>위험 분석 및 보고서</h1>
          <p className="text-muted-foreground">HACCP 위험 요소를 분석하고 보고서를 관리합니다</p>
        </div>
        <Button onClick={handleNewReport}>
          <Plus className="w-4 h-4 mr-2" />
          새 보고서 작성
        </Button>
      </div>

      <Tabs defaultValue="hazard-analysis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hazard-analysis">위험 분석</TabsTrigger>
          <TabsTrigger value="reports">보고서 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="hazard-analysis" className="space-y-6">
          {/* 위험 분석 개요 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">높은 위험</p>
                  <p className="text-2xl">2</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">중간 위험</p>
                  <p className="text-2xl">2</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">낮은 위험</p>
                  <p className="text-2xl">0</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">총 CCP</p>
                  <p className="text-2xl">4</p>
                </div>
              </div>
            </Card>
          </div>

          {/* 위험 분석 테이블 */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3>위험 요소 분석표 (Hazard Analysis)</h3>
              <Button variant="outline" onClick={handleDownloadPlan}>
                <Download className="w-4 h-4 mr-2" />
                HACCP 플랜 다운로드
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>공정단계</TableHead>
                    <TableHead>위험요소</TableHead>
                    <TableHead>위험도</TableHead>
                    <TableHead>CCP</TableHead>
                    <TableHead>한계기준</TableHead>
                    <TableHead>모니터링</TableHead>
                    <TableHead>개선조치</TableHead>
                    <TableHead>검증</TableHead>
                    <TableHead>최종검토</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hazards.map((hazard) => (
                    <TableRow key={hazard.id}>
                      <TableCell>{hazard.process}</TableCell>
                      <TableCell className="max-w-48">
                        <div className="truncate" title={hazard.hazard}>
                          {hazard.hazard}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(hazard.riskLevel)}>
                          {hazard.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>{hazard.ccp}</TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={hazard.criticalLimit}>
                          {hazard.criticalLimit}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={hazard.monitoring}>
                          {hazard.monitoring}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={hazard.corrective}>
                          {hazard.corrective}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={hazard.verification}>
                          {hazard.verification}
                        </div>
                      </TableCell>
                      <TableCell>{hazard.lastReview}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>위험 요소 상세 정보</DialogTitle>
                              <DialogDescription>
                                HACCP 위험 요소의 상세 정보를 확인하세요.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>공정단계</Label>
                                  <p className="mt-1">{hazard.process}</p>
                                </div>
                                <div>
                                  <Label>위험도</Label>
                                  <div className="mt-1">
                                    <Badge className={getRiskColor(hazard.riskLevel)}>
                                      {hazard.riskLevel}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label>위험요소</Label>
                                <p className="mt-1">{hazard.hazard}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>CCP</Label>
                                  <p className="mt-1">{hazard.ccp}</p>
                                </div>
                                <div>
                                  <Label>한계기준</Label>
                                  <p className="mt-1">{hazard.criticalLimit}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label>모니터링 방법</Label>
                                <p className="mt-1">{hazard.monitoring}</p>
                              </div>
                              
                              <div>
                                <Label>개선조치</Label>
                                <p className="mt-1">{hazard.corrective}</p>
                              </div>
                              
                              <div>
                                <Label>검증</Label>
                                <p className="mt-1">{hazard.verification}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* 보고서 목록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3>{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.period}</p>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>진행률</span>
                      <span>{report.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${report.progress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{report.summary}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{report.createdDate}</span>
                    </div>
                    <Badge variant="outline">{report.type}</Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewReport(report.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      보기
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleNewReport()}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      편집
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadReport(report.id, report.title)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 새 보고서 작성 양식 */}
          <Card className="p-6">
            <h3 className="mb-4">새 보고서 작성</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report-title">보고서 제목</Label>
                <Input id="report-title" placeholder="보고서 제목을 입력하세요" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="report-type">보고서 유형</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">일일 보고서</SelectItem>
                    <SelectItem value="weekly">주간 보고서</SelectItem>
                    <SelectItem value="monthly">월간 보고서</SelectItem>
                    <SelectItem value="incident">사고 보고서</SelectItem>
                    <SelectItem value="audit">감사 보고서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-period">보고 기간</Label>
                <Input id="report-period" type="date" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="report-priority">우선순위</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="우선순위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="low">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="report-summary">요약</Label>
                <Textarea 
                  id="report-summary" 
                  placeholder="보고서 내용 요약을 입력하세요"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline">초안 저장</Button>
              <Button>보고서 작성 시작</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}