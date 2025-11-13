import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BackupManager } from "./BackupManager";
import { BackupSetupGuide } from "./BackupSetupGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Settings, Download, Wrench } from "lucide-react";

export function BackupConfigurePage() {
  const [activeTab, setActiveTab] = useState("manager");

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">백업 설정 & 관리</h1>
        </div>
        <p className="text-gray-600">Google Sheets 백업 기능의 설정과 관리를 위한 통합 도구입니다.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manager" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>백업 관리</span>
          </TabsTrigger>
          <TabsTrigger value="helper" className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>설정 가이드</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manager">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>백업 관리</span>
              </CardTitle>
              <CardDescription>
                자동 백업 설정, 수동 백업 실행, 백업 이력을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="helper">
          <BackupSetupGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}