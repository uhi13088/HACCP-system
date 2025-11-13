// Private Key 처리 유틸리티 함수들

export function processPrivateKey(privateKey: any): Uint8Array {
  console.log('🔐 Processing private key...')
  console.log('📋 Private key type:', typeof privateKey)
  
  // 민감한 정보 로깅 방지 - 길이와 시작/끝 부분만 로깅
  if (typeof privateKey === 'string' && privateKey.length > 100) {
    console.log(`📏 Private key length: ${privateKey.length}`)
    console.log(`🔑 Private key start: ${privateKey.substring(0, 50)}...`)
    console.log(`🔑 Private key end: ...${privateKey.substring(privateKey.length - 50)}`)
  } else {
    console.log('📋 Private key (short or non-string):', privateKey)
  }
  
  // 타입 검증
  if (privateKey === null || privateKey === undefined) {
    throw new Error('Private key is null or undefined')
  }
  
  // 문자열로 변환 시도
  let keyString: string
  try {
    if (typeof privateKey === 'string') {
      keyString = privateKey
    } else if (typeof privateKey === 'object' && privateKey.toString) {
      keyString = privateKey.toString()
    } else {
      keyString = String(privateKey)
    }
  } catch (conversionError) {
    console.error('❌ Failed to convert private key to string:', conversionError)
    throw new Error(`Cannot convert private key to string: ${typeof privateKey}`)
  }
  
  if (!keyString || keyString.length === 0) {
    throw new Error('Private key is empty after conversion')
  }
  
  console.log('✅ Private key converted to string successfully')
  console.log(`📏 Original private key length: ${keyString.length}`)
  
  // PEM 형식의 private key를 PKCS#8 형식으로 변환
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  
  // private key가 올바른 형식인지 확인
  if (!keyString.includes(pemHeader) || !keyString.includes(pemFooter)) {
    console.error('❌ Invalid private key format - missing PEM headers')
    console.error(`🔍 Key contains BEGIN header: ${keyString.includes(pemHeader)}`)
    console.error(`🔍 Key contains END footer: ${keyString.includes(pemFooter)}`)
    
    // 더 자세한 분석
    if (keyString.length < 100) {
      console.error(`🔍 Key content (too short): ${keyString}`)
    } else {
      console.error(`🔍 Key start (200 chars): ${keyString.substring(0, 200)}`)
      console.error(`🔍 Key end (200 chars): ${keyString.substring(keyString.length - 200)}`)
    }
    
    throw new Error('Invalid private key format - missing PEM headers')
  }
  
  // PEM 내용 추출 및 정리 - 더 엄격한 처리
  let pemContents = keyString
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .trim()
  
  console.log(`📏 PEM content after header/footer removal: ${pemContents.length} chars`)
  
  // JSON에서 이스케이프된 문자들 처리 (JSON.parse 과정에서 생길 수 있는 문제들)
  const originalPemLength = pemContents.length
  
  pemContents = pemContents
    .replace(/\\n/g, '')  // JSON에서 이스케이프된 개행 문자
    .replace(/\\r/g, '')  // JSON에서 이스케이프된 캐리지 리턴
    .replace(/\\t/g, '')  // JSON에서 이스케이프된 탭
    .replace(/\\\\/g, '') // JSON에서 이스케이프된 백슬래시
    .replace(/\\"/g, '')  // JSON에서 이스케이프된 따옴표
    .replace(/\r/g, '')   // 실제 캐리지 리턴
    .replace(/\n/g, '')   // 실제 개행
    .replace(/\t/g, '')   // 실제 탭
    .replace(/\s/g, '')   // 모든 공백 문자
  
  console.log(`📏 After escape handling: ${pemContents.length} chars (removed ${originalPemLength - pemContents.length} chars)`)
  
  if (pemContents.length < 100) {
    console.error(`❌ PEM content too short: ${pemContents}`)
  } else {
    console.log(`🔑 First 50 chars after cleaning: ${pemContents.substring(0, 50)}`)
    console.log(`🔑 Last 50 chars after cleaning: ${pemContents.substring(pemContents.length - 50)}`)
  }
  
  // 유니코드 문자나 다른 특수 문자 처리
  // Base64에 허용되지 않는 문자들을 찾아서 제거
  const originalLength = pemContents.length
  pemContents = pemContents.replace(/[^\w+/=]/g, '') // 단어 문자, +, /, = 만 허용
  
  if (originalLength !== pemContents.length) {
    console.log(`Removed ${originalLength - pemContents.length} invalid characters`)
  }
  
  // Base64 문자열 유효성 검사 - 엄격한 검사
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  if (!base64Regex.test(pemContents)) {
    // 잘못된 문자를 찾아서 상세 로깅
    const invalidChars = []
    for (let i = 0; i < pemContents.length; i++) {
      const char = pemContents[i]
      if (!/[A-Za-z0-9+/=]/.test(char)) {
        invalidChars.push({
          char: char,
          code: char.charCodeAt(0),
          position: i
        })
      }
    }
    
    console.error('Invalid characters found:', invalidChars)
    
    // 마지막 시도: 허용된 문자만 남기기
    pemContents = pemContents.replace(/[^A-Za-z0-9+/=]/g, '')
    console.log('Final cleaned PEM content length:', pemContents.length)
    
    // 다시 검사
    if (!base64Regex.test(pemContents)) {
      throw new Error(`Invalid base64 characters in private key after all cleaning attempts. Remaining invalid chars: ${invalidChars.length}`)
    }
  }
  
  // Base64 패딩 확인 및 수정
  const paddingNeeded = 4 - (pemContents.length % 4)
  if (paddingNeeded !== 4) {
    pemContents += '='.repeat(paddingNeeded)
    console.log(`Added ${paddingNeeded} padding characters`)
  }
  
  console.log('Final private key length:', pemContents.length)
  
  // Base64 디코딩을 try-catch로 감싸기
  let binaryString
  try {
    console.log('🔄 Attempting base64 decode...')
    binaryString = atob(pemContents)
    console.log('✅ Base64 decode successful, binary length:', binaryString.length)
  } catch (error) {
    console.error('❌ Base64 decode error:', error)
    console.error(`📏 PEM content length: ${pemContents.length}`)
    
    if (pemContents.length < 200) {
      console.error(`🔍 Full PEM content: "${pemContents}"`)
    } else {
      console.error(`🔍 PEM start (200 chars): "${pemContents.substring(0, 200)}"`)
      console.error(`🔍 PEM end (200 chars): "${pemContents.substring(pemContents.length - 200)}"`)
    }
    
    // 문자별 분석
    const invalidChars = []
    for (let i = 0; i < Math.min(pemContents.length, 100); i++) {
      const char = pemContents[i]
      const charCode = char.charCodeAt(0)
      if (!/[A-Za-z0-9+/=]/.test(char)) {
        invalidChars.push({
          char: char,
          code: charCode,
          position: i,
          hex: charCode.toString(16)
        })
      }
    }
    
    if (invalidChars.length > 0) {
      console.error(`🔍 Invalid characters found (first 100 chars):`, invalidChars)
    }
    
    throw new Error(`Failed to decode private key: ${error.message}`)
  }
  
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  console.log('Private key processing completed successfully')
  return bytes
}

export async function importPrivateKey(privateKeyPemOrBytes: string | Uint8Array) {
  console.log('Importing private key...')
  try {
    // 입력값 타입 확인 및 적절한 처리
    let keyBytes: Uint8Array
    
    if (typeof privateKeyPemOrBytes === 'string') {
      console.log('Processing string private key')
      keyBytes = processPrivateKey(privateKeyPemOrBytes)
    } else if (privateKeyPemOrBytes instanceof Uint8Array) {
      console.log('Using provided Uint8Array directly')
      keyBytes = privateKeyPemOrBytes
    } else {
      console.error('Invalid private key type:', typeof privateKeyPemOrBytes)
      throw new Error(`Invalid private key type: ${typeof privateKeyPemOrBytes}. Expected string or Uint8Array.`)
    }
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )
    console.log('Private key imported successfully')
    return cryptoKey
  } catch (error) {
    console.error('Private key import error:', error)
    throw new Error(`Failed to import private key: ${error.message}`)
  }
}

export async function generateSignature(cryptoKey: CryptoKey, data: string) {
  console.log('Generating signature...')
  try {
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(data)
    )
    console.log('Signature generated successfully')
    return signature
  } catch (error) {
    console.error('Signature generation error:', error)
    throw new Error(`Failed to generate signature: ${error.message}`)
  }
}

export function encodeSignature(signature: ArrayBuffer) {
  try {
    const signatureArray = new Uint8Array(signature)
    const signatureString = String.fromCharCode(...signatureArray)
    
    // Base64 URL safe 인코딩
    const base64 = btoa(signatureString)
    const encodedSignature = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    
    console.log('Signature encoded successfully')
    return encodedSignature
  } catch (error) {
    console.error('Signature encoding error:', error)
    throw new Error(`Failed to encode signature: ${error.message}`)
  }
}

export function encodeBase64Url(data: string) {
  try {
    // Base64 URL safe 인코딩 (문자열용)
    const base64 = btoa(data)
    const encodedData = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    
    console.log('String encoded to Base64URL successfully')
    return encodedData
  } catch (error) {
    console.error('String encoding error:', error)
    throw new Error(`Failed to encode string: ${error.message}`)
  }
}

// Google Service Account JSON 검증 및 자동 수정 함수
export function validateAndFixServiceAccountJson(jsonString: string): any {
  console.log('🔍 Validating and fixing service account JSON...')
  
  let serviceAccount: any
  
  try {
    // JSON 파싱 시도
    serviceAccount = JSON.parse(jsonString)
    console.log('✅ JSON parsing successful')
  } catch (parseError) {
    console.error('❌ JSON parsing failed:', parseError)
    throw new Error(`Invalid JSON format: ${parseError.message}`)
  }
  
  // 필수 필드 검증
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id']
  const missingFields = []
  
  for (const field of requiredFields) {
    if (!serviceAccount[field]) {
      missingFields.push(field)
    }
  }
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields)
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
  
  console.log('✅ All required fields present')
  
  // private_key 필드 특별 검증 및 수정
  if (serviceAccount.private_key) {
    console.log('🔍 Analyzing private_key field...')
    
    let privateKey = serviceAccount.private_key
    const originalLength = privateKey.length
    
    // 자동 수정 시도
    console.log(`📏 Original private_key length: ${originalLength}`)
    
    // 1. 이중 escape 처리
    if (privateKey.includes('\\\\n')) {
      console.log('🔧 Fixing double-escaped newlines...')
      privateKey = privateKey.replace(/\\\\n/g, '\\n')
    }
    
    // 2. 실제 개행 문자가 없는 경우 \n을 실제 개행으로 변환
    if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
      console.log('🔧 Converting \\n to actual newlines...')
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    
    // 3. PEM 헤더/푸터 확인 및 수정
    const pemHeader = '-----BEGIN PRIVATE KEY-----'
    const pemFooter = '-----END PRIVATE KEY-----'
    
    if (!privateKey.includes(pemHeader)) {
      console.log('🔧 Adding missing PEM header...')
      privateKey = pemHeader + '\n' + privateKey
    }
    
    if (!privateKey.includes(pemFooter)) {
      console.log('🔧 Adding missing PEM footer...')
      privateKey = privateKey + '\n' + pemFooter
    }
    
    // 4. PEM 형식 정규화
    const lines = privateKey.split('\n')
    const normalizedLines = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine === pemHeader || trimmedLine === pemFooter) {
        normalizedLines.push(trimmedLine)
      } else if (trimmedLine.length > 0) {
        // Base64 라인은 64자씩 분할
        for (let i = 0; i < trimmedLine.length; i += 64) {
          normalizedLines.push(trimmedLine.substring(i, i + 64))
        }
      }
    }
    
    const normalizedPrivateKey = normalizedLines.join('\n')
    
    if (normalizedPrivateKey !== serviceAccount.private_key) {
      console.log('🔧 Applied private_key normalization')
      console.log(`📏 Length: ${originalLength} → ${normalizedPrivateKey.length}`)
      serviceAccount.private_key = normalizedPrivateKey
    }
    
    // 5. Base64 내용 검증
    try {
      const base64Content = normalizedPrivateKey
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s/g, '')
      
      // Base64 유효성 검사
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      if (!base64Regex.test(base64Content)) {
        console.warn('⚠️ Private key contains invalid base64 characters')
      } else {
        console.log('✅ Private key base64 validation passed')
      }
    } catch (validationError) {
      console.warn('⚠️ Private key validation warning:', validationError.message)
    }
  }
  
  console.log('✅ Service account JSON validation and fixing completed')
  return serviceAccount
}