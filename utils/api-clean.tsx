import { projectId, publicAnonKey } from './supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3`

class ApiClient {
  private serverStatus = {
    isConnected: false,
    lastChecked: null as Date | null,
    mockModeEnabled: true
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': publicAnonKey,
      'Authorization': `Bearer ${publicAnonKey}`
    }
  }

  // 실제 서버 연결 상태를 강제로 확인
  async checkServerStatus(): Promise<boolean> {
    console.log('🔍 [API] Checking actual server connection...', API_BASE)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3초로 단축
      
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)
      
      // 실제 서버가 응답하면 연결됨으로 설정
      if (response.ok) {
        console.log('✅ [API] Real server connected! Status:', response.status)
        this.serverStatus.isConnected = true
        this.serverStatus.mockModeEnabled = false
        this.serverStatus.lastChecked = new Date()
        console.log('📊 [API] Updated status:', this.serverStatus)
        return true
      } else {
        console.log('❌ [API] Server returned error:', response.status)
        this.serverStatus.isConnected = false
        this.serverStatus.mockModeEnabled = true
        this.serverStatus.lastChecked = new Date()
        console.log('📊 [API] Updated status (error):', this.serverStatus)
        return false
      }
    } catch (error: any) {
      console.log('❌ [API] Server connection failed:', error.name, error.message)
      this.serverStatus.isConnected = false
      this.serverStatus.mockModeEnabled = true
      this.serverStatus.lastChecked = new Date()
      console.log('📊 [API] Updated status (failed):', this.serverStatus)
      return false
    }
  }

  // 서버 상태 반환 (실제 상태를 정확히 반환)
  getServerStatus() {
    const status = {
      isConnected: this.serverStatus.isConnected,
      lastChecked: this.serverStatus.lastChecked,
      mockModeEnabled: this.serverStatus.mockModeEnabled
    }
    console.log('📊 [API] Getting server status:', status)
    return status
  }

  // 강제 초기화 (서버 상태 재확인)
  async forceInitialize() {
    console.log('🔄 [API] Force reinitializing...')
    await this.checkServerStatus()
    return this.getServerStatus()
  }

  // 실제 서버 요청 시도, 실패 시 모킹
  async request(endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}) {
    // 먼저 실제 서버 요청 시도
    if (!this.serverStatus.mockModeEnabled) {
      try {
        const url = `${API_BASE}${endpoint}`
        const { responseType, ...fetchOptions } = options
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 타임아웃을 8초로 단축
        
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...this.getHeaders(),
            ...fetchOptions.headers
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          // 성공 시 실제 서버 연결 유지
          this.serverStatus.isConnected = true
          this.serverStatus.mockModeEnabled = false
          
          let data
          if (responseType === 'blob') {
            data = await response.blob()
          } else {
            data = await response.json()
          }
          
          console.log(`✅ [API] Real server response for ${endpoint}`)
          return data
        } else {
          console.warn(`⚠ [API] Server returned error ${response.status} for ${endpoint}`)
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error: any) {
        console.log(`❌ [API] Real server failed for ${endpoint}:`, error.name, error.message)
        
        // 특정 에러 타입에 따라 다르게 처리
        if (error.name === 'AbortError') {
          console.log(`⏰ [API] Request timeout for ${endpoint}, switching to mock mode`)
        } else if (error.message.includes('Failed to fetch')) {
          console.log(`🌐 [API] Network error for ${endpoint}, switching to mock mode`)
        }
        
        this.serverStatus.isConnected = false
        this.serverStatus.mockModeEnabled = true
      }
    }

    // 모킹 모드로 fallback
    console.log(`🎭 [API] Using mock mode for ${endpoint}`)
    return await this.mockRequest(endpoint, options)
  }

  // 모킹 API 요청 처리 - 완전히 새로 작성
  private async mockRequest(endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}) {
    const method = (options.method || 'GET').toUpperCase()
    console.log(`🎭 [MOCK] Processing ${method} ${endpoint}`)
    
    // 지연 시뮬레이션 (더 짧게)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    try {
      // 센서 데이터 기록 - 최우선 처리
      if (endpoint === '/sensors/data' && method === 'POST') {
        console.log(`🎭 [MOCK] ✅ Handling sensor data POST request`)
        
        let requestBody: any = {}
        
        // 요청 바디 파싱
        if (options.body) {
          try {
            if (typeof options.body === 'string') {
              requestBody = JSON.parse(options.body)
            } else {
              requestBody = options.body
            }
          } catch (parseError) {
            console.error(`🎭 [MOCK] Failed to parse request body:`, parseError)
            return {
              success: false,
              error: 'Invalid request body format'
            }
          }
        }
        
        const { sensorId, type, value, location } = requestBody
        console.log(`🎭 [MOCK] Extracted sensor data:`, { sensorId, type, value, location })
        
        // 필수 필드 검증
        if (!sensorId) {
          console.warn(`🎭 [MOCK] Missing sensorId`)
          return { success: false, error: 'Missing sensorId' }
        }
        
        if (!type) {
          console.warn(`🎭 [MOCK] Missing type`)
          return { success: false, error: 'Missing type' }
        }
        
        if (value === undefined || value === null) {
          console.warn(`🎭 [MOCK] Missing value`)
          return { success: false, error: 'Missing value' }
        }
        
        // 센서 데이터 객체 생성
        const sensorData = {
          sensorId: String(sensorId),
          type: String(type),
          value: String(value),
          location: String(location || 'Unknown'),
          timestamp: new Date().toISOString(),
          status: 'normal',
          id: `mock_sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        console.log(`🎭 [MOCK] Created sensor data object:`, sensorData)
        
        // 로컬 스토리지 저장 시도
        try {
          const storageKey = 'mock_sensors'
          let sensorsArray: any[] = []
          
          // 기존 데이터 로드
          try {
            const existingData = localStorage.getItem(storageKey)
            if (existingData) {
              sensorsArray = JSON.parse(existingData)
              if (!Array.isArray(sensorsArray)) {
                sensorsArray = []
              }
            }
          } catch (loadError) {
            console.warn(`🎭 [MOCK] Failed to load existing data, starting fresh:`, loadError)
            sensorsArray = []
          }
          
          // 새 데이터 추가
          sensorsArray.push(sensorData)
          
          // 최대 500개 기록 유지 (메모리 절약)
          if (sensorsArray.length > 500) {
            sensorsArray.splice(0, sensorsArray.length - 500)
          }
          
          // 저장
          localStorage.setItem(storageKey, JSON.stringify(sensorsArray))
          console.log(`🎭 [MOCK] ✅ Successfully stored sensor data for ${sensorId} (total: ${sensorsArray.length} records)`)
          
        } catch (storageError) {
          console.warn(`🎭 [MOCK] Storage failed but continuing:`, storageError)
        }
        
        // 항상 성공 응답 반환
        return {
          success: true,
          data: sensorData,
          message: `Mock: Successfully recorded sensor data for ${sensorId}`,
          timestamp: new Date().toISOString()
        }
      }
      
      // 센서 최신 데이터 조회
      if (endpoint === '/sensors/latest') {
        console.log(`🎭 [MOCK] ✅ Handling sensors/latest request`)
        
        try {
          const existingData = localStorage.getItem('mock_sensors')
          let sensorsArray: any[] = []
          
          if (existingData) {
            sensorsArray = JSON.parse(existingData)
            if (!Array.isArray(sensorsArray)) sensorsArray = []
          }
          
          // 각 센서 ID별 최신 데이터만 추출
          const latestSensors: Record<string, any> = {}
          sensorsArray.forEach((sensor: any) => {
            if (sensor && sensor.sensorId) {
              if (!latestSensors[sensor.sensorId] || 
                  new Date(sensor.timestamp) > new Date(latestSensors[sensor.sensorId].timestamp)) {
                latestSensors[sensor.sensorId] = sensor
              }
            }
          })
          
          const latestArray = Object.values(latestSensors)
          console.log(`🎭 [MOCK] ✅ Returning ${latestArray.length} latest sensor records`)
          
          return {
            success: true,
            data: latestArray,
            message: `Found ${latestArray.length} sensors`
          }
        } catch (error) {
          console.warn(`🎭 [MOCK] Error processing sensors/latest:`, error)
          return {
            success: true,
            data: [],
            message: 'No sensor data available'
          }
        }
      }
      
      // 헬스체크
      if (endpoint === '/health') {
        return {
          success: false,
          error: 'Mock mode - no real server available'
        }
      }
      
      // 대시보드 데이터
      if (endpoint === '/dashboard') {
        return {
          success: true,
          data: {
            stats: {
              totalSensors: 0,
              criticalSensors: 0,
              warningSensors: 0,
              totalChecklists: 5,
              completedChecklists: 2,
              inProgressChecklists: 3,
              totalCCPs: 2,
              criticalCCPs: 0,
              warningCCPs: 0,
              totalAlerts: 1,
              criticalAlerts: 0
            },
            systemStatus: 'offline'
          }
        }
      }
      
      // 알림 데이터
      if (endpoint.startsWith('/alerts')) {
        return {
          success: true,
          data: []
        }
      }
      
      // 기본 POST 응답
      if (method === 'POST') {
        console.log(`🎭 [MOCK] ✅ Default POST response for ${endpoint}`)
        return {
          success: true,
          data: { 
            id: `mock_${Date.now()}`, 
            created: new Date().toISOString() 
          },
          message: `Mock POST completed for ${endpoint}`
        }
      }
      
      // 기본 PUT 응답
      if (method === 'PUT') {
        return {
          success: true,
          message: `Mock PUT completed for ${endpoint}`
        }
      }
      
      // 기본 DELETE 응답
      if (method === 'DELETE') {
        return {
          success: true,
          message: `Mock DELETE completed for ${endpoint}`
        }
      }
      
      // 기본 GET 응답
      console.log(`🎭 [MOCK] ✅ Default GET response for ${endpoint}`)
      return {
        success: true,
        data: [],
        message: `Mock GET completed for ${endpoint}`
      }
      
    } catch (error: any) {
      console.error(`🎭 [MOCK] ❌ Mock request failed for ${endpoint}:`, error)
      return {
        success: false,
        error: error.message || 'Mock request processing failed',
        endpoint,
        method
      }
    }
  }

  // 공통 메서드들
  async get(endpoint: string, options: { responseType?: 'json' | 'blob' } = {}) {
    return this.request(endpoint, { method: 'GET', responseType: options.responseType || 'json' })
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // 센서 관련 메서드들
  async recordSensorData(data: {
    sensorId: string
    type: string
    value: number | string
    location: string
    timestamp?: string
  }) {
    const requestPayload = {
      sensorId: data.sensorId,
      type: data.type,
      value: data.value,
      location: data.location,
      timestamp: data.timestamp || new Date().toISOString()
    }
    
    console.log(`📡 [API] Recording sensor data for ${data.sensorId}:`, requestPayload)
    
    try {
      // API 요청 실행
      const result = await this.request('/sensors/data', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      })
      
      // 응답 로깅
      console.log(`📊 [API] Raw response for ${data.sensorId}:`, result)
      
      // 응답 검증 및 처리
      if (result && typeof result === 'object') {
        if (result.success === true) {
          console.log(`✅ [API] Sensor data successfully recorded for ${data.sensorId}`)
          return result
        } else {
          console.warn(`⚠ [API] API returned non-success response for ${data.sensorId}:`, result)
          
          // 특정 에러 메시지 패턴 확인
          if (result.error && typeof result.error === 'string') {
            // "Mock endpoint not implemented" 에러 처리
            if (result.error.includes('Mock endpoint not implemented') || 
                result.error.includes('endpoint not implemented')) {
              
              console.log(`🎭 [API] Detected unimplemented endpoint error, forcing mock mode`)
              this.serverStatus.mockModeEnabled = true
              this.serverStatus.isConnected = false
              
              // 직접 모킹 메서드 호출
              const mockResult = await this.mockRequest('/sensors/data', {
                method: 'POST',
                body: JSON.stringify(requestPayload)
              })
              
              console.log(`🎭 [API] Mock fallback result for ${data.sensorId}:`, mockResult)
              return mockResult
            }
          }
          
          // 다른 실패 응답도 그대로 반환 (모니터링 지속)
          return result
        }
      }
      
      // 예상치 못한 응답 형태
      console.warn(`⚠ [API] Unexpected response format for ${data.sensorId}:`, result)
      return { 
        success: false, 
        error: 'Unexpected response format', 
        originalResponse: result 
      }
      
    } catch (networkError: any) {
      console.error(`❌ [API] Network error while recording ${data.sensorId}:`, networkError.message)
      
      // 네트워크 에러 발생 시 강제로 모킹 모드 전환
      console.log(`🎭 [API] Network error detected, switching to mock mode`)
      this.serverStatus.mockModeEnabled = true
      this.serverStatus.isConnected = false
      
      // 모킹 모드로 재시도
      try {
        const mockResult = await this.mockRequest('/sensors/data', {
          method: 'POST',
          body: JSON.stringify(requestPayload)
        })
        
        console.log(`🎭 [API] Network error fallback successful for ${data.sensorId}`)
        return mockResult
        
      } catch (mockError: any) {
        console.error(`❌ [API] Both network and mock failed for ${data.sensorId}:`, mockError.message)
        return { 
          success: false, 
          error: `Complete failure: Network error (${networkError.message}) and mock error (${mockError.message})`,
          sensorId: data.sensorId,
          critical: true
        }
      }
    }
  }

  async getLatestSensorData() {
    return this.request('/sensors/latest')
  }

  async getDashboardData() {
    return this.request('/dashboard')
  }

  async getAlerts(acknowledged?: boolean) {
    const query = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : ''
    return this.request(`/alerts${query}`)
  }

  async acknowledgeAlert(alertId: string) {
    return this.request(`/alerts/${alertId}/acknowledge`, { method: 'PUT' })
  }

  async healthCheck() {
    return this.request('/health')
  }

  // 기타 API 메서드들 (기본 구현)
  async createChecklist(checklist: any) { return this.post('/checklists', checklist) }
  async getChecklists(date?: string) { 
    const query = date ? `?date=${date}` : ''
    return this.get(`/checklists${query}`) 
  }
  async updateChecklistItem(checklistId: string, itemId: string, data: any) {
    return this.put(`/checklists/${checklistId}/items/${itemId}`, data)
  }
  async createReport(report: any) { return this.post('/reports', report) }
  async getReports(type?: string, status?: string) {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (status) params.append('status', status)
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.get(`/reports${query}`)
  }
  async updateReport(reportId: string, data: any) { return this.put(`/reports/${reportId}`, data) }
  async getCCPs() { return this.get('/ccp') }
  async createCCP(ccp: any) { return this.post('/ccp', ccp) }
  async updateCCP(ccpId: string, data: any) { return this.put(`/ccp/${ccpId}`, data) }
  async deleteCCP(ccpId: string) { return this.delete(`/ccp/${ccpId}`) }
  async addCCPRecord(ccpId: string, record: any) { return this.post(`/ccp/${ccpId}/records`, record) }
  async initializeSystem() { return this.post('/init') }
  async login(email: string, password: string) { return this.post('/auth/login', { email, password }) }
  async signup(email: string, password: string, name: string) { return this.post('/auth/signup', { email, password, name }) }
  async getSuppliers() { return this.get('/suppliers') }
  async createSupplier(supplier: any) { return this.post('/suppliers', supplier) }
  async updateSupplier(supplierId: string, data: any) { return this.put(`/suppliers/${supplierId}`, data) }
  async deleteSupplier(supplierId: string) { return this.delete(`/suppliers/${supplierId}`) }

  // 백업 관련 메소드들
  async backupCCPRecords() { return this.post('/backup/execute-ccp') }
  async executeCCPBackup() { return this.backupCCPRecords() }
  async getBackupLogs() { return this.get('/backup/logs') }
  async getBackupConfigStatus() { return this.get('/backup/config') }
  async testBackupConnection() { return this.post('/backup/test-connection') }
  async scheduleBackup() { return this.post('/backup/schedule') }
  async setBackupConfig(config: any) { return this.post('/backup/config', config) }
  async getBackupConfig() { return this.get('/backup/config') }
  async updateBackupConfig(config: any) { return this.put('/backup/config', config) }
  async deleteBackupConfig() { return this.delete('/backup/config') }
  async setMenuBackupConfig(config: any) { return this.post('/backup/menu-config', config) }
  async getMenuBackupConfigs() { return this.get('/backup/menu-configs') }
  async testMenuBackupConnection(config: any) { return this.post('/backup/test-menu-connection', config) }
  async deleteMenuBackupConfig(menuId: string) { return this.delete(`/backup/menu-config/${menuId}`) }
  async executeMenuBackup(menuId: string) { return this.post(`/backup/execute-menu/${menuId}`) }
  async backupMenuData(menuId: string, menuName: string) { return this.executeMenuBackup(menuId) }
  async getBackupStructures() { return this.get('/backup-structures') }
  async getBackupStructure(documentType: string) { return this.get(`/backup-structures/${documentType}`) }
  async saveBackupStructure(structure: any) { return this.post('/backup-structures', structure) }
  async deleteBackupStructure(documentType: string) { return this.delete(`/backup-structures/${documentType}`) }
  async previewBackupStructure(documentType: string) { return this.get(`/backup-structures/${documentType}/preview`) }
  async testBackupStructure(documentType: string) { return this.post(`/backup-structures/${documentType}/test`) }
  async executeStructuredBackup(documentType: string) { return this.post(`/backup-structures/${documentType}/backup`) }
  async createSampleData() { return this.post('/create-sample-data') }
  async getProjectInfo() { return this.get('/export/project-info') }
  async downloadProjectSource() { return this.get('/export/project-source', { responseType: 'blob' }) }

  async getSensorData(sensorId?: string, period: string = '24h', type?: string, location?: string) {
    const params = new URLSearchParams()
    params.append('period', period)
    if (type) params.append('type', type)
    if (location) params.append('location', location)
    
    if (sensorId) {
      return this.get(`/sensors/data/${sensorId}?period=${period}`)
    } else {
      return this.get(`/sensors/data?${params.toString()}`)
    }
  }

  async getAllSensorData(period: string = '24h', type?: string, location?: string) {
    const params = new URLSearchParams()
    params.append('period', period)
    if (type) params.append('type', type)
    if (location) params.append('location', location)
    
    return this.get(`/sensors/data?${params.toString()}`)
  }
}

export const api = new ApiClient()