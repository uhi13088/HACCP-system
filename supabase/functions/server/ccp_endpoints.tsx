import * as kv from './kv_store.tsx';

// CCP 상태 결정 함수
function determineStatus(ccp: any): string {
  try {
    if (!ccp.currentValue || !ccp.criticalLimit) {
      return 'normal';
    }
    
    const currentValue = parseFloat(ccp.currentValue);
    const { min, max } = ccp.criticalLimit;
    
    if (isNaN(currentValue) || isNaN(min) || isNaN(max)) {
      return 'normal';
    }
    
    if (currentValue < min || currentValue > max) {
      return 'critical';
    } else if (currentValue < min + 5 || currentValue > max - 5) {
      return 'warning';
    }
    
    return 'normal';
  } catch (error) {
    console.error('Error determining status:', error);
    return 'normal';
  }
}

// CCP 엔드포인트 추가 함수
export function addCCPEndpoints(app: any) {
  // CCP 목록 조회
  app.get('/make-server-79e634f3/ccp', async (c: any) => {
    try {
      console.log('📊 Fetching CCP data...');
      
      let ccps = [];
      try {
        ccps = await kv.getByPrefix('ccp:');
        console.log('✓ Found', ccps.length, 'CCP records');
      } catch (kvError) {
        console.log('⚠ KV fetch error for CCPs:', kvError);
        ccps = [];
      }
      
      // 각 CCP에 상태 추가
      const ccpsWithStatus = ccps.map((ccp: any) => ({
        ...ccp,
        status: determineStatus(ccp)
      }));
      
      return c.json({ success: true, data: ccpsWithStatus });
    } catch (error) {
      console.error('❌ Error fetching CCPs:', error);
      return c.json({
        success: true,
        data: [],
        warning: 'CCP fetch failed, returning empty array'
      });
    }
  });

  // 특정 CCP 조회
  app.get('/make-server-79e634f3/ccp/:id', async (c: any) => {
    try {
      const ccpId = c.req.param('id');
      console.log('📊 Fetching CCP:', ccpId);
      
      const ccp = await kv.get(`ccp:${ccpId}`);
      
      if (!ccp) {
        return c.json({ error: 'CCP not found' }, 404);
      }
      
      const ccpWithStatus = {
        ...ccp,
        status: determineStatus(ccp)
      };
      
      return c.json({ success: true, data: ccpWithStatus });
    } catch (error) {
      console.error('❌ Error fetching CCP:', error);
      return c.json({ error: 'Failed to fetch CCP' }, 500);
    }
  });

  // CCP 생성
  app.post('/make-server-79e634f3/ccp', async (c: any) => {
    try {
      const ccpData = await c.req.json();
      console.log('📝 Creating CCP:', ccpData);
      
      const ccp = {
        ...ccpData,
        records: [],
        correctiveActions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: c.get('userId') || 'system'
      };
      
      await kv.set(`ccp:${ccp.id}`, ccp);
      console.log('✓ CCP created:', ccp.id);
      
      return c.json({ success: true, data: ccp });
    } catch (error) {
      console.error('❌ Error creating CCP:', error);
      return c.json({ error: 'Failed to create CCP' }, 500);
    }
  });

  // CCP 업데이트
  app.put('/make-server-79e634f3/ccp/:id', async (c: any) => {
    try {
      const ccpId = c.req.param('id');
      const updateData = await c.req.json();
      console.log('📝 Updating CCP:', ccpId);
      
      const existingCCP = await kv.get(`ccp:${ccpId}`);
      if (!existingCCP) {
        return c.json({ error: 'CCP not found' }, 404);
      }
      
      const updatedCCP = {
        ...existingCCP,
        ...updateData,
        updatedAt: new Date().toISOString(),
        updatedBy: c.get('userId') || 'system'
      };
      
      await kv.set(`ccp:${ccpId}`, updatedCCP);
      console.log('✓ CCP updated:', ccpId);
      
      return c.json({ success: true, data: updatedCCP });
    } catch (error) {
      console.error('❌ Error updating CCP:', error);
      return c.json({ error: 'Failed to update CCP' }, 500);
    }
  });

  // CCP 삭제
  app.delete('/make-server-79e634f3/ccp/:id', async (c: any) => {
    try {
      const ccpId = c.req.param('id');
      console.log('🗑 Deleting CCP:', ccpId);
      
      const existingCCP = await kv.get(`ccp:${ccpId}`);
      if (!existingCCP) {
        return c.json({ error: 'CCP not found' }, 404);
      }
      
      await kv.del(`ccp:${ccpId}`);
      console.log('✓ CCP deleted:', ccpId);
      
      return c.json({ success: true, message: 'CCP deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting CCP:', error);
      return c.json({ error: 'Failed to delete CCP' }, 500);
    }
  });

  // CCP 기록 추가
  app.post('/make-server-79e634f3/ccp/:id/records', async (c: any) => {
    try {
      const ccpId = c.req.param('id');
      const recordData = await c.req.json();
      console.log('📝 Adding record to CCP:', ccpId, recordData);
      
      // CCP 존재 확인
      let existingCCP = await kv.get(`ccp:${ccpId}`);
      if (!existingCCP) {
        // CCP가 없으면 기본 CCP 생성
        console.log('⚠ CCP not found, creating basic CCP:', ccpId);
        const basicCCP = {
          id: ccpId,
          name: `CCP-${ccpId}`,
          process: 'Unknown Process',
          ccpType: 'unknown',
          hazard: 'Unknown hazard',
          criticalLimit: { min: 0, max: 100 },
          unit: '°C',
          monitoringMethod: 'Manual',
          frequency: '매시간',
          currentValue: recordData.heatingTemp || recordData.productTempAfter || 0,
          status: 'normal',
          lastChecked: new Date().toISOString(),
          records: [],
          correctiveActions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await kv.set(`ccp:${ccpId}`, basicCCP);
        existingCCP = basicCCP;
      }
      
      // 새로운 기록 생성
      const record = {
        id: `record_${Date.now()}`,
        ...recordData,
        timestamp: recordData.measureTime || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId') || 'system'
      };
      
      // CCP의 기록 목록에 추가
      const updatedCCP = {
        ...existingCCP,
        records: [...(existingCCP.records || []), record],
        lastChecked: new Date().toISOString(),
        currentValue: recordData.heatingTemp || recordData.productTempAfter || existingCCP.currentValue,
        updatedAt: new Date().toISOString()
      };
      
      // 상태 재평가
      updatedCCP.status = determineStatus(updatedCCP);
      
      await kv.set(`ccp:${ccpId}`, updatedCCP);
      
      // 기록을 별도로도 저장
      await kv.set(`ccp_record:${record.id}`, record);
      
      console.log('✓ Record added to CCP:', ccpId, 'Record ID:', record.id);
      
      return c.json({ success: true, data: record });
    } catch (error) {
      console.error('❌ Error adding CCP record:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to add CCP record',
        details: error.message 
      }, 500);
    }
  });

  // CCP 기록 목록 조회
  app.get('/make-server-79e634f3/ccp/:id/records', async (c: any) => {
    try {
      const ccpId = c.req.param('id');
      console.log('📋 Fetching records for CCP:', ccpId);
      
      const ccp = await kv.get(`ccp:${ccpId}`);
      if (!ccp) {
        return c.json({ error: 'CCP not found' }, 404);
      }
      
      const records = ccp.records || [];
      console.log('✓ Found', records.length, 'records for CCP:', ccpId);
      
      return c.json({ success: true, data: records });
    } catch (error) {
      console.error('❌ Error fetching CCP records:', error);
      return c.json({ error: 'Failed to fetch CCP records' }, 500);
    }
  });

  // CCP 기록 업데이트
  app.put('/make-server-79e634f3/ccp/:id/records/:recordId', async (c: any) => {
    try {
      const ccpId = c.req.param('id');
      const recordId = c.req.param('recordId');
      const updateData = await c.req.json();
      console.log('📝 Updating record:', recordId, 'in CCP:', ccpId);
      
      const ccp = await kv.get(`ccp:${ccpId}`);
      if (!ccp) {
        return c.json({ error: 'CCP not found' }, 404);
      }
      
      const records = ccp.records || [];
      const recordIndex = records.findIndex((r: any) => r.id === recordId);
      
      if (recordIndex === -1) {
        return c.json({ error: 'Record not found' }, 404);
      }
      
      records[recordIndex] = {
        ...records[recordIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const updatedCCP = {
        ...ccp,
        records,
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`ccp:${ccpId}`, updatedCCP);
      await kv.set(`ccp_record:${recordId}`, records[recordIndex]);
      
      console.log('✓ Record updated:', recordId);
      
      return c.json({ success: true, data: records[recordIndex] });
    } catch (error) {
      console.error('❌ Error updating CCP record:', error);
      return c.json({ error: 'Failed to update CCP record' }, 500);
    }
  });
}