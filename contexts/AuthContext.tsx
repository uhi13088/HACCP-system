import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  canEdit: () => boolean; // 매니저 이상만 편집 가능
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 컴포넌트 마운트시 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    const savedUser = localStorage.getItem('haccp_user');
    const savedToken = localStorage.getItem('haccp_token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('haccp_user');
        localStorage.removeItem('haccp_token');
      }
    }
  }, []);

  const login = (userData: User & { token?: string }) => {
    const { token, ...user } = userData;
    setUser(user);
    localStorage.setItem('haccp_user', JSON.stringify(user));
    // 개발 환경에서는 토큰을 저장하지 않음 (public anon key만 사용)
    localStorage.removeItem('haccp_token');
    console.log('Logged in user:', user.name, 'Role:', user.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('haccp_user');
    localStorage.removeItem('haccp_token');
  };

  const hasRole = (requiredRoles: string | string[]) => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(user.role);
  };

  const canEdit = () => {
    return hasRole(['admin', 'manager']);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canEdit
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 역할 기반 접근 제어 컴포넌트
interface ProtectedProps {
  children: ReactNode;
  requiredRole?: string | string[];
  fallback?: ReactNode;
}

export function Protected({ children, requiredRole, fallback }: ProtectedProps) {
  const { hasRole } = useAuth();

  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}

// 편집 권한 체크 컴포넌트
export function EditProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { canEdit } = useAuth();

  if (!canEdit()) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}