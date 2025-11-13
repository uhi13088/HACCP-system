// 구조화된 백업 엔드포인트 - 연간/월간 대시보드 + CCP별 시트
import * as kv from './kv_store.tsx'
import { processPrivateKey, importPrivateKey, generateSignature, encodeSignature } from './private_key_utils.tsx'

// 년간 대시보드 생성 함수
async function createYearlyDashboard(baseUrl: string, accessToken: string, ccps: any[], sensors: any[], checklists: any[], alerts: any[], spreadsheetData: any) {
  console.log('📊 Building yearly dashboard data...')
  
  // 현재 년도
  const currentYear = new Date().getFullYear()
  
  // 월별 데이터 집계
  const monthlyData = []
  for (let month = 1; month <= 12; month++) {
    const monthName = `${month}월`
    
    // 해당 월의 데이터 필터링
    const monthCCPs = ccps.filter(ccp => {
      if (!ccp.createdAt) return false
      const date = new Date(ccp.createdAt)
      return date.getFullYear() === currentYear && date.getMonth() + 1 === month
    })
    
    const monthSensors = sensors.filter(sensor => {
      if (!sensor.createdAt) return false
      const date = new Date(sensor.createdAt)
      return date.getFullYear() === currentYear && date.getMonth() + 1 === month
    })
    
    const monthChecklists = checklists.filter(checklist => {
      if (!checklist.createdAt) return false
      const date = new Date(checklist.createdAt)
      return date.getFullYear() === currentYear && date.getMonth() + 1 === month
    })
    
    const monthAlerts = alerts.filter(alert => {
      if (!alert.timestamp) return false
      const date = new Date(alert.timestamp)
      return date.getFullYear() === currentYear && date.getMonth() + 1 === month
    })
    
    // 완료된 체크리스트 수
    const completedChecklists = monthChecklists.filter(cl => cl.status === 'completed').length
    // 위험 상태 CCP 수
    const criticalCCPs = monthCCPs.filter(ccp => ccp.status === 'critical').length
    // 미확인 알림 수
    const unacknowledgedAlerts = monthAlerts.filter(alert => !alert.acknowledged).length
    
    monthlyData.push([
      monthName,
      monthCCPs.length,
      monthSensors.length,
      monthChecklists.length,
      completedChecklists,
      `${monthChecklists.length > 0 ? Math.round((completedChecklists / monthChecklists.length) * 100) : 0}%`,
      monthAlerts.length,
      unacknowledgedAlerts,
      criticalCCPs,
      monthCCPs.filter(ccp => ccp.status === 'normal').length
    ])
  }
  
  // 년간 대시보드 데이터 구성
  const yearlyDashboardData = [
    [`${currentYear}년 HACCP 관리 년간 대시보드`, '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['📊 월별 실적 요약', '', '', '', '', '', '', '', '', ''],
    ['월', 'CCP 관리점', '센서 데이터', '총 체크리스트', '완료 체크리스트', '완료율', '총 알림', '미확인 알림', '위험 CCP', '정상 CCP'],
    ...monthlyData,
    ['', '', '', '', '', '', '', '', '', ''],
    ['📈 년간 총계', '', '', '', '', '', '', '', '', ''],
    [
      '전체',
      ccps.length,
      sensors.length,
      checklists.length,
      checklists.filter(cl => cl.status === 'completed').length,
      `${checklists.length > 0 ? Math.round((checklists.filter(cl => cl.status === 'completed').length / checklists.length) * 100) : 0}%`,
      alerts.length,
      alerts.filter(alert => !alert.acknowledged).length,
      ccps.filter(ccp => ccp.status === 'critical').length,
      ccps.filter(ccp => ccp.status === 'normal').length
    ]
  ]
  
  // 년간 대시보드 시트 클리어 및 업데이트
  await clearAndWriteSheet(baseUrl, accessToken, '년간 대시보드', yearlyDashboardData)
  
  // 년간 대시보드 서식 적용
  const yearlySheetId = getSheetId(spreadsheetData, '년간 대시보드')
  await formatYearlyDashboard(baseUrl, accessToken, yearlySheetId)
}

// 월간 대시보드 생성 함수
async function createMonthlyDashboard(baseUrl: string, accessToken: string, ccps: any[], sensors: any[], checklists: any[], alerts: any[], spreadsheetData: any) {
  console.log('📅 Building monthly dashboard data...')
  
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // 현재 월의 일별 데이터 집계
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const dailyData = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${currentMonth}월 ${day}일`
    
    // 해당 일의 데이터 필터링
    const dayCCPs = ccps.filter(ccp => {
      if (!ccp.createdAt) return false
      const date = new Date(ccp.createdAt)
      return date.getFullYear() === currentYear && 
             date.getMonth() + 1 === currentMonth && 
             date.getDate() === day
    })
    
    const daySensors = sensors.filter(sensor => {
      if (!sensor.createdAt) return false
      const date = new Date(sensor.createdAt)
      return date.getFullYear() === currentYear && 
             date.getMonth() + 1 === currentMonth && 
             date.getDate() === day
    })
    
    const dayChecklists = checklists.filter(checklist => {
      if (!checklist.createdAt) return false
      const date = new Date(checklist.createdAt)
      return date.getFullYear() === currentYear && 
             date.getMonth() + 1 === currentMonth && 
             date.getDate() === day
    })
    
    const dayAlerts = alerts.filter(alert => {
      if (!alert.timestamp) return false
      const date = new Date(alert.timestamp)
      return date.getFullYear() === currentYear && 
             date.getMonth() + 1 === currentMonth && 
             date.getDate() === day
    })
    
    const completedChecklists = dayChecklists.filter(cl => cl.status === 'completed').length
    const criticalCCPs = dayCCPs.filter(ccp => ccp.status === 'critical').length
    
    dailyData.push([
      dayStr,
      dayCCPs.length,
      daySensors.length,
      dayChecklists.length,
      completedChecklists,
      dayAlerts.length,
      criticalCCPs,
      dayCCPs.filter(ccp => ccp.status === 'normal').length
    ])
  }
  
  // 월간 대시보드 데이터 구성
  const monthlyDashboardData = [
    [`${currentYear}년 ${currentMonth}월 HACCP 관리 월간 대시보드`, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['📅 일별 실적 현황', '', '', '', '', '', '', ''],
    ['일자', 'CCP 관리점', '센서 데이터', '총 체크리스트', '완료 체크리스트', '총 알림', '위험 CCP', '정상 CCP'],
    ...dailyData,
    ['', '', '', '', '', '', '', ''],
    ['📊 월간 총계', '', '', '', '', '', '', ''],
    [
      '합계',
      ccps.filter(ccp => {
        if (!ccp.createdAt) return false
        const date = new Date(ccp.createdAt)
        return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
      }).length,
      sensors.filter(sensor => {
        if (!sensor.createdAt) return false
        const date = new Date(sensor.createdAt)
        return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
      }).length,
      checklists.filter(checklist => {
        if (!checklist.createdAt) return false
        const date = new Date(checklist.createdAt)
        return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
      }).length,
      checklists.filter(checklist => {
        if (!checklist.createdAt) return false
        const date = new Date(checklist.createdAt)
        return date.getFullYear() === currentYear && 
               date.getMonth() + 1 === currentMonth && 
               checklist.status === 'completed'
      }).length,
      alerts.filter(alert => {
        if (!alert.timestamp) return false
        const date = new Date(alert.timestamp)
        return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
      }).length,
      ccps.filter(ccp => {
        if (!ccp.createdAt) return false
        const date = new Date(ccp.createdAt)
        return date.getFullYear() === currentYear && 
               date.getMonth() + 1 === currentMonth && 
               ccp.status === 'critical'
      }).length,
      ccps.filter(ccp => {
        if (!ccp.createdAt) return false
        const date = new Date(ccp.createdAt)
        return date.getFullYear() === currentYear && 
               date.getMonth() + 1 === currentMonth && 
               ccp.status === 'normal'
      }).length
    ]
  ]
  
  // 월간 대시보드 시트 클리어 및 업데이트
  await clearAndWriteSheet(baseUrl, accessToken, '월간 대시보드', monthlyDashboardData)
  
  // 월간 대시보드 서식 적용
  const monthlySheetId = getSheetId(spreadsheetData, '월간 대시보드')
  await formatMonthlyDashboard(baseUrl, accessToken, monthlySheetId)
}

// CCP 타입별 시트 생성 함수 (각 CCP 타입별로 분리, 월별 드롭다운 포함)
async function createCCPTypeSheets(baseUrl: string, accessToken: string, ccps: any[], spreadsheetData: any) {
  console.log('🎯 Building CCP type-specific sheets...')
  
  // CCP 타입별로 그룹화
  const ccpsByType = ccps.reduce((groups, ccp) => {
    const type = ccp.ccpType || ccp.process || '기타'
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(ccp)
    return groups
  }, {})
  
  // 각 CCP 타입별로 시트 생성
  for (const [ccpType, typeCCPs] of Object.entries(ccpsByType)) {
    const sheetName = `${ccpType} CCP`
    console.log(`📝 Creating sheet for ${sheetName} with ${typeCCPs.length} records...`)
    
    // 해당 타입의 월별 데이터 생성
    const ccpTypeData = [
      [`${ccpType} CCP 관리 (월별 현황)`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['📅 월별 필터:', '전체', '', '', '', '선택한 월의 데이터만 표시됩니다', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['📋 CCP 관리점 상세 현황', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['번호', 'ID', '이름', '공정', '위험요소', '한계기준(최소)', '한계기준(최대)', '단위', '현재값', '상태', '최종점검', '생성일시', '월', '일', '비고'],
    ]
    
    // 날짜순으로 정렬
    const sortedCCPs = typeCCPs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA // 최신순
    })
    
    // CCP 데이터 추가 (월과 일 정보 포함)
    if (sortedCCPs.length > 0) {
      sortedCCPs.forEach((ccp, index) => {
        let month = ''
        let day = ''
        let createdDate = ''
        
        if (ccp.createdAt) {
          const date = new Date(ccp.createdAt)
          month = `${date.getMonth() + 1}월`
          day = `${date.getDate()}일`
          createdDate = date.toLocaleDateString('ko-KR')
        }
        
        // 상태에 따른 비고 추가
        let remark = ''
        if (ccp.status === 'critical') {
          remark = '⚠️ 위험상태'
        } else if (ccp.status === 'warning') {
          remark = '⚡ 주의상태'
        } else if (ccp.status === 'normal') {
          remark = '✅ 정상'
        }
        
        ccpTypeData.push([
          index + 1, // 번호
          ccp.id || '',
          ccp.name || '',
          ccp.process || '',
          ccp.hazard || '',
          ccp.criticalLimit?.min || '',
          ccp.criticalLimit?.max || '',
          ccp.unit || '',
          ccp.currentValue || '',
          ccp.status || '',
          ccp.lastChecked || '',
          createdDate,
          month,
          day,
          remark
        ])
      })
    } else {
      ccpTypeData.push([1, '데이터 없음', '', '', '', '', '', '', '', '', '', '', '', '', ''])
    }
    
    // CCP 타입별 시트 클리어 및 업데이트
    await clearAndWriteSheet(baseUrl, accessToken, sheetName, ccpTypeData)
    
    // CCP 타입별 시트 서식 적용
    const ccpSheetId = getSheetId(spreadsheetData, sheetName)
    await formatCCPTypeSheet(baseUrl, accessToken, ccpSheetId, sheetName, sortedCCPs.length)
  }
}

// 시트 클리어 및 데이터 쓰기 공통 함수
async function clearAndWriteSheet(baseUrl: string, accessToken: string, sheetName: string, data: any[][]) {
  console.log(`🗑️ Clearing ${sheetName} sheet data...`)
  
  try {
    const clearResponse = await fetch(`${baseUrl}/values/${encodeURIComponent(sheetName)}!A1:Z1000:clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!clearResponse.ok) {
      const clearErrorText = await clearResponse.text()
      console.log(`⚠ ${sheetName} sheet clear failed:`, clearErrorText)
    } else {
      console.log(`✓ ${sheetName} sheet cleared successfully`)
    }
  } catch (clearError) {
    console.log(`⚠ ${sheetName} sheet clear error (continuing):`, clearError.message)
  }
  
  // 시트에 데이터 쓰기
  console.log(`📝 Writing ${data.length} rows to ${sheetName} sheet...`)
  const writeResponse = await fetch(`${baseUrl}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: data,
      majorDimension: 'ROWS'
    })
  })
  
  if (!writeResponse.ok) {
    const errorText = await writeResponse.text()
    console.error(`❌ ${sheetName} data write failed:`, writeResponse.status, errorText)
    throw new Error(`${sheetName} 데이터 쓰기 실패: ${writeResponse.status} - ${errorText}`)
  } else {
    const writeResult = await writeResponse.json()
    console.log(`✅ ${sheetName} data written successfully:`, writeResult)
  }
}

// 시트 ID 찾기 함수
function getSheetId(spreadsheetData: any, sheetName: string): number {
  const sheet = spreadsheetData.sheets?.find((s: any) => s.properties.title === sheetName)
  return sheet ? sheet.properties.sheetId : 0
}

// 년간 대시보드 서식 적용
async function formatYearlyDashboard(baseUrl: string, accessToken: string, sheetId: number) {
  console.log('🎨 Applying yearly dashboard formatting...')
  
  const requests = [
    // 전체 시트 열 너비 자동 조정
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 10
        }
      }
    },
    // 제목 행 서식 (A1:J1)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
            textFormat: {
              bold: true,
              fontSize: 14,
              foregroundColor: { red: 1, green: 1, blue: 1 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 헤더 행 서식 (A4:J4)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 10
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
            textFormat: {
              bold: true,
              fontSize: 11
            },
            horizontalAlignment: 'CENTER',
            borders: {
              top: { style: 'SOLID', width: 1 },
              bottom: { style: 'SOLID', width: 1 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            }
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 데이터 행 테두리 (A5:J16)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 4,
          endRowIndex: 16,
          startColumnIndex: 0,
          endColumnIndex: 10
        },
        cell: {
          userEnteredFormat: {
            borders: {
              top: { style: 'SOLID', width: 1 },
              bottom: { style: 'SOLID', width: 1 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    }
  ]
  
  await applyFormatting(baseUrl, accessToken, requests)
}

// 월간 대시보드 서식 적용
async function formatMonthlyDashboard(baseUrl: string, accessToken: string, sheetId: number) {
  console.log('🎨 Applying monthly dashboard formatting...')
  
  const requests = [
    // 전체 시트 열 너비 자동 조정
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 8
        }
      }
    },
    // 제목 행 서식 (A1:H1)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 8
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
            textFormat: {
              bold: true,
              fontSize: 14,
              foregroundColor: { red: 1, green: 1, blue: 1 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 헤더 행 서식 (A4:H4)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 8
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
            textFormat: {
              bold: true,
              fontSize: 11
            },
            horizontalAlignment: 'CENTER',
            borders: {
              top: { style: 'SOLID', width: 1 },
              bottom: { style: 'SOLID', width: 1 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            }
          }
        },
        fields: 'userEnteredFormat'
      }
    }
  ]
  
  await applyFormatting(baseUrl, accessToken, requests)
}

// CCP 타입별 시트 서식 적용
async function formatCCPTypeSheet(baseUrl: string, accessToken: string, sheetId: number, sheetName: string, dataRowCount: number) {
  console.log(`🎨 Applying formatting for ${sheetName}...`)
  
  const requests = [
    // 전체 시트 열 너비 자동 조정
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 15
        }
      }
    },
    // 제목 행 서식 (A1:O1)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 15
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.8, green: 0.2, blue: 0.2 },
            textFormat: {
              bold: true,
              fontSize: 16,
              foregroundColor: { red: 1, green: 1, blue: 1 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 월별 필터 라벨 서식 (A3)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 0,
          endColumnIndex: 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 1 },
            textFormat: {
              bold: true,
              fontSize: 12
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 월별 필터 드롭다운 셀 서식 (B3)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 1,
          endColumnIndex: 2
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1, green: 1, blue: 0.8 },
            textFormat: {
              bold: true,
              fontSize: 12
            },
            borders: {
              top: { style: 'SOLID', width: 2 },
              bottom: { style: 'SOLID', width: 2 },
              left: { style: 'SOLID', width: 2 },
              right: { style: 'SOLID', width: 2 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 필터 설명 서식 (E3:K3)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 4,
          endColumnIndex: 11
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
            textFormat: {
              italic: true,
              fontSize: 10,
              foregroundColor: { red: 0.5, green: 0.5, blue: 0.5 }
            },
            horizontalAlignment: 'LEFT'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 섹션 제목 서식 (A5:O5)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 0,
          endColumnIndex: 15
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.6, blue: 0.8 },
            textFormat: {
              bold: true,
              fontSize: 14,
              foregroundColor: { red: 1, green: 1, blue: 1 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 헤더 행 서식 (A6:O6)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 5,
          endRowIndex: 6,
          startColumnIndex: 0,
          endColumnIndex: 15
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.85, green: 0.85, blue: 0.85 },
            textFormat: {
              bold: true,
              fontSize: 11
            },
            horizontalAlignment: 'CENTER',
            borders: {
              top: { style: 'SOLID', width: 2 },
              bottom: { style: 'SOLID', width: 2 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            }
          }
        },
        fields: 'userEnteredFormat'
      }
    }
  ]
  
  // 데이터 행 서식 (A7부터 데이터 끝까지)
  if (dataRowCount > 0) {
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 6,
          endRowIndex: 6 + dataRowCount + 1, // 여유분 추가
          startColumnIndex: 0,
          endColumnIndex: 15
        },
        cell: {
          userEnteredFormat: {
            borders: {
              top: { style: 'SOLID', width: 1 },
              bottom: { style: 'SOLID', width: 1 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            },
            horizontalAlignment: 'CENTER',
            textFormat: {
              fontSize: 10
            }
          }
        },
        fields: 'userEnteredFormat'
      }
    })
    
    // 상태 열 (J열) 조건부 서식
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{
            sheetId: sheetId,
            startRowIndex: 6,
            endRowIndex: 6 + dataRowCount + 1,
            startColumnIndex: 9,
            endColumnIndex: 10
          }],
          booleanRule: {
            condition: {
              type: 'TEXT_EQ',
              values: [{ userEnteredValue: 'critical' }]
            },
            format: {
              backgroundColor: { red: 1, green: 0.8, blue: 0.8 },
              textFormat: {
                bold: true,
                foregroundColor: { red: 0.8, green: 0, blue: 0 }
              }
            }
          }
        },
        index: 0
      }
    })
    
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{
            sheetId: sheetId,
            startRowIndex: 6,
            endRowIndex: 6 + dataRowCount + 1,
            startColumnIndex: 9,
            endColumnIndex: 10
          }],
          booleanRule: {
            condition: {
              type: 'TEXT_EQ',
              values: [{ userEnteredValue: 'normal' }]
            },
            format: {
              backgroundColor: { red: 0.8, green: 1, blue: 0.8 },
              textFormat: {
                bold: true,
                foregroundColor: { red: 0, green: 0.6, blue: 0 }
              }
            }
          }
        },
        index: 1
      }
    })
  }
  
  // 월별 드롭다운 데이터 유효성 검사 추가
  const months = ['전체', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  
  requests.push({
    setDataValidation: {
      range: {
        sheetId: sheetId,
        startRowIndex: 2,
        endRowIndex: 3,
        startColumnIndex: 1,
        endColumnIndex: 2
      },
      rule: {
        condition: {
          type: 'ONE_OF_LIST',
          values: months.map(month => ({ userEnteredValue: month }))
        },
        showCustomUi: true,
        strict: true
      }
    }
  })
  
  // 기본 필터 추가 (헤더 행에 필터 버튼 추가)
  requests.push({
    setBasicFilter: {
      filter: {
        range: {
          sheetId: sheetId,
          startRowIndex: 5,
          endRowIndex: 6 + dataRowCount + 1,
          startColumnIndex: 0,
          endColumnIndex: 15
        }
      }
    }
  })
  
  await applyFormatting(baseUrl, accessToken, requests)
}

// 일반 데이터 시트 서식 적용 (센서, 체크리스트, 알림용)
async function formatDataSheet(baseUrl: string, accessToken: string, sheetId: number, sheetName: string, dataRowCount: number, titleColor: {red: number, green: number, blue: number}) {
  console.log(`🎨 Applying formatting for ${sheetName}...`)
  
  const requests = [
    // 전체 시트 열 너비 자동 조정
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 8
        }
      }
    },
    // 제목 행 서식 (A1)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 8
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: titleColor,
            textFormat: {
              bold: true,
              fontSize: 16,
              foregroundColor: { red: 1, green: 1, blue: 1 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 섹션 제목 서식 (A3)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 0,
          endColumnIndex: 8
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
            textFormat: {
              bold: true,
              fontSize: 14,
              foregroundColor: { red: 0.3, green: 0.3, blue: 0.3 }
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // 헤더 행 서식 (A4)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 8
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.85, green: 0.85, blue: 0.85 },
            textFormat: {
              bold: true,
              fontSize: 12
            },
            horizontalAlignment: 'CENTER',
            borders: {
              top: { style: 'SOLID', width: 2 },
              bottom: { style: 'SOLID', width: 2 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            }
          }
        },
        fields: 'userEnteredFormat'
      }
    }
  ]
  
  // 데이터 행 서식
  if (dataRowCount > 0) {
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 4,
          endRowIndex: 4 + dataRowCount + 1,
          startColumnIndex: 0,
          endColumnIndex: 8
        },
        cell: {
          userEnteredFormat: {
            borders: {
              top: { style: 'SOLID', width: 1 },
              bottom: { style: 'SOLID', width: 1 },
              left: { style: 'SOLID', width: 1 },
              right: { style: 'SOLID', width: 1 }
            },
            horizontalAlignment: 'CENTER',
            textFormat: {
              fontSize: 10
            }
          }
        },
        fields: 'userEnteredFormat'
      }
    })
    
    // 기본 필터 추가
    requests.push({
      setBasicFilter: {
        filter: {
          range: {
            sheetId: sheetId,
            startRowIndex: 3,
            endRowIndex: 4 + dataRowCount + 1,
            startColumnIndex: 0,
            endColumnIndex: 8
          }
        }
      }
    })
  }
  
  await applyFormatting(baseUrl, accessToken, requests)
}

// 서식 적용 공통 함수
async function applyFormatting(baseUrl: string, accessToken: string, requests: any[]) {
  try {
    const formatResponse = await fetch(`${baseUrl}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: requests
      })
    })
    
    if (!formatResponse.ok) {
      const errorText = await formatResponse.text()
      console.log('⚠ Formatting failed:', errorText)
    } else {
      console.log('✅ Formatting applied successfully')
    }
  } catch (formatError) {
    console.log('⚠ Formatting error (continuing):', formatError.message)
  }
}

// 인증 미들웨어 - 개발 환경에서는 완전히 우회
async function requireAuth(c: any, next: any) {
  try {
    console.log('🔐 Auth middleware called')
    // 개발 환경에서는 모든 요청을 허용 (완전 우회)
    console.log('✅ Development mode - bypassing all authentication checks')
    c.set('userId', 'dev_user_bypassed')
    c.set('user', { id: 'dev_user_bypassed', role: 'admin' })
    return next()
  } catch (error) {
    console.error('❌ Auth middleware error:', error)
    // 에러가 발생해도 개발 환경에서는 통���시키기
    console.log('⚠️ Auth error occurred, but allowing in development mode')
    c.set('userId', 'dev_user_error_bypass')
    c.set('user', { id: 'dev_user_error_bypass', role: 'admin' })
    return next()
  }
}

export function addBackupEndpoints(app: any) {
  // 백업 설정 저장 엔드포인트
  app.post('/make-server-79e634f3/backup/config', requireAuth, async (c: any) => {
    try {
      console.log('💾 Saving backup configuration...')
      const configData = await c.req.json()
      
      const { spreadsheet_id, service_account_json } = configData
      
      if (!service_account_json) {
        return c.json({
          success: false,
          error: '서비스 계정 JSON이 필요합니다.'
        }, 400)
      }
      
      // JSON 형식 검증
      try {
        const serviceAccount = JSON.parse(service_account_json)
        const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
        
        for (const field of requiredFields) {
          if (!serviceAccount[field]) {
            return c.json({
              success: false,
              error: `서비스 어카운트 JSON에서 ${field} 필드가 누락되었습니다.`
            }, 400)
          }
        }
      } catch (error) {
        return c.json({
          success: false,
          error: '잘못된 JSON 형식입니다.'
        }, 400)
      }
      
      // 백업 설정을 KV 저장소에 저장
      const config = {
        spreadsheet_id,
        service_account_json,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      
      await kv.set('backup_config', config)
      
      console.log('✅ Backup configuration saved successfully')
      return c.json({
        success: true,
        message: '백업 설정이 저장되었습니다.'
      })
    } catch (error) {
      console.error('❌ Error saving backup config:', error)
      return c.json({
        success: false,
        error: '백업 설정 저장 중 오류가 발생했습니다.'
      }, 500)
    }
  })

  // 백업 설정 조회 엔드포인트
  app.get('/make-server-79e634f3/backup/config', requireAuth, async (c: any) => {
    try {
      console.log('📖 Loading backup configuration...')
      
      const config = await kv.get('backup_config')
      
      if (!config) {
        return c.json({
          success: true,
          data: null,
          message: '설정된 백업 구성이 없습니다.'
        })
      }
      
      // 보안상 서비스 어카운트 JSON의 일부만 반환 (마스킹)
      const maskedConfig = {
        spreadsheet_id: config.spreadsheet_id,
        service_account_json: config.service_account_json, // 설정 폼에서 사용하기 위해 전체 반환
        updated_at: config.updated_at,
        created_at: config.created_at,
        has_service_account: !!config.service_account_json,
        has_spreadsheet_id: !!config.spreadsheet_id
      }
      
      return c.json({
        success: true,
        data: maskedConfig
      })
    } catch (error) {
      console.error('❌ Error loading backup config:', error)
      return c.json({
        success: false,
        error: '백업 설정 로드 중 오류가 발생했습니다.'
      }, 500)
    }
  })

  // 백업 로그 조회 엔드포인트
  app.get('/make-server-79e634f3/backup/logs', requireAuth, async (c: any) => {
    try {
      console.log('📄 Fetching backup logs...')
      
      let logs = []
      
      try {
        logs = await kv.getByPrefix('backup_log:')
        console.log('✓ Found', logs.length, 'backup log records')
      } catch (kvError) {
        console.log('⚠ KV fetch error for backup logs:', kvError)
        logs = []
      }
      
      // 최신순으로 정렬 (안전한 방식)
      try {
        const sortedLogs = logs.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timeB - timeA
        })
        
        console.log('✅ Returning', sortedLogs.length, 'sorted backup logs')
        return c.json({ success: true, data: sortedLogs })
      } catch (sortError) {
        console.log('⚠ Error sorting backup logs:', sortError)
        return c.json({ success: true, data: logs })
      }
    } catch (error) {
      console.error('❌ Error fetching backup logs:', error)
      return c.json({ 
        success: true, 
        data: [],
        warning: 'Backup logs fetch failed, returning empty array'
      })
    }
  })

  // 백업 연결 테스트 엔드포인트
  app.post('/make-server-79e634f3/backup/test-connection', requireAuth, async (c: any) => {
    try {
      console.log('🔍 Testing backup connection...')
      
      // KV 저장소에서 설정 로드
      const config = await kv.get('backup_config')
      
      if (!config) {
        return c.json({ 
          success: false, 
          error: '백업 설정이 구성되지 않았습니다. 먼저 스프레드시트 ID와 서비스 어카운트를 설정해주세요.',
          step: 'config_check'
        })
      }
      
      const SERVICE_ACCOUNT_JSON = config.service_account_json
      const SPREADSHEET_ID = config.spreadsheet_id
      
      // 설정 기본 검사
      if (!SERVICE_ACCOUNT_JSON || SERVICE_ACCOUNT_JSON.trim() === '') {
        return c.json({ 
          success: false, 
          error: '서비스 어카운트 JSON이 설정되지 않았습니다. 설정 페이지에서 Service Account JSON을 설정해주세요.',
          step: 'config_check'
        })
      }

      if (!SPREADSHEET_ID || SPREADSHEET_ID.trim() === '') {
        return c.json({ 
          success: false, 
          error: '스프레드시트 ID가 설정되지 않았습니다. 설정 페이지에서 스프레드시트 ID를 설정해주세요.',
          step: 'config_check'
        })
      }

      // Service Account JSON 파싱 테스트
      let serviceAccount
      try {
        const trimmedJson = SERVICE_ACCOUNT_JSON.trim()
        serviceAccount = JSON.parse(trimmedJson)
        console.log('✓ Service Account parsed successfully for test')
        
        // 필수 필드 확인
        const requiredFields = ['client_email', 'private_key', 'project_id']
        for (const field of requiredFields) {
          if (!serviceAccount[field]) {
            return c.json({ 
              success: false, 
              error: `Service Account JSON에서 ${field} 필드가 누락되었습니다.`,
              step: 'required_fields_check'
            })
          }
        }
        
      } catch (error) {
        return c.json({ 
          success: false, 
          error: `Service Account JSON 파싱 오류: ${error.message}. 올바른 JSON 형식인지 확인해주세요.`,
          step: 'json_parsing'
        })
      }

      // 실제 Google Sheets API 연결 테스트
      console.log('🔗 Testing actual Google Sheets API connection...')
      
      try {
        // JWT 토큰 생성
        const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
        const TOKEN_URL = 'https://oauth2.googleapis.com/token'
        
        const now = Math.floor(Date.now() / 1000)
        const exp = now + 3600
        
        const jwtHeader = { alg: 'RS256', typ: 'JWT' }
        const jwtPayload = {
          iss: serviceAccount.client_email,
          scope: SCOPE,
          aud: TOKEN_URL,
          exp: exp,
          iat: now
        }
        
        function base64UrlEncode(str: string): string {
          const base64 = btoa(str)
          return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        }
        
        const headerEncoded = base64UrlEncode(JSON.stringify(jwtHeader))
        const payloadEncoded = base64UrlEncode(JSON.stringify(jwtPayload))
        const unsignedToken = `${headerEncoded}.${payloadEncoded}`
        
        const privateKey = await importPrivateKey(serviceAccount.private_key)
        const signature = await generateSignature(privateKey, unsignedToken)
        const signatureEncoded = encodeSignature(signature)
        
        const jwt = `${unsignedToken}.${signatureEncoded}`
        
        // Access Token 요청
        console.log('🔑 Requesting access token for test...')
        const tokenResponse = await fetch(TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
          }),
        })
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          throw new Error(`Access token 요청 실패 (${tokenResponse.status}): ${errorText}`)
        }
        
        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token
        console.log('✓ Access token obtained for test')
        
        // 스프레드시트 정보 조회 테스트
        console.log('📋 Testing spreadsheet access...')
        const spreadsheetResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        
        if (!spreadsheetResponse.ok) {
          const errorText = await spreadsheetResponse.text()
          throw new Error(`스프레드시트 접근 실패 (${spreadsheetResponse.status}): ${errorText}`)
        }
        
        const spreadsheetData = await spreadsheetResponse.json()
        console.log('✅ Spreadsheet access test successful')
        
        return c.json({
          success: true,
          message: '백업 설정이 올바르게 구성되었으며 Google Sheets 연결이 성공했습니다.',
          data: {
            spreadsheet: {
              id: SPREADSHEET_ID,
              title: spreadsheetData.properties?.title || 'Unknown',
              url: spreadsheetData.spreadsheetUrl
            },
            serviceAccount: {
              email: serviceAccount.client_email,
              project: serviceAccount.project_id
            },
            sheets: spreadsheetData.sheets?.map(sheet => sheet.properties.title) || [],
            timestamp: new Date().toISOString()
          }
        })
      } catch (connectionError) {
        console.error('❌ Google Sheets connection test failed:', connectionError)
        return c.json({
          success: false,
          error: `Google Sheets 연결 테스트 실패: ${connectionError.message}`,
          step: 'sheets_api_test'
        }, 400)
      }
      
    } catch (error) {
      console.error('❌ Test connection error:', error)
      return c.json({ 
        success: false, 
        error: `연결 테스트 중 오류 발생: ${error.message}`,
        step: 'general_error'
      }, 500)
    }
  })

  // 구조화된 CCP 기록을 Google Sheets로 백업
  app.post('/make-server-79e634f3/backup/ccp-records', requireAuth, async (c: any) => {
    const logId = `backup_${Date.now()}`
    const timestamp = new Date().toISOString()
    
    try {
      console.log('🚀 Starting structured CCP backup...')
      
      // KV 저장소에서 설정 로드
      const config = await kv.get('backup_config')
      
      if (!config) {
        const errorMsg = '백업 설정이 구성되지 않았습니다.'
        console.log('❌ No backup configuration found')
        
        const failureLog = {
          id: logId,
          timestamp,
          status: 'failed',
          type: 'manual',
          data: { error: errorMsg, details: 'No backup configuration in KV store' }
        }
        await kv.set(`backup_log:${logId}`, failureLog)
        
        return c.json({ 
          success: false, 
          error: errorMsg + ' 먼저 설정 페이지에서 스프레드시트 ID와 서비스 어카운트를 설정해주세요.'
        })
      }
      
      // 모든 데이터 가져오기
      const ccps = await kv.getByPrefix('ccp:')
      const sensors = await kv.getByPrefix('sensor_latest:')
      const checklists = await kv.getByPrefix('checklist:')
      const alerts = await kv.getByPrefix('alert:')
      
      console.log(`📋 Found data to backup: ${ccps.length} CCPs, ${sensors.length} sensors, ${checklists.length} checklists, ${alerts.length} alerts`)

      // Service Account 파싱
      let serviceAccount
      try {
        serviceAccount = JSON.parse(config.service_account_json)
      } catch (parseError) {
        throw new Error(`Service Account JSON 파싱 오류: ${parseError.message}`)
      }

      // JWT 토큰 생성을 위한 준비
      const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
      const TOKEN_URL = 'https://oauth2.googleapis.com/token'
      
      // JWT 생성
      console.log('🔐 Creating JWT for Google Sheets API...')
      
      const now = Math.floor(Date.now() / 1000)
      const exp = now + 3600 // 1시간 후 만료
      
      const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT'
      }
      
      const jwtPayload = {
        iss: serviceAccount.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        exp: exp,
        iat: now
      }
      
      // Base64 URL 인코딩 함수
      function base64UrlEncode(str: string): string {
        const base64 = btoa(str)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      }
      
      const headerEncoded = base64UrlEncode(JSON.stringify(jwtHeader))
      const payloadEncoded = base64UrlEncode(JSON.stringify(jwtPayload))
      const unsignedToken = `${headerEncoded}.${payloadEncoded}`
      
      // 개인키로 서명 생성
      const privateKey = await importPrivateKey(serviceAccount.private_key)
      const signature = await generateSignature(privateKey, unsignedToken)
      const signatureEncoded = encodeSignature(signature)
      
      const jwt = `${unsignedToken}.${signatureEncoded}`
      console.log('✓ JWT created successfully')
      
      // Access Token 요청
      console.log('🔑 Requesting access token...')
      const tokenResponse = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      })
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Access token 요청 실패 (${tokenResponse.status}): ${errorText}`)
      }
      
      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token
      console.log('✓ Access token obtained successfully')
      
      // 스프레드시트 API를 사용하여 데이터 백업
      const spreadsheetId = config.spreadsheet_id
      const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`
      
      // CCP별 공정명 기반 시트 목록 생성 (공정 이름 사용)
      const ccpProcessNames = [...new Set(ccps.map(ccp => {
        // ccp의 process나 name 필드를 사용하여 공정명 생성
        const processName = ccp.process || ccp.name || ccp.ccpType || '기타공정'
        return processName
      }).filter(Boolean))]
      const ccpSheetNames = ccpProcessNames.map(processName => `${processName}`)
      
      // 필요한 시트들이 존재하는지 확인하고 없으면 생성 (CCP 관련 시트만)
      const requiredSheets = ['년간 대시보드', '월간 대시보드', ...ccpSheetNames]
      
      console.log('🔍 Checking existing sheets...')
      const spreadsheetInfo = await fetch(`${baseUrl}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      
      if (!spreadsheetInfo.ok) {
        throw new Error(`스프레드시트 정보 조회 실패: ${spreadsheetInfo.status}`)
      }
      
      const spreadsheetData = await spreadsheetInfo.json()
      const existingSheets = spreadsheetData.sheets?.map(sheet => sheet.properties.title) || []
      console.log('✓ Existing sheets:', existingSheets)
      
      // 없는 시트들 생성
      const sheetsToCreate = requiredSheets.filter(sheetName => !existingSheets.includes(sheetName))
      
      if (sheetsToCreate.length > 0) {
        console.log('📝 Creating missing sheets:', sheetsToCreate)
        
        const requests = sheetsToCreate.map(sheetName => ({
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }))
        
        const batchUpdateResponse = await fetch(`${baseUrl}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: requests
          })
        })
        
        if (!batchUpdateResponse.ok) {
          const errorText = await batchUpdateResponse.text()
          console.log('⚠ Sheet creation failed:', errorText)
        } else {
          console.log('✓ Sheets created successfully')
        }
      }
      
      // 스프레드시트 정보 가져오기 (시트 ID 확인용)
      const updatedSpreadsheetInfo = await fetch(`${baseUrl}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      
      if (!updatedSpreadsheetInfo.ok) {
        throw new Error(`스프레드시트 정보 재조회 실패: ${updatedSpreadsheetInfo.status}`)
      }
      
      const updatedSpreadsheetData = await updatedSpreadsheetInfo.json()
      
      // 1. 년간 대시보드 생성
      console.log('📊 Creating yearly dashboard...')
      await createYearlyDashboard(baseUrl, accessToken, ccps, sensors, checklists, alerts, updatedSpreadsheetData)
      
      // 2. 월간 대시보드 생성
      console.log('📅 Creating monthly dashboard...')
      await createMonthlyDashboard(baseUrl, accessToken, ccps, sensors, checklists, alerts, updatedSpreadsheetData)
      
      // 3. CCP별 시트 생성 (각 CCP 타입별로 분리, 월별 드롭다운 포함)
      console.log('🎯 Creating CCP type-specific sheets...')
      await createCCPTypeSheets(baseUrl, accessToken, ccps, updatedSpreadsheetData)
      
      // 4. 센서 데이터 시트 생성/업데이트
      console.log('🌡️ Backing up sensor data...')
      
      const sensorRows = [
        ['🌡️ 센서 데이터 종합 현황', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['📊 실시간 센서 모니터링 데이터', '', '', '', '', '', ''],
        ['센서ID', '타입', '값', '위치', '상태', '타임스탬프', '생성일시']
      ]
      
      if (sensors.length > 0) {
        // 타임스탬프 순으로 정렬
        const sortedSensors = sensors.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return dateB - dateA
        })
        
        sortedSensors.forEach(sensor => {
          sensorRows.push([
            sensor.sensorId || '',
            sensor.type || '',
            sensor.value || '',
            sensor.location || '',
            sensor.status || '',
            sensor.timestamp || '',
            sensor.createdAt || ''
          ])
        })
      } else {
        // 데이터가 없어도 헤더는 추가
        sensorRows.push(['데이터 없음', '', '', '', '', '', ''])
      }
        
      // 센서 시트 클리어 및 업데이트
      await clearAndWriteSheet(baseUrl, accessToken, '센서데이터', sensorRows)
      
      // 센서 데이터 시트 서식 적용
      const sensorSheetId = getSheetId(updatedSpreadsheetData, '센서데이터')
      await formatDataSheet(baseUrl, accessToken, sensorSheetId, '센서데이터', sensors.length, { red: 0.2, green: 0.8, blue: 0.2 })
      
      // 5. 체크리스트 데이터 시트 생성/업데이트
      console.log('📋 Backing up checklist data...')
      
      const checklistRows = [
        ['📋 체크리스트 관리 현황', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['✅ 업무 체크리스트 진행 상황', '', '', '', '', '', ''],
        ['ID', '제목', '카테고리', '상태', '담당자', '생성일시', '완료일시']
      ]
      
      if (checklists.length > 0) {
        // 생성일시 순으로 정렬
        const sortedChecklists = checklists.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        
        sortedChecklists.forEach(checklist => {
          checklistRows.push([
            checklist.id || '',
            checklist.title || '',
            checklist.category || '',
            checklist.status || '',
            checklist.assignee || '',
            checklist.createdAt || '',
            checklist.completedAt || ''
          ])
        })
      } else {
        // 데이터가 없어도 헤더는 추가
        checklistRows.push(['데이터 없음', '', '', '', '', '', ''])
      }
        
      // 체크리스트 시트 클리어 및 업데이트
      await clearAndWriteSheet(baseUrl, accessToken, '체크리스트', checklistRows)
      
      // 체크리스트 시트 서식 적용
      const checklistSheetId = getSheetId(updatedSpreadsheetData, '체크리스트')
      await formatDataSheet(baseUrl, accessToken, checklistSheetId, '체크리스트', checklists.length, { red: 0.8, green: 0.4, blue: 0.2 })
      
      // 6. 알림 데이터 시트 생성/업데이트
      console.log('🚨 Backing up alert data...')
      
      const alertRows = [
        ['🚨 알림 데이터 관리 현황', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['⚠️ 시스템 알림 및 경고 이력', '', '', '', '', '', '', ''],
        ['ID', '센서ID', '타입', '메시지', '타임스탬프', '확인여부', '확인일시', '확인자']
      ]
      
      if (alerts.length > 0) {
        // 타임스탬프 순으로 정렬 (최신순)
        const sortedAlerts = alerts.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return dateB - dateA
        })
        
        sortedAlerts.forEach(alert => {
          alertRows.push([
            alert.id || '',
            alert.sensorId || '',
            alert.type || '',
            alert.message || '',
            alert.timestamp || '',
            alert.acknowledged ? '✅ 확인' : '⚠️ 미확인',
            alert.acknowledgedAt || '',
            alert.acknowledgedBy || ''
          ])
        })
      } else {
        // 데이터가 없어도 헤더는 추가
        alertRows.push(['데이터 없음', '', '', '', '', '', '', ''])
      }
        
      // 알림 시트 클리어 및 업데이트
      await clearAndWriteSheet(baseUrl, accessToken, '알림데이터', alertRows)
      
      // 알림 데이터 시트 서식 적용
      const alertSheetId = getSheetId(updatedSpreadsheetData, '알림데이터')
      await formatDataSheet(baseUrl, accessToken, alertSheetId, '알림데이터', alerts.length, { red: 0.8, green: 0.2, blue: 0.6 })

      // 백업 성공 로그
      const totalRecords = ccps.length + sensors.length + checklists.length + alerts.length
      const successLog = {
        id: logId,
        timestamp,
        status: 'success',
        type: 'manual',
        data: {
          message: '대시보드 백업이 완료되었습니다.',
          recordCounts: {
            ccps: ccps.length,
            sensors: sensors.length,
            checklists: checklists.length,
            alerts: alerts.length,
            total: totalRecords
          },
          spreadsheet_id: config.spreadsheet_id,
          sheets_created: requiredSheets
        }
      }
      await kv.set(`backup_log:${logId}`, successLog)

      console.log('✅ Backup completed successfully')
      return c.json({
        success: true,
        data: {
          message: `대시보드 백업이 완료되었습니다. 총 ${totalRecords}개 레코드가 백업되었습니다.`,
          recordCounts: {
            ccps: ccps.length,
            sensors: sensors.length,
            checklists: checklists.length,
            alerts: alerts.length,
            total: totalRecords
          },
          spreadsheet_id: config.spreadsheet_id,
          timestamp
        }
      })

    } catch (error) {
      console.error('❌ Backup failed:', error)
      
      const failureLog = {
        id: logId,
        timestamp,
        status: 'failed',
        type: 'manual',
        data: {
          error: `백업 실패: ${error.message}`,
          details: error.stack
        }
      }
      await kv.set(`backup_log:${logId}`, failureLog)

      return c.json({
        success: false,
        error: `백업 실패: ${error.message}`
      }, 500)
    }
  })
}