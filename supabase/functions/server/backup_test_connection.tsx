// 백업 연결 테스트 엔드포인트
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'
import { processPrivateKey, importPrivateKey, generateSignature, encodeSignature } from './private_key_utils.tsx'

export function addBackupTestEndpoint(app: Hono, kv: any, requireAuth: any, supabase: any) {
  // 백업 연결 테스트
  app.post('/make-server-79e634f3/backup/test-connection', requireAuth, async (c) => {
    try {
      console.log('🔍 Testing backup connection to Google Sheets...')
      
      // KV 저장소에서 백업 설정 가져오기
      console.log('Loading backup configuration from KV store...')
      let backupConfig
      try {
        backupConfig = await kv.get('backup_config')
        console.log('Backup config loaded:', !!backupConfig)
        console.log('Has spreadsheet_id:', !!backupConfig?.spreadsheet_id)
        console.log('Has service_account_json:', !!backupConfig?.service_account_json)
      } catch (error) {
        console.log('Failed to load backup config:', error)
      }

      // 백업 설정 확인
      const SERVICE_ACCOUNT_JSON = backupConfig?.service_account_json || Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      const SPREADSHEET_ID = backupConfig?.spreadsheet_id || Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')
      
      console.log('Configuration check:')
      console.log('- Using config from:', backupConfig ? 'KV store' : 'environment variables')
      console.log('- SERVICE_ACCOUNT_JSON exists:', !!SERVICE_ACCOUNT_JSON)
      console.log('- SERVICE_ACCOUNT_JSON length:', SERVICE_ACCOUNT_JSON?.length || 0)
      console.log('- SPREADSHEET_ID exists:', !!SPREADSHEET_ID)
      console.log('- SPREADSHEET_ID value:', SPREADSHEET_ID || 'null')
      
      if (!SERVICE_ACCOUNT_JSON || SERVICE_ACCOUNT_JSON.trim() === '') {
        return c.json({ 
          success: false, 
          error: '백업 설정이 완료되지 않았습니다. Service Account JSON을 설정해주세요.'
        })
      }

      if (!SPREADSHEET_ID) {
        return c.json({ 
          success: false, 
          error: '백업 설정이 완료되지 않았습니다. 스프레드시트 ID를 설정해주세요.'
        })
      }

      // Service Account 키 파싱
      let serviceAccount
      try {
        console.log('Parsing Service Account JSON...')
        serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON.trim())
        console.log('Service Account parsed successfully')
        console.log('Available fields:', Object.keys(serviceAccount))
        console.log('Client email:', serviceAccount.client_email)
        console.log('Project ID:', serviceAccount.project_id)
      } catch (error) {
        const errorMsg = `Service Account JSON 파싱 오류: ${error.message}`
        console.log(errorMsg)
        return c.json({ 
          success: false, 
          error: errorMsg
        })
      }

      // 필수 필드 확인
      const requiredFields = ['client_email', 'private_key', 'project_id']
      for (const field of requiredFields) {
        if (!serviceAccount[field]) {
          const errorMsg = `Service Account JSON에 필수 필드 '${field}'가 없습니다.`
          console.log(errorMsg)
          return c.json({ 
            success: false, 
            error: errorMsg
          })
        }
      }

      // JWT 토큰 생성 및 Google API 테스트
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
        
        // 스프레드시트 메타데이터 확인 (연결 테스트)
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
          console.log('Spreadsheet access test failed:', metadataError)
          throw new Error(`Spreadsheet access failed: ${metadataResponse.status} ${metadataError}`)
        }
        
        const spreadsheetData = await metadataResponse.json()
        console.log('✅ Spreadsheet access test successful:', spreadsheetData.properties.title)
        
        return c.json({ 
          success: true, 
          data: {
            message: 'Google Sheets 연결 테스트가 성공했습니다.',
            spreadsheetTitle: spreadsheetData.properties.title,
            spreadsheetId: SPREADSHEET_ID,
            serviceAccountEmail: serviceAccount.client_email,
            sheetsCount: spreadsheetData.sheets?.length || 0,
            timestamp: new Date().toISOString()
          }
        })
        
      } catch (apiError) {
        console.error('Google API test failed:', apiError)
        return c.json({ 
          success: false, 
          error: `Google Sheets 연결 테스트 실패: ${apiError.message}`
        })
      }
      
    } catch (error) {
      console.error('Backup connection test error:', error)
      return c.json({ 
        success: false, 
        error: `연결 테스트 중 오류가 발생했습니다: ${error.message}`
      })
    }
  })
}