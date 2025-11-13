import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Checkbox } from "./ui/checkbox";
import {
  User,
  Download,
  Settings as SettingsIcon,
  Save,
  Shield,
  Plus,
  Edit,
  Trash2,
  Thermometer,
  Timer,
  Droplets,
  Zap,
  Check,
  X,
  UserCircle,
  Mail,
  Key,
  UserCog,
  AlertTriangle,
  Edit2,
  Eye,
  Crown,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { BackupStructureManager } from "./BackupStructureManager";
import { 
  loadCCPTypes, 
  saveCCPTypes, 
  addCCPType, 
  updateCCPType, 
  deleteCCPType,
  type CCPType,
  type CCPFieldSetting
} from "../utils/ccpTypes";

export function SettingsMinimal() {
  const { user, hasRole } = useAuth();

  // 프로필 설정
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: '',
  });

  // 프로젝트 정보 및 다운로드 상태
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 계정 관리 상태
  const [accountForm, setAccountForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    name: ''
  });



  // 공급업체 관리 상태
  const [suppliers, setSuppliers] = useState<Array<{
    id: string;
    name: string;
    category: string;
    contact: string;
    phone: string;
    address: string;
    notes: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
  }>>([]);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    category: 'general',
    contact: '',
    phone: '',
    address: '',
    notes: ''
  });

  // CCP 타입 관리 상태
  const [ccpTypes, setCcpTypes] = useState<CCPType[]>([]);
  const [showCCPTypeDialog, setShowCCPTypeDialog] = useState(false);
  const [editingCCPType, setEditingCCPType] = useState<CCPType | null>(null);
  const [newCCPType, setNewCCPType] = useState<CCPType>({
    id: '',
    name: '',
    color: 'blue',
    settings: {
      requiredFields: [],
      fieldSettings: [],
      description: '',
      alertEnabled: true
    }
  });



  // 삭제 확인 다이얼로그
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = () => {
      loadProjectInfo();
      loadCCPTypesData();
      
      // 공급업체 로드는 약간의 지연을 둠 (서버 준비 시간 확보)
      setTimeout(() => {
        loadSuppliers();
      }, 1000);
    };

    loadInitialData();
  }, []);

  // 프로젝트 정보 로드
  const loadProjectInfo = async () => {
    try {
      const result = await api.getProjectInfo();
      if (result) {
        setProjectInfo(result);
      }
    } catch (error) {
      console.error('Failed to load project info:', error);
      // 프로젝트 정보 로드 실패는 치명적이지 않으므로 무시
    }
  };



  // 공급업체 목록 로드
  const loadSuppliers = async () => {
    try {
      console.log('🔍 Loading suppliers data...');
      
      const data = await api.getSuppliers();
      console.log('📄 Suppliers API response:', data);
      
      if (data && data.success) {
        setSuppliers(data.data || []);
        console.log(`✅ Loaded ${data.data?.length || 0} suppliers`);
      } else {
        console.warn('Suppliers response was not successful:', data);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('❌ Failed to load suppliers:', error);
      setSuppliers([]);
      
      toast.error('공급업체 목록을 불러올 수 없습니다', {
        description: '모킹 데이터를 사용합니다.',
        duration: 3000
      });
    }
  };

  // 프로필 저장
  const handleSaveProfile = () => {
    try {
      // 실제로는 API 호출
      toast.success('프로필이 저장되었습니다.');
    } catch (error) {
      toast.error('프로필 저장에 실패했습니다.');
    }
  };

  // 전체 코드 다운로드
  const handleDownloadProject = async () => {
    setIsDownloading(true);
    try {
      toast.info('프로젝트 파일을 준비중입니다...', {
        description: '잠시만 기다려주세요.',
        duration: 3000,
      });

      // 직접 fetch를 사용하여 blob 응답을 받음
      const response = await api.request('/export/project-source', {
        method: 'GET',
        responseType: 'blob'
      });
      
      if (response && response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `smart-haccp-source-${timestamp}.txt`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('프로젝트 코드가 다운로드되었습니다!', {
          description: '다운로드된 파일을 통해 전체 소스코드를 확인할 수 있습니다.',
          duration: 5000,
        });
      } else {
        throw new Error('다운로드 응답이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('다운로드에 실패했습니다.', {
        description: '서버 연결을 확인하고 다시 시도해주세요.',
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // 공급업체 관련 함수들
  const handleCreateSupplier = async () => {
    try {
      const response = await api.addSupplier(newSupplier);
      
      if (response.success) {
        toast.success('공급업체가 추가되었습니다.');
        setShowSupplierDialog(false);
        setNewSupplier({
          name: '',
          category: 'general',
          contact: '',
          phone: '',
          address: '',
          notes: ''
        });
        loadSuppliers();
      } else {
        throw new Error(response.error || 'Failed to create supplier');
      }
    } catch (error) {
      console.error('Failed to create supplier:', error);
      toast.error('공급업체 추가에 실패했습니다.', {
        description: error.message || '서버 연결을 확인해주세요.'
      });
    }
  };

  const handleUpdateSupplier = async () => {
    try {
      const response = await api.updateSupplier(editingSupplier.id, newSupplier);
      
      if (response.success) {
        toast.success('공급업체가 수정되었습니다.');
        setShowSupplierDialog(false);
        setEditingSupplier(null);
        setNewSupplier({
          name: '',
          category: 'general',
          contact: '',
          phone: '',
          address: '',
          notes: ''
        });
        loadSuppliers();
      } else {
        throw new Error(response.error || 'Failed to update supplier');
      }
    } catch (error) {
      console.error('Failed to update supplier:', error);
      toast.error('공급업체 수정에 실패했습니다.');
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteTarget) return;
    
    try {
      const response = await api.deleteSupplier(deleteTarget.id);
      
      if (response.success) {
        toast.success('공급업체가 삭제되었습니다.');
        loadSuppliers();
      } else {
        throw new Error(response.error || 'Failed to delete supplier');
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast.error('공급업체 삭제에 실패했습니다.');
    } finally {
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  // CCP 타입 관련 함수들
  const loadCCPTypesData = async () => {
    try {
      const types = loadCCPTypes(); // 동기 함수이므로 await 제거
      console.log('Loaded CCP types:', types); // 디버깅용 로그
      
      // 데이터 유효성 검증
      const validTypes = types.filter(type => 
        type && typeof type === 'object' && type.id && type.name && type.color
      );
      
      setCcpTypes(validTypes);
      console.log('Valid CCP types set:', validTypes.length);
    } catch (error) {
      console.error('Failed to load CCP types:', error);
      setCcpTypes([]); // 빈 배열로 설정하여 오류 방지
      toast.error('CCP 타입을 불러올 수 없습니다.');
    }
  };

  const handleCreateCCPType = () => {
    try {
      if (!newCCPType.id || !newCCPType.name) {
        toast.error('CCP 타입 ID와 이름을 입력해주세요.');
        return;
      }

      // 중복 ID 체크
      if (ccpTypes.some(type => type.id === newCCPType.id)) {
        toast.error('이미 사용 중인 CCP 타입 ID입니다.');
        return;
      }

      const newType = addCCPType(newCCPType); // 동기 함수이므로 await 제거
      setCcpTypes(prev => [...prev, newType]);
      
      setShowCCPTypeDialog(false);
      setNewCCPType({
        id: '',
        name: '',
        color: 'blue',
        settings: {
          requiredFields: [],
          fieldSettings: [],
          description: '',
          alertEnabled: true
        }
      });
      
      toast.success('CCP 타입이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to create CCP type:', error);
      toast.error('CCP 타입 추가에 실패했습니다.');
    }
  };

  const handleUpdateCCPType = () => {
    try {
      if (!editingCCPType) return;

      const updatedType = updateCCPType(editingCCPType.id, editingCCPType); // 동기 함수이므로 await 제거
      setCcpTypes(prev => prev.map(type => 
        type.id === editingCCPType.id ? updatedType : type
      ));
      
      setShowCCPTypeDialog(false);
      setEditingCCPType(null);
      toast.success('CCP 타입이 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update CCP type:', error);
      toast.error('CCP 타입 수정에 실패했습니다.');
    }
  };

  const handleDeleteCCPType = async () => {
    if (!deleteTarget) return;
    
    try {
      await deleteCCPType(deleteTarget.id);
      setCcpTypes(prev => prev.filter(type => type.id !== deleteTarget.id));
      toast.success('CCP 타입이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete CCP type:', error);
      toast.error('CCP 타입 삭제에 실패했습니다.');
    } finally {
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const addFieldSetting = (isEditing: boolean) => {
    const newField: CCPFieldSetting = {
      id: `field_${Date.now()}`,
      label: '새 필드',
      type: 'text',
      required: false,
      options: []
    };

    if (isEditing && editingCCPType) {
      setEditingCCPType(prev => ({
        ...prev!,
        settings: {
          ...prev!.settings,
          fieldSettings: [...(prev!.settings.fieldSettings || []), newField]
        }
      }));
    } else {
      setNewCCPType(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          fieldSettings: [...(prev.settings.fieldSettings || []), newField]
        }
      }));
    }
  };

  const removeFieldSetting = (index: number, isEditing: boolean) => {
    if (isEditing && editingCCPType) {
      setEditingCCPType(prev => ({
        ...prev!,
        settings: {
          ...prev!.settings,
          fieldSettings: prev!.settings.fieldSettings?.filter((_, i) => i !== index) || []
        }
      }));
    } else {
      setNewCCPType(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          fieldSettings: prev.settings.fieldSettings?.filter((_, i) => i !== index) || []
        }
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <p className="text-gray-600">Smart HACCP 시스템의 각종 설정을 관리합니다.</p>
        </div>
        
        {/* 상태 요약 */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">시스템 정상</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="backup-structure">백업 구조</TabsTrigger>
          <TabsTrigger value="ccp-types">CCP 타입</TabsTrigger>
          <TabsTrigger value="suppliers">공급업체</TabsTrigger>
          <TabsTrigger value="system">시스템</TabsTrigger>
        </TabsList>

        {/* 프로필 설정 */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCircle className="w-5 h-5" />
                <span>프로필 정보</span>
              </CardTitle>
              <CardDescription>
                개인 프로필 정보를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">이름</Label>
                  <Input
                    id="profileName"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">이메일</Label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">전화번호</Label>
                  <Input
                    id="profilePhone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profileDepartment">부서</Label>
                  <Input
                    id="profileDepartment"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="부서를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 백업 구조 관리 */}
        <TabsContent value="backup-structure" className="space-y-6">
          <BackupStructureManager />
        </TabsContent>

        {/* CCP 타입 관리 */}
        <TabsContent value="ccp-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>CCP 타입 관리</span>
                </div>
                <Button
                  onClick={() => {
                    setEditingCCPType(null);
                    setNewCCPType({
                      id: '',
                      name: '',
                      color: 'blue',
                      settings: {
                        requiredFields: [],
                        fieldSettings: [],
                        description: '',
                        alertEnabled: true
                      }
                    });
                    setShowCCPTypeDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  CCP 타입 추가
                </Button>
              </CardTitle>
              <CardDescription>
                중요관리점(CCP) 타입별 설정을 관리합니다. 각 타입별로 다른 기록 양식과 필드를 설정할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ccpTypes && ccpTypes.length > 0 ? ccpTypes.map((ccpType) => {
                  // 데이터 유효성 검증
                  if (!ccpType || !ccpType.id || !ccpType.name) {
                    console.warn('Invalid CCP type data:', ccpType);
                    return null;
                  }
                  
                  return (
                    <Card key={ccpType.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`
                            ${ccpType.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            ccpType.color === 'green' ? 'bg-green-100 text-green-800' :
                            ccpType.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            ccpType.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            ccpType.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}
                          `}>
                            {ccpType.id}
                          </Badge>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCCPType(ccpType);
                              setShowCCPTypeDialog(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'ccpType',
                                id: ccpType.id,
                                name: ccpType.name
                              });
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-base">{ccpType.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">필드 수:</span>
                          <span>{ccpType.settings.fieldSettings?.length || 0}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">알림:</span>
                          <span>{ccpType.settings.alertEnabled ? '활성' : '비활성'}</span>
                        </div>
                        {ccpType.settings.description && (
                          <p className="text-gray-600 text-xs mt-2 line-clamp-2">
                            {ccpType.settings.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                }).filter(Boolean) : (
                  <div className="col-span-full text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">CCP 타입을 로드하는 중...</h3>
                    <p className="text-gray-500">잠시만 기다려주세요.</p>
                  </div>
                )}
              </div>

              {ccpTypes && ccpTypes.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">CCP 타입이 없습니다</h3>
                  <p className="text-gray-500 mb-4">새로운 CCP 타입을 추가하여 시작해보세요.</p>
                  <Button onClick={() => setShowCCPTypeDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 번째 CCP 타입 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* 공급업체 관리 */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>공급업체 관리</span>
                </div>
                <Button
                  onClick={() => {
                    setEditingSupplier(null);
                    setNewSupplier({
                      name: '',
                      category: 'general',
                      contact: '',
                      phone: '',
                      address: '',
                      notes: ''
                    });
                    setShowSupplierDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  공급업체 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>업체명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {supplier.category === 'general' ? '일반' :
                           supplier.category === 'ingredient' ? '원재료' :
                           supplier.category === 'packaging' ? '포장재' :
                           supplier.category === 'equipment' ? '장비' : supplier.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{supplier.contact}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{new Date(supplier.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setNewSupplier({
                                name: supplier.name,
                                category: supplier.category,
                                contact: supplier.contact,
                                phone: supplier.phone,
                                address: supplier.address,
                                notes: supplier.notes
                              });
                              setShowSupplierDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'supplier',
                                id: supplier.id,
                                name: supplier.name
                              });
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 정보 */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>시스템 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시스템 버전</Label>
                  <p className="text-sm text-gray-600">v2.1.0</p>
                </div>
                <div>
                  <Label>빌드 날짜</Label>
                  <p className="text-sm text-gray-600">{new Date().toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <Label>환경</Label>
                  <p className="text-sm text-gray-600">Development</p>
                </div>
                <div>
                  <Label>데이터베이스</Label>
                  <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">프로젝트 내보내기</h3>
                <p className="text-sm text-gray-600">
                  전체 프로젝트 소스코드를 다운로드할 수 있습니다.
                </p>
                <Button 
                  onClick={handleDownloadProject}
                  disabled={isDownloading}
                  variant="outline"
                >
                  {isDownloading ? (
                    <>다운로드 중...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      소스코드 다운로드
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 공급업체 추가/수정 다이얼로그 */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? '공급업체 수정' : '공급업체 추가'}
            </DialogTitle>
            <DialogDescription>
              공급업체 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">업체명</Label>
              <Input
                id="supplierName"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                placeholder="공급업체명"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierCategory">카테고리</Label>
              <Select
                value={newSupplier.category}
                onValueChange={(value) => setNewSupplier(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="ingredient">원재료</SelectItem>
                  <SelectItem value="packaging">포장재</SelectItem>
                  <SelectItem value="equipment">장비</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierContact">담당자</Label>
              <Input
                id="supplierContact"
                value={newSupplier.contact}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="담당자명"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierPhone">연락처</Label>
              <Input
                id="supplierPhone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="전화번호"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierAddress">주소</Label>
              <Input
                id="supplierAddress"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                placeholder="공급업체 주소"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierNotes">비고</Label>
              <Textarea
                id="supplierNotes"
                value={newSupplier.notes}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="기타 특이사항"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingSupplier ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CCP 타입 추가/수정 다이얼로그 */}
      <Dialog open={showCCPTypeDialog} onOpenChange={setShowCCPTypeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCCPType ? 'CCP 타입 수정' : 'CCP 타입 추가'}
            </DialogTitle>
            <DialogDescription>
              CCP 타입별 설정과 필드를 정의합니다. 각 타입별로 고유한 기록 양식을 생성할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ccpTypeId">CCP 타입 ID</Label>
                <Input
                  id="ccpTypeId"
                  value={editingCCPType ? editingCCPType.id : newCCPType.id}
                  onChange={(e) => {
                    if (editingCCPType) {
                      setEditingCCPType(prev => ({ ...prev!, id: e.target.value }));
                    } else {
                      setNewCCPType(prev => ({ ...prev, id: e.target.value }));
                    }
                  }}
                  placeholder="예: oven_bread"
                  disabled={!!editingCCPType}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ccpTypeName">CCP 타입명</Label>
                <Input
                  id="ccpTypeName"
                  value={editingCCPType ? editingCCPType.name : newCCPType.name}
                  onChange={(e) => {
                    if (editingCCPType) {
                      setEditingCCPType(prev => ({ ...prev!, name: e.target.value }));
                    } else {
                      setNewCCPType(prev => ({ ...prev, name: e.target.value }));
                    }
                  }}
                  placeholder="예: 오븐공정_빵류"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ccpTypeColor">표시 색상</Label>
              <Select
                value={editingCCPType ? editingCCPType.color : newCCPType.color}
                onValueChange={(value) => {
                  if (editingCCPType) {
                    setEditingCCPType(prev => ({ ...prev!, color: value }));
                  } else {
                    setNewCCPType(prev => ({ ...prev, color: value }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">파란색</SelectItem>
                  <SelectItem value="green">녹색</SelectItem>
                  <SelectItem value="orange">주황색</SelectItem>
                  <SelectItem value="purple">보라색</SelectItem>
                  <SelectItem value="red">빨간색</SelectItem>
                  <SelectItem value="yellow">노란색</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ccpTypeDescription">설명</Label>
              <Textarea
                id="ccpTypeDescription"
                value={editingCCPType ? editingCCPType.settings.description || '' : newCCPType.settings.description || ''}
                onChange={(e) => {
                  if (editingCCPType) {
                    setEditingCCPType(prev => ({
                      ...prev!,
                      settings: {
                        ...prev!.settings,
                        description: e.target.value
                      }
                    }));
                  } else {
                    setNewCCPType(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        description: e.target.value
                      }
                    }));
                  }
                }}
                placeholder="CCP 타입에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>

            {/* 필드 설정 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">기록 필드 설정</Label>
                <Button
                  type="button" 
                  onClick={() => addFieldSetting(!!editingCCPType)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  필드 추가
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(editingCCPType ? editingCCPType.settings.fieldSettings || [] : newCCPType.settings.fieldSettings || []).map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">필드 #{index + 1}</Label>
                      <Button
                        type="button"
                        onClick={() => removeFieldSetting(index, !!editingCCPType)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">필드명</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const updatedFields = [...(editingCCPType ? editingCCPType.settings.fieldSettings || [] : newCCPType.settings.fieldSettings || [])];
                            updatedFields[index] = { ...field, label: e.target.value };
                            
                            if (editingCCPType) {
                              setEditingCCPType(prev => ({
                                ...prev!,
                                settings: { ...prev!.settings, fieldSettings: updatedFields }
                              }));
                            } else {
                              setNewCCPType(prev => ({
                                ...prev,
                                settings: { ...prev.settings, fieldSettings: updatedFields }
                              }));
                            }
                          }}
                          placeholder="필드명"
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">타입</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => {
                            const updatedFields = [...(editingCCPType ? editingCCPType.settings.fieldSettings || [] : newCCPType.settings.fieldSettings || [])];
                            updatedFields[index] = { ...field, type: value as any };
                            
                            if (editingCCPType) {
                              setEditingCCPType(prev => ({
                                ...prev!,
                                settings: { ...prev!.settings, fieldSettings: updatedFields }
                              }));
                            } else {
                              setNewCCPType(prev => ({
                                ...prev,
                                settings: { ...prev.settings, fieldSettings: updatedFields }
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">텍스트</SelectItem>
                            <SelectItem value="number">숫자</SelectItem>
                            <SelectItem value="temperature">온도</SelectItem>
                            <SelectItem value="time">시간</SelectItem>
                            <SelectItem value="select">선택</SelectItem>
                            <SelectItem value="checkbox">체크박스</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => {
                          const updatedFields = [...(editingCCPType ? editingCCPType.settings.fieldSettings || [] : newCCPType.settings.fieldSettings || [])];
                          updatedFields[index] = { ...field, required: !!checked };
                          
                          if (editingCCPType) {
                            setEditingCCPType(prev => ({
                              ...prev!,
                              settings: { ...prev!.settings, fieldSettings: updatedFields }
                            }));
                          } else {
                            setNewCCPType(prev => ({
                              ...prev,
                              settings: { ...prev.settings, fieldSettings: updatedFields }
                            }));
                          }
                        }}
                      />
                      <Label className="text-xs">필수 필드</Label>
                    </div>
                  </div>
                ))}

                {(editingCCPType ? editingCCPType.settings.fieldSettings || [] : newCCPType.settings.fieldSettings || []).length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    아직 추가된 필드가 없습니다. "필드 추가" 버튼을 클릭하여 필드를 추가해보세요.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCCPTypeDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={editingCCPType ? handleUpdateCCPType : handleCreateCCPType}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingCCPType ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name}을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTarget?.type === 'supplier') {
                handleDeleteSupplier();
              } else if (deleteTarget?.type === 'ccpType') {
                handleDeleteCCPType();
              }
            }}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}