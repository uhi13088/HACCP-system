import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { api } from "../utils/api";
import { RefreshCw, AlertTriangle, CheckCircle, Server } from "lucide-react";

interface ServerStatusIndicatorProps {
  className?: string;
}

export function ServerStatusIndicator({ className }: ServerStatusIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkServerStatus = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const isHealthy = await api.checkServerStatus();
      setIsConnected(isHealthy);
      setLastChecked(new Date());
      
      if (!isHealthy) {
        setError('서버가 응답하지 않습니다');
      }
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  // 컴포넌트 마운트 시 서버 상태 확인
  useEffect(() => {
    checkServerStatus();
    
    // 30초마다 자동 확인
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">서버 상태</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  연결됨
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  연결 안됨
                </>
              )}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={checkServerStatus}
              disabled={isChecking}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {lastChecked && (
          <div className="text-xs text-gray-500">
            마지막 확인: {lastChecked.toLocaleTimeString()}
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!isConnected && (
          <div className="text-xs text-gray-600 space-y-1">
            <p>서버 연결 문제 해결 방법:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>서버가 실행 중인지 확인</li>
              <li>네트워크 연결 상태 확인</li>
              <li>페이지 새로고침 시도</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}