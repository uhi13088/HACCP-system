import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api } from "../utils/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
}

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // 데모 계정 정보
  const demoAccounts = [
    { email: 'admin@company.com', password: 'admin123', role: 'admin', name: '시스템 관리자' },
    { email: 'manager@company.com', password: 'manager123', role: 'manager', name: '품질관리팀장' },
    { email: 'operator@company.com', password: 'operator123', role: 'operator', name: '작업자' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 서버 API를 통한 로그인 시도
      console.log('Attempting login via API...');
      
      try {
        const response = await api.login(formData.email, formData.password);
        
        if (response.success && response.data) {
          console.log('API login successful:', response.data);
          
          const userWithToken = {
            ...response.data.user,
            token: response.data.token
          };
          
          onLogin(userWithToken);
          return;
        } else {
          console.log('API login failed:', response.error);
          throw new Error(response.error || 'API login failed');
        }
      } catch (apiError) {
        console.log('API login error:', apiError.message);
        
        // API 실패 시 로컬 데모 계정으로 fallback
        console.log('Falling back to demo account validation...');
        
        const demoUser = demoAccounts.find(
          account => account.email === formData.email && account.password === formData.password
        );

        if (demoUser) {
          console.log('Demo account login successful');
          
          const user: User = {
            id: `demo_user_${Date.now()}`,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role as 'admin' | 'manager' | 'operator'
          };

          onLogin(user);
        } else {
          setError('서버에 연결할 수 없습니다. 이메일과 비밀번호를 확인해주세요.');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setFormData({
      email: account.email,
      password: account.password
    });
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl text-gray-900">Smart HACCP</h2>
          <p className="mt-2 text-gray-600">식품안전관리시스템에 로그인하세요</p>
        </div>

        {/* 로그인 폼 */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="이메일을 입력하세요"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="비밀번호를 입력하세요"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          {/* 데모 계정 안내 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">데모 계정으로 체험해보세요</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemo(true)}
                className="w-full"
              >
                데모 계정 보기
              </Button>
            </div>
          </div>
        </Card>

        {/* 시스템 정보 */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Smart HACCP System v2.1.0</p>
          <p>식품안전관리시스템</p>
        </div>
      </div>

      {/* 데모 계정 다이얼로그 */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데모 계정 정보</DialogTitle>
            <DialogDescription>
              각각 다른 권한을 가진 데모 계정들로 시스템을 체험해보세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              아래 계정들로 각각 다른 권한을 체험해보실 수 있습니다.
            </p>
            
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <Card key={index} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleDemoLogin(account)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-gray-600">{account.email}</p>
                      <p className="text-xs text-blue-600">
                        권한: {account.role === 'admin' ? '관리자' : 
                               account.role === 'manager' ? '매니저' : '작업자'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">비밀번호</p>
                      <p className="text-sm font-mono">{account.password}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>권한별 기능:</strong><br />
                • 관리자: 모든 기능 접근 가능<br />
                • 매니저: CCP 편집, 시스템 설정 등<br />
                • 작업자: 체크리스트, 기록 등 기본 기능만
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}