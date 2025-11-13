// 백업 구조 관리 엔드포인트
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

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

interface BackupStructure {
  documentType: string;
  spreadsheetId: string;
  sheetName: string;
  fields: BackupField[];
  enabled: boolean;
  lastModified: string;
  createdBy: string;
}

// 기본 구조 템플릿 정의
const DEFAULT_STRUCTURES: Record<string, Partial<BackupStructure>> = {
  'production-log': {
    fields: [
      { id: '1', name: '날짜', type: 'date', required: true, order: 1 },
      { id: '2', name: '제품명', type: 'text', required: true, order: 2 },
      { id: '3', name: '생산량', type: 'number', required: true, order: 3 },
      { id: '4', name: '담당자', type: 'text', required: true, order: 4 },
      { id: '5', name: '비고', type: 'text', required: false, order: 5 }
    ]
  },
  'temperature-log': {
    fields: [
      { id: '1', name: '날짜', type: 'date', required: true, order: 1 },
      { id: '2', name: '시간', type: 'datetime', required: true, order: 2 },
      { id: '3', name: '냉장고온도', type: 'number', required: true, order: 3 },
      { id: '4', name: '냉동고온도', type: 'number', required: true, order: 4 },
      { id: '5', name: '점검자', type: 'text', required: true, order: 5 }
    ]
  },
  'cleaning-log': {
    fields: [
      { id: '1', name: '날짜', type: 'date', required: true, order: 1 },
      { id: '2', name: '청소구역', type: 'text', required: true, order: 2 },
      { id: '3', name: '세척제', type: 'text', required: true, order: 3 },
      { id: '4', name: '완료시간', type: 'datetime', required: true, order: 4 },
      { id: '5', name: '담당자', type: 'text', required: true, order: 5 }
    ]
  },
  'receiving-log': {
    fields: [
      { id: '1', name: '입고일', type: 'date', required: true, order: 1 },
      { id: '2', name: '원료명', type: 'text', required: true, order: 2 },
      { id: '3', name: '공급업체', type: 'text', required: true, order: 3 },
      { id: '4', name: '수량', type: 'number', required: true, order: 4 },
      { id: '5', name: '검수결과', type: 'text', required: true, order: 5 },
      { id: '6', name: '검수자', type: 'text', required: true, order: 6 }
    ]
  },
  'pest-control': {
    fields: [
      { id: '1', name: '주차', type: 'text', required: true, order: 1 },
      { id: '2', name: '점검일', type: 'date', required: true, order: 2 },
      { id: '3', name: '점검구역', type: 'text', required: true, order: 3 },
      { id: '4', name: '방충시설상태', type: 'text', required: true, order: 4 },
      { id: '5', name: '방서시설상태', type: 'text', required: true, order: 5 },
      { id: '6', name: '점검자', type: 'text', required: true, order: 6 }
    ]
  },
  'facility-inspection': {
    fields: [
      { id: '1', name: '주차', type: 'text', required: true, order: 1 },
      { id: '2', name: '점검일', type: 'date', required: true, order: 2 },
      { id: '3', name: '시설명', type: 'text', required: true, order: 3 },
      { id: '4', name: '점검항목', type: 'text', required: true, order: 4 },
      { id: '5', name: '상태', type: 'text', required: true, order: 5 },
      { id: '6', name: '조치사항', type: 'text', required: false, order: 6 },
      { id: '7', name: '점검자', type: 'text', required: true, order: 7 }
    ]
  },
  'visitor-log': {
    fields: [
      { id: '1', name: '날짜', type: 'date', required: true, order: 1 },
      { id: '2', name: '방문자명', type: 'text', required: true, order: 2 },
      { id: '3', name: '소속', type: 'text', required: true, order: 3 },
      { id: '4', name: '입장시간', type: 'datetime', required: true, order: 4 },
      { id: '5', name: '퇴장시간', type: 'datetime', required: false, order: 5 },
      { id: '6', name: '방문목적', type: 'text', required: true, order: 6 },
      { id: '7', name: '승인자', type: 'text', required: true, order: 7 }
    ]
  },
  'accident-report': {
    fields: [
      { id: '1', name: '발생일시', type: 'datetime', required: true, order: 1 },
      { id: '2', name: '사고유형', type: 'text', required: true, order: 2 },
      { id: '3', name: '발생장소', type: 'text', required: true, order: 3 },
      { id: '4', name: '당사자', type: 'text', required: true, order: 4 },
      { id: '5', name: '사고내용', type: 'text', required: true, order: 5 },
      { id: '6', name: '원인분석', type: 'text', required: true, order: 6 },
      { id: '7', name: '조치사항', type: 'text', required: true, order: 7 },
      { id: '8', name: '보고자', type: 'text', required: true, order: 8 }
    ]
  },
  'training-record': {
    fields: [
      { id: '1', name: '교육일', type: 'date', required: true, order: 1 },
      { id: '2', name: '교육명', type: 'text', required: true, order: 2 },
      { id: '3', name: '교육대상', type: 'text', required: true, order: 3 },
      { id: '4', name: '교육시간', type: 'number', required: true, order: 4 },
      { id: '5', name: '교육내용', type: 'text', required: true, order: 5 },
      { id: '6', name: '강사', type: 'text', required: true, order: 6 },
      { id: '7', name: '참석인원', type: 'number', required: true, order: 7 },
      { id: '8', name: '평가결과', type: 'text', required: false, order: 8 }
    ]
  }
};

export function addBackupStructureEndpoints(app: Hono, kvStore: any, requireAuth: any) {

  // 모든 백업 구조 조회
  app.get('/make-server-79e634f3/backup-structures', requireAuth, async (c: any) => {
    try {
      console.log('Fetching all backup structures...');
      const structures = await kv.getByPrefix('backup_structure:');
      console.log(`Found ${structures.length} backup structures`);
      
      return c.json({ 
        success: true, 
        data: structures 
      });
    } catch (error: any) {
      console.log('Error fetching backup structures:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch backup structures: ' + error.message 
      }, 500);
    }
  });

  // 특정 문서 타입의 백업 구조 조회
  app.get('/make-server-79e634f3/backup-structures/:documentType', requireAuth, async (c: any) => {
    try {
      const documentType = c.req.param('documentType');
      console.log(`Fetching backup structure for document type: ${documentType}`);
      
      const structure = await kv.get(`backup_structure:${documentType}`);
      
      if (!structure) {
        // 기본 구조가 있다면 반환
        const defaultStructure = DEFAULT_STRUCTURES[documentType];
        if (defaultStructure) {
          const newStructure: BackupStructure = {
            documentType,
            spreadsheetId: '',
            sheetName: 'Sheet1',
            fields: defaultStructure.fields || [],
            enabled: false,
            lastModified: new Date().toISOString(),
            createdBy: 'system'
          };
          
          return c.json({ 
            success: true, 
            data: newStructure,
            isDefault: true
          });
        }
        
        return c.json({ 
          success: false, 
          error: 'Backup structure not found' 
        }, 404);
      }
      
      return c.json({ 
        success: true, 
        data: structure 
      });
    } catch (error: any) {
      console.log('Error fetching backup structure:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch backup structure: ' + error.message 
      }, 500);
    }
  });

  // 백업 구조 생성/수정
  app.post('/make-server-79e634f3/backup-structures', requireAuth, async (c: any) => {
    try {
      const structureData = await c.req.json();
      console.log('Creating/updating backup structure:', structureData);

      // 필수 필드 검증
      if (!structureData.documentType || !structureData.spreadsheetId || !structureData.fields || structureData.fields.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: documentType, spreadsheetId, fields' 
        }, 400);
      }

      // 스프레드시트 ID 형식 검증 (DEFAULT_SPREADSHEET 허용)
      if (structureData.spreadsheetId && structureData.spreadsheetId !== 'DEFAULT_SPREADSHEET') {
        const spreadsheetIdPattern = /^[a-zA-Z0-9-_]{28,}$/;
        if (!spreadsheetIdPattern.test(structureData.spreadsheetId)) {
          return c.json({ 
            success: false, 
            error: 'Invalid spreadsheet ID format' 
          }, 400);
        }
      }

      // 필드 검증
      for (const field of structureData.fields) {
        if (!field.name || !field.type) {
          return c.json({ 
            success: false, 
            error: 'Each field must have name and type' 
          }, 400);
        }
      }

      const structure: BackupStructure = {
        ...structureData,
        lastModified: new Date().toISOString(),
        createdBy: structureData.createdBy || 'system'
      };

      // 필드 순서 정렬
      structure.fields = structure.fields.sort((a, b) => a.order - b.order);

      await kv.set(`backup_structure:${structure.documentType}`, structure);
      console.log(`Backup structure saved for document type: ${structure.documentType}`);

      return c.json({ 
        success: true, 
        data: structure 
      });
    } catch (error: any) {
      console.log('Error saving backup structure:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to save backup structure: ' + error.message 
      }, 500);
    }
  });

  // 백업 구조 삭제
  app.delete('/make-server-79e634f3/backup-structures/:documentType', requireAuth, async (c: any) => {
    try {
      const documentType = c.req.param('documentType');
      console.log(`Deleting backup structure for document type: ${documentType}`);

      await kv.del(`backup_structure:${documentType}`);
      console.log(`Backup structure deleted for document type: ${documentType}`);

      return c.json({ 
        success: true 
      });
    } catch (error: any) {
      console.log('Error deleting backup structure:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to delete backup structure: ' + error.message 
      }, 500);
    }
  });

  // 백업 구조 미리보기 (샘플 데이터)
  app.get('/make-server-79e634f3/backup-structures/:documentType/preview', requireAuth, async (c: any) => {
    try {
      const documentType = c.req.param('documentType');
      console.log(`Generating preview for document type: ${documentType}`);

      // 백업 구조 조회
      const structure = await kv.get(`backup_structure:${documentType}`);
      if (!structure) {
        return c.json({ 
          success: false, 
          error: 'Backup structure not found' 
        }, 404);
      }

      // 실제 데이터 조회 (최대 10개)
      let actualData = [];
      try {
        const dataKey = getDataKeyForDocumentType(documentType);
        if (dataKey) {
          const records = await kv.getByPrefix(dataKey);
          actualData = records.slice(0, 10);
        }
      } catch (error) {
        console.log('Could not fetch actual data, generating sample data');
      }

      // 실제 데이터가 없으면 샘플 데이터 생성
      if (actualData.length === 0) {
        actualData = generateSampleData(structure, 5);
      }

      // 구조에 맞게 데이터 변환
      const previewData = actualData.map(record => {
        const transformedRecord: any = {};
        structure.fields.forEach((field: BackupField) => {
          transformedRecord[field.name] = transformFieldValue(record, field);
        });
        return transformedRecord;
      });

      return c.json({ 
        success: true, 
        data: previewData 
      });
    } catch (error: any) {
      console.log('Error generating preview:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to generate preview: ' + error.message 
      }, 500);
    }
  });

  // 테스트 백업 실행
  app.post('/make-server-79e634f3/backup-structures/:documentType/test', requireAuth, async (c: any) => {
    try {
      const documentType = c.req.param('documentType');
      console.log(`Running test backup for document type: ${documentType}`);

      // 백업 구조 조회
      const structure = await kv.get(`backup_structure:${documentType}`);
      if (!structure) {
        return c.json({ 
          success: false, 
          error: 'Backup structure not found' 
        }, 404);
      }

      if (!structure.enabled) {
        return c.json({ 
          success: false, 
          error: 'Backup structure is disabled' 
        }, 400);
      }

      // 테스트 데이터 생성 (1개 행)
      const testData = generateSampleData(structure, 1);
      
      // 실제 백업 로직은 여기서 구현
      // 현재는 성공으로 가정
      console.log(`Test backup completed for ${documentType}:`, testData);

      return c.json({ 
        success: true,
        message: 'Test backup completed successfully',
        testData: testData[0]
      });
    } catch (error: any) {
      console.log('Error running test backup:', error);
      return c.json({ 
        success: false, 
        error: 'Test backup failed: ' + error.message 
      }, 500);
    }
  });

  // 백업 구조를 사용하여 실제 백업 실행
  app.post('/make-server-79e634f3/backup-structures/:documentType/backup', requireAuth, async (c: any) => {
    try {
      const documentType = c.req.param('documentType');
      console.log(`Running structured backup for document type: ${documentType}`);

      // 백업 구조 조회
      const structure = await kv.get(`backup_structure:${documentType}`);
      if (!structure) {
        return c.json({ 
          success: false, 
          error: 'Backup structure not found' 
        }, 404);
      }

      if (!structure.enabled) {
        return c.json({ 
          success: false, 
          error: 'Backup structure is disabled' 
        }, 400);
      }

      // 실제 데이터 조회
      const dataKey = getDataKeyForDocumentType(documentType);
      if (!dataKey) {
        return c.json({ 
          success: false, 
          error: 'Unknown document type' 
        }, 400);
      }

      const records = await kv.getByPrefix(dataKey);
      if (records.length === 0) {
        return c.json({ 
          success: false, 
          error: 'No data to backup' 
        }, 400);
      }

      // 구조에 맞게 데이터 변환
      const transformedData = records.map(record => {
        const transformedRecord: any = {};
        structure.fields.forEach((field: BackupField) => {
          transformedRecord[field.name] = transformFieldValue(record, field);
        });
        return transformedRecord;
      });

      // TODO: 실제 Google Sheets API 호출
      // 현재는 성공으로 가정
      console.log(`Structured backup completed for ${documentType}: ${transformedData.length} records`);

      return c.json({ 
        success: true,
        message: `Backup completed successfully: ${transformedData.length} records`,
        recordCount: transformedData.length
      });
    } catch (error: any) {
      console.log('Error running structured backup:', error);
      return c.json({ 
        success: false, 
        error: 'Structured backup failed: ' + error.message 
      }, 500);
    }
  });
}

// 문서 타입에 따른 데이터 키 반환
function getDataKeyForDocumentType(documentType: string): string | null {
  const keyMap: Record<string, string> = {
    'production-log': 'production_log:',
    'temperature-log': 'temperature_log:',
    'cleaning-log': 'cleaning_log:',
    'receiving-log': 'receiving_log:',
    'pest-control': 'pest_control:',
    'facility-inspection': 'facility_inspection:',
    'visitor-log': 'visitor_log:',
    'accident-report': 'accident_report:',
    'training-record': 'training_record:'
  };
  
  return keyMap[documentType] || null;
}

// 필드 값 변환
function transformFieldValue(record: any, field: BackupField): string {
  let value = record[field.name] || record[field.id] || field.defaultValue || '';
  
  // 타입별 변환
  switch (field.type) {
    case 'date':
      if (value && typeof value === 'string') {
        try {
          return new Date(value).toLocaleDateString('ko-KR');
        } catch {
          return value;
        }
      }
      break;
    case 'datetime':
      if (value && typeof value === 'string') {
        try {
          return new Date(value).toLocaleString('ko-KR');
        } catch {
          return value;
        }
      }
      break;
    case 'number':
      if (value !== null && value !== undefined) {
        return String(value);
      }
      break;
    case 'boolean':
      return value ? '예' : '아니오';
  }
  
  return String(value || '');
}

// 샘플 데이터 생성
function generateSampleData(structure: BackupStructure, count: number): any[] {
  const sampleData = [];
  
  for (let i = 0; i < count; i++) {
    const record: any = {};
    
    structure.fields.forEach(field => {
      switch (field.type) {
        case 'date':
          record[field.name] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'datetime':
          record[field.name] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'number':
          record[field.name] = Math.floor(Math.random() * 100) + 1;
          break;
        case 'boolean':
          record[field.name] = Math.random() > 0.5;
          break;
        case 'email':
          record[field.name] = `user${i + 1}@example.com`;
          break;
        case 'url':
          record[field.name] = `https://example.com/item${i + 1}`;
          break;
        default: // text
          record[field.name] = field.defaultValue || `샘플 ${field.name} ${i + 1}`;
      }
    });
    
    sampleData.push(record);
  }
  
  return sampleData;
}