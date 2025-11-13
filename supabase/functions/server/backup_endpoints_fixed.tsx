// 백업 관련 엔드포인트
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'
import { processPrivateKey, importPrivateKey, generateSignature, encodeSignature } from './private_key_utils.tsx'

export function addBackupEndpoints(app: Hono, kv: any, requireAuth: any, supabase: any) {
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

      // 환경변수가 잘못된 형식인지 확인
      const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
      
      // Private key만 포함된 경우 (MII로 시작하는 Base64 인코딩 키)
      if (trimmedJson.startsWith('MII') || trimmedJson.startsWith('-----BEGIN PRIVATE KEY-----')) {
        const errorMsg = `SERVICE_ACCOUNT_JSON에 Private Key만 포함되어 있습니다. 완전한 Service Account JSON 파일이 필요합니다.`
        console.log('SERVICE_ACCOUNT_JSON contains only private key')
        console.log('Content preview:', trimmedJson.substring(0, 100))
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { 
            error: errorMsg, 
            details: 'SERVICE_ACCOUNT_JSON contains only private key, not complete JSON',
            contentPreview: trimmedJson.substring(0, 100),
            contentLength: trimmedJson.length,
            detectedFormat: trimmedJson.startsWith('MII') ? 'Base64 Private Key' : 'PEM Private Key'
          }
        }
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: 'SERVICE_ACCOUNT_JSON 환경변수에 Private Key만 포함되어 있습니다. Google Cloud Console에서 다운로드한 완전한 Service Account JSON 파일을 사용해주세요. JSON 파일은 {"type":"service_account","project_id":...} 형식이어야 합니다.'
        })
      }
      
      // 해시나 ID 등 기타 잘못된 형식 확인
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
        
        // Private key만 포함된 경우 먼저 확인
        if (trimmedJson.startsWith('MII') || trimmedJson.startsWith('-----BEGIN PRIVATE KEY-----')) {
          throw new Error('SERVICE_ACCOUNT_JSON contains only private key, not complete JSON. Please use the complete Service Account JSON file from Google Cloud Console.')
        }
        
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
        
        // CCP ID별로 데이터 그룹화
        const ccpGroups = new Map()
        ccps.forEach((ccp: any) => {
          const ccpId = ccp.id
          if (!ccpGroups.has(ccpId)) {
            ccpGroups.set(ccpId, [])
          }
          ccpGroups.get(ccpId).push(ccp)
        })
        
        console.log(`Found ${ccpGroups.size} different CCPs:`, Array.from(ccpGroups.keys()))
        
        // 각 CCP별로 워크시트 생성 및 데이터 저장
        const processedSheets = []
        
        for (const [ccpId, ccpData] of ccpGroups) {
          console.log(`Processing CCP: ${ccpId} with ${ccpData.length} records`)
          
          let sheetId = null
          const sheetName = ccpId // CCP ID를 시트명으로 사용
          
          // 기존 시트 확인
          const existingSheet = spreadsheetData.sheets?.find(
            (sheet: any) => sheet.properties.title === sheetName
          )
          
          if (existingSheet) {
            sheetId = existingSheet.properties.sheetId
            console.log(`Using existing sheet: ${sheetName} (ID: ${sheetId})`)
          } else {
            // 새 워크시트 생성
            console.log(`Creating new sheet: ${sheetName}`)
            const createSheetResponse = await fetch(
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
                        title: sheetName,
                        gridProperties: {
                          rowCount: 1000,
                          columnCount: 15
                        }
                      }
                    }
                  }]
                })
              }
            )
            
            if (!createSheetResponse.ok) {
              const createError = await createSheetResponse.text()
              console.log(`Sheet creation failed for ${sheetName}:`, createError)
              throw new Error(`Sheet creation failed for ${sheetName}: ${createSheetResponse.status} ${createError}`)
            }
            
            const createResult = await createSheetResponse.json()
            sheetId = createResult.replies[0].addSheet.properties.sheetId
            console.log(`New sheet created: ${sheetName} (ID: ${sheetId})`)
          }
          
          // CCP 정보에서 공정명 추출
          const mainCcp = ccpData[0]
          const processName = mainCcp?.process || mainCcp?.name || ''
          const titleText = `${ccpId} [${processName}]`
          
          console.log(`Setting title and headers for ${sheetName}: "${titleText}"`)
          
          // 1. 제목 셀 병합 (A1:B1)
          const mergeTitleResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                requests: [{
                  mergeCells: {
                    range: {
                      sheetId: sheetId,
                      startRowIndex: 0,
                      endRowIndex: 1,
                      startColumnIndex: 0,
                      endColumnIndex: 2
                    },
                    mergeType: 'MERGE_ALL'
                  }
                }]
              })
            }
          )
          
          if (!mergeTitleResponse.ok) {
            const mergeError = await mergeTitleResponse.text()
            console.log(`Title merge failed for ${sheetName}:`, mergeError)
          } else {
            console.log(`Title cells merged successfully for ${sheetName}`)
          }
          
          // 2. 제목 텍스트 설정 및 스타일링
          const titleUpdateResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                requests: [
                  // 제목 텍스트 설정
                  {
                    updateCells: {
                      range: {
                        sheetId: sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      },
                      rows: [{
                        values: [{
                          userEnteredValue: {
                            stringValue: titleText
                          },
                          userEnteredFormat: {
                            textFormat: {
                              fontSize: 16,
                              bold: true
                            },
                            horizontalAlignment: 'CENTER',
                            verticalAlignment: 'MIDDLE',
                            backgroundColor: {
                              red: 0.2,
                              green: 0.4,
                              blue: 0.8,
                              alpha: 0.2
                            }
                          }
                        }]
                      }],
                      fields: 'userEnteredValue,userEnteredFormat'
                    }
                  }
                ]
              })
            }
          )
          
          if (!titleUpdateResponse.ok) {
            const titleError = await titleUpdateResponse.text()
            console.log(`Title update failed for ${sheetName}:`, titleError)
          } else {
            console.log(`Title set successfully for ${sheetName}: "${titleText}"`)
          }
          
          // 3. 헤더 설정 (2번째 행으로 이동)
          const headerRange = `${sheetName}!A2:O2`
          const headers = [
            'Date', 'Time', 'CCP_ID', 'Process', 'Measured_Value', 'Unit', 
            'Critical_Limit_Min', 'Critical_Limit_Max', 'Status', 'Inspector', 
            'Notes', 'Compliance', 'Corrective_Action', 'Signature', 'Created_At'
          ]
          
          console.log(`Setting headers for ${sheetName} at row 2...`)
          const headerResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${headerRange}?valueInputOption=RAW`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                values: [headers]
              })
            }
          )
          
          if (!headerResponse.ok) {
            const headerError = await headerResponse.text()
            console.log(`Header setting failed for ${sheetName}:`, headerError)
          }
          
          // 4. 헤더 스타일링
          const headerStyleResponse = await fetch(
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
                    range: {
                      sheetId: sheetId,
                      startRowIndex: 1,
                      endRowIndex: 2,
                      startColumnIndex: 0,
                      endColumnIndex: 15
                    },
                    rows: [{
                      values: headers.map(header => ({
                        userEnteredFormat: {
                          textFormat: {
                            bold: true,
                            fontSize: 10
                          },
                          backgroundColor: {
                            red: 0.9,
                            green: 0.9,
                            blue: 0.9,
                            alpha: 1.0
                          },
                          horizontalAlignment: 'CENTER'
                        }
                      }))
                    }],
                    fields: 'userEnteredFormat'
                  }
                }]
              })
            }
          )
          
          if (!headerStyleResponse.ok) {
            const styleError = await headerStyleResponse.text()
            console.log(`Header styling failed for ${sheetName}:`, styleError)
          }
          
          // CCP 데이터를 날짜별로 정렬하고 스프레드시트 형식으로 변환
          const sortedCcpData = ccpData.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.lastChecked || new Date())
            const dateB = new Date(b.createdAt || b.lastChecked || new Date())
            return dateB.getTime() - dateA.getTime() // 최신순 정렬
          })
          
          const rows = []
          
          // CCP 자체 정보 (현재 상태)
          const currentMainCcp = sortedCcpData[0]
          if (currentMainCcp) {
            const createdDate = new Date(currentMainCcp.createdAt || currentMainCcp.lastChecked || new Date())
            rows.push([
              createdDate.toISOString().split('T')[0], // Date
              createdDate.toTimeString().split(' ')[0], // Time
              currentMainCcp.id || ccpId,
              currentMainCcp.process || currentMainCcp.name || '',
              currentMainCcp.currentValue || '',
              currentMainCcp.unit || '',
              currentMainCcp.criticalLimit?.min || '',
              currentMainCcp.criticalLimit?.max || '',
              currentMainCcp.status || 'normal',
              'System',
              `현재 측정값: ${currentMainCcp.currentValue} ${currentMainCcp.unit}`,
              currentMainCcp.status === 'critical' ? '부적합' : '적합',
              '',
              '',
              createdDate.toISOString()
            ])
          }
          
          // CCP 기록들 추가
          sortedCcpData.forEach((ccp: any) => {
            if (ccp.records && Array.isArray(ccp.records)) {
              ccp.records.forEach((record: any) => {
                const recordDate = new Date(record.timestamp || record.createdAt || new Date())
                rows.push([
                  recordDate.toISOString().split('T')[0], // Date
                  recordDate.toTimeString().split(' ')[0], // Time
                  ccpId,
                  ccp.process || ccp.name || '',
                  record.data?.measuredValue || record.measuredValue || '',
                  ccp.unit || '',
                  ccp.criticalLimit?.min || '',
                  ccp.criticalLimit?.max || '',
                  record.status || 'normal',
                  record.operator || record.inspector || '',
                  record.data?.notes || record.notes || '',
                  record.data?.compliance || (record.status === 'critical' ? '부적합' : '적합'),
                  record.data?.correctiveAction || '',
                  record.signature ? 'Signed' : '',
                  recordDate.toISOString()
                ])
              })
            }
          })
          
          if (rows.length > 0) {
            // 데이터 추가 (A3부터 시작 - 제목과 헤더 때문에 한 행 아래로)
            const dataRange = `${sheetName}!A3:O${rows.length + 2}`
            console.log(`Writing ${rows.length} records to ${sheetName} (${dataRange})...`)
            
            const writeResponse = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${dataRange}?valueInputOption=RAW`,
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
            
            if (!writeResponse.ok) {
              const writeError = await writeResponse.text()
              console.log(`Data write failed for ${sheetName}:`, writeError)
              throw new Error(`Data write failed for ${sheetName}: ${writeResponse.status} ${writeError}`)
            }
            
            const writeResult = await writeResponse.json()
            console.log(`Data written successfully to ${sheetName}:`, writeResult.updatedRows || rows.length)
            
            processedSheets.push({
              sheetName,
              recordCount: rows.length,
              ccpId
            })
          } else {
            console.log(`No data to write for ${sheetName}`)
            processedSheets.push({
              sheetName,
              recordCount: 0,
              ccpId
            })
          }
        }
        
        console.log('All CCP sheets processed:', processedSheets)
        
        // 성공 로그 저장
        const totalRecords = processedSheets.reduce((sum, sheet) => sum + sheet.recordCount, 0)
        const successLog = {
          id: logId,
          timestamp,
          status: 'success',
          type: 'manual',
          data: { 
            message: `${ccps.length}개의 CCP에서 총 ${totalRecords}개의 기록이 ${processedSheets.length}개 시트에 성공적으로 백업되었습니다.`,
            ccpCount: ccps.length,
            totalRecords,
            sheetsCreated: processedSheets.length,
            spreadsheetId: SPREADSHEET_ID,
            processedSheets: processedSheets.map(s => ({
              ccpId: s.ccpId,
              sheetName: s.sheetName,
              recordCount: s.recordCount
            }))
          }
        }
        await kv.set(`backup_log:${logId}`, successLog)
        
        return c.json({ 
          success: true, 
          data: { 
            message: `${processedSheets.length}개 CCP별 시트에 총 ${totalRecords}개의 기록이 성공적으로 백업되었습니다.`,
            ccpCount: ccps.length,
            totalRecords,
            sheetsCreated: processedSheets.length,
            spreadsheetId: SPREADSHEET_ID,
            processedSheets: processedSheets.map(s => ({
              ccpId: s.ccpId,
              sheetName: s.sheetName,
              recordCount: s.recordCount
            }))
          }
        })
        
      } catch (apiError) {
        const errorMsg = `Google Sheets API 호출 오류: ${apiError.message}`
        console.log('Google Sheets API error:', apiError)
        
        // API 에러 로그 저장
        const apiErrorLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { 
            error: errorMsg,
            apiError: apiError.message,
            spreadsheetId: SPREADSHEET_ID
          }
        }
        await kv.set(`backup_log:${logId}`, apiErrorLog)
        
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
          // 잘못된 형식 사전 검사
          const trimmed = SERVICE_ACCOUNT_JSON.trim()
          
          // Private key만 포함된 경우 확인
          if (trimmed.startsWith('MII') || trimmed.startsWith('-----BEGIN PRIVATE KEY-----')) {
            console.log('Config check - SERVICE_ACCOUNT_JSON contains only private key')
            console.log('Config check - Content preview:', trimmed.substring(0, 100))
            console.log('Config check - Detected format:', trimmed.startsWith('MII') ? 'Base64 Private Key' : 'PEM Private Key')
            
            status.serviceAccount = false
            status.details.serviceAccount = {
              hasJson: false,
              parseError: 'SERVICE_ACCOUNT_JSON contains only private key, not complete JSON',
              contentPreview: trimmed.substring(0, 100),
              contentLength: trimmed.length,
              detectedFormat: trimmed.startsWith('MII') ? 'Base64 Private Key' : 'PEM Private Key',
              suggestion: 'Please use the complete Service Account JSON file downloaded from Google Cloud Console (should start with {"type":"service_account",...})'
            }
          } else if (trimmed.length < 100 || !trimmed.includes('{') || !trimmed.includes('"type"') || !trimmed.includes('"private_key"')) {
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
        
        // Private key만 포함된 경우 먼저 확인
        if (trimmed.startsWith('MII') || trimmed.startsWith('-----BEGIN PRIVATE KEY-----')) {
          return c.json({ 
            success: false, 
            error: 'SERVICE_ACCOUNT_JSON에 Private Key만 포함되어 있습니다. Google Cloud Console에서 다운로드한 완전한 Service Account JSON 파일을 사용해주세요. JSON 파일은 {"type":"service_account",...} 형식이어야 합니다.' 
          })
        }
        
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

      // 간단한 연결 테스트
      try {
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
  
  // 백업 로그 조회 엔드포인트
  app.get('/make-server-79e634f3/backup/logs', requireAuth, async (c) => {
    try {
      console.log('Fetching backup logs...')
      const logs = await kv.getByPrefix('backup_log:')
      
      // 최신순으로 정렬
      const sortedLogs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      console.log(`Found ${sortedLogs.length} backup logs`)
      return c.json({ success: true, data: sortedLogs })
    } catch (error) {
      console.log('Error fetching backup logs:', error)
      return c.json({ error: 'Failed to fetch backup logs' }, 500)
    }
  })

  // 백업 설정 상태 확인 엔드포인트
  app.get('/make-server-79e634f3/backup/config-status', requireAuth, async (c) => {
    try {
      console.log('Checking backup configuration status...')
      
      const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      let serviceAccountStatus = false
      let spreadsheetIdStatus = false
      
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
}