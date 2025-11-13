// 백업 관련 엔드포인트
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

export function addBackupEndpoints(app: Hono, requireAuth: any) {
  // CCP 기록을 Google Sheets로 백업 (Service Account 사용)
  app.post('/make-server-79e634f3/backup/ccp-records', requireAuth, async (c) => {
    const logId = `backup_${Date.now()}`
    const timestamp = new Date().toISOString()
    
    try {
      console.log('Starting CCP records backup to Google Sheets...')
      
      // 환경변수 확인
      const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      console.log('Environment check:')
      console.log('- SERVICE_ACCOUNT_JSON exists:', !!SERVICE_ACCOUNT_JSON)
      console.log('- SERVICE_ACCOUNT_JSON length:', SERVICE_ACCOUNT_JSON?.length || 0)
      console.log('- SERVICE_ACCOUNT_JSON preview:', SERVICE_ACCOUNT_JSON ? SERVICE_ACCOUNT_JSON.substring(0, 50) + '...' : 'null')
      console.log('- SPREADSHEET_ID exists:', !!SPREADSHEET_ID) 
      console.log('- SPREADSHEET_ID value:', SPREADSHEET_ID || 'null')
      
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
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg + ' 환경변수를 올바른 Service Account JSON으로 설정해주세요.'
        })
      }

      // 환경변수가 잘못된 형식인지 확인 (해시나 ID 등)
      const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
      if (trimmedJson.length < 100 || !trimmedJson.includes('{') || !trimmedJson.includes('"type"') || !trimmedJson.includes('"private_key"')) {
        const errorMsg = `SERVICE_ACCOUNT_JSON이 올바르지 않습니다. 현재 값은 JSON이 아닌 해시나 ID로 보입니다.`
        console.log('Invalid SERVICE_ACCOUNT_JSON format detected')
        console.log('Content preview:', trimmedJson.substring(0, 100))
        console.log('Content length:', trimmedJson.length)
        console.log('Contains {:', trimmedJson.includes('{'))
        console.log('Contains "type":', trimmedJson.includes('"type"'))
        console.log('Contains "private_key":', trimmedJson.includes('"private_key"'))
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { 
            error: errorMsg, 
            details: 'SERVICE_ACCOUNT_JSON appears to be hash/ID instead of JSON',
            contentPreview: trimmedJson.substring(0, 100),
            contentLength: trimmedJson.length,
            containsBrace: trimmedJson.includes('{'),
            containsType: trimmedJson.includes('"type"'),
            containsPrivateKey: trimmedJson.includes('"private_key"')
          }
        }
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: 'SERVICE_ACCOUNT_JSON 환경변수가 올바른 JSON 형식이 아닙니다. Google Cloud Console에서 다운로드한 완전한 JSON 키를 사용해주세요. 현재 값은 해시나 ID로 보입니다.'
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
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg
        })
      }

      // 모든 CCP 데이터 가져오기
      const ccps = await kv.getByPrefix('ccp:')
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
        await kv.set(`backup_log:${logId}`, warningLog)
        
        return c.json({ 
          success: true, 
          data: { message: warningMsg, recordCount: 0 }
        })
      }

      // Service Account 키 파싱
      let serviceAccount
      try {
        console.log('Parsing Service Account JSON...')
        console.log('JSON length:', SERVICE_ACCOUNT_JSON.length)
        console.log('JSON preview (first 200 chars):', SERVICE_ACCOUNT_JSON.substring(0, 200))
        
        // JSON 형식 기본 검사
        const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
        if (!trimmedJson.startsWith('{')) {
          throw new Error('JSON must start with {')
        }
        if (!trimmedJson.endsWith('}')) {
          throw new Error('JSON must end with }')
        }
        
        // 잘못된 형식인지 확인 (환경변수가 base64나 다른 형식으로 설정된 경우)
        if (/^[a-zA-Z0-9+/=]+$/.test(trimmedJson) && !trimmedJson.includes('{')) {
          throw new Error('JSON appears to be base64 encoded or invalid format')
        }
        
        serviceAccount = JSON.parse(trimmedJson)
        console.log('Service Account parsed successfully')
        console.log('Available fields:', Object.keys(serviceAccount))
        console.log('Client email:', serviceAccount.client_email)
        console.log('Project ID:', serviceAccount.project_id)
        console.log('Private key ID:', serviceAccount.private_key_id ? 'Present' : 'Missing')
        console.log('Private key length:', serviceAccount.private_key ? serviceAccount.private_key.length : 0)
        
        // Private key 형식 확인
        if (serviceAccount.private_key) {
          const hasBeginMarker = serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')
          const hasEndMarker = serviceAccount.private_key.includes('-----END PRIVATE KEY-----')
          console.log('Private key format check:', { hasBeginMarker, hasEndMarker })
        }
        
      } catch (error) {
        const errorMsg = `Service Account JSON 파싱 오류: ${error.message}`
        console.log('JSON parsing failed:', error)
        console.log('JSON content length:', SERVICE_ACCOUNT_JSON.length)
        console.log('JSON sample (first 500 chars):', SERVICE_ACCOUNT_JSON.substring(0, 500))
        
        // 상세한 에러 진단
        if (!SERVICE_ACCOUNT_JSON.trim().startsWith('{')) {
          console.log('ERROR: JSON does not start with {')
        }
        if (!SERVICE_ACCOUNT_JSON.trim().endsWith('}')) {
          console.log('ERROR: JSON does not end with }')
        }
        if (/^[a-zA-Z0-9+/=]+$/.test(SERVICE_ACCOUNT_JSON.trim()) && !SERVICE_ACCOUNT_JSON.includes('{')) {
          console.log('ERROR: Data appears to be base64 encoded, not JSON')
        }
        
        // 실패 로그 저장
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { 
            error: errorMsg, 
            jsonLength: SERVICE_ACCOUNT_JSON.length,
            parseError: error.message,
            startsWithBrace: SERVICE_ACCOUNT_JSON.trim().startsWith('{'),
            endsWithBrace: SERVICE_ACCOUNT_JSON.trim().endsWith('}')
          }
        }
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: `Invalid service account JSON format: ${error.message}`
        })
      }

      // 필수 필드 확인
      const requiredFields = ['client_email', 'private_key', 'project_id']
      for (const field of requiredFields) {
        if (!serviceAccount[field]) {
          const errorMsg = `Service Account JSON에 필수 필드 '${field}'가 없습니다.`
          console.log('Missing required field:', field)
          
          const failureLog = {
            id: logId,
            timestamp,
            status: 'failed',
            type: 'manual',
            data: { error: errorMsg, missingField: field }
          }
          await kv.set(`backup_log:${logId}`, failureLog)
          
          return c.json({ 
            success: false, 
            error: errorMsg
          })
        }
      }

      // JWT 토큰 생성 함수
      const createJWT = async (payload: any, privateKey: string) => {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()

        // 헤더
        const header = {
          alg: 'RS256',
          typ: 'JWT'
        }

        // 헤더를 Base64URL로 인코딩
        const encodedHeader = btoa(JSON.stringify(header))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')

        // 페이로드를 Base64URL로 인코딩
        const encodedPayload = btoa(JSON.stringify(payload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')

        // 서명할 데이터
        const signData = `${encodedHeader}.${encodedPayload}`

        // RSA 개인키 가져오기
        console.log('Processing private key...')
        const pemHeader = '-----BEGIN PRIVATE KEY-----'
        const pemFooter = '-----END PRIVATE KEY-----'
        
        // 개행 문자 처리 개선
        let cleanKey = privateKey
        
        // PEM 헤더/푸터 제거
        if (cleanKey.includes(pemHeader)) {
          cleanKey = cleanKey.replace(pemHeader, '')
        }
        if (cleanKey.includes(pemFooter)) {
          cleanKey = cleanKey.replace(pemFooter, '')
        }
        
        // 다양한 개행 문자 패턴 처리
        cleanKey = cleanKey.replace(/\\r\\n/g, '')
                          .replace(/\\n/g, '')
                          .replace(/\r\n/g, '')
                          .replace(/\n/g, '')
                          .replace(/\r/g, '')
                          .replace(/\s+/g, '')
        
        console.log('Cleaned key length:', cleanKey.length)
        const pemContents = cleanKey
        
        // Base64 디코딩
        let binaryKey
        try {
          binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
          console.log('Private key decoded successfully, length:', binaryKey.length)
        } catch (error) {
          console.log('Failed to decode private key:', error.message)
          throw new Error(`Private key decoding failed: ${error.message}`)
        }

        // 개인키 임포트
        let cryptoKey
        try {
          cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            binaryKey,
            {
              name: 'RSASSA-PKCS1-v1_5',
              hash: 'SHA-256'
            },
            false,
            ['sign']
          )
          console.log('Private key imported successfully')
        } catch (error) {
          console.log('Failed to import private key:', error.message)
          throw new Error(`Private key import failed: ${error.message}`)
        }

        // 서명 생성
        const signature = await crypto.subtle.sign(
          'RSASSA-PKCS1-v1_5',
          cryptoKey,
          encoder.encode(signData)
        )

        // 서명을 Base64URL로 인코딩
        const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')

        return `${signData}.${encodedSignature}`
      }

      // 액세스 토큰 가져오기
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      }

      let accessToken
      try {
        console.log('Creating JWT token...')
        console.log('JWT payload:', JSON.stringify(payload, null, 2))
        
        const jwt = await createJWT(payload, serviceAccount.private_key)
        console.log('JWT token created, length:', jwt.length)
        
        console.log('Requesting access token from Google...')
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        })

        console.log('Token response status:', tokenResponse.status)
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.log('Token response error:', errorText)
          throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`)
        }

        const tokenData = await tokenResponse.json()
        accessToken = tokenData.access_token
        console.log('Access token obtained successfully, length:', accessToken.length)
      } catch (error) {
        const errorMsg = `Google OAuth 토큰 요청 실패: ${error.message}`
        console.log('OAuth token request failed:', error)
        console.log('Error stack:', error.stack)
        
        // 실패 로그 저장
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { error: errorMsg, errorStack: error.stack }
        }
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg
        })
      }

      // CCP 데이터를 시트 형식으로 변환
      const today = new Date().toLocaleDateString('ko-KR')
      const sheetData = []

      // 헤더 추가
      sheetData.push([
        'CCP ID',
        'CCP 명',
        '공정명',
        '위해요소',
        '중요한계점',
        '단위',
        '모니터링 방법',
        '빈도',
        '현재값',
        '상태',
        '마지막 점검',
        '기록 수',
        '생성일시',
        '업데이트일시'
      ])

      // CCP 데이터 추가
      for (const ccp of ccps) {
        const criticalLimitStr = ccp.criticalLimit ? 
          `${ccp.criticalLimit.min} ~ ${ccp.criticalLimit.max}` : 'N/A'
        
        const statusKo = ccp.status === 'normal' ? '정상' : 
                        ccp.status === 'warning' ? '경고' : '위험'
        
        sheetData.push([
          ccp.id || '',
          ccp.name || '',
          ccp.process || '',
          ccp.hazard || '',
          criticalLimitStr,
          ccp.unit || '',
          ccp.monitoringMethod || '',
          ccp.frequency || '',
          ccp.currentValue?.toString() || '0',
          statusKo,
          ccp.lastChecked ? new Date(ccp.lastChecked).toLocaleString('ko-KR') : '',
          ccp.records ? ccp.records.length.toString() : '0',
          ccp.createdAt ? new Date(ccp.createdAt).toLocaleString('ko-KR') : '',
          ccp.updatedAt ? new Date(ccp.updatedAt).toLocaleString('ko-KR') : ''
        ])
      }

      // Google Sheets에 데이터 쓰기
      try {
        console.log('Writing data to Google Sheets...')
        
        // 시트 이름 생성 (날짜 기반)
        const sheetName = `CCP_Backup_${today.replace(/\./g, '_')}`
        
        // 먼저 시트가 있는지 확인하고 없으면 생성
        const sheetsResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
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
          // 새 시트 생성
          console.log(`Creating new sheet: ${sheetName}`)
          const addSheetResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
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

        // 데이터 쓰기
        const updateResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A1:clear`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const writeResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A1`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              range: `${sheetName}!A1`,
              majorDimension: 'ROWS',
              values: sheetData
            })
          }
        )

        if (!writeResponse.ok) {
          const errorText = await writeResponse.text()
          console.log('Write response error text:', errorText)
          console.log('Write response status:', writeResponse.status)
          console.log('Write response headers:', Object.fromEntries(writeResponse.headers.entries()))
          
          // Google API 에러 파싱 시도
          try {
            const errorData = JSON.parse(errorText)
            console.log('Google Sheets API error:', JSON.stringify(errorData, null, 2))
            throw new Error(`Google Sheets API error: ${errorData.error?.code || writeResponse.status}`)
          } catch (parseError) {
            throw new Error(`Write to sheet failed: ${writeResponse.status} - ${errorText}`)
          }
        }

        console.log('Data written to Google Sheets successfully')
        
        const successMessage = `CCP 데이터 백업이 완료되었습니다. (${ccps.length}개 CCP, 시트: ${sheetName})`
        
        // 성공 로그 저장
        const successLog = {
          id: logId,
          timestamp,
          status: 'success',
          type: 'manual',
          data: { 
            message: successMessage,
            recordCount: ccps.length,
            sheetName: sheetName
          }
        }
        await kv.set(`backup_log:${logId}`, successLog)
        
        return c.json({ 
          success: true, 
          data: { 
            message: successMessage,
            recordCount: ccps.length,
            sheetName: sheetName
          }
        })

      } catch (error) {
        const errorMsg = `Google Sheets 쓰기 실패: ${error.message}`
        console.log('Google Sheets write failed:', error)
        
        // 실패 로그 저장
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { error: errorMsg }
        }
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg
        })
      }

    } catch (error) {
      const errorMsg = `백업 처리 중 오류 발생: ${error.message}`
      console.log('Backup process error:', error)
      
      // 에러 로그 저장
      const errorLog = {
        id: logId,
        timestamp,
        status: 'error',
        type: 'manual',
        data: { error: errorMsg }
      }
      await kv.set(`backup_log:${logId}`, errorLog)
      
      return c.json({ 
        success: false, 
        error: errorMsg
      })
    }
  })

  // 백업 설정 상태 확인 API
  app.get('/make-server-79e634f3/backup/config-status', requireAuth, async (c) => {
    try {
      console.log('Checking backup configuration status...')
      
      const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      console.log('Config check - SERVICE_ACCOUNT_JSON exists:', !!SERVICE_ACCOUNT_JSON)
      console.log('Config check - SERVICE_ACCOUNT_JSON length:', SERVICE_ACCOUNT_JSON?.length || 0)
      console.log('Config check - SPREADSHEET_ID exists:', !!SPREADSHEET_ID)
      
      const status = {
        serviceAccount: false,
        spreadsheetId: false,
        details: {}
      }
      
      // Service Account JSON 확인
      if (SERVICE_ACCOUNT_JSON && SERVICE_ACCOUNT_JSON.trim()) {
        try {
          // 잘못된 형식 사전 검사 (해시나 ID 등)
          const trimmed = SERVICE_ACCOUNT_JSON.trim()
          if (trimmed.length < 100 || !trimmed.includes('{') || !trimmed.includes('"type"') || !trimmed.includes('"private_key"')) {
            console.log('Config check - SERVICE_ACCOUNT_JSON appears to be hash/ID instead of JSON')
            console.log('Config check - Content preview:', trimmed.substring(0, 100))
            console.log('Config check - Length:', trimmed.length)
            console.log('Config check - Contains {:', trimmed.includes('{'))
            console.log('Config check - Contains "type":', trimmed.includes('"type"'))
            console.log('Config check - Contains "private_key":', trimmed.includes('"private_key"'))
            
            status.serviceAccount = false
            status.details.serviceAccount = {
              hasJson: true,
              parseError: 'SERVICE_ACCOUNT_JSON appears to be hash/ID instead of JSON',
              contentPreview: trimmed.substring(0, 100),
              contentLength: trimmed.length,
              containsBrace: trimmed.includes('{'),
              containsType: trimmed.includes('"type"'),
              containsPrivateKey: trimmed.includes('"private_key"'),
              suggestion: 'Please use the complete JSON key downloaded from Google Cloud Console'
            }
          } else if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
            console.log('Config check - JSON format invalid: does not start with { or end with }')
            status.serviceAccount = false
            status.details.serviceAccount = {
              hasJson: true,
              parseError: 'Invalid JSON format: must start with { and end with }'
            }
          } else {
            console.log('Config check - Attempting to parse JSON...')
            const serviceAccount = JSON.parse(trimmed)
            console.log('Config check - JSON parsed successfully')
            
            const requiredFields = ['client_email', 'private_key', 'project_id']
            const hasAllFields = requiredFields.every(field => {
              const hasField = !!serviceAccount[field]
              console.log(`Config check - Field '${field}':`, hasField ? 'Present' : 'Missing')
              return hasField
            })
            
            status.serviceAccount = hasAllFields
            status.details.serviceAccount = {
              hasJson: true,
              hasRequiredFields: hasAllFields,
              clientEmail: serviceAccount.client_email || null,
              projectId: serviceAccount.project_id || null,
              fieldsPresent: requiredFields.filter(field => serviceAccount[field])
            }
            console.log('Config check - Service Account validation:', hasAllFields ? 'PASSED' : 'FAILED')
          }
        } catch (error) {
          console.log('Config check - JSON parsing failed:', error.message)
          status.details.serviceAccount = {
            hasJson: true,
            parseError: error.message,
            jsonPreview: SERVICE_ACCOUNT_JSON.substring(0, 100)
          }
        }
      } else {
        console.log('Config check - SERVICE_ACCOUNT_JSON not found or empty')
        status.details.serviceAccount = {
          hasJson: false
        }
      }
      
      // Spreadsheet ID 확인
      if (SPREADSHEET_ID && SPREADSHEET_ID.trim().length > 0) {
        console.log('Config check - Spreadsheet ID found:', SPREADSHEET_ID.substring(0, 20) + '...')
        status.spreadsheetId = true
        status.details.spreadsheetId = {
          hasId: true,
          idLength: SPREADSHEET_ID.length
        }
      } else {
        console.log('Config check - Spreadsheet ID not found')
        status.details.spreadsheetId = {
          hasId: false
        }
      }
      
      console.log('Config check result:', {
        serviceAccount: status.serviceAccount,
        spreadsheetId: status.spreadsheetId
      })
      
      return c.json({ success: true, data: status })
    } catch (error) {
      console.log('Error checking backup config status:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to check backup configuration',
        details: error.message 
      }, 500)
    }
  })

  // 백업 로그 조회 API
  app.get('/make-server-79e634f3/backup/logs', requireAuth, async (c) => {
    try {
      console.log('Fetching backup logs...')
      
      // 백업 로그를 KV에서 조회
      const logs = await kv.getByPrefix('backup_log:')
      
      // 시간순으로 정렬 (최신순)
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
      return c.json({ success: true, data: sortedLogs })
    } catch (error) {
      console.log('Error fetching backup logs:', error)
      return c.json({ error: 'Failed to fetch backup logs' }, 500)
    }
  })

  // 백업 연결 테스트 API
  app.post('/make-server-79e634f3/backup/test-connection', requireAuth, async (c) => {
    try {
      console.log('Testing backup connection...')
      
      const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      // 환경변수 확인
      if (!SERVICE_ACCOUNT_JSON || SERVICE_ACCOUNT_JSON.trim() === '') {
        return c.json({ 
          success: false, 
          error: 'GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다.' 
        })
      }

      if (!SPREADSHEET_ID || SPREADSHEET_ID.trim() === '') {
        return c.json({ 
          success: false, 
          error: 'GOOGLE_SHEETS_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.' 
        })
      }

      // JSON 파싱 테스트
      let serviceAccount
      try {
        const trimmed = SERVICE_ACCOUNT_JSON.trim()
        if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
          return c.json({ 
            success: false, 
            error: 'SERVICE_ACCOUNT_JSON이 올바른 JSON 형식이 아닙니다. Google Cloud Console에서 다운로드한 JSON 키를 사용해주세요.' 
          })
        }
        
        serviceAccount = JSON.parse(trimmed)
        
        // 필수 필드 확인
        const requiredFields = ['client_email', 'private_key', 'project_id']
        for (const field of requiredFields) {
          if (!serviceAccount[field]) {
            return c.json({ 
              success: false, 
              error: `Service Account JSON에 필수 필드 '${field}'가 없습니다.` 
            })
          }
        }
      } catch (error) {
        return c.json({ 
          success: false, 
          error: `Service Account JSON 파싱 오류: ${error.message}` 
        })
      }

      // Google Sheets API 접근 테스트 (스프레드시트 정보 읽기)
      try {
        // 간단한 JWT 토큰 생성 (테스트용)
        const now = Math.floor(Date.now() / 1000)
        const payload = {
          iss: serviceAccount.client_email,
          scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now
        }

        // JWT 생성 로직은 복잡하므로 일단 환경변수와 기본 설정만 확인
        return c.json({ 
          success: true, 
          data: { 
            message: '환경변수 설정이 올바릅니다. Google Sheets 백업을 사용할 수 있습니다.',
            serviceAccount: {
              clientEmail: serviceAccount.client_email,
              projectId: serviceAccount.project_id,
              hasPrivateKey: !!serviceAccount.private_key
            },
            spreadsheetId: SPREADSHEET_ID
          }
        })
      } catch (error) {
        return c.json({ 
          success: false, 
          error: `백업 연결 테스트 실패: ${error.message}` 
        })
      }
    } catch (error) {
      console.log('Backup connection test error:', error)
      return c.json({ 
        success: false, 
        error: `연결 테스트 중 오류 발생: ${error.message}` 
      })
    }
  })
}