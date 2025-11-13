import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  address: string;
  notes: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

const SUPPLIER_CATEGORIES = [
  { value: 'ingredient', label: '원료' },
  { value: 'packaging', label: '포장재' },
  { value: 'equipment', label: '장비' },
  { value: 'service', label: '서비스' },
  { value: 'general', label: '기타' }
];

const SUPPLIER_STATUSES = [
  { value: 'active', label: '활성', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: '비활성', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: '승인대기', color: 'bg-yellow-100 text-yellow-800' }
];

export function SupplierManager() {
  const { hasRole } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // 다이얼로그 상태
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contact: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active' as const
  });

  // 공급업체 목록 조회
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getSuppliers();
      
      if (response.success && Array.isArray(response.data)) {
        setSuppliers(response.data);
        setFilteredSuppliers(response.data);
      } else {
        setError('공급업체 데이터를 불러오는데 실패했습니다.');
        setSuppliers([]);
        setFilteredSuppliers([]);
      }
    } catch (error: any) {
      console.error('공급업체 조회 실패:', error);
      setError(error.message || '공급업체 데이터 조회 중 오류가 발생했습니다.');
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링
  const applyFilters = () => {
    let filtered = suppliers;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.includes(searchTerm) ||
        supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터링
    if (filterCategory !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === filterCategory);
    }

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === filterStatus);
    }

    setFilteredSuppliers(filtered);
  };

  // 공급업체 추가
  const handleAddSupplier = async () => {
    if (!formData.name || !formData.category) {
      toast.error('공급업체명과 카테고리는 필수 입력 항목입니다.');
      return;
    }

    try {
      const response = await api.addSupplier(formData);
      
      if (response.success) {
        toast.success('공급업체가 성공적으로 추가되었습니다.');
        setShowAddDialog(false);
        resetForm();
        fetchSuppliers();
      } else {
        toast.error(response.error || '공급업체 추가에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('공급업체 추가 실패:', error);
      toast.error(error.message || '공급업체 추가 중 오류가 발생했습니다.');
    }
  };

  // 공급업체 수정
  const handleEditSupplier = async () => {
    if (!selectedSupplier || !formData.name || !formData.category) {
      toast.error('공급업체명과 카테고리는 필수 입력 항목입니다.');
      return;
    }

    try {
      const response = await api.updateSupplier(selectedSupplier.id, formData);
      
      if (response.success) {
        toast.success('공급업체 정보가 성공적으로 수정되었습니다.');
        setShowEditDialog(false);
        setSelectedSupplier(null);
        resetForm();
        fetchSuppliers();
      } else {
        toast.error(response.error || '공급업체 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('공급업체 수정 실패:', error);
      toast.error(error.message || '공급업체 수정 중 오류가 발생했습니다.');
    }
  };

  // 공급업체 삭제
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await api.deleteSupplier(selectedSupplier.id);
      
      if (response.success) {
        toast.success('공급업체가 성공적으로 삭제되었습니다.');
        setShowDeleteDialog(false);
        setSelectedSupplier(null);
        fetchSuppliers();
      } else {
        toast.error(response.error || '공급업체 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('공급업체 삭제 실패:', error);
      toast.error(error.message || '공급업체 삭제 중 오류가 발생했습니다.');
    }
  };

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      contact: '',
      phone: '',
      address: '',
      notes: '',
      status: 'active'
    });
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      category: supplier.category,
      contact: supplier.contact,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
      status: supplier.status
    });
    setShowEditDialog(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteDialog(true);
  };

  // 상태 배지 가져오기
  const getStatusBadge = (status: string) => {
    const statusConfig = SUPPLIER_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    const Icon = status === 'active' ? CheckCircle : 
                 status === 'inactive' ? XCircle : Clock;

    return (
      <Badge className={statusConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  // 카테고리 라벨 가져오기
  const getCategoryLabel = (category: string) => {
    const categoryConfig = SUPPLIER_CATEGORIES.find(c => c.value === category);
    return categoryConfig?.label || category;
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [suppliers, searchTerm, filterCategory, filterStatus]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>공급업체 관리</h1>
            <p className="text-gray-600">공급업체 정보를 관리합니다.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">공급업체 데이터를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>공급업체 관리</h1>
            <p className="text-gray-600">공급업체 정보를 관리합니다.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 로드 오류</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSuppliers}>다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1>공급업체 관리</h1>
          <p className="text-gray-600">공급업체 정보를 관리합니다.</p>
        </div>
        {hasRole(['admin', 'manager']) && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            공급업체 추가
          </Button>
        )}
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">검색</Label>
              <Input
                id="search"
                placeholder="공급업체명, 담당자, 전화번호, 주소 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-filter">카테고리</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {SUPPLIER_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">상태</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  {SUPPLIER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">전체 공급업체</p>
                <p className="text-2xl font-semibold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">활성 공급업체</p>
                <p className="text-2xl font-semibold">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">원료 공급업체</p>
                <p className="text-2xl font-semibold">
                  {suppliers.filter(s => s.category === 'ingredient').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">포장재 공급업체</p>
                <p className="text-2xl font-semibold">
                  {suppliers.filter(s => s.category === 'packaging').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 공급업체 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              공급업체 목록
              <Badge className="ml-2" variant="secondary">
                {filteredSuppliers.length}개
              </Badge>
            </span>
            <Button variant="outline" size="sm" onClick={fetchSuppliers}>
              <FileText className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">조건에 맞는 공급업체가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>공급업체명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                    {hasRole(['admin', 'manager']) && <TableHead>작업</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(supplier.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-400" />
                          {supplier.contact || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          <span className="truncate max-w-32" title={supplier.address}>
                            {supplier.address || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(supplier.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </TableCell>
                      {hasRole(['admin', 'manager']) && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(supplier)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(supplier)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 공급업체 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>공급업체 추가</DialogTitle>
            <DialogDescription>
              새로운 공급업체 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-name">공급업체명 *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="공급업체명을 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="add-category">카테고리 *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="add-category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="add-contact">담당자</Label>
              <Input
                id="add-contact"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="담당자명을 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="add-phone">전화번호</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="전화번호를 입력하세요"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="add-address">주소</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="주소를 입력하세요"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="add-notes">비고</Label>
              <Textarea
                id="add-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 정보나 비고사항을 입력하세요"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              resetForm();
            }}>
              취소
            </Button>
            <Button onClick={handleAddSupplier}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공급업체 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>공급업체 수정</DialogTitle>
            <DialogDescription>
              공급업체 정보를 수정해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">공급업체명 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="공급업체명을 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">카테고리 *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-contact">담당자</Label>
              <Input
                id="edit-contact"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="담당자명을 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone">전화번호</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="전화번호를 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-status">상태</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive' | 'pending') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-address">주소</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="주소를 입력하세요"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="edit-notes">비고</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 정보나 비고사항을 입력하세요"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setSelectedSupplier(null);
              resetForm();
            }}>
              취소
            </Button>
            <Button onClick={handleEditSupplier}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공급업체 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공급업체 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              '{selectedSupplier?.name}' 공급업체를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedSupplier(null);
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}