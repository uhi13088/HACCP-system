import { projectId, publicAnonKey } from './supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-79e634f3`

class ApiClient {
  private serverStatus = {
    isConnected: false,
    lastChecked: null as Date | null,
    retryCount: 0,
    maxRetries: 3,
    mockModeEnabled: true,
    initialCheckDone: false
  }
  
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': publicAnonKey,
      'Authorization': `Bearer ${publicAnonKey}`
    }
  }

  async checkServerStatus(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (this.serverStatus.mockModeEnabled) {
      return false
    }

    try {
      const url = `${API_BASE}/health`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)
      this.serverStatus.isConnected = response.ok
      this.serverStatus.lastChecked = new Date()
      this.serverStatus.retryCount = 0
      
      if (response.ok) {
        return true
      } else {
        this.serverStatus.mockModeEnabled = true
        return false
      }
    } catch (error) {
      this.serverStatus.isConnected = false
      this.serverStatus.lastChecked = new Date()
      this.serverStatus.mockModeEnabled = true
      return false
    }
  }

  getServerStatus() {
    return { 
      ...this.serverStatus,
      isConnected: this.serverStatus.mockModeEnabled ? false : this.serverStatus.isConnected
    }
  }

  async forceInitialize() {
    this.isInitialized = false
    this.initPromise = null
    this.serverStatus.initialCheckDone = false
    await this.initialize()
    return this.getServerStatus();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized || this.initPromise) {
      return this.initPromise || Promise.resolve()
    }

    this.initPromise = this._performInitialization()
    await this.initPromise
  }

  private async _performInitialization(): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const url = `${API_BASE}/health`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        this.serverStatus.mockModeEnabled = false
        this.serverStatus.isConnected = true
      } else {
        this.serverStatus.mockModeEnabled = true
        this.serverStatus.isConnected = false
      }
    } catch (error) {
      this.serverStatus.mockModeEnabled = true
      this.serverStatus.isConnected = false
    }
    
    this.serverStatus.initialCheckDone = true
    this.serverStatus.lastChecked = new Date()
    this.isInitialized = true
  }

  async request(endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}) {
    await this.initialize()

    // 항상 모킹 모드 사용
    if (this.serverStatus.mockModeEnabled || endpoint.startsWith('/backup/structures')) {
      return await this.mockRequest(endpoint, options)
    }

    try {
      const url = `${API_BASE}${endpoint}`
      const { responseType, ...fetchOptions } = options
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.getHeaders(),
          ...fetchOptions.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      this.serverStatus.isConnected = true
      this.serverStatus.retryCount = 0

      let data
      if (responseType === 'blob') {
        data = await response.blob()
      } else {
        data = await response.json()
      }
      
      return data
    } catch (error: any) {
      this.serverStatus.mockModeEnabled = true
      this.serverStatus.isConnected = false
      return await this.mockRequest(endpoint, options)
    }
  }

  // 모킹 API 요청 처리
  private async mockRequest(endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}) {
    console.log(`🎭 [MOCK] ${options.method || 'GET'} ${endpoint}`)
    
    // 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const method = (options.method || 'GET').toUpperCase()
    
    // ========== 센서 데이터 POST 처리 ==========
    if (endpoint === '/sensors/data' && method === 'POST') {
      console.log('🌡️ [MOCK] Handling sensor data POST request')
      
      try {
        let requestBody = {}
        
        if (options.body) {
          if (typeof options.body === 'string') {
            requestBody = JSON.parse(options.body)
          } else {
            requestBody = options.body
          }
        }
        
        console.log('📊 [MOCK] Request body:', requestBody)
        
        const { sensorId, type, value, location } = requestBody as any
        
        if (!sensorId || !type || value === undefined) {
          console.error('❌ [MOCK] Missing required fields')
          return {
            success: false,
            error: 'Missing required fields: sensorId, type, or value'
          }
        }
        
        const sensorData = {
          sensorId: String(sensorId),
          type: String(type),
          value: String(value),
          location: String(location || 'Unknown'),
          timestamp: new Date().toISOString(),
          status: 'normal',
          id: `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        // 로컬 스토리지에 저장
        try {
          const existingData = localStorage.getItem('mock_sensors') || '[]'
          let sensorsArray = JSON.parse(existingData)
          if (!Array.isArray(sensorsArray)) sensorsArray = []
          
          sensorsArray.push(sensorData)
          
          if (sensorsArray.length > 1000) {
            sensorsArray.splice(0, sensorsArray.length - 1000)
          }
          
          localStorage.setItem('mock_sensors', JSON.stringify(sensorsArray))
          
          console.log(`✅ [MOCK] Sensor data saved for ${sensorId}`)
          
          return {
            success: true,
            data: sensorData,
            message: `Sensor data recorded for ${sensorId}`
          }
        } catch (storageError) {
          console.error('❌ [MOCK] Storage error:', storageError)
          return {
            success: false,
            error: 'Failed to save sensor data'
          }
        }
      } catch (error: any) {
        console.error('❌ [MOCK] Error processing sensor data:', error)
        return {
          success: false,
          error: error.message || 'Failed to process sensor data'
        }
      }
    }
    
    // ========== 헬스체크 ==========
    if (endpoint === '/health') {
      return {
        success: true,
        status: 'healthy',
        timestamp: Date.now(),
        server: 'make-server-79e634f3-mock'
      }
    }
    
    // ========== 센서 최신 데이터 ==========
    if (endpoint === '/sensors/latest') {
      const existingData = localStorage.getItem('mock_sensors') || '[]'
      let sensorsArray = []
      try {
        sensorsArray = JSON.parse(existingData)
      } catch (e) {
        sensorsArray = []
      }
      
      const latestSensors: any = {}
      sensorsArray.forEach((sensor: any) => {
        if (!latestSensors[sensor.sensorId] || 
            new Date(sensor.timestamp) > new Date(latestSensors[sensor.sensorId].timestamp)) {
          latestSensors[sensor.sensorId] = sensor
        }
      })
      
      const latestArray = Object.values(latestSensors)
      
      // 실제로 데이터가 있을 때만 반환, 없으면 빈 배열 반환
      return {
        success: true,
        data: latestArray,
        message: latestArray.length === 0 ? 'No sensor data available' : `Found ${latestArray.length} sensors`
      }
    }
    
    // ========== 대시보드 데이터 ==========
    if (endpoint === '/dashboard') {
      // 실제 센서 데이터를 기반으로 카운트 계산
      const existingData = localStorage.getItem('mock_sensors') || '[]'
      let sensorsArray = []
      try {
        sensorsArray = JSON.parse(existingData)
      } catch (e) {
        sensorsArray = []
      }
      
      const activeSensorIds = new Set()
      sensorsArray.forEach((sensor: any) => {
        activeSensorIds.add(sensor.sensorId)
      })
      
      const totalSensors = activeSensorIds.size
      
      return {
        success: true,
        data: {
          stats: {
            totalSensors: totalSensors, criticalSensors: 0, warningSensors: totalSensors > 0 ? 1 : 0,
            totalChecklists: 12, completedChecklists: 8, inProgressChecklists: 4,
            totalCCPs: 4, criticalCCPs: 0, warningCCPs: 1,
            totalAlerts: totalSensors > 0 ? 2 : 0, criticalAlerts: 0
          },
          systemStatus: totalSensors > 0 ? 'normal' : 'warning'
        }
      }
    }
    
    // ========== 알림 데이터 ==========
    if (endpoint.startsWith('/alerts')) {
      return {
        success: true,
        data: [
          { id: 'alert1', type: 'warning', message: '창고 습도가 권장 범위를 초과했습니다', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), acknowledged: false },
          { id: 'alert2', type: 'info', message: '일일 점검이 80% 완료되었습니다', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), acknowledged: false }
        ]
      }
    }
    
    // ========== 기본 POST 응답 ==========
    if (method === 'POST') {
      return {
        success: true,
        data: { id: `mock_${Date.now()}`, created: new Date().toISOString() },
        message: `Mock POST response for ${endpoint}`
      }
    }
    
    // ========== 기본 PUT 응답 ==========
    if (method === 'PUT') {
      return {
        success: true,
        message: `Mock PUT response for ${endpoint}`
      }
    }
    
    // ========== 기본 DELETE 응답 ==========
    if (method === 'DELETE') {
      return {
        success: true,
        message: `Mock DELETE response for ${endpoint}`
      }
    }
    
    // ========== 기본 GET 응답 ==========
    return {
      success: true,
      data: [],
      message: `Mock GET response for ${endpoint}`
    }
  }

  // 센서 데이터 API
  async recordSensorData(data: {
    sensorId: string
    type: string
    value: number | string
    location: string
    timestamp?: string
  }) {
    console.log(`📡 Recording sensor data for ${data.sensorId}:`, data)
    
    try {
      if (!data.sensorId || !data.type || data.value === undefined) {
        throw new Error('Missing required sensor data fields')
      }
      
      const result = await this.request('/sensors/data', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          timestamp: data.timestamp || new Date().toISOString()
        })
      })
      
      if (!result?.success) {
        console.warn(`⚠ API response not successful for ${data.sensorId}:`, result)
      } else {
        console.log(`✅ Successfully recorded data for ${data.sensorId}`)
      }
      
      return result
    } catch (error: any) {
      console.error(`❌ Failed to record sensor data for ${data.sensorId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to record sensor data',
        sensorId: data.sensorId
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

  // 기본 메소드들
  async get(endpoint: string, options: { responseType?: 'json' | 'blob' } = {}) {
    return this.request(endpoint, { method: 'GET', responseType: options.responseType || 'json' })
  }

  async post(endpoint: string, data?: any) {
    try {
      return await this.request(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async put(endpoint: string, data?: any) {
    try {
      return await this.request(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async delete(endpoint: string) {
    try {
      return await this.request(endpoint, { method: 'DELETE' })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 나머지 API 메소드들 (기본 구현)
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

  // 기타 누락된 메소드들
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