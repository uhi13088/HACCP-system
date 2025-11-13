// 백업 관련 엔드포인트
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'
import { processPrivateKey, importPrivateKey, generateSignature, encodeSignature } from './private_key_utils.tsx'

export function addBackupEndpoints(app: Hono, kvStore: any, requireAuth: any, supabase: any) {
  // 백업 로그 조회 엔드포인트
  app.get('/make-server-79e634f3/backup/logs', requireAuth, async (c) => {
    try {
      console.log('📄 Fetching backup logs...')
      
      let logs = []
      
      try {
        logs = await kvStore.getByPrefix('backup_log:')
        console.log('✓ Found', logs.length, 'backup log records')
      } catch (kvError) {
        console.log('⚠ KV fetch error for backup logs:', kvError)
        logs = []
      }
      
      // 최신순으로 정렬 (안전한 방식)
      try {
        const sortedLogs = logs.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timeB - timeA
        })
        
        console.log('✅ Returning', sortedLogs.length, 'sorted backup logs')
        return c.json({ success: true, data: sortedLogs })
      } catch (sortError) {
        console.log('⚠ Error sorting backup logs:', sortError)
        return c.json({ success: true, data: logs })
      }
    } catch (error) {
      console.error('❌ Error fetching backup logs:', error)
      return c.json({ 
        success: true, 
        data: [],
        warning: 'Backup logs fetch failed, returning empty array'
      })
    }
  })

  // 백업 설정 상태 확인 엔드포인트
  app.get('/make-server-79e634f3/backup/config-status', requireAuth, async (c) => {
    try {
      console.log('🔧 Checking backup configuration status...')
      
      let serviceAccountStatus = false
      let spreadsheetIdStatus = false
      
      try {
        const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
        
        console.log('Environment variables check:')
        console.log('- SERVICE_ACCOUNT_JSON exists:', !!SERVICE_ACCOUNT_JSON)
        console.log('- SPREADSHEET_ID exists:', !!SPREADSHEET_ID)
      
      // Service Account JSON 확인
      if (SERVICE_ACCOUNT_JSON && SERVICE_ACCOUNT_JSON.trim() !== '') {
        const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
        
        // 올바른 JSON 형식인지 확인
        try {
          if (trimmedJson.startsWith('{') && 
              trimmedJson.endsWith('}') && 
              trimmedJson.includes('"type"') && 
              trimmedJson.includes('"private_key"') &&
              !trimmedJson.startsWith('MII') &&
              !trimmedJson.startsWith('-----BEGIN PRIVATE KEY-----')) {
            
            const serviceAccount = JSON.parse(trimmedJson)
            const requiredFields = ['client_email', 'private_key', 'project_id']
            const hasAllFields = requiredFields.every(field => serviceAccount[field])
            
            if (hasAllFields) {
              serviceAccountStatus = true
              console.log('Service Account JSON status: Valid')
            } else {
              console.log('Service Account JSON status: Missing required fields')
            }
          } else {
            console.log('Service Account JSON status: Invalid format')
          }
        } catch (error) {
          console.log('Service Account JSON status: Parse error')
        }
      } else {
        console.log('Service Account JSON status: Not set')
      }
      
      // Spreadsheet ID 확인
      if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
        spreadsheetIdStatus = true
        console.log('Spreadsheet ID status: Set')
      } else {
        console.log('Spreadsheet ID status: Not set')
      }
      
      const configStatus = {
        serviceAccount: serviceAccountStatus,
        spreadsheetId: spreadsheetIdStatus,
        overall: serviceAccountStatus && spreadsheetIdStatus
      }
      
      console.log('Configuration status:', configStatus)
      
      return c.json({ 
        success: true, 
        data: configStatus 
      })
    } catch (error) {
      console.log('Error checking backup configuration:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to check backup configuration',
        data: {
          serviceAccount: false,
          spreadsheetId: false,
          overall: false
        }
      }, 500)
    }
  })

  // CCP 기록을 Google Sheets로 백업 (Service Account 사용)
  app.post('/make-server-79e634f3/backup/ccp-records', requireAuth, async (c) => {
    const logId = `backup_${Date.now()}`
    const timestamp = new Date().toISOString()
    
    try {
      console.log('Starting CCP records backup to Google Sheets...')
      
      // 환경���수 확인
      const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      console.log('Environment check:')
      console.log('- SERVICE_ACCOUNT_JSON exists:', !!SERVICE_ACCOUNT_JSON)
      console.log('- SERVICE_ACCOUNT_JSON length:', SERVICE_ACCOUNT_JSON?.length || 0)
      console.log('- SPREADSHEET_ID exists:', !!SPREADSHEET_ID) 
      
      // 환경변수 기본 검사
      if (!SERVICE_ACCOUNT_JSON || SERVICE_ACCOUNT_JSON.trim() === '') {
        const errorMsg = 'GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다.'
        console.log('Missing or empty GOOGLE_SERVICE_ACCOUNT_JSON')
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { error: errorMsg, details: 'Missing SERVICE_ACCOUNT_JSON' }
        }
        await kvStore.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg + ' 환경변수를 올바른 Service Account JSON으로 설정해주세요.'
        })
      }

      if (!SPREADSHEET_ID) {
        const errorMsg = 'GOOGLE_SHEETS_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.'
        console.log('Missing GOOGLE_SHEETS_SPREADSHEET_ID')
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { error: errorMsg, details: 'Missing SPREADSHEET_ID' }
        }
        await kvStore.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg
        })
      }

      // 모든 CCP 데이터 가져오기
      const ccps = await kvStore.getByPrefix('ccp:')
      console.log(`Found ${ccps.length} CCPs to backup`)

      if (ccps.length === 0) {
        const warningMsg = '백업할 CCP 데이터가 없습니다.'
        console.log('No CCP data to backup')
        
        // 성공이지만 데이터 없음 로그
        const warningLog = {
          id: logId,
          timestamp,
          status: 'success',
          type: 'manual',
          data: { message: warningMsg, recordCount: 0 }
        }
        await kvStore.set(`backup_log:${logId}`, warningLog)
        
        return c.json({ 
          success: true, 
          data: { message: warningMsg, recordCount: 0 }
        })
      }

      // Service Account JSON 파싱
      let serviceAccount
      try {
        const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
        
        // JSON 형식 기본 검사
        if (!trimmedJson.startsWith('{') || !trimmedJson.endsWith('}')) {
          throw new Error('Invalid JSON format - must start with { and end with }')
        }
        
        if (!trimmedJson.includes('"type"') || !trimmedJson.includes('"private_key"')) {
          throw new Error('Missing required fields in Service Account JSON')
        }
        
        serviceAccount = JSON.parse(trimmedJson)
        console.log('Service Account parsed successfully')
        console.log('Client email:', serviceAccount.client_email)
        console.log('Project ID:', serviceAccount.project_id)
        
        // 필수 필드 확인
        const requiredFields = ['client_email', 'private_key', 'project_id']
        for (const field of requiredFields) {
          if (!serviceAccount[field]) {
            throw new Error(`Missing required field: ${field}`)
          }
        }
        
      } catch (error) {
        const errorMsg = `Service Account JSON 파싱 오류: ${error.message}`
        console.log('JSON parsing failed:', error)
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { 
            error: errorMsg, 
            parseError: error.message
          }
        }
        await kvStore.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg
        })
      }

      // JWT 토큰 생성 및 Google Sheets API 호출
      try {
        console.log('Creating JWT token for Google Sheets API...')
        
        // JWT 헤더
        const header = {
          alg: 'RS256',
          typ: 'JWT'
        }
        
        // JWT 페이로드
        const now = Math.floor(Date.now() / 1000)
        const payload = {
          iss: serviceAccount.client_email,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600, // 1시간
          iat: now
        }
        
        // Base64URL 인코딩 함수
        const base64url = (data: string) => {
          return btoa(data)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
        }
        
        // JWT 생성
        const encodedHeader = base64url(JSON.stringify(header))
        const encodedPayload = base64url(JSON.stringify(payload))
        const unsignedToken = `${encodedHeader}.${encodedPayload}`
        
        // Private Key를 사용한 서명 생성
        console.log('Signing JWT with private key...')
        const privateKey = serviceAccount.private_key
        
        // 유틸리티 함수를 사용하여 private key 처리
        const keyBytes = processPrivateKey(privateKey)
        const cryptoKey = await importPrivateKey(keyBytes)
        const signature = await generateSignature(cryptoKey, unsignedToken)
        const encodedSignature = encodeSignature(signature, base64url)
        
        // 최종 JWT
        const jwt = `${unsignedToken}.${encodedSignature}`
        console.log('JWT created successfully')
        
        // Access Token 요청
        console.log('Requesting access token from Google...')
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
          })
        })
        
        if (!tokenResponse.ok) {
          const tokenError = await tokenResponse.text()
          console.log('Token request failed:', tokenError)
          throw new Error(`Token request failed: ${tokenResponse.status} ${tokenError}`)
        }
        
        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token
        console.log('Access token obtained successfully')
        
        // 스프레드시트 메타데이터 확인
        console.log('Checking spreadsheet metadata...')
        const metadataResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )
        
        if (!metadataResponse.ok) {
          const metadataError = await metadataResponse.text()
          console.log('Spreadsheet metadata request failed:', metadataError)
          throw new Error(`Spreadsheet access failed: ${metadataResponse.status} ${metadataError}`)
        }
        
        const spreadsheetData = await metadataResponse.json()
        console.log('Spreadsheet found:', spreadsheetData.properties.title)
        console.log('Available sheets:', spreadsheetData.sheets?.map(s => s.properties.title))
        
        // 첫 번째 시트 이름 가져오기
        const firstSheet = spreadsheetData.sheets?.[0]
        if (!firstSheet) {
          throw new Error('스프레드시트에 시트가 없습니다')
        }
        
        const sheetName = firstSheet.properties.title
        console.log('Using sheet:', sheetName)
        
        // CCP 데이터를 스프레드시트 형식으로 변환
        const rows = []
        const headers = [
          'Date', 'Time', 'CCP_ID', 'Process', 'Measured_Value', 'Unit', 
          'Critical_Limit_Min', 'Critical_Limit_Max', 'Status', 'Inspector', 
          'Notes', 'Compliance', 'Corrective_Action', 'Signature', 'Created_At'
        ]
        
        // 헤더 추가
        rows.push(headers)
        
        // CCP 데이터 추가
        ccps.forEach((ccp: any) => {
          const createdDate = new Date(ccp.createdAt || ccp.lastChecked || new Date())
          rows.push([
            createdDate.toISOString().split('T')[0], // Date
            createdDate.toTimeString().split(' ')[0], // Time
            ccp.id || '',
            ccp.process || ccp.name || '',
            ccp.currentValue || '',
            ccp.unit || '',
            ccp.criticalLimit?.min || '',
            ccp.criticalLimit?.max || '',
            ccp.status || 'normal',
            'System',
            `현재 측정값: ${ccp.currentValue} ${ccp.unit}`,
            ccp.status === 'critical' ? '부적합' : '적합',
            '',
            '',
            createdDate.toISOString()
          ])
        })
        
        // 데이터가 있는지 확인
        if (rows.length === 0) {
          throw new Error('백업할 데이터가 없습니다')
        }
        
        // 최소 1행(헤더)은 있어야 함
        if (rows.length === 1) {
          console.log('헤더만 있고 데이터가 없음, 빈 행 추가')
          rows.push(['', '', '', '', '', '', '', '', '', '', '데이터 없음', '', '', '', ''])
        }
        
        // 여러 범위 지정 방식을 시도 (호환성 향상)
        const possibleRanges = [
          `${sheetName}!A1:O${rows.length}`, // 기본 방식
          `'${sheetName}'!A1:O${rows.length}`, // 따옴표로 감싸기
          `${sheetName}!A:O`, // 전체 열 범위
          `A1:O${rows.length}`, // 시트 이름 없이 범위만
        ]
        
        console.log(`Attempting to write ${rows.length} rows using multiple range formats`)
        console.log('Available sheet names:', spreadsheetData.sheets?.map(s => s.properties.title))
        
        let writeResponse = null
        let successfulRange = null
        let lastError = null
        
        // 각 범위 형식을 시도
        for (const range of possibleRanges) {
          try {
            console.log(`Trying range format: ${range}`)
            
            // 먼저 해당 범위에 데이터 쓰기 시도
            writeResponse = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  values: rows
                })
              }
            )
            
            if (writeResponse.ok) {
              console.log(`✓ Successfully used range format: ${range}`)
              successfulRange = range
              break
            } else {
              const errorText = await writeResponse.text()
              console.log(`✗ Range format ${range} failed:`, errorText)
              lastError = errorText
              writeResponse = null
            }
            
          } catch (error) {
            console.log(`✗ Range format ${range} threw error:`, error.message)
            lastError = error.message
            continue
          }
        }
        
        // 모든 범위 형식이 실패한 경우
        if (!writeResponse || !writeResponse.ok) {
          console.log('All range formats failed, trying batch update method...')
          
          // 대안: batchUpdate API 사용
          try {
            const batchUpdateResponse = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  requests: [{
                    updateCells: {
                      start: {
                        sheetId: firstSheet.properties.sheetId,
                        rowIndex: 0,
                        columnIndex: 0
                      },
                      rows: rows.map(row => ({
                        values: row.map(cell => ({
                          userEnteredValue: { stringValue: String(cell || '') }
                        }))
                      })),
                      fields: 'userEnteredValue'
                    }
                  }]
                })
              }
            )
            
            if (batchUpdateResponse.ok) {
              console.log('✓ BatchUpdate method succeeded')
              writeResponse = batchUpdateResponse
              successfulRange = `batchUpdate on sheet ${firstSheet.properties.sheetId}`
            } else {
              const batchError = await batchUpdateResponse.text()
              console.log('✗ BatchUpdate method failed:', batchError)
              throw new Error(`All write methods failed. Last error: ${lastError || batchError}`)
            }
          } catch (batchError) {
            console.log('✗ BatchUpdate method threw error:', batchError.message)
            throw new Error(`All write methods failed. Last range error: ${lastError}, BatchUpdate error: ${batchError.message}`)
          }
        }
        
        if (!writeResponse.ok) {
          const writeError = await writeResponse.text()
          console.log('Data write failed:', writeError)
          console.log('Failed range:', range)
          console.log('Sheet name used:', safeSheetName)
          console.log('Available sheets:', spreadsheetData.sheets?.map(s => s.properties.title))
          
          let errorDetails = writeError
          try {
            const errorObj = JSON.parse(writeError)
            errorDetails = errorObj.error?.message || writeError
          } catch (e) {
            // writeError가 JSON이 아닌 경우
          }
          
          throw new Error(`Data write failed: ${writeResponse.status} - ${errorDetails}`)
        }
        
        const writeResult = await writeResponse.json()
        console.log('Data written successfully!')
        console.log('Method used:', successfulRange || 'batchUpdate')
        console.log('Rows updated:', writeResult.updatedRows || writeResult.replies?.[0]?.updatedRows || rows.length)
        console.log('Cells updated:', writeResult.updatedCells || writeResult.replies?.[0]?.updatedCells || 'unknown')
        console.log('Range written:', writeResult.updatedRange || successfulRange || 'batchUpdate')
        
        const finalRowCount = writeResult.updatedRows || writeResult.replies?.[0]?.updatedRows || rows.length
        const method = successfulRange ? `범위: ${successfulRange}` : 'batchUpdate API'
        
        // 성공 로그 저장
        const successLog = {
          id: logId,
          timestamp,
          status: 'success',
          type: 'manual',
          data: { 
            message: `CCP 데이터 백업 완료 (${method})`,
            recordCount: ccps.length,
            spreadsheetId: SPREADSHEET_ID,
            rowsWritten: finalRowCount,
            spreadsheetTitle: spreadsheetData.properties.title,
            method: method
          }
        }
        await kvStore.set(`backup_log:${logId}`, successLog)

        return c.json({
          success: true,
          data: {
            message: `${ccps.length}개의 CCP 기록이 Google Sheets '${spreadsheetData.properties.title}'에 성공적으로 백업되었습니다.`,
            recordCount: ccps.length,
            rowsWritten: finalRowCount,
            spreadsheetId: SPREADSHEET_ID,
            method: method,
            timestamp
          }
        })
        
      } catch (error) {
        console.log('Google Sheets API error:', error)
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { 
            error: error.message,
            stack: error.stack,
            step: 'Google Sheets API call'
          }
        }
        await kvStore.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: 'Google Sheets 백업 실패: ' + error.message 
        })
      }

    } catch (error) {
      console.log('Error during backup:', error)
      
      // 실패 로그 저장
      const failureLog = {
        id: logId,
        timestamp,
        status: 'failed',
        type: 'manual',
        data: { 
          error: error.message,
          stack: error.stack 
        }
      }
      await kvStore.set(`backup_log:${logId}`, failureLog)
      
      return c.json({ 
        success: false, 
        error: 'Backup failed: ' + error.message 
      }, 500)
    }
  })

  // 백업 연결 테스트 엔드포인트
  app.post('/make-server-79e634f3/backup/test-connection', requireAuth, async (c) => {
    try {
      console.log('Testing backup connection...')
      
      // 환경변수 확인
      const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      console.log('Environment check for connection test:')
      console.log('- SERVICE_ACCOUNT_JSON exists:', !!SERVICE_ACCOUNT_JSON)
      console.log('- SERVICE_ACCOUNT_JSON length:', SERVICE_ACCOUNT_JSON?.length || 0)
      console.log('- SPREADSHEET_ID exists:', !!SPREADSHEET_ID)
      console.log('- SPREADSHEET_ID value:', SPREADSHEET_ID)
      
      // 환경변수 기본 검사
      if (!SERVICE_ACCOUNT_JSON || SERVICE_ACCOUNT_JSON.trim() === '') {
        return c.json({ 
          success: false, 
          error: 'GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다. Service Account JSON을 설정해주세요.'
        })
      }

      if (!SPREADSHEET_ID || SPREADSHEET_ID.trim() === '') {
        return c.json({ 
          success: false, 
          error: 'GOOGLE_SHEETS_SPREADSHEET_ID 환경변수가 설정되지 않았습니다. 스프레드시트 ID를 설정해주세요.'
        })
      }

      // Service Account JSON 파싱 테스트
      let serviceAccount
      try {
        const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
        
        // JSON 형식 기본 검사
        if (!trimmedJson.startsWith('{') || !trimmedJson.endsWith('}')) {
          return c.json({ 
            success: false, 
            error: 'Service Account JSON 형식이 올바르지 않습니다. JSON은 {로 시작하고 }로 끝나야 합니다.'
          })
        }
        
        if (!trimmedJson.includes('"type"') || !trimmedJson.includes('"private_key"')) {
          return c.json({ 
            success: false, 
            error: 'Service Account JSON에 필수 필드(type, private_key)가 없습니다.'
          })
        }
        
        serviceAccount = JSON.parse(trimmedJson)
        console.log('Service Account parsed successfully for test')
        console.log('Client email:', serviceAccount.client_email)
        console.log('Project ID:', serviceAccount.project_id)
        
        // 필수 필드 확인
        const requiredFields = ['client_email', 'private_key', 'project_id']
        for (const field of requiredFields) {
          if (!serviceAccount[field]) {
            return c.json({ 
              success: false, 
              error: `Service Account JSON에서 ${field} 필드가 누락되었습니다.`
            })
          }
        }
        
      } catch (error) {
        return c.json({ 
          success: false, 
          error: `Service Account JSON 파싱 오류: ${error.message}. 올바른 JSON 형식인지 확인해주세요.`
        })
      }

      // JWT 토큰 생성 및 Google Sheets API 연결 테스트
      try {
        console.log('Creating JWT token for connection test...')
        
        // JWT 헤더
        const header = {
          alg: 'RS256',
          typ: 'JWT'
        }
        
        // JWT 페이로드
        const now = Math.floor(Date.now() / 1000)
        const payload = {
          iss: serviceAccount.client_email,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600, // 1시간
          iat: now
        }
        
        // Base64URL 인코딩 함수
        const base64url = (data: string) => {
          return btoa(data)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
        }
        
        // JWT 생성
        const encodedHeader = base64url(JSON.stringify(header))
        const encodedPayload = base64url(JSON.stringify(payload))
        const unsignedToken = `${encodedHeader}.${encodedPayload}`
        
        // Private Key를 사용한 서명 생성
        console.log('Signing JWT with private key for test...')
        const privateKey = serviceAccount.private_key
        
        // PEM 형식의 private key를 PKCS#8 형식으로 변환
        const pemHeader = '-----BEGIN PRIVATE KEY-----'
        const pemFooter = '-----END PRIVATE KEY-----'
        
        // private key가 올바른 형식인지 확인
        if (!privateKey.includes(pemHeader) || !privateKey.includes(pemFooter)) {
          throw new Error('Invalid private key format - missing PEM headers')
        }
        
        // PEM 내용 추출 및 정리
        let pemContents = privateKey
          .replace(pemHeader, '')
          .replace(pemFooter, '')
          .replace(/\r/g, '')
          .replace(/\n/g, '')
          .replace(/\s/g, '')
        
        // Base64 문자열 유효성 검사
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(pemContents)) {
          throw new Error('Invalid base64 characters in private key')
        }
        
        // Base64 패딩 추가 (필요한 경우)
        while (pemContents.length % 4 !== 0) {
          pemContents += '='
        }
        
        console.log('Private key length after cleaning for test:', pemContents.length)
        
        // Base64 디코딩을 try-catch로 감싸기
        let binaryString
        try {
          binaryString = atob(pemContents)
        } catch (error) {
          console.error('Base64 decode error in test:', error)
          throw new Error(`Failed to decode private key: ${error.message}`)
        }
        
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        // 개인키 가져오기
        console.log('Attempting to import private key for test...')
        let cryptoKey
        try {
          cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            bytes,
            {
              name: 'RSASSA-PKCS1-v1_5',
              hash: 'SHA-256'
            },
            false,
            ['sign']
          )
          console.log('Private key imported successfully for test')
        } catch (error) {
          console.error('Private key import error in test:', error)
          throw new Error(`Failed to import private key: ${error.message}`)
        }
        
        // 서명 생성
        const signature = await crypto.subtle.sign(
          'RSASSA-PKCS1-v1_5',
          cryptoKey,
          new TextEncoder().encode(unsignedToken)
        )
        
        // 서명을 Base64URL로 인코딩
        const signatureArray = new Uint8Array(signature)
        const signatureString = String.fromCharCode(...signatureArray)
        const encodedSignature = base64url(signatureString)
        
        // 최종 JWT
        const jwt = `${unsignedToken}.${encodedSignature}`
        console.log('JWT created successfully for test')
        
        // Access Token 요청
        console.log('Requesting access token from Google for test...')
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
          })
        })
        
        if (!tokenResponse.ok) {
          const tokenError = await tokenResponse.text()
          console.log('Token request failed in test:', tokenError)
          return c.json({ 
            success: false, 
            error: `Google OAuth 토큰 요청 실패: ${tokenResponse.status}. Service Account 설정을 확인해주세요.`
          })
        }
        
        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token
        console.log('Access token obtained successfully for test')
        
        // 스프레드시트 메타데이터 확인
        console.log('Testing spreadsheet access...')
        const metadataResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )
        
        if (!metadataResponse.ok) {
          const metadataError = await metadataResponse.text()
          console.log('Spreadsheet metadata request failed in test:', metadataError)
          
          if (metadataResponse.status === 404) {
            return c.json({ 
              success: false, 
              error: '스프레드시트를 찾을 수 없습니다. 스프레드시트 ID가 올바른지 확인해주세요.'
            })
          } else if (metadataResponse.status === 403) {
            return c.json({ 
              success: false, 
              error: `스프레드시트에 접근할 수 없습니다. Service Account 이메일(${serviceAccount.client_email})을 스프레드시트 편집자로 공유했는지 확인해주세요.`
            })
          } else {
            return c.json({ 
              success: false, 
              error: `스프레드시트 접근 실패: ${metadataResponse.status} ${metadataError}`
            })
          }
        }
        
        const spreadsheetData = await metadataResponse.json()
        console.log('Spreadsheet access test successful:', spreadsheetData.properties.title)
        
        // 첫 번째 시트 확인
        const firstSheet = spreadsheetData.sheets?.[0]
        if (!firstSheet) {
          return c.json({ 
            success: false, 
            error: '스프레드시트에 시트가 없습니다. 최소 하나의 시트가 필요합니다.'
          })
        }
        
        return c.json({
          success: true,
          data: {
            message: '백업 연결 테스트 성공!',
            spreadsheetTitle: spreadsheetData.properties.title,
            spreadsheetId: SPREADSHEET_ID,
            serviceAccountEmail: serviceAccount.client_email,
            availableSheets: spreadsheetData.sheets?.map(s => s.properties.title) || [],
            connectionStatus: 'verified'
          }
        })
        
      } catch (error) {
        console.log('Google Sheets API connection test error:', error)
        return c.json({ 
          success: false, 
          error: `Google Sheets API 연결 테스트 실패: ${error.message}`
        })
      }

    } catch (error) {
      console.log('Connection test error:', error)
      return c.json({ 
        success: false, 
        error: `연결 테스트 중 오류 발생: ${error.message}`
      }, 500)
    }
  })

  // 백업 실행 엔드포인트 (별칭)
  app.post('/make-server-79e634f3/backup/execute', requireAuth, async (c) => {
    // /backup/ccp-records 엔드포인트로 리다이렉트
    return app.fetch(c.req.raw, { ...c.env, path: '/make-server-79e634f3/backup/ccp-records' })
  })
}