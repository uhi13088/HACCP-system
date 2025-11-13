// CCP 기록 자동 백업 스케줄러
// 브라우저에서 매일 오후 6시에 백업을 실행하는 클라이언트 사이드 스케줄러

import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from './supabase/info';

export class BackupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private scheduledHour = 18; // 기본값: 오후 6시
  private scheduledMinute = 0; // 기본값: 정각

  // 스케줄러 시작
  start() {
    if (this.isRunning) {
      console.log('Backup scheduler is already running');
      return;
    }

    // 저장된 백업 시간 로드
    this.loadScheduleSettings();

    console.log('Starting backup scheduler...');
    this.isRunning = true;

    // 매분마다 시간 체크 (정확한 시간에 실행하기 위해)
    this.intervalId = setInterval(() => {
      this.checkAndRunBackup();
    }, 60000); // 1분마다 체크

    const timeStr = String(this.scheduledHour).padStart(2, '0') + ':' + String(this.scheduledMinute).padStart(2, '0');
    console.log(`Backup scheduler started - will run daily at ${timeStr}`);
  }

  // 백업 시간 설정
  setScheduleTime(hour: number, minute: number = 0) {
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time format');
    }
    
    this.scheduledHour = hour;
    this.scheduledMinute = minute;
    
    // 설정을 로컬 스토리지에 저장
    this.saveScheduleSettings();
    
    const timeStr = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
    console.log(`Backup schedule updated to ${timeStr}`);
    
    // 스케줄러가 실행 중이면 재시작
    if (this.isRunning) {
      this.restart();
    }
  }

  // 현재 설정된 백업 시간 가져오기
  getScheduleTime() {
    return {
      hour: this.scheduledHour,
      minute: this.scheduledMinute,
      timeString: String(this.scheduledHour).padStart(2, '0') + ':' + String(this.scheduledMinute).padStart(2, '0')
    };
  }

  // 스케줄 설정 저장
  private saveScheduleSettings() {
    const settings = {
      hour: this.scheduledHour,
      minute: this.scheduledMinute
    };
    localStorage.setItem('backup_schedule_settings', JSON.stringify(settings));
  }

  // 스케줄 설정 로드
  private loadScheduleSettings() {
    const saved = localStorage.getItem('backup_schedule_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.scheduledHour = settings.hour || 18;
        this.scheduledMinute = settings.minute || 0;
      } catch (error) {
        console.warn('Failed to load backup schedule settings, using defaults');
      }
    }
  }

  // 스케줄러 재시작
  private restart() {
    this.stop();
    this.start();
  }

  // 스케줄러 중지
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Backup scheduler stopped');
  }

  // 현재 시간 체크 및 백업 실행
  private checkAndRunBackup() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 설정된 시간에 실행
    if (hour === this.scheduledHour && minute === this.scheduledMinute) {
      console.log('Scheduled backup time reached - executing backup...');
      this.executeBackup();
    }
  }

  // 백업 실행 - 모든 등록된 백업 구조 처리
  private async executeBackup() {
    try {
      console.log('🔄 Executing scheduled backup for all configured document types...');
      
      // 백업 구조 목록 조회
      const backupStructuresUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/structures`;
      console.log('📡 Getting backup structures from:', backupStructuresUrl);
      
      const structuresResponse = await fetch(backupStructuresUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });

      if (!structuresResponse.ok) {
        throw new Error(`Failed to get backup structures: ${structuresResponse.status}`);
      }

      const structuresResult = await structuresResponse.json();
      
      if (!structuresResult.success || !Array.isArray(structuresResult.data)) {
        console.log('⚠️ No backup structures configured, falling back to CCP-only backup');
        return await this.executeCCPBackup();
      }

      const activeStructures = structuresResult.data.filter(structure => structure.enabled);
      
      if (activeStructures.length === 0) {
        console.log('⚠️ No active backup structures found, falling back to CCP-only backup');
        return await this.executeCCPBackup();
      }

      console.log(`📊 Found ${activeStructures.length} active backup structures`);

      const backupResults = [];
      let successCount = 0;
      let failureCount = 0;

      // 각 백업 구조에 대해 백업 실행
      for (const structure of activeStructures) {
        try {
          console.log(`🔄 Backing up ${structure.documentType}...`);
          
          const documentBackupUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/execute-document`;
          
          // 타임아웃을 포함한 fetch 설정
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
          
          const documentResponse = await fetch(documentBackupUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'apikey': publicAnonKey
            },
            body: JSON.stringify({
              documentType: structure.documentType,
              spreadsheetId: structure.useDefaultSpreadsheet !== false && structure.spreadsheetId === 'DEFAULT_SPREADSHEET' ? 'DEFAULT_SPREADSHEET' : structure.spreadsheetId,
              sheetName: structure.sheetName
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!documentResponse.ok) {
            throw new Error(`HTTP ${documentResponse.status}: ${documentResponse.statusText}`);
          }

          const documentResult = await documentResponse.json();

          if (documentResult.success) {
            console.log(`✅ Successfully backed up ${structure.documentType}`);
            backupResults.push({
              documentType: structure.documentType,
              status: 'success',
              recordCount: documentResult.data?.recordCount || 0
            });
            successCount++;
          } else {
            console.error(`❌ Failed to backup ${structure.documentType}:`, documentResult.error);
            backupResults.push({
              documentType: structure.documentType,
              status: 'failed',
              error: documentResult.error
            });
            failureCount++;
          }
        } catch (error) {
          console.error(`❌ Error backing up ${structure.documentType}:`, error);
          backupResults.push({
            documentType: structure.documentType,
            status: 'error',
            error: error.message
          });
          failureCount++;
        }
      }

      // 결과 요약
      const totalBackups = successCount + failureCount;
      
      if (successCount > 0 && failureCount === 0) {
        // 완전 성공
        toast.success('자동 백업 완료', {
          description: `${successCount}개 문서 타입이 모두 성공적으로 백업되었습니다.`,
          duration: 5000,
        });
        
        this.logBackupResult('success', {
          type: 'all_documents',
          totalStructures: totalBackups,
          successCount,
          failureCount,
          results: backupResults
        });
      } else if (successCount > 0) {
        // 부분 성공
        toast.warning('백업 부분 완료', {
          description: `${successCount}/${totalBackups}개 문서 타입이 백업되었습니다. ${failureCount}개 실패`,
          duration: 6000,
        });
        
        this.logBackupResult('partial', {
          type: 'all_documents',
          totalStructures: totalBackups,
          successCount,
          failureCount,
          results: backupResults
        });
      } else {
        // 완전 실패
        toast.error('자동 백업 실패', {
          description: `모든 백업이 실패했습니다. 설정을 확인해주세요.`,
          duration: 6000,
        });
        
        this.logBackupResult('failed', {
          type: 'all_documents',
          totalStructures: totalBackups,
          successCount,
          failureCount,
          results: backupResults
        });
      }

    } catch (error) {
      console.error('Backup execution error:', error);
      
      // 에러 토스트 알림
      toast.error('백업 시스템 오류', {
        description: '백업 시스템에 문제가 발생했습니다. 관리자에게 문의하세요.',
        duration: 6000,
      });

      // 에러 로그 저장
      this.logBackupResult('error', { error: error.message });
    }
  }

  // CCP 전용 백업 (기존 방식)
  private async executeCCPBackup() {
    try {
      console.log('🔄 Executing CCP-only backup...');
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/execute-ccp`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });

      const result = await response.json();

      if (result.success) {
        console.log('CCP backup completed successfully:', result.data);
        
        toast.success('자동 백업 완료', {
          description: `오늘의 CCP 기록이 Google Sheets에 백업되었습니다.`,
          duration: 5000,
        });

        this.logBackupResult('success', { type: 'ccp_only', ...result.data });
      } else {
        console.error('CCP backup failed:', result.error);
        
        toast.error('자동 백업 실패', {
          description: `백업 중 오류가 발생했습니다: ${result.error}`,
          duration: 6000,
        });

        this.logBackupResult('failed', { type: 'ccp_only', error: result.error });
      }
    } catch (error) {
      console.error('CCP backup error:', error);
      throw error; // 상위에서 처리하도록 전파
    }
  }

  // 백업 결과 로그 저장 (로컬 스토리지)
  private logBackupResult(status: 'success' | 'failed' | 'error', data: any) {
    const log = {
      id: `backup_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status,
      data,
      type: 'scheduled'
    };

    // 로컬 스토리지에 최근 10개 로그 저장
    const existingLogs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
    const newLogs = [log, ...existingLogs].slice(0, 10);
    localStorage.setItem('backup_logs', JSON.stringify(newLogs));
  }

  // 수동 백업 실행 - 모든 등록된 문서 타입 백업
  async executeManualBackup() {
    try {
      console.log('🔄 Executing manual backup for all configured document types...');
      
      // 백업 구조 목록 조회
      const backupStructuresUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/structures`;
      console.log('📡 Getting backup structures from:', backupStructuresUrl);
      
      const structuresResponse = await fetch(backupStructuresUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });

      if (!structuresResponse.ok) {
        console.log('⚠️ Failed to get backup structures, falling back to CCP-only backup');
        return await this.executeManualCCPBackup();
      }

      const structuresResult = await structuresResponse.json();
      
      if (!structuresResult.success || !Array.isArray(structuresResult.data)) {
        console.log('⚠️ No backup structures configured, falling back to CCP-only backup');
        return await this.executeManualCCPBackup();
      }

      const activeStructures = structuresResult.data.filter(structure => structure.enabled);
      
      if (activeStructures.length === 0) {
        console.log('⚠️ No active backup structures found, falling back to CCP-only backup');
        return await this.executeManualCCPBackup();
      }

      console.log(`📊 Found ${activeStructures.length} active backup structures for manual backup`);

      const backupResults = [];
      let successCount = 0;
      let failureCount = 0;

      // 각 백업 구조에 대해 백업 실행
      for (const structure of activeStructures) {
        try {
          console.log(`🔄 Manually backing up ${structure.documentType}...`);
          
          const documentBackupUrl = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/execute-document`;
          
          const documentResponse = await fetch(documentBackupUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'apikey': publicAnonKey
            },
            body: JSON.stringify({
              documentType: structure.documentType,
              spreadsheetId: structure.useDefaultSpreadsheet !== false && structure.spreadsheetId === 'DEFAULT_SPREADSHEET' ? 'DEFAULT_SPREADSHEET' : structure.spreadsheetId,
              sheetName: structure.sheetName
            })
          });

          const documentResult = await documentResponse.json();

          if (documentResult.success) {
            console.log(`✅ Successfully backed up ${structure.documentType}`);
            backupResults.push({
              documentType: structure.documentType,
              status: 'success',
              recordCount: documentResult.data?.recordCount || 0
            });
            successCount++;
          } else {
            console.error(`❌ Failed to backup ${structure.documentType}:`, documentResult.error);
            backupResults.push({
              documentType: structure.documentType,
              status: 'failed',
              error: documentResult.error
            });
            failureCount++;
          }
        } catch (error) {
          console.error(`❌ Error backing up ${structure.documentType}:`, error);
          backupResults.push({
            documentType: structure.documentType,
            status: 'error',
            error: error.message
          });
          failureCount++;
        }
      }

      // 결과 처리
      const totalBackups = successCount + failureCount;
      
      if (successCount > 0 && failureCount === 0) {
        // 완전 성공
        this.logBackupResult('success', {
          type: 'all_documents_manual',
          totalStructures: totalBackups,
          successCount,
          failureCount,
          results: backupResults
        });
        
        return { 
          success: true, 
          data: {
            message: `${successCount}개 문서 타입이 모두 성공적으로 백업되었습니다.`,
            totalStructures: totalBackups,
            successCount,
            failureCount,
            results: backupResults
          }
        };
      } else if (successCount > 0) {
        // 부분 성공
        this.logBackupResult('partial', {
          type: 'all_documents_manual',
          totalStructures: totalBackups,
          successCount,
          failureCount,
          results: backupResults
        });
        
        return { 
          success: true, 
          data: {
            message: `${successCount}/${totalBackups}개 문서 타입이 백업되었습니다. ${failureCount}개 실패`,
            totalStructures: totalBackups,
            successCount,
            failureCount,
            results: backupResults,
            warning: true
          }
        };
      } else {
        // 완전 실패
        this.logBackupResult('failed', {
          type: 'all_documents_manual',
          totalStructures: totalBackups,
          successCount,
          failureCount,
          results: backupResults
        });
        
        return { 
          success: false, 
          error: `모든 백업이 실패했습니다. 설정을 확인해주세요.`,
          details: {
            totalStructures: totalBackups,
            successCount,
            failureCount,
            results: backupResults
          }
        };
      }

    } catch (error) {
      console.error('Manual backup execution error:', error);
      
      let errorMessage = 'Google Sheets API 설정을 확인해주세요.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.';
      }
      
      // 에러 로그 저장
      this.logBackupResult('error', { 
        error: error.message,
        userMessage: errorMessage,
        type: error.name
      });
      
      return { success: false, error: errorMessage };
    }
  }

  // CCP 전용 수동 백업 (기존 방식)
  private async executeManualCCPBackup() {
    try {
      console.log('🔄 Executing manual CCP-only backup...');
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3/backup/execute-ccp`;
      console.log('📡 Manual CCP backup URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        
        const errorMsg = response.status === 404 
          ? 'API 엔드포인트를 찾을 수 없습니다.' 
          : response.status >= 500
          ? '서버 내부 오류가 발생했습니다.'
          : `HTTP 오류: ${response.status}`;
          
        this.logBackupResult('error', { 
          error: errorMsg,
          details: {
            status: response.status,
            statusText: response.statusText,
            responseText: errorText
          }
        });
        
        return { success: false, error: errorMsg };
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        console.log('Manual CCP backup completed successfully:', result.data);
        
        // 백업 완료 로그 저장
        this.logBackupResult('success', { type: 'ccp_only_manual', ...result.data });
        
        return { success: true, data: result.data };
      } else {
        console.error('Manual CCP backup failed:', result.error);
        
        // Google Sheets API 설정 문제인 경우 더 명확한 메시지
        let errorMessage = result.error;
        if (result.error) {
          if (result.error.includes('환경변수') || 
              result.error.includes('SERVICE_ACCOUNT_JSON') ||
              result.error.includes('SPREADSHEET_ID')) {
            errorMessage = 'Google Sheets API 환경변수 설정을 확인해주세요.';
          } else if (result.error.includes('Invalid service account JSON') ||
                     result.error.includes('JSON 파싱')) {
            errorMessage = 'Service Account JSON 형식이 올바르지 않습니다. 완전한 JSON 키를 사용해주세요.';
          } else if (result.error.includes('401') || 
                     result.error.includes('UNAUTHENTICATED')) {
            errorMessage = 'Google Sheets API 인증에 실패했습니다. Service Account 설정을 확인해주세요.';
          } else if (result.error.includes('Unable to parse range') ||
                     result.error.includes('INVALID_ARGUMENT')) {
            errorMessage = '스프레드시트의 시트 구조에 문제가 있습니다. 새 스프레드시트를 생성하거나 기존 시트를 확인해주세요.';
          } else if (result.error.includes('Spreadsheet access failed') ||
                     result.error.includes('403')) {
            errorMessage = '스프레드시트에 접근할 수 없습니다. Service Account 이메일을 스프레드시트 편집자로 공유했는지 확인해주세요.';
          } else if (result.error.includes('404')) {
            errorMessage = '스프레드시트를 찾을 수 없습니다. 스프레드시트 ID가 올바른지 확인해주세요.';
          }
        }
        
        // 백업 실패 로그 저장
        this.logBackupResult('failed', { 
          error: result.error,
          userMessage: errorMessage
        });
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Manual CCP backup error:', error);
      throw error; // 상위에서 처리하도록 전파
    }
  }

  // 백업 로그 가져오기
  getBackupLogs() {
    return JSON.parse(localStorage.getItem('backup_logs') || '[]');
  }

  // 스케줄러 상태 확인
  isSchedulerRunning() {
    return this.isRunning;
  }

  // 다음 백업 시간 계산
  getNextBackupTime() {
    const now = new Date();
    const nextBackup = new Date();
    
    // 오늘 설정된 시간으로 설정
    nextBackup.setHours(this.scheduledHour, this.scheduledMinute, 0, 0);
    
    // 이미 오늘 설정된 시간이 지났으면 내일로 설정
    if (now.getHours() > this.scheduledHour || 
        (now.getHours() === this.scheduledHour && now.getMinutes() >= this.scheduledMinute)) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    return nextBackup;
  }
}

// 싱글톤 인스턴스 생성
export const backupScheduler = new BackupScheduler();

// 자동 시작 (앱 로드시)
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 실행
  window.addEventListener('load', () => {
    // 사용자가 로그인한 경우에만 스케줄러 시작
    if (localStorage.getItem('token')) {
      backupScheduler.start();
    }
  });

  // 페이지 언로드시 스케줄러 정리
  window.addEventListener('beforeunload', () => {
    backupScheduler.stop();
  });
}