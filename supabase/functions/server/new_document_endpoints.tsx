// =================
// 신규 문서 관리 엔드포인트
// =================

// 냉장냉동고 온도기록부
export function addDocumentEndpoints(app: any, kv: any, requireAuth: any) {
  
  // 냉장냉동고 온도기록부
  app.get('/make-server-79e634f3/temperature-logs', requireAuth, async (c: any) => {
    try {
      const date = c.req.query('date') || new Date().toISOString().split('T')[0]
      const records = await kv.getByPrefix('temperature_log:')
      
      const filteredRecords = records.filter((record: any) => 
        record.date === date
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching temperature logs:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/temperature-logs', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`temperature_log:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating temperature log:', error)
      return c.json({ error: 'Failed to create temperature log' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/temperature-logs/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`temperature_log:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting temperature log:', error)
      return c.json({ error: 'Failed to delete temperature log' }, 500)
    }
  })

  // 세척소독 기록부
  app.get('/make-server-79e634f3/cleaning-logs', requireAuth, async (c: any) => {
    try {
      const date = c.req.query('date') || new Date().toISOString().split('T')[0]
      const records = await kv.getByPrefix('cleaning_log:')
      
      const filteredRecords = records.filter((record: any) => 
        record.date === date
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching cleaning logs:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/cleaning-logs', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`cleaning_log:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating cleaning log:', error)
      return c.json({ error: 'Failed to create cleaning log' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/cleaning-logs/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`cleaning_log:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting cleaning log:', error)
      return c.json({ error: 'Failed to delete cleaning log' }, 500)
    }
  })

  // 원료입고 검수기록부
  app.get('/make-server-79e634f3/receiving-logs', requireAuth, async (c: any) => {
    try {
      const date = c.req.query('date') || new Date().toISOString().split('T')[0]
      const records = await kv.getByPrefix('receiving_log:')
      
      const filteredRecords = records.filter((record: any) => 
        record.date === date
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching receiving logs:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/receiving-logs', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`receiving_log:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating receiving log:', error)
      return c.json({ error: 'Failed to create receiving log' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/receiving-logs/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`receiving_log:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting receiving log:', error)
      return c.json({ error: 'Failed to delete receiving log' }, 500)
    }
  })

  // 시설점검 주간체크리스트
  app.get('/make-server-79e634f3/facility-inspections', requireAuth, async (c: any) => {
    try {
      const week = c.req.query('week') || (() => {
        const now = new Date()
        const year = now.getFullYear()
        const weekNum = Math.ceil(((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7)
        return `${year}-W${weekNum.toString().padStart(2, '0')}`
      })()
      
      const records = await kv.getByPrefix('facility_inspection:')
      
      const filteredRecords = records.filter((record: any) => 
        record.week === week
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching facility inspections:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/facility-inspections', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`facility_inspection:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating facility inspection:', error)
      return c.json({ error: 'Failed to create facility inspection' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/facility-inspections/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`facility_inspection:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting facility inspection:', error)
      return c.json({ error: 'Failed to delete facility inspection' }, 500)
    }
  })

  // 사고보고서
  app.get('/make-server-79e634f3/accident-reports', requireAuth, async (c: any) => {
    try {
      const month = c.req.query('month') || new Date().toISOString().slice(0, 7)
      const records = await kv.getByPrefix('accident_report:')
      
      const filteredRecords = records.filter((record: any) => 
        record.date && record.date.startsWith(month)
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching accident reports:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/accident-reports', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`accident_report:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating accident report:', error)
      return c.json({ error: 'Failed to create accident report' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/accident-reports/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`accident_report:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting accident report:', error)
      return c.json({ error: 'Failed to delete accident report' }, 500)
    }
  })

  // 교육훈련 기록부
  app.get('/make-server-79e634f3/training-records', requireAuth, async (c: any) => {
    try {
      const month = c.req.query('month') || new Date().toISOString().slice(0, 7)
      const records = await kv.getByPrefix('training_record:')
      
      const filteredRecords = records.filter((record: any) => 
        record.date && record.date.startsWith(month)
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching training records:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/training-records', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`training_record:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating training record:', error)
      return c.json({ error: 'Failed to create training record' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/training-records/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`training_record:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting training record:', error)
      return c.json({ error: 'Failed to delete training record' }, 500)
    }
  })

  // Excel 내보내기 엔드포인트들 (Mock 구현)
  app.get('/make-server-79e634f3/temperature-logs/export', requireAuth, async (c: any) => {
    // Mock Excel file - return empty blob for now
    const mockExcel = new TextEncoder().encode('Mock Excel Content')
    const response = new Response(mockExcel, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="temperature-logs.xlsx"'
      }
    })
    return response
  })

  app.get('/make-server-79e634f3/cleaning-logs/export', requireAuth, async (c: any) => {
    const mockExcel = new TextEncoder().encode('Mock Excel Content')
    const response = new Response(mockExcel, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="cleaning-logs.xlsx"'
      }
    })
    return response
  })

  app.get('/make-server-79e634f3/receiving-logs/export', requireAuth, async (c: any) => {
    const mockExcel = new TextEncoder().encode('Mock Excel Content')
    const response = new Response(mockExcel, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="receiving-logs.xlsx"'
      }
    })
    return response
  })

  app.get('/make-server-79e634f3/facility-inspections/export', requireAuth, async (c: any) => {
    const mockExcel = new TextEncoder().encode('Mock Excel Content')
    const response = new Response(mockExcel, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="facility-inspections.xlsx"'
      }
    })
    return response
  })

  app.get('/make-server-79e634f3/accident-reports/export', requireAuth, async (c: any) => {
    const mockExcel = new TextEncoder().encode('Mock Excel Content')
    const response = new Response(mockExcel, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="accident-reports.xlsx"'
      }
    })
    return response
  })

  app.get('/make-server-79e634f3/training-records/export', requireAuth, async (c: any) => {
    const mockExcel = new TextEncoder().encode('Mock Excel Content')
    const response = new Response(mockExcel, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="training-records.xlsx"'
      }
    })
    return response
  })

  // 생산일지
  app.get('/make-server-79e634f3/production-logs', requireAuth, async (c: any) => {
    try {
      const date = c.req.query('date') || new Date().toISOString().split('T')[0]
      const records = await kv.getByPrefix('production_log:')
      
      const filteredRecords = records.filter((record: any) => 
        record.date === date
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching production logs:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/production-logs', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`production_log:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating production log:', error)
      return c.json({ error: 'Failed to create production log' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/production-logs/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`production_log:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting production log:', error)
      return c.json({ error: 'Failed to delete production log' }, 500)
    }
  })

  // 방충방서 주간점검표
  app.get('/make-server-79e634f3/pest-control', requireAuth, async (c: any) => {
    try {
      const week = c.req.query('week') || (() => {
        const now = new Date()
        const year = now.getFullYear()
        const weekNum = Math.ceil(((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7)
        return `${year}-W${weekNum.toString().padStart(2, '0')}`
      })()
      
      const records = await kv.getByPrefix('pest_control:')
      
      const filteredRecords = records.filter((record: any) => 
        record.week === week
      )

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching pest control records:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/pest-control', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`pest_control:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating pest control record:', error)
      return c.json({ error: 'Failed to create pest control record' }, 500)
    }
  })

  app.put('/make-server-79e634f3/pest-control/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      const recordData = await c.req.json()
      
      const record = {
        ...recordData,
        id,
        updatedAt: new Date().toISOString()
      }

      await kv.set(`pest_control:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error updating pest control record:', error)
      return c.json({ error: 'Failed to update pest control record' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/pest-control/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`pest_control:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting pest control record:', error)
      return c.json({ error: 'Failed to delete pest control record' }, 500)
    }
  })

  // 외부인출입관리대장
  app.get('/make-server-79e634f3/visitor-logs', requireAuth, async (c: any) => {
    try {
      const date = c.req.query('date')
      const records = await kv.getByPrefix('visitor_log:')
      
      // 날짜가 지정된 경우에만 필터링, 아니면 모든 데이터 반환
      const filteredRecords = date 
        ? records.filter((record: any) => record.date === date)
        : records

      return c.json({ success: true, data: filteredRecords })
    } catch (error) {
      console.log('Error fetching visitor logs:', error)
      return c.json({ success: true, data: [] })
    }
  })

  app.post('/make-server-79e634f3/visitor-logs', requireAuth, async (c: any) => {
    try {
      const recordData = await c.req.json()
      const id = Date.now().toString()
      
      const record = {
        id,
        ...recordData,
        createdAt: new Date().toISOString()
      }

      await kv.set(`visitor_log:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error creating visitor log:', error)
      return c.json({ error: 'Failed to create visitor log' }, 500)
    }
  })

  app.put('/make-server-79e634f3/visitor-logs/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      const recordData = await c.req.json()
      
      const record = {
        ...recordData,
        id,
        updatedAt: new Date().toISOString()
      }

      await kv.set(`visitor_log:${id}`, record)
      return c.json({ success: true, data: record })
    } catch (error) {
      console.log('Error updating visitor log:', error)
      return c.json({ error: 'Failed to update visitor log' }, 500)
    }
  })

  app.delete('/make-server-79e634f3/visitor-logs/:id', requireAuth, async (c: any) => {
    try {
      const id = c.req.param('id')
      await kv.del(`visitor_log:${id}`)
      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting visitor log:', error)
      return c.json({ error: 'Failed to delete visitor log' }, 500)
    }
  })
}