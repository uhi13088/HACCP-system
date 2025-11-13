import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Settings,
  Copy,
  X
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { BackupStructureManager } from "./BackupStructureManager";
import { CCPMultiSheetManager } from "./CCPMultiSheetManager";

// 백업 관련 인터페이스
interface MenuBackupConfig {
  id: string;
  menuId: string;
  menuName: string;
  spreadsheetId: string;
  isConnected: boolean;
  lastBackup: string | null;
  lastTest: string | null;
}

interface BackupStructure {
  id?: string;
  documentType: string;
  spreadsheetId: string;
  sheets: BackupSheet[];
  enabled: boolean;
  lastModified: string;
  createdBy: string;
  useDefaultSpreadsheet?: boolean;
}

interface BackupSheet {
  id: string;
  name: string;
  fields: BackupField[];
  enabled: boolean;
}

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

export function BackupManagement() {
  const [activeTab, setActiveTab] = useState("menu");
  
  // 메뉴별 백업 설정 상태
  const [menuBackupConfigs, setMenuBackupConfigs] = useState<MenuBackupConfig[]>([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [newSpreadsheetId, setNewSpreadsheetId] = useState('');
  const [menuBackupLoading, setMenuBackupLoading] = useState(false);
  const [showAddMenuDialog, setShowAddMenuDialog] = useState(false);
  
  // 백업 구조 설정 상태
  const [backupStructures, setBackupStructures] = useState<BackupStructure[]>([]);
  
  // CCP 다중 시트 관리 상태
  const [showCCPMultiSheetManager, setShowCCPMultiSheetManager] = useState(false);
  const [ccpSpreadsheetId, setCcpSpreadsheetId] = useState('');

  // 백업 가능한 메뉴 목록
  const backupableMenus = [
    // 메인
    { id: 'dashboard', name: '대시보드' },
    { id: 'checklist', name: '체크리스트' },
    { id: 'ccp', name: 'CCP 관리' },
    { id: 'monitoring', name: '환경 모니터링' },
    { id: 'analysis', name: '위험 분석' },
    
    // 일간문서
    { id: 'production-log', name: '생산일지' },
    { id: 'temperature-log', name: '냉장냉동고 온도기록부' },
    { id: 'cleaning-log', name: '세척·소독 기록부' },
    { id: 'receiving-log', name: '원료입고 검수기록부' },
    
    // 주간문서
    { id: 'pest-control', name: '방충·방서 주간점검표' },
    { id: 'facility-inspection', name: '시설점검 주간체크리스트' },
    
    // 월간문서
    { id: 'training-record', name: '교육훈련 기록부' },
    
    // 각종문서
    { id: 'visitor-log', name: '외부인출입관리대장' },
    { id: 'accident-report', name: '사고보고서' },
    { id: 'supplier', name: '공급업체 관리' },
    
    // 시스템
    { id: 'excel-import', name: '엑셀 가져오기' },
    { id: 'diagnostics', name: '서버 진단' },
    { id: 'admin', name: '시스템 관리' }
  ];

  // 초기 데이터 로드
  useEffect(() => {
    loadMenuBackupConfigs();
  }, []);

  const loadMenuBackupConfigs = async () => {
    try {
      console.log('📖 Loading menu backup configurations...');
      const result = await api.getMenuBackupConfigs();
      
      if (result.success && result.data && Array.isArray(result.data)) {
        const configs = result.data.map((config: any) => ({
          id: config.menu_id,
          menuId: config.menu_id,
          menuName: config.menu_name,
          spreadsheetId: config.spreadsheet_id,
          isConnected: config.is_connected || false,
          lastBackup: config.last_backup,
          lastTest: config.last_test
        }));
        
        setMenuBackupConfigs(configs);
        console.log('✅ Menu backup configurations loaded:', configs.length);
        
        // 자동 연결 테스트 실행
        if (configs.length > 0) {
          autoTestAllConnections();
        }
      } else {
        console.log('⚠️ No menu backup configurations found or data is not an array:', result.data);
        setMenuBackupConfigs([]);
      }
    } catch (error) {
      console.error('❌ Failed to load menu backup configs:', error);
      setMenuBackupConfigs([]);
    }
  };

  // 메뉴별 백업 설정 추가
  const handleAddMenuBackupConfig = async () => {
    if (!selectedMenu || !newSpreadsheetId.trim()) {
      toast.error('메뉴와 스프레드시트 ID를 모두 입력해주세요.');
      return;
    }

    // 이미 설정된 메뉴인지 확인
    if (menuBackupConfigs.some(config => config.menuId === selectedMenu)) {
      toast.error('이미 해당 메뉴의 백업 설정이 존재합니다.');
      return;
    }

    setMenuBackupLoading(true);
    try {
      const menuName = backupableMenus.find(menu => menu.id === selectedMenu)?.name || selectedMenu;
      
      console.log('💾 Adding menu backup configuration:', {
        menuId: selectedMenu,
        menuName,
        spreadsheetId: newSpreadsheetId.trim()
      });

      const result = await api.addMenuBackupConfig({
        menuId: selectedMenu,
        menuName,
        spreadsheetId: newSpreadsheetId.trim()
      });

      if (result.success) {
        toast.success(`${menuName} 백업 설정이 추가되었습니다.`);
        await loadMenuBackupConfigs();
        setSelectedMenu('');
        setNewSpreadsheetId('');
        setShowAddMenuDialog(false);
      } else {
        toast.error(result.error || '백업 설정 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding menu backup config:', error);
      toast.error('백업 설정 추가 중 오류가 발생했습니다.');
    } finally {
      setMenuBackupLoading(false);
    }
  };

  // 연결 테스트
  const testConnection = async (config: MenuBackupConfig) => {
    try {
      console.log(`🔍 Testing connection for ${config.menuName}...`);
      
      const result = await api.testBackupConnection({
        menuId: config.menuId,
        spreadsheetId: config.spreadsheetId
      });

      if (result.success) {
        console.log(`✅ Connection test passed for ${config.menuName}`);
        
        // 상태 업데이트
        setMenuBackupConfigs(prev => 
          prev.map(c => 
            c.id === config.id 
              ? { ...c, isConnected: true, lastTest: new Date().toISOString() }
              : c
          )
        );
        
        toast.success(`${config.menuName} 연결 테스트 성공`);
      } else {
        console.log(`❌ Connection test failed for ${config.menuName}:`, result.error);
        
        // 상태 업데이트
        setMenuBackupConfigs(prev => 
          prev.map(c => 
            c.id === config.id 
              ? { ...c, isConnected: false, lastTest: new Date().toISOString() }
              : c
          )
        );
        
        toast.error(`${config.menuName} 연결 테스트 실패: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error testing connection for ${config.menuName}:`, error);
      toast.error(`연결 테스트 중 오류가 발생했습니다: ${config.menuName}`);
    }
  };

  // 모든 연결 자동 테스트
  const autoTestAllConnections = async () => {
    console.log('🔄 Starting automatic connection tests for all configurations...');
    
    for (const config of menuBackupConfigs) {
      if (config.spreadsheetId && config.spreadsheetId.trim()) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms 딜레이
        await testConnection(config);
      }
    }
    
    console.log('✅ Automatic connection tests completed');
  };

  // 백업 설정 삭제
  const handleDeleteConfig = async (configId: string) => {
    try {
      const config = menuBackupConfigs.find(c => c.id === configId);
      if (!config) return;

      const result = await api.deleteMenuBackupConfig(configId);
      
      if (result.success) {
        setMenuBackupConfigs(prev => prev.filter(c => c.id !== configId));
        toast.success(`${config.menuName} 백업 설정이 삭제되었습니다.`);
      } else {
        toast.error(result.error || '백업 설정 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting backup config:', error);
      toast.error('백업 설정 삭제 중 오류가 발생했습니다.');
    }
  };

  // 스프레드시트 ID에서 스프레드시트 URL 생성
  const getSpreadsheetUrl = (spreadsheetId: string) => {
    if (!spreadsheetId) return '';
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  };

  // CCP 다중 시트 관리 열기
  const handleOpenCCPMultiSheetManager = () => {
    const ccpConfig = menuBackupConfigs.find(config => config.menuId === 'ccp');
    if (!ccpConfig || !ccpConfig.spreadsheetId) {
      toast.error('CCP 관리 백업 설정을 먼저 추가해주세요.');
      return;
    }
    
    setCcpSpreadsheetId(ccpConfig.spreadsheetId);
    setShowCCPMultiSheetManager(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">백업 관리</h2>
        <p className="text-muted-foreground">
          Google Sheets 백업 설정을 관리하고 백업 구조를 설정합니다.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu">메뉴별 백업</TabsTrigger>
          <TabsTrigger value="structure">백업 구조</TabsTrigger>
        </TabsList>

        {/* 메뉴별 백업 설정 */}
        <TabsContent value="menu" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium">메뉴별 백업 설정</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  각 메뉴별로 Google Sheets 백업 설정을 관리합니다.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={autoTestAllConnections}
                  disabled={menuBackupConfigs.length === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  전체 테스트
                </Button>
                <Button onClick={() => setShowAddMenuDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  메뉴 추가
                </Button>
              </div>
            </div>

            {/* 메뉴별 백업 설정 목록 */}
            <div className="space-y-4">
              {menuBackupConfigs.map((config) => (
                <Card key={config.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{config.menuName}</h4>
                          <Badge 
                            variant={config.isConnected ? "default" : "secondary"}
                            className={config.isConnected ? "bg-green-100 text-green-800" : ""}
                          >
                            {config.isConnected ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                연결됨
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                미연결
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>스프레드시트 ID: {config.spreadsheetId}</span>
                          {config.spreadsheetId && (
                            <a
                              href={getSpreadsheetUrl(config.spreadsheetId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              열기
                            </a>
                          )}
                        </div>
                        
                        {/* CCP 관리 특별 안내 */}
                        {config.menuId === 'ccp' && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 mt-2">
                            <p className="text-xs">
                              💡 CCP 관리는 공정별로 다중 시트를 지원합니다. "다중 시트 관리" 버튼으로 각 공정별 시트를 설정하세요.
                            </p>
                          </div>
                        )}
                        
                        {config.lastTest && (
                          <div>
                            마지막 테스트: {new Date(config.lastTest).toLocaleString('ko-KR')}
                          </div>
                        )}
                        {config.lastBackup && (
                          <div>
                            마지막 백업: {new Date(config.lastBackup).toLocaleString('ko-KR')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* CCP 관리인 경우 다중 시트 관리 버튼 추가 */}
                      {config.menuId === 'ccp' && (
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenCCPMultiSheetManager}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          다중 시트 관리
                        </Button>
                      )}
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => testConnection(config)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        테스트
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {menuBackupConfigs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">백업 설정이 없습니다</h3>
                  <p className="text-sm">새 메뉴 백업을 추가하여 시작하세요.</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 백업 구조 설정 */}
        <TabsContent value="structure" className="space-y-6">
          <BackupStructureManager 
            onStructureChange={setBackupStructures} 
          />
        </TabsContent>
      </Tabs>

      {/* 메뉴 추가 다이얼로그 */}
      <Dialog open={showAddMenuDialog} onOpenChange={setShowAddMenuDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 메뉴 백업 설정</DialogTitle>
            <DialogDescription>
              백업할 메뉴와 Google Sheets ID를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu">메뉴 선택</Label>
              <select
                id="menu"
                value={selectedMenu}
                onChange={(e) => setSelectedMenu(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">메뉴를 선택하세요</option>
                {backupableMenus
                  .filter(menu => !menuBackupConfigs.some(config => config.menuId === menu.id))
                  .map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spreadsheetId">Google Sheets ID</Label>
              <Input
                id="spreadsheetId"
                placeholder="예: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={newSpreadsheetId}
                onChange={(e) => setNewSpreadsheetId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Google Sheets URL에서 /d/ 뒤의 긴 문자열을 입력하세요.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMenuDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={handleAddMenuBackupConfig} 
              disabled={menuBackupLoading || !selectedMenu || !newSpreadsheetId.trim()}
            >
              {menuBackupLoading ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CCP 다중 시트 관리 다이얼로그 */}
      <Dialog 
        open={showCCPMultiSheetManager} 
        onOpenChange={(open) => {
          setShowCCPMultiSheetManager(open);
          if (!open) {
            setCcpSpreadsheetId('');
          }
        }}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] p-0">
          <div className="p-6">
            <CCPMultiSheetManager 
              ccpSpreadsheetId={ccpSpreadsheetId}
              onClose={() => setShowCCPMultiSheetManager(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}