import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { addBackupEndpoints } from './backup_endpoints_fixed.tsx'
import { addDocumentEndpoints } from './new_document_endpoints.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// 인증 미들웨어
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (!accessToken || accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
    // 개발 환경에서는 인증 건너뛰기
    return next()
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  c.req.userId = user.id
  return next()
}

// =================
// 헬스체크 및 기본 엔드포인트
// =================

// 헬스체크 엔드포인트
app.get('/make-server-79e634f3/health', async (c) => {
  return c.json({ 
    success: true, 
    data: { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      server: 'make-server-79e634f3'
    } 
  })
})

// 루트 엔드포인트
app.get('/make-server-79e634f3/', async (c) => {
  return c.json({ 
    success: true, 
    data: { 
      message: 'Smart HACCP API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    } 
  })
})

// =================
// 사용자 인증
// =================

// 사용자 로그인
app.post('/make-server-79e634f3/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400)
    }

    // 데모 계정 확인
    const demoAccounts = [
      { email: 'admin@company.com', password: 'admin123', role: 'admin', name: '시스템 관리자' },
      { email: 'manager@company.com', password: 'manager123', role: 'manager', name: '품질관리팀장' },
      { email: 'operator@company.com', password: 'operator123', role: 'operator', name: '작업자' }
    ]

    const demoUser = demoAccounts.find(
      account => account.email === email && account.password === password
    )

    if (demoUser) {
      const user = {
        id: `user_${Date.now()}`,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role
      }

      return c.json({
        success: true,
        data: {
          user,
          token: `token_${Date.now()}`
        }
      })
    }

    // 실제 환경에서는 Supabase Auth 사용
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'User',
          role: data.user.user_metadata?.role || 'operator'
        },
        token: data.session.access_token
      }
    })
  } catch (error) {
    console.log('Error during login:', error)
    return c.json({ error: 'Failed to authenticate user' }, 500)
  }
})

// 사용자 회원가입
app.post('/make-server-79e634f3/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Supabase Auth에서 사용자 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // 이메일 확인 자동 처리
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    // 생성된 사용자 정보 반환
    return c.json({
      success: true,
      data: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name
      }
    })
  } catch (error) {
    console.log('Error during signup:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// =================
// 센서 데이터 관리
// =================

// 센서 데이터 기록
app.post('/make-server-79e634f3/sensors/data', requireAuth, async (c) => {
  try {
    const { sensorId, type, value, location, timestamp } = await c.req.json()
    
    if (!sensorId || !type || value === undefined) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const sensorData = {
      sensorId,
      type,
      value,
      location,
      timestamp: timestamp || new Date().toISOString(),
      status: 'normal', // 기본값
      createdAt: new Date().toISOString()
    }

    // 임계값 확인 및 상태 설정
    const criticalLimits = {
      'refrigerator_temp': { min: 1, max: 4 },
      'freezer_temp': { min: -25, max: -18 },
      'cooking_temp': { min: 74, max: 100 },
      'humidity': { min: 50, max: 70 }
    }

    const limit = criticalLimits[type]
    if (limit) {
      const numValue = parseFloat(value)
      if (numValue < limit.min || numValue > limit.max) {
        sensorData.status = 'critical'
      } else if (numValue < limit.min + 1 || numValue > limit.max - 1) {
        sensorData.status = 'warning'
      }
    }

    await kv.set(`sensor_data:${sensorId}:${timestamp}`, sensorData)
    
    // 최신 데이터 업데이트
    await kv.set(`sensor_latest:${sensorId}`, sensorData)

    // 알림이 필요한 경우 알림 생성
    if (sensorData.status === 'critical' || sensorData.status === 'warning') {
      const alert = {
        id: `alert_${Date.now()}`,
        sensorId,
        type: sensorData.status,
        message: `${location} ${type} 센서에서 ${sensorData.status === 'critical' ? '심각한' : '경고'} 수준의 이상이 감지되었습니다. 현재값: ${value}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      }
      await kv.set(`alert:${alert.id}`, alert)
    }

    return c.json({ success: true, data: sensorData })
  } catch (error) {
    console.log('Error recording sensor data:', error)
    return c.json({ error: 'Failed to record sensor data' }, 500)
  }
})

// 센서 데이터 조회
app.get('/make-server-79e634f3/sensors/data/:sensorId', requireAuth, async (c) => {
  try {
    const sensorId = c.req.param('sensorId')
    const period = c.req.query('period') || '24h'
    
    const data = await kv.getByPrefix(`sensor_data:${sensorId}:`)
    
    // 시간 필터링
    const now = new Date()
    let filterTime = new Date()
    
    switch (period) {
      case '1h':
        filterTime.setHours(now.getHours() - 1)
        break
      case '24h':
        filterTime.setHours(now.getHours() - 24)
        break
      case '7d':
        filterTime.setDate(now.getDate() - 7)
        break
      case '30d':
        filterTime.setDate(now.getDate() - 30)
        break
    }

    const filteredData = data
      .filter(item => new Date(item.timestamp) >= filterTime)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return c.json({ success: true, data: filteredData })
  } catch (error) {
    console.log('Error fetching sensor data:', error)
    return c.json({ error: 'Failed to fetch sensor data' }, 500)
  }
})

// 모든 센서 데이터 조회 (일반적인 센서 데이터 조회)
app.get('/make-server-79e634f3/sensors/data', requireAuth, async (c) => {
  try {
    const period = c.req.query('period') || '24h'
    const sensorType = c.req.query('type')
    const location = c.req.query('location')
    
    // 모든 센서 데이터 조회
    const allSensorData = await kv.getByPrefix('sensor_data:')
    
    // 시간 필터링
    const now = new Date()
    let filterTime = new Date()
    
    switch (period) {
      case '1h':
        filterTime.setHours(now.getHours() - 1)
        break
      case '24h':
        filterTime.setHours(now.getHours() - 24)
        break
      case '7d':
        filterTime.setDate(now.getDate() - 7)
        break
      case '30d':
        filterTime.setDate(now.getDate() - 30)
        break
    }

    let filteredData = allSensorData
      .filter(item => new Date(item.timestamp) >= filterTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // 타입 필터링
    if (sensorType) {
      filteredData = filteredData.filter(item => item.type === sensorType)
    }

    // 위치 필터링
    if (location) {
      filteredData = filteredData.filter(item => item.location === location)
    }

    return c.json({ success: true, data: filteredData })
  } catch (error) {
    console.log('Error fetching sensor data:', error)
    return c.json({ error: 'Failed to fetch sensor data' }, 500)
  }
})

// 모든 센서 최신 데이터 조회
app.get('/make-server-79e634f3/sensors/latest', requireAuth, async (c) => {
  try {
    const latestData = await kv.getByPrefix('sensor_latest:')
    return c.json({ success: true, data: latestData })
  } catch (error) {
    console.log('Error fetching latest sensor data:', error)
    return c.json({ error: 'Failed to fetch latest sensor data' }, 500)
  }
})

// =================
// 대시보드 API
// =================

// 대시보드 데이터 조회
app.get('/make-server-79e634f3/dashboard', requireAuth, async (c) => {
  try {
    console.log('Fetching dashboard data...')
    
    // 최신 센서 데이터 조회
    const latestSensors = await kv.getByPrefix('sensor_latest:')
    
    // 오늘의 체크리스트 조회
    const today = new Date().toISOString().split('T')[0]
    const allChecklists = await kv.getByPrefix('checklist:')
    const todayChecklists = allChecklists.filter(checklist => 
      checklist.createdAt.startsWith(today)
    )

    // CCP 데이터 조회
    const ccps = await kv.getByPrefix('ccp:')
    const ccpsWithStatus = ccps.map(ccp => ({
      ...ccp,
      status: determineStatus(ccp)
    }))

    // 알림 데이터 조회
    const allAlerts = await kv.getByPrefix('alert:')
    const unacknowledgedAlerts = allAlerts.filter(alert => !alert.acknowledged)

    // 통계 계산
    const stats = {
      totalSensors: latestSensors.length,
      criticalSensors: latestSensors.filter(s => s.status === 'critical').length,
      warningSensors: latestSensors.filter(s => s.status === 'warning').length,
      
      totalChecklists: todayChecklists.length,
      completedChecklists: todayChecklists.filter(c => c.status === '완료').length,
      inProgressChecklists: todayChecklists.filter(c => c.status === '진행중').length,
      
      totalCCPs: ccpsWithStatus.length,
      criticalCCPs: ccpsWithStatus.filter(c => c.status === 'critical').length,
      warningCCPs: ccpsWithStatus.filter(c => c.status === 'warning').length,
      
      totalAlerts: unacknowledgedAlerts.length,
      criticalAlerts: unacknowledgedAlerts.filter(a => a.type === 'critical').length
    }

    // 시스템 상태 결정
    let systemStatus = 'normal'
    if (stats.criticalSensors > 0 || stats.criticalCCPs > 0 || stats.criticalAlerts > 0) {
      systemStatus = 'critical'
    } else if (stats.warningSensors > 0 || stats.warningCCPs > 0) {
      systemStatus = 'warning'
    }

    const dashboardData = {
      stats,
      systemStatus,
      latestSensors: latestSensors.slice(0, 10), // 최근 10개만
      recentAlerts: unacknowledgedAlerts.slice(0, 5), // 최근 5개 알림
      todayChecklists: todayChecklists.slice(0, 5), // 오늘의 체크리스트 5개
      ccpOverview: ccpsWithStatus.map(ccp => ({
        id: ccp.id,
        name: ccp.name,
        status: ccp.status,
        currentValue: ccp.currentValue,
        unit: ccp.unit,
        lastChecked: ccp.lastChecked
      }))
    }

    return c.json({ success: true, data: dashboardData })
  } catch (error) {
    console.log('Error fetching dashboard data:', error)
    return c.json({ error: 'Failed to fetch dashboard data' }, 500)
  }
})

// =================
// 시스템 초기화
// =================

// 시스템 초기 데이터 생성
app.post('/make-server-79e634f3/init', requireAuth, async (c) => {
  try {
    console.log('Initializing system data...')
    
    // 초기 체크리스트 데이터 생성
    const initialChecklists = [
      {
        id: 1,
        title: "식재료 입고 점검",
        category: "입고 관리",
        items: [
          { id: 1, text: "입고 온도 확인 (냉장: 1-4°C, 냉동: -18°C 이하)", completed: true, notes: "정상 온도 확인됨" },
          { id: 2, text: "포장 상태 및 유통기한 확인", completed: true, notes: "" },
          { id: 3, text: "공급업체 인증서 확인", completed: false, notes: "" },
          { id: 4, text: "입고 수량 대조", completed: false, notes: "" }
        ],
        dueTime: "09:00",
        status: "진행중",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ]

    // 체크리스트 저장
    for (const checklist of initialChecklists) {
      await kv.set(`checklist:${checklist.id}`, checklist)
    }

    // 초기 센서 데이터 생성
    const sampleSensors = [
      { sensorId: 'fridge1', type: 'refrigerator_temp', value: 2.5, location: '주방', status: 'normal' },
      { sensorId: 'fridge2', type: 'refrigerator_temp', value: 2.8, location: '보조주방', status: 'normal' }
    ]
    
    for (const sensor of sampleSensors) {
      const sensorData = {
        ...sensor,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      await kv.set(`sensor_latest:${sensor.sensorId}`, sensorData)
    }

    // 초기 CCP 데이터 생성
    const initialCCPs = initializeCCPs()
    const ccpsWithStatus = initialCCPs.map(ccp => ({
      ...ccp,
      status: determineStatus(ccp)
    }))
    
    for (const ccp of ccpsWithStatus) {
      await kv.set(`ccp:${ccp.id}`, ccp)
    }

    console.log('System initialization completed')
    
    return c.json({ 
      success: true, 
      data: {
        checklists: initialChecklists,
        sensors: sampleSensors,
        ccps: ccpsWithStatus,
        message: 'System initialized successfully'
      }
    })
  } catch (error) {
    console.log('Error during system initialization:', error)
    return c.json({ error: 'Failed to initialize system' }, 500)
  }
})

// =================
// 체크리스트 관리
// =================

// 체크리스트 생성
app.post('/make-server-79e634f3/checklists', requireAuth, async (c) => {
  try {
    const checklistData = await c.req.json()
    const id = Date.now() // 숫자 ID 사용
    
    const checklist = {
      id,
      ...checklistData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: c.req.userId || 'system'
    }

    await kv.set(`checklist:${id}`, checklist)
    return c.json({ success: true, data: checklist })
  } catch (error) {
    console.log('Error creating checklist:', error)
    return c.json({ error: 'Failed to create checklist' }, 500)
  }
})

// 체크리스트 목록 조회
app.get('/make-server-79e634f3/checklists', requireAuth, async (c) => {
  try {
    const date = c.req.query('date') || new Date().toISOString().split('T')[0]
    const checklists = await kv.getByPrefix('checklist:')
    
    const filteredChecklists = checklists.filter(checklist => 
      checklist.createdAt.startsWith(date)
    )

    return c.json({ success: true, data: filteredChecklists })
  } catch (error) {
    console.log('Error fetching checklists:', error)
    return c.json({ error: 'Failed to fetch checklists' }, 500)
  }
})

// =================
// CCP 관리
// =================

// 초기 CCP 데이터 생성 함수
function initializeCCPs() {
  const now = new Date()
  const generateRandomValue = (min, max) => {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10
  }

  return [
    {
      id: 'CCP-1B-1',
      name: 'CCP-1B [오븐(굽기)공정-과자]',
      process: '과자류 오븐 굽기',
      ccpType: 'oven_bread',
      hazard: '병원성 미생물 생존',
      criticalLimit: { min: 180, max: 220 },
      unit: '°C',
      monitoringMethod: '적외선 온도계',
      frequency: '30분마다',
      currentValue: generateRandomValue(175, 225),
      status: 'normal',
      lastChecked: new Date(now.getTime() - 15 * 60000).toISOString(),
      records: [],
      correctiveActions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

// CCP 상태 결정 함수
function determineStatus(ccp) {
  const { currentValue, criticalLimit } = ccp
  
  if (ccp.id === 'CCP-5P') {
    return currentValue === 0 ? 'normal' : 'critical'
  }

  const tolerance = (criticalLimit.max - criticalLimit.min) * 0.1
  
  if (currentValue < criticalLimit.min || currentValue > criticalLimit.max) {
    return 'critical'
  } else if (
    currentValue < criticalLimit.min + tolerance || 
    currentValue > criticalLimit.max - tolerance
  ) {
    return 'warning'
  }
  
  return 'normal'
}

// CCP 목록 조회
app.get('/make-server-79e634f3/ccp', requireAuth, async (c) => {
  try {
    const ccps = await kv.getByPrefix('ccp:')
    
    if (ccps.length === 0) {
      // 초기 CCP 데이터 생성
      console.log('Creating initial CCP data...')
      const initialCCPs = initializeCCPs()
      
      // 상태 업데이트
      const ccpsWithStatus = initialCCPs.map(ccp => ({
        ...ccp,
        status: determineStatus(ccp)
      }))
      
      // 저장
      for (const ccp of ccpsWithStatus) {
        await kv.set(`ccp:${ccp.id}`, ccp)
      }
      
      return c.json({ success: true, data: ccpsWithStatus })
    }

    // 기존 CCP 데이터 반환 (상태 업데이트)
    const updatedCCPs = ccps.map(ccp => ({
      ...ccp,
      status: determineStatus(ccp)
    }))

    return c.json({ success: true, data: updatedCCPs })
  } catch (error) {
    console.log('Error fetching CCPs:', error)
    return c.json({ error: 'Failed to fetch CCPs' }, 500)
  }
})

// =================
// 외부 엔드포인트 추가
// =================

// 문서 엔드포인트 추가
addDocumentEndpoints(app, kv, requireAuth)

// 백업 엔드포인트 추가
addBackupEndpoints(app, kv, requireAuth, supabase)

// 서버 시작
Deno.serve(app.fetch)