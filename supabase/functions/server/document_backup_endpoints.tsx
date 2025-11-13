// 개별 문서 타입 백업 엔드포인트
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

export function addDocumentBackupEndpoints(app: Hono, requireAuth: any) {
  
  // 개별 문서 타입 백업 실행
  app.post('/make-server-79e634f3/backup/execute-document', requireAuth, async (c) => {
    const startTime = new Date().toISOString()
    const backupLogId = `document_backup_${Date.now()}`
    
    try {
      const body = await c.req.json()
      const { documentType, spreadsheetId, sheetName } = body
      
      console.log('🎯 ===== STARTING DOCUMENT BACKUP EXECUTION =====')
      console.log('📅 Backup started at:', startTime)
      console.log('📄 Document type:', documentType)
      console.log('📊 Spreadsheet ID:', spreadsheetId?.slice(0, 20) + '...')
      console.log('📋 Sheet name:', sheetName)
      console.log('🆔 Backup log ID:', backupLogId)

      // 입력 검증
      if (!documentType) {
        return c.json({
          success: false,
          error: '문서 타입이 지정되지 않았습니다.'
        }, 400)
      }

      // 스프레드시트 ID 처리 - 기본 스프레드시트 또는 개별 스프레드시트
      let actualSpreadsheetId = spreadsheetId
      if (!spreadsheetId || spreadsheetId === 'DEFAULT_SPREADSHEET') {
        // 환경변수에서 기본 스프레드시트 ID 가져오기
        const defaultSpreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
        if (!defaultSpreadsheetId) {
          return c.json({
            success: false,
            error: '기본 스프레드시트 ID가 환경변수에 설정되지 않았습니다. GOOGLE_SHEETS_SPREADSHEET_ID를 설정하세요.'
          }, 400)
        }
        actualSpreadsheetId = defaultSpreadsheetId
        console.log('📋 Using default spreadsheet ID from environment variable')
      }

      console.log('📊 Final spreadsheet ID to use:', actualSpreadsheetId?.slice(0, 20) + '...')

      // 백업 설정 로드
      console.log('📥 Loading backup configuration...')
      const config = await kv.get('backup_config')
      if (!config || !config.service_account_json) {
        console.log('❌ No backup configuration found')
        return c.json({
          success: false,
          error: '백업 설정이 없습니다. 먼저 Google Service Account를 설정해주세요.'
        }, 400)
      }

      console.log('✅ Backup configuration loaded successfully')

      // 문서 타입별 데이터 로드
      console.log(`📊 Loading ${documentType} data...`)
      let documents = []
      let dataKey = ''
      
      switch (documentType) {
        case 'production-log':
          dataKey = 'production_daily_log:'
          break
        case 'temperature-log':
          dataKey = 'refrigerator_temperature_log:'
          break
        case 'cleaning-log':
          dataKey = 'cleaning_disinfection_log:'
          break
        case 'receiving-log':
          dataKey = 'material_receiving_log:'
          break
        case 'pest-control':
          dataKey = 'pest_control_weekly:'
          break
        case 'facility-inspection':
          dataKey = 'facility_weekly_inspection:'
          break
        case 'visitor-log':
          dataKey = 'visitor_management:'
          break
        case 'accident-report':
          dataKey = 'accident_report:'
          break
        case 'training-record':
          dataKey = 'training_record:'
          break
        case 'ccp':
          dataKey = 'ccp:'
          break
        default:
          return c.json({
            success: false,
            error: `지원하지 않는 문서 타입입니다: ${documentType}`
          }, 400)
      }

      const documentsRaw = await kv.getByPrefix(dataKey)
      documents = Array.isArray(documentsRaw) ? documentsRaw.filter(doc => doc && doc.id) : []
      
      console.log(`✅ Loaded ${documents.length} ${documentType} records for backup`)

      if (documents.length === 0) {
        console.log('⚠️ No data found for backup')
        return c.json({
          success: false,
          error: `${documentType}에 대한 데이터가 없습니다.`
        }, 400)
      }

      // 백업 로그 시작
      await kv.set(backupLogId, {
        id: backupLogId,
        timestamp: startTime,
        status: 'in_progress',
        type: 'document_backup',
        documentType,
        recordCount: documents.length,
        spreadsheetId: actualSpreadsheetId,
        sheetName,
        step: 'started'
      })

      // Google Sheets API 인증
      console.log('🔐 Authenticating with Google Sheets API...')
      
      let serviceAccount
      try {
        serviceAccount = JSON.parse(config.service_account_json)
      } catch (error) {
        console.error('❌ Failed to parse service account JSON:', error)
        return c.json({
          success: false,
          error: 'Service Account JSON 형식이 올바르지 않습니다.'
        }, 400)
      }

      // JWT 토큰 생성 및 액세스 토큰 획득
      const jwt = await createJWT(serviceAccount)
      const accessToken = await getAccessToken(jwt)

      console.log('✅ Google Sheets API authentication successful')

      // 스프레드시트 데이터 구성
      const today = new Date().toLocaleDateString('ko-KR')
      const sheetData = []
      
      // 헤더 추가 (문서 타입에 따라 다름)
      const headers = getDocumentHeaders(documentType)
      sheetData.push(headers)

      // 데이터 변환
      for (const doc of documents) {
        const row = convertDocumentToRow(documentType, doc)
        sheetData.push(row)
      }

      // Google Sheets에 데이터 쓰기
      console.log('📝 Writing data to Google Sheets...')
      
      const actualSheetName = sheetName || `${documentType}_${today.replace(/\./g, '_')}`
      
      // 시트 존재 확인 및 생성
      await ensureSheetExists(actualSpreadsheetId, actualSheetName, accessToken)
      
      // 데이터 쓰기
      await writeDataToSheet(actualSpreadsheetId, actualSheetName, sheetData, accessToken)

      // 백업 성공 로그
      const endTime = new Date().toISOString()
      await kv.set(backupLogId, {
        id: backupLogId,
        timestamp: startTime,
        completed_at: endTime,
        status: 'success',
        type: 'document_backup',
        documentType,
        recordCount: documents.length,
        spreadsheetId: actualSpreadsheetId,
        sheetName: actualSheetName,
        step: 'completed'
      })
      
      console.log('🎉 ===== DOCUMENT BACKUP COMPLETED SUCCESSFULLY =====')
      return c.json({
        success: true,
        message: `${documentType} 데이터 백업이 성공적으로 완료되었습니다.`,
        data: {
          documentType,
          recordCount: documents.length,
          spreadsheetId: actualSpreadsheetId,
          sheetName: actualSheetName,
          completedAt: endTime,
          backupLogId: backupLogId
        }
      })
      
    } catch (error) {
      console.error('❌ Document backup failed with error:', error)
      
      // 백업 실패 로그 기록
      try {
        await kv.set(backupLogId, {
          id: backupLogId,
          timestamp: startTime,
          failed_at: new Date().toISOString(),
          status: 'failed',
          type: 'document_backup',
          error: error.message || error.toString(),
          errorType: error.name || 'UnknownError',
          step: 'global_error_handler'
        })
      } catch (logError) {
        console.error('Failed to save error log:', logError)
      }

      return c.json({
        success: false,
        error: `백업 중 오류가 발생했습니다: ${error.message}`,
        details: {
          errorType: error.name,
          timestamp: new Date().toISOString()
        }
      }, 500)
    }
  })
}

// 문서 타입별 헤더 정의
function getDocumentHeaders(documentType: string): string[] {
  const baseHeaders = ['ID', '생성일', '수정일']
  
  switch (documentType) {
    case 'production-log':
      return ['ID', '날짜', '제품명', '생산량', '담당자', '비고', ...baseHeaders]
    case 'temperature-log':
      return ['ID', '날짜', '냉장고명', '온도(°C)', '상태', '점검자', '비고', ...baseHeaders]
    case 'cleaning-log':
      return ['ID', '날짜', '청소구역', '사용제품', '담당자', '상태', '비고', ...baseHeaders]
    case 'receiving-log':
      return ['ID', '날짜', '원료명', '공급업체', '수량', '상태', '검수자', '비고', ...baseHeaders]
    case 'pest-control':
      return ['ID', '주차', '점검일', '구역', '상태', '발견사항', '조치사항', '점검자', ...baseHeaders]
    case 'facility-inspection':
      return ['ID', '주차', '점검일', '시설명', '상태', '이상사항', '조치사항', '점검자', ...baseHeaders]
    case 'visitor-log':
      return ['ID', '날짜', '방문자명', '소속', '방문목적', '입실시간', '퇴실시간', '담당자', ...baseHeaders]
    case 'accident-report':
      return ['ID', '발생일시', '사고유형', '장소', '내용', '조치사항', '보고자', '상태', ...baseHeaders]
    case 'training-record':
      return ['ID', '날짜', '교육명', '교육자', '참석자', '시간', '내용', '평가', ...baseHeaders]
    case 'ccp':
      return ['ID', 'CCP명', '공정', '위해요소', '한계기준', '단위', '모니터링방법', '빈도', '현재값', '상태', '최종점검', '기록수', ...baseHeaders]
    default:
      return ['ID', '데이터', ...baseHeaders]
  }
}

// 문서 데이터를 행으로 변환
function convertDocumentToRow(documentType: string, doc: any): string[] {
  const baseData = [
    doc.id || '',
    doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ko-KR') : '',
    doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('ko-KR') : ''
  ]
  
  switch (documentType) {
    case 'production-log':
      return [
        doc.id || '',
        doc.date || '',
        doc.productName || '',
        doc.quantity?.toString() || '',
        doc.operator || '',
        doc.notes || '',
        ...baseData
      ]
    case 'temperature-log':
      return [
        doc.id || '',
        doc.date || '',
        doc.refrigeratorName || '',
        doc.temperature?.toString() || '',
        doc.status || '',
        doc.inspector || '',
        doc.notes || '',
        ...baseData
      ]
    case 'cleaning-log':
      return [
        doc.id || '',
        doc.date || '',
        doc.area || '',
        doc.cleaningProduct || '',
        doc.operator || '',
        doc.status || '',
        doc.notes || '',
        ...baseData
      ]
    case 'receiving-log':
      return [
        doc.id || '',
        doc.date || '',
        doc.materialName || '',
        doc.supplier || '',
        doc.quantity?.toString() || '',
        doc.status || '',
        doc.inspector || '',
        doc.notes || '',
        ...baseData
      ]
    case 'pest-control':
      return [
        doc.id || '',
        doc.week || '',
        doc.date || '',
        doc.area || '',
        doc.status || '',
        doc.findings || '',
        doc.actions || '',
        doc.inspector || '',
        ...baseData
      ]
    case 'facility-inspection':
      return [
        doc.id || '',
        doc.week || '',
        doc.date || '',
        doc.facilityName || '',
        doc.status || '',
        doc.issues || '',
        doc.actions || '',
        doc.inspector || '',
        ...baseData
      ]
    case 'visitor-log':
      return [
        doc.id || '',
        doc.date || '',
        doc.visitorName || '',
        doc.organization || '',
        doc.purpose || '',
        doc.entryTime || '',
        doc.exitTime || '',
        doc.host || '',
        ...baseData
      ]
    case 'accident-report':
      return [
        doc.id || '',
        doc.incidentDateTime || '',
        doc.type || '',
        doc.location || '',
        doc.description || '',
        doc.actions || '',
        doc.reporter || '',
        doc.status || '',
        ...baseData
      ]
    case 'training-record':
      return [
        doc.id || '',
        doc.date || '',
        doc.trainingName || '',
        doc.instructor || '',
        doc.attendees || '',
        doc.duration || '',
        doc.content || '',
        doc.evaluation || '',
        ...baseData
      ]
    case 'ccp':
      return [
        doc.id || '',
        doc.name || '',
        doc.process || '',
        doc.hazard || '',
        doc.criticalLimit ? `${doc.criticalLimit.min} ~ ${doc.criticalLimit.max}` : 'N/A',
        doc.unit || '',
        doc.monitoringMethod || '',
        doc.frequency || '',
        doc.currentValue?.toString() || '0',
        doc.status === 'normal' ? '정상' : doc.status === 'warning' ? '경고' : '위험',
        doc.lastChecked ? new Date(doc.lastChecked).toLocaleString('ko-KR') : '',
        doc.records ? doc.records.length.toString() : '0',
        ...baseData
      ]
    default:
      return [
        doc.id || '',
        JSON.stringify(doc),
        ...baseData
      ]
  }
}

// JWT 토큰 생성
async function createJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encoder = new TextEncoder()
  const headerB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(header))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payloadB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(payload))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const data = `${headerB64}.${payloadB64}`
  
  // Private key 처리
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n')
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(data)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${data}.${signatureB64}`
}

// 액세스 토큰 획득
async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token request failed: ${response.status} - ${errorText}`)
  }

  const tokenData = await response.json()
  return tokenData.access_token
}

// 시트 존재 확인 및 생성
async function ensureSheetExists(spreadsheetId: string, sheetName: string, accessToken: string) {
  const sheetsResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!sheetsResponse.ok) {
    throw new Error(`Sheets info request failed: ${sheetsResponse.status}`)
  }

  const sheetsInfo = await sheetsResponse.json()
  const existingSheet = sheetsInfo.sheets?.find((sheet: any) => 
    sheet.properties.title === sheetName
  )

  if (!existingSheet) {
    console.log(`Creating new sheet: ${sheetName}`)
    const addSheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        })
      }
    )

    if (!addSheetResponse.ok) {
      const errorText = await addSheetResponse.text()
      throw new Error(`Add sheet failed: ${addSheetResponse.status} - ${errorText}`)
    }
    console.log('New sheet created successfully')
  }
}

// 데이터를 시트에 쓰기
async function writeDataToSheet(spreadsheetId: string, sheetName: string, data: string[][], accessToken: string) {
  // 기존 데이터 클리어
  const clearResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:ZZ1000:clear`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )

  // 새 데이터 쓰기
  const writeResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: data,
        majorDimension: 'ROWS'
      })
    }
  )

  if (!writeResponse.ok) {
    const errorText = await writeResponse.text()
    throw new Error(`Write data failed: ${writeResponse.status} - ${errorText}`)
  }

  console.log(`✅ Successfully wrote ${data.length} rows to ${sheetName}`)
}