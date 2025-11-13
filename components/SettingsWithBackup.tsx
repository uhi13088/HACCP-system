import { useState } from \"react\";
import { useAuth } from \"../contexts/AuthContext\";
import { toast } from \"sonner@2.0.3\";
import { SettingsPage } from \"./SettingsPage\";
import { BackupManager } from \"./BackupManager\";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from \"./ui/card\";
import { Tabs, TabsContent, TabsList, TabsTrigger } from \"./ui/tabs\";
import { Separator } from \"./ui/separator\";
import {
  User,
  Bell,
  Shield,
  Key,
  Database,
  Download,
  Settings as SettingsIcon,
} from \"lucide-react\";

export function SettingsWithBackup() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState(\"profile\");

  return (
    <div className=\"container mx-auto p-6 max-w-6xl\">
      <div className=\"mb-8\">
        <div className=\"flex items-center space-x-3 mb-2\">
          <SettingsIcon className=\"w-6 h-6 text-blue-600\" />
          <h1 className=\"text-2xl font-bold\">설정</h1>
        </div>
        <p className=\"text-gray-600\">시스템 및 개인 설정을 관리합니다.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className=\"space-y-6\">
        <TabsList className={`grid w-full ${hasRole('admin') ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value=\"profile\" className=\"flex items-center space-x-2\">
            <User className=\"w-4 h-4\" />
            <span>프로필</span>
          </TabsTrigger>
          <TabsTrigger value=\"notifications\" className=\"flex items-center space-x-2\">
            <Bell className=\"w-4 h-4\" />
            <span>알림</span>
          </TabsTrigger>
          <TabsTrigger value=\"haccp\" className=\"flex items-center space-x-2\">
            <Shield className=\"w-4 h-4\" />
            <span>HACCP</span>
          </TabsTrigger>
          <TabsTrigger value=\"backup\" className=\"flex items-center space-x-2\">
            <Download className=\"w-4 h-4\" />
            <span>백업</span>
          </TabsTrigger>
          <TabsTrigger value=\"security\" className=\"flex items-center space-x-2\">
            <Key className=\"w-4 h-4\" />
            <span>보안</span>
          </TabsTrigger>
          {hasRole('admin') && (
            <TabsTrigger value=\"system\" className=\"flex items-center space-x-2\">
              <Database className=\"w-4 h-4\" />
              <span>시스템</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 백업 설정 탭 */}
        <TabsContent value=\"backup\">
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center space-x-2\">
                <Download className=\"w-5 h-5\" />
                <span>데이터 백업 관리</span>
              </CardTitle>
              <CardDescription>
                CCP 기록을 안전하게 외부 저장소에 백업합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 기존 설정 페이지의 다른 탭들을 여기에 복사 */}
        {/* 프로필, 알림, HACCP, 보안, 시스템 설정 등 */}
        
        {activeTab !== \"backup\" && (
          <div>
            <SettingsPage />
          </div>
        )}
      </Tabs>
    </div>
  );
}