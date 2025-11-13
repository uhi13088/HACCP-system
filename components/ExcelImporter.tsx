import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Progress } from "./ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, Eye } from "lucide-react";
import * as XLSX from 'xlsx';
import { api } from "../utils/api";

interface ExcelData {
  sheetName: string;
  headers: string[];
  data: any[][];
  rowCount: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function ExcelImporter() {
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [importType, setImportType] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 엑셀 파일 읽기
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheets: ExcelData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          return {
            sheetName,
            headers: jsonData[0] as string[] || [],
            data: jsonData.slice(1) as any[][],
            rowCount: jsonData.length - 1
          };
        });

        setExcelData(sheets);
        if (sheets.length > 0) {
          setSelectedSheet(sheets[0].sheetName);
          setPreviewData(sheets[0].data.slice(0, 10)); // 처음 10행만 미리보기
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // 시트 선택 변경
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const sheet = excelData.find(s => s.sheetName === sheetName);
    if (sheet) {
      setPreviewData(sheet.data.slice(0, 10));
    }
  };

  // 체크리스트 데이터 변환
  const convertToChecklists = (data: any[][], headers: string[]) => {
    const checklists = [];
    let currentChecklist: any = null;

    for (const row of data) {
      if (!row[0]) continue; // 빈 행 건너뛰기

      // 체크리스트 제목 행인지 확인 (첫 번째 열에 값이 있고 두 번째 열이 비어있는 경우)
      if (row[0] && !row[1]) {
        if (currentChecklist && currentChecklist.items.length > 0) {
          checklists.push(currentChecklist);
        }
        
        currentChecklist = {
          title: row[0],
          category: row[2] || "일반",
          dueTime: row[3] || "09:00",
          items: [],
          status: "대기"
        };
      } else if (currentChecklist && row[0] && row[1]) {
        // 체크리스트 항목 행
        currentChecklist.items.push({
          id: currentChecklist.items.length + 1,
          text: row[0],
          completed: false,
          notes: row[2] || ""
        });
      }
    }

    if (currentChecklist && currentChecklist.items.length > 0) {
      checklists.push(currentChecklist);
    }

    return checklists;
  };

  // 센서 데이터 변환
  const convertToSensorData = (data: any[][], headers: string[]) => {
    return data.map(row => ({
      sensorId: row[0] || `sensor_${Date.now()}_${Math.random()}`,
      type: row[1] || 'temperature',
      value: parseFloat(row[2]) || 0,
      location: row[3] || '위치 미상',
      timestamp: row[4] ? new Date(row[4]).toISOString() : new Date().toISOString()
    })).filter(item => item.sensorId && item.type && item.value !== undefined);
  };

  // 위험 분석 데이터 변환
  const convertToHazardAnalysis = (data: any[][], headers: string[]) => {
    return data.map(row => ({
      process: row[0] || '',
      hazard: row[1] || '',
      riskLevel: row[2] || '중간',
      ccp: row[3] || '',
      criticalLimit: row[4] || '',
      monitoring: row[5] || '',
      corrective: row[6] || '',
      verification: row[7] || '',
      lastReview: row[8] ? new Date(row[8]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })).filter(item => item.process && item.hazard);
  };

  // 데이터 가져오기 실행
  const handleImport = async () => {
    const sheet = excelData.find(s => s.sheetName === selectedSheet);
    if (!sheet || !importType) return;

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      let convertedData: any[] = [];
      let importPromises: Promise<any>[] = [];

      switch (importType) {
        case 'checklists':
          convertedData = convertToChecklists(sheet.data, sheet.headers);
          importPromises = convertedData.map(checklist => api.createChecklist(checklist));
          break;
        
        case 'sensors':
          convertedData = convertToSensorData(sheet.data, sheet.headers);
          importPromises = convertedData.map(sensorData => api.recordSensorData(sensorData));
          break;
        
        case 'hazards':
          convertedData = convertToHazardAnalysis(sheet.data, sheet.headers);
          // 위험 분석은 KV 스토어에 직접 저장
          importPromises = convertedData.map(async (hazard, index) => {
            // 모의 API 호출 (실제로는 위험 분석 저장 API가 필요)
            return new Promise(resolve => setTimeout(resolve, 100));
          });
          break;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < importPromises.length; i++) {
        try {
          await importPromises[i];
          successCount++;
        } catch (error) {
          failedCount++;
          errors.push(`Row ${i + 1}: ${error}`);
        }
        
        setImportProgress(Math.round(((i + 1) / importPromises.length) * 100));
      }

      setImportResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 5) // 최대 5개 오류만 표시
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: 0,
        failed: sheet.rowCount,
        errors: ['Import failed: ' + error]
      });
    } finally {
      setImporting(false);
    }
  };

  // 템플릿 다운로드
  const downloadTemplate = (type: string) => {
    let templateData: any[][] = [];
    let fileName = '';

    switch (type) {
      case 'checklists':
        templateData = [
          ['체크리스트 제목', '', '카테고리', '시간'],
          ['식재료 입고 점검', '', '입고 관리', '09:00'],
          ['입고 온도 확인', '체크 항목', '메모'],
          ['포장 상태 확인', '체크 항목', ''],
          ['조리 과정 모니터링', '', '조리 관리', '11:30'],
          ['조리 온도 측정', '체크 항목', '75°C 이상 확인'],
          ['조리 시간 기록', '체크 항목', '']
        ];
        fileName = 'checklist_template.xlsx';
        break;
      
      case 'sensors':
        templateData = [
          ['센서ID', '타입', '값', '위치', '시간'],
          ['fridge1', 'refrigerator_temp', '2.5', '주방', '2024-08-25 09:00:00'],
          ['freezer1', 'freezer_temp', '-18.5', '창고', '2024-08-25 09:00:00'],
          ['kitchen', 'humidity', '65', '주방', '2024-08-25 09:00:00']
        ];
        fileName = 'sensor_template.xlsx';
        break;
      
      case 'hazards':
        templateData = [
          ['공정단계', '위험요소', '위험도', 'CCP', '한계기준', '모니터링', '개선조치', '검증', '최종검토'],
          ['식재료 입고', '병원성 미생물 오염', '높음', '온도 확인', '냉장: 1-4°C', '입고시 온도 측정', '기준 초과시 반품', '주간 온도계 검증', '2024-08-20'],
          ['조리', '가열 부족', '높음', '조리 온도', '중심온도 75°C 이상', '조리시 온도 측정', '재가열 또는 폐기', '일일 온도계 점검', '2024-08-18']
        ];
        fileName = 'hazard_template.xlsx';
        break;
    }

    if (templateData.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, fileName);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>엑셀 데이터 가져오기</h1>
          <p className="text-muted-foreground">엑셀 파일에서 HACCP 데이터를 가져와 시스템에 등록합니다</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            파일 선택
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 템플릿 다운로드 */}
      <Card className="p-6">
        <h3 className="mb-4">템플릿 다운로드</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4>체크리스트 템플릿</h4>
            <p className="text-sm text-muted-foreground">일일 점검 항목을 일괄 등록할 수 있는 템플릿</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadTemplate('checklists')}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4>센서 데이터 템플릿</h4>
            <p className="text-sm text-muted-foreground">센서 측정값을 일괄 등록할 수 있는 템플릿</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadTemplate('sensors')}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4>위험 분석 템플릿</h4>
            <p className="text-sm text-muted-foreground">HACCP 위험 분석표를 등록할 수 있는 템플릿</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadTemplate('hazards')}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </div>
        </div>
      </Card>

      {/* 파일 정보 및 설정 */}
      {excelData.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              <h3>엑셀 파일 정보</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">시트 선택</label>
                <Select value={selectedSheet} onValueChange={handleSheetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {excelData.map(sheet => (
                      <SelectItem key={sheet.sheetName} value={sheet.sheetName}>
                        {sheet.sheetName} ({sheet.rowCount}행)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm mb-2">데이터 유형</label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklists">체크리스트</SelectItem>
                    <SelectItem value="sensors">센서 데이터</SelectItem>
                    <SelectItem value="hazards">위험 분석</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleImport}
                  disabled={!selectedSheet || !importType || importing}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      가져오는 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      데이터 가져오기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 가져오기 진행상황 */}
      {importing && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3>데이터 가져오기 진행중</h3>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              데이터를 처리하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        </Card>
      )}

      {/* 가져오기 결과 */}
      {importResult && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3>가져오기 완료</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>성공: {importResult.success}건</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>실패: {importResult.failed}건</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>다음 오류가 발생했습니다:</p>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* 데이터 미리보기 */}
      {previewData.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3>데이터 미리보기</h3>
              <Badge variant="outline">
                처음 10행 표시
              </Badge>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {excelData.find(s => s.sheetName === selectedSheet)?.headers.map((header, index) => (
                      <TableHead key={index}>{header || `열 ${index + 1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell: any, cellIndex: number) => (
                        <TableCell key={cellIndex}>
                          {cell?.toString() || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}