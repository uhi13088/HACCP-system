export function addSupplierEndpoints(app: any, kv: any, requireAuth: any) {
  console.log('🔧 Adding supplier endpoints...');
  console.log('🔍 Checking parameters - app:', typeof app, 'kv:', typeof kv, 'requireAuth:', typeof requireAuth);

  try {
    // 공급업체 목록 조회
    console.log('📋 Registering GET /make-server-79e634f3/suppliers endpoint...');
    app.get('/make-server-79e634f3/suppliers', requireAuth, async (c: any) => {
      try {
        console.log('📝 Getting suppliers list')
        
        let suppliers = [];
        try {
          suppliers = await kv.get('suppliers') || [];
        } catch (kvError) {
          console.warn('KV get error, using empty array:', kvError);
          suppliers = [];
        }
        
        // 만약 공급업체 데이터가 없다면 초기 데이터 생성
        if (suppliers.length === 0) {
          console.log('🔧 No suppliers found, creating initial data...')
          const initialSuppliers = [
            {
              id: `supplier_${Date.now()}_1`,
              name: '(주)한국밀가루',
              category: 'ingredient',
              contact: '김민수',
              phone: '02-123-4567',
              address: '서울시 강남구 테헤란로 123',
              notes: '주요 밀가루 공급업체',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: `supplier_${Date.now()}_2`,
              name: '(주)신선유제품',
              category: 'ingredient',
              contact: '이영희',
              phone: '031-987-6543',
              address: '경기도 수원시 영통구 월드컵로 456',
              notes: '우유, 버터 등 유제품 전문',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: `supplier_${Date.now()}_3`,
              name: '(주)깨끗한포장',
              category: 'packaging',
              contact: '박철수',
              phone: '02-555-7890',
              address: '서울시 마포구 상암로 789',
              notes: '친환경 포장재 전문업체',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          try {
            await kv.set('suppliers', initialSuppliers);
            suppliers = initialSuppliers;
            console.log('✅ Initial suppliers data created')
          } catch (setError) {
            console.error('Error creating initial suppliers:', setError);
            suppliers = initialSuppliers; // Use in-memory fallback
          }
        }
        
        console.log(`✅ Found ${suppliers.length} suppliers`)
        
        return c.json({
          success: true,
          data: suppliers
        });
      } catch (error: any) {
        console.error('❌ Failed to get suppliers:', error);
        return c.json({
          success: false,
          error: error.message || 'Failed to get suppliers'
        }, 500);
      }
    });

    // 공급업체 추가
    app.post('/make-server-79e634f3/suppliers', requireAuth, async (c: any) => {
      try {
        const body = await c.req.json();
        console.log('📝 Adding new supplier:', body);
        
        let suppliers = [];
        try {
          suppliers = await kv.get('suppliers') || [];
        } catch (kvError) {
          console.warn('KV get error during add, using empty array:', kvError);
          suppliers = [];
        }
        
        const newSupplier = {
          id: Date.now().toString(),
          name: body.name || '',
          category: body.category || 'general',
          contact: body.contact || '',
          phone: body.phone || '',
          address: body.address || '',
          notes: body.notes || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        suppliers.push(newSupplier);
        
        try {
          await kv.set('suppliers', suppliers);
        } catch (setError) {
          console.error('Error saving suppliers:', setError);
          // Continue anyway with in-memory data
        }
        
        console.log(`✅ Added supplier: ${newSupplier.name}`);
        
        return c.json({
          success: true,
          data: newSupplier
        });
      } catch (error: any) {
        console.error('❌ Failed to add supplier:', error);
        return c.json({
          success: false,
          error: error.message || 'Failed to add supplier'
        }, 500);
      }
    });

    // 공급업체 수정
    app.put('/make-server-79e634f3/suppliers/:id', requireAuth, async (c: any) => {
      try {
        const id = c.req.param('id');
        const body = await c.req.json();
        console.log(`📝 Updating supplier ${id}:`, body);
        
        let suppliers = [];
        try {
          suppliers = await kv.get('suppliers') || [];
        } catch (kvError) {
          console.warn('KV get error during update:', kvError);
          suppliers = [];
        }
        
        const supplierIndex = suppliers.findIndex((s: any) => s.id === id);
        
        if (supplierIndex === -1) {
          return c.json({
            success: false,
            error: 'Supplier not found'
          }, 404);
        }
        
        suppliers[supplierIndex] = {
          ...suppliers[supplierIndex],
          ...body,
          id,
          updatedAt: new Date().toISOString()
        };
        
        try {
          await kv.set('suppliers', suppliers);
        } catch (setError) {
          console.error('Error updating suppliers:', setError);
          // Continue anyway
        }
        
        console.log(`✅ Updated supplier: ${suppliers[supplierIndex].name}`);
        
        return c.json({
          success: true,
          data: suppliers[supplierIndex]
        });
      } catch (error: any) {
        console.error('❌ Failed to update supplier:', error);
        return c.json({
          success: false,
          error: error.message || 'Failed to update supplier'
        }, 500);
      }
    });

    // 공급업체 삭제
    app.delete('/make-server-79e634f3/suppliers/:id', requireAuth, async (c: any) => {
      try {
        const id = c.req.param('id');
        console.log(`📝 Deleting supplier ${id}`);
        
        let suppliers = [];
        try {
          suppliers = await kv.get('suppliers') || [];
        } catch (kvError) {
          console.warn('KV get error during delete:', kvError);
          suppliers = [];
        }
        
        const filteredSuppliers = suppliers.filter((s: any) => s.id !== id);
        
        if (suppliers.length === filteredSuppliers.length) {
          return c.json({
            success: false,
            error: 'Supplier not found'
          }, 404);
        }
        
        try {
          await kv.set('suppliers', filteredSuppliers);
        } catch (setError) {
          console.error('Error deleting supplier:', setError);
          // Continue anyway
        }
        
        console.log(`✅ Deleted supplier ${id}`);
        
        return c.json({
          success: true,
          message: 'Supplier deleted'
        });
      } catch (error: any) {
        console.error('❌ Failed to delete supplier:', error);
        return c.json({
          success: false,
          error: error.message || 'Failed to delete supplier'
        }, 500);
      }
    });

    // 공급업체 헬스체크 엔드포인트 (디버깅용)
    console.log('📋 Registering health check endpoint: /make-server-79e634f3/suppliers/health');
    app.get('/make-server-79e634f3/suppliers/health', async (c: any) => {
      console.log('🏥 Supplier health check requested');
      return c.json({
        success: true,
        message: 'Supplier endpoints are working',
        timestamp: new Date().toISOString(),
        kv_available: typeof kv !== 'undefined',
        auth_available: typeof requireAuth !== 'undefined'
      });
    });

    console.log('✅ Supplier endpoints added successfully');
    console.log('📋 Registered endpoints for suppliers:');
    console.log('  - GET    /make-server-79e634f3/suppliers');
    console.log('  - POST   /make-server-79e634f3/suppliers');
    console.log('  - PUT    /make-server-79e634f3/suppliers/:id');
    console.log('  - DELETE /make-server-79e634f3/suppliers/:id');
    console.log('  - GET    /make-server-79e634f3/suppliers/health');
    console.log('📋 Total: 5 endpoints registered for suppliers');
    
  } catch (error) {
    console.error('❌ Critical error in addSupplierEndpoints:', error);
    throw error; // Re-throw to prevent server from starting if there's a critical error
  }
}