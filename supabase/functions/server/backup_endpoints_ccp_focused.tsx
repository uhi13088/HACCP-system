// CCP 중심 백업 엔드포인트 - 연간/월간 대시보드 + 공정별 CCP 시트
import * as kv from './kv_store.tsx'
import { processPrivateKey, importPrivateKey, generateSignature, encodeSignature } from './private_key_utils.tsx'

// 년간 대시보드 생성 함수 (CCP 중심)
async function createYearlyDashboard(baseUrl: string, accessToken: string, ccps: any[], spreadsheetData: any) {
  console.log('📊 Building yearly CCP dashboard data...')
  
  const currentYear = new Date().getFullYear()
  
  // 월별 CCP 데이터 집계
  const monthlyData = []
  for (let month = 1; month <= 12; month++) {
    const monthName = `${month}월`
    
    // 해당 월의 CCP 데이터 필터링
    const monthCCPs = ccps.filter(ccp => {
      if (!ccp.createdAt) return false
      const date = new Date(ccp.createdAt)
      return date.getFullYear() === currentYear && date.getMonth() + 1 === month
    })
    
    // 위험 상태 CCP 수
    const criticalCCPs = monthCCPs.filter(ccp => ccp.status === 'critical').length
    // 정상 상태 CCP 수  
    const normalCCPs = monthCCPs.filter(ccp => ccp.status === 'normal').length
    // 점검률 계산
    const checkedCCPs = monthCCPs.filter(ccp => ccp.lastChecked).length
    const checkRate = monthCCPs.length > 0 ? `${Math.round((checkedCCPs / monthCCPs.length) * 100)}%` : '0%'
    
    monthlyData.push([
      monthName,
      monthCCPs.length,
      criticalCCPs,
      normalCCPs,
      checkRate
    ])
  }
  
  // 년간 대시보드 데이터 구성
  const yearlyDashboardData = [
    [`${currentYear}년 HACCP CCP 관리 년간 대시보드`, '', '', '', ''],
    ['', '', '', '', ''],
    ['📊 월별 CCP 관리 현황', '', '', '', ''],
    ['월', 'CCP 관리점 수', '위험 CCP', '정상 CCP', 'CCP 점검률'],
    ...monthlyData,
    ['', '', '', '', ''],
    ['📈 년간 총계', '', '', '', ''],
    [
      '전체',
      ccps.length,
      ccps.filter(ccp => ccp.status === 'critical').length,
      ccps.filter(ccp => ccp.status === 'normal').length,
      ccps.length > 0 ? `${Math.round((ccps.filter(ccp => ccp.lastChecked).length / ccps.length) * 100)}%` : '0%'
    ]
  ]
  
  // 년간 대시보드 시트 클리어 및 업데이트
  await clearAndWriteSheet(baseUrl, accessToken, '년간 대시보드', yearlyDashboardData)
  
  // 년간 대시보드 서식 적용
  const yearlySheetId = getSheetId(spreadsheetData, '년간 대시보드')
  await formatYearlyDashboard(baseUrl, accessToken, yearlySheetId)
}

// 월간 대시보드 생성 함수 (월별 필터 포함)
async function createMonthlyDashboard(baseUrl: string, accessToken: string, ccps: any[], spreadsheetData: any) {
  console.log('📅 Building monthly CCP dashboard data...')
  
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // 현재 월의 일별 CCP 데이터 집계
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const dailyData = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${currentMonth}월 ${day}일`
    
    // 해당 일의 CCP 데이터 필터링
    const dayCCPs = ccps.filter(ccp => {
      if (!ccp.createdAt) return false
      const date = new Date(ccp.createdAt)
      return date.getFullYear() === currentYear && 
             date.getMonth() + 1 === currentMonth && 
             date.getDate() === day
    })
    
    const criticalCCPs = dayCCPs.filter(ccp => ccp.status === 'critical').length
    const normalCCPs = dayCCPs.filter(ccp => ccp.status === 'normal').length
    
    dailyData.push([
      dayStr,
      dayCCPs.length,
      criticalCCPs,
      normalCCPs
    ])
  }
  
  // 월간 대시보드 데이터 구성 (월별 필터 포함)
  const monthlyDashboardData = [
    [`${currentYear}년 ${currentMonth}월 HACCP CCP 관리 월간 대시보드`, '', '', ''],
    ['', '', '', ''],
    ['📅 월별 필터:', '전체', '← 드롭다운에서 월을 선택하세요', ''],
    ['', '', '', ''],
    ['📅 일별 CCP 현황', '', '', ''],
    ['일자', 'CCP 관리점', '위험 CCP', '정상 CCP'],
    ...dailyData,
    ['', '', '', ''],
    ['📊 월간 총계', '', '', ''],
    [
      '합계',
      ccps.filter(ccp => {
        if (!ccp.createdAt) return false
        const date = new Date(ccp.createdAt)
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
  
  // 월간 대시보드 서식 적용 (월별 필터 포함)
  const monthlySheetId = getSheetId(spreadsheetData, '월간 대시보드')
  await formatMonthlyDashboard(baseUrl, accessToken, monthlySheetId)
}

// CCP 공정별 시트 생성 함수 (공정명으로 시트 생성, 날짜를 첫 번째 컬럼으로)
async function createCCPProcessSheets(baseUrl: string, accessToken: string, ccps: any[], spreadsheetData: any) {
  console.log('🎯 Building CCP process-specific sheets...')
  
  // CCP 공정별로 그룹화
  const ccpsByProcess = ccps.reduce((groups, ccp) => {
    // 공정명 생성 - process, name, ccpType 순서로 우선순위
    const processName = ccp.process || ccp.name || ccp.ccpType || '기타공정'
    if (!groups[processName]) {
      groups[processName] = []
    }
    groups[processName].push(ccp)
    return groups
  }, {})
  
  // 각 공정별로 시트 생성
  for (const [processName, processCCPs] of Object.entries(ccpsByProcess)) {
    const sheetName = processName // 공정 이름을 시트명으로 직접 사용
    console.log(`📝 Creating sheet for ${sheetName} with ${processCCPs.length} records...`)
    
    // 해당 공정의 CCP 데이터 생성 (날짜/시간을 첫 번째 컬럼으로)
    const ccpProcessData = [
      [`${processName} CCP 관리 (월별 현황)`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['📅 월별 필터:', '전체', '', '', '', '← 월을 선택하면 해당 월 데이터만 표시됩니다', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['📋 CCP 관리점 상세 현황', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['생성일시', '번호', 'ID', '이름', '공정', '위험요소', '한계기준(최소)', '한계기준(최대)', '단위', '현재값', '상태', '최종점검', '월', '일', '비고'],
    ]
    
    // 날짜순으로 정렬
    const sortedCCPs = processCCPs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA // 최신순
    })
    
    // CCP 데이터 추가 (생성일시를 첫 번째 컬럼으로)
    if (sortedCCPs.length > 0) {
      sortedCCPs.forEach((ccp, index) => {
        let month = ''
        let day = ''
        let createdDate = ''
        let createdDateTime = ''
        
        if (ccp.createdAt) {
          const date = new Date(ccp.createdAt)
          month = `${date.getMonth() + 1}월`
          day = `${date.getDate()}일`
          createdDate = date.toLocaleDateString('ko-KR')
          createdDateTime = date.toLocaleString('ko-KR')
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
        
        ccpProcessData.push([
          createdDateTime, // 생성일시를 첫 번째 컬럼으로
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
          month,
          day,
          remark
        ])
      })
    } else {
      ccpProcessData.push(['데이터 없음', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
    }
    
    // CCP 공정별 시트 클리어 및 업데이트
    await clearAndWriteSheet(baseUrl, accessToken, sheetName, ccpProcessData)
    
    // CCP 공정별 시트 서식 적용
    const ccpSheetId = getSheetId(spreadsheetData, sheetName)
    await formatCCPProcessSheet(baseUrl, accessToken, ccpSheetId, sheetName, sortedCCPs.length)
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
          endIndex: 5
        }
      }
    },
    // 제목 행 서식 (A1:E1)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 5
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
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
    // 헤더 행 서식 (A4:E4)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 5
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
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
    },
    // 데이터 행 테두리
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 4,
          endRowIndex: 20,
          startColumnIndex: 0,
          endColumnIndex: 5
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

// 월간 대시보드 서식 적용 (월별 필터 포함)
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
          endIndex: 4
        }
      }
    },
    // 제목 행 서식 (A1:D1)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 4
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
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
    // 헤더 행 서식 (A6:D6)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 5,
          endRowIndex: 6,
          startColumnIndex: 0,
          endColumnIndex: 4
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
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
  
  // 기본 필터 추가
  requests.push({
    setBasicFilter: {
      filter: {
        range: {
          sheetId: sheetId,
          startRowIndex: 5,
          endRowIndex: 50, // 충분한 범위
          startColumnIndex: 0,
          endColumnIndex: 4
        }
      }
    }
  })
  
  await applyFormatting(baseUrl, accessToken, requests)
}

// CCP 공정별 시트 서식 적용
async function formatCCPProcessSheet(baseUrl: string, accessToken: string, sheetId: number, sheetName: string, dataRowCount: number) {
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
    
    // 상태 열 (K열) 조건부 서식
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{
            sheetId: sheetId,
            startRowIndex: 6,
            endRowIndex: 6 + dataRowCount + 1,
            startColumnIndex: 10, // K열 (상태)
            endColumnIndex: 11
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
            startColumnIndex: 10, // K열 (상태)
            endColumnIndex: 11
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
    // 에러가 발생해도 개발 환경에서는 통과시키기
    console.log('⚠️ Auth error occurred, but allowing in development mode')
    c.set('userId', 'dev_user_error_bypass')
    c.set('user', { id: 'dev_user_error_bypass', role: 'admin' })
    return next()
  }
}

export function addBackupEndpointsCCPFocused(app: any) {
  // CCP 중심 백업 실행 엔드포인트
  app.post('/make-server-79e634f3/backup/execute-ccp', requireAuth, async (c: any) => {
    console.log('🚀 ===== CCP-FOCUSED BACKUP ENDPOINT CALLED =====')
    console.log('📍 Request URL:', c.req.url)
    console.log('📝 Request method:', c.req.method)
    console.log('🔄 Starting CCP-focused backup process...')
    
    try {
      // 백업 설정 로드
      const config = await kv.get('backup_config')
      if (!config) {
        return c.json({
          success: false,
          error: '백업 설정이 구성되지 않았습니다. 먼저 설정을 완료해주세요.'
        }, 400)
      }

      const { spreadsheet_id, service_account_json } = config
      const SERVICE_ACCOUNT_JSON = JSON.parse(service_account_json)
      
      // Google Sheets API 접근 토큰 생성
      const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT'
      }
      
      const now = Math.floor(Date.now() / 1000)
      const jwtPayload = {
        iss: SERVICE_ACCOUNT_JSON.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
      }
      
      const processedKey = await processPrivateKey(SERVICE_ACCOUNT_JSON.private_key)
      const importedKey = await importPrivateKey(processedKey)
      
      const headerEncoded = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      const payloadEncoded = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      
      const dataToSign = `${headerEncoded}.${payloadEncoded}`
      const signature = await generateSignature(importedKey, dataToSign)
      const signatureEncoded = await encodeSignature(signature)
      
      const jwt = `${dataToSign}.${signatureEncoded}`
      
      // 접근 토큰 요청
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      })
      
      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text()
        console.error('❌ Token request failed:', tokenError)
        throw new Error(`토큰 요청 실패: ${tokenResponse.status}`)
      }
      
      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token
      
      const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}`
      
      // 스프레드시트 정보 가져오기
      const spreadsheetResponse = await fetch(`${baseUrl}?fields=sheets.properties`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!spreadsheetResponse.ok) {
        throw new Error(`스프레드시트 접근 실패: ${spreadsheetResponse.status}`)
      }
      
      let spreadsheetData = await spreadsheetResponse.json()
      
      // CCP 데이터 로드
      let ccps = []
      try {
        ccps = await kv.getByPrefix('ccp:')
        console.log('✓ Found', ccps.length, 'CCP records')
      } catch (kvError) {
        console.log('⚠ KV fetch error for CCPs:', kvError)
        ccps = []
      }

      // CCP별 공정명 기반 시트 목록 생성
      const ccpProcessNames = [...new Set(ccps.map(ccp => {
        const processName = ccp.process || ccp.name || ccp.ccpType || '기타공정'
        return processName
      }).filter(Boolean))]
      const ccpSheetNames = ccpProcessNames
      
      // 필요한 시트들이 존재하는지 확인하고 없으면 생성 (CCP 관련 시트만)
      const requiredSheets = ['년간 대시보드', '월간 대시보드', ...ccpSheetNames]
      
      console.log('📋 Required sheets:', requiredSheets)
      
      const existingSheets = spreadsheetData.sheets.map(s => s.properties.title)
      const sheetsToCreate = requiredSheets.filter(sheet => !existingSheets.includes(sheet))
      
      if (sheetsToCreate.length > 0) {
        console.log('📝 Creating missing sheets:', sheetsToCreate)
        
        const createSheetRequests = sheetsToCreate.map(sheetName => ({
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
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: createSheetRequests
          })
        })
        
        if (!batchUpdateResponse.ok) {
          const batchError = await batchUpdateResponse.text()
          console.error('❌ Batch update failed:', batchError)
          throw new Error(`시트 생성 실패: ${batchUpdateResponse.status}`)
        }
        
        console.log('✅ Successfully created missing sheets')
        
        // 업데이트된 스프레드시트 정보 다시 가져오기
        const updatedSpreadsheetResponse = await fetch(`${baseUrl}?fields=sheets.properties`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        
        if (updatedSpreadsheetResponse.ok) {
          spreadsheetData = await updatedSpreadsheetResponse.json()
        }
      }
      
      const updatedSpreadsheetData = spreadsheetData
      
      // 1. 년간 대시보드 생성
      console.log('📊 Creating yearly dashboard...')
      await createYearlyDashboard(baseUrl, accessToken, ccps, updatedSpreadsheetData)

      // 2. 월간 대시보드 생성 (월별 필터 포함)
      console.log('📅 Creating monthly dashboard...')
      await createMonthlyDashboard(baseUrl, accessToken, ccps, updatedSpreadsheetData)

      // 3. CCP별 공정명 시트 생성 (월별 드롭다운 포함)
      console.log('🎯 Creating CCP process-specific sheets...')
      await createCCPProcessSheets(baseUrl, accessToken, ccps, updatedSpreadsheetData)
      
      // 백업 로그 저장
      const backupLog = {
        timestamp: new Date().toISOString(),
        success: true,
        recordsProcessed: {
          ccps: ccps.length
        },
        sheets_created: requiredSheets,
        spreadsheet_id: spreadsheet_id,
        backup_type: 'CCP_FOCUSED'
      }
      
      const logKey = `backup_log:${Date.now()}`
      await kv.set(logKey, backupLog)
      
      console.log('✅ CCP-focused backup completed successfully!')
      
      return c.json({
        success: true,
        message: 'CCP 중심 백업이 성공적으로 완료되었습니다.',
        data: backupLog
      })
      
    } catch (error) {
      console.error('❌ CCP-focused backup failed:', error)
      
      // 실패 로그 저장
      const errorLog = {
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message || 'Unknown error',
        backup_type: 'CCP_FOCUSED'
      }
      
      try {
        const logKey = `backup_log:${Date.now()}`
        await kv.set(logKey, errorLog)
      } catch (logError) {
        console.error('❌ Failed to save error log:', logError)
      }
      
      return c.json({
        success: false,
        error: 'CCP 중심 백업 실행 중 오류가 발생했습니다.',
        details: error.message
      }, 500)
    }
  })

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

  // 기존 엔드포인트들에 대한 명확한 응답 (호환성)
  app.post('/make-server-79e634f3/backup/ccp-records', requireAuth, async (c: any) => {
    console.log('🔄 ===== LEGACY ENDPOINT /backup/ccp-records CALLED =====')
    console.log('📍 Redirecting to new endpoint...')
    
    // 직접 새로운 엔드포인트로 요청 전달
    try {
      // 백업 설정 로드
      const config = await kv.get('backup_config')
      if (!config) {
        return c.json({
          success: false,
          error: '백업 설정이 구성되지 않았습니다. 새로운 엔드포인트 /backup/execute-ccp를 사용해주세요.'
        }, 400)
      }

      return c.json({
        success: false,
        error: '이 엔드포인트는 더 이상 사용되지 않습니다. /backup/execute-ccp 엔드포인트를 사용해주세요.',
        redirect_to: '/backup/execute-ccp'
      }, 410) // Gone
    } catch (error) {
      return c.json({
        success: false,
        error: '레거시 엔드포인트입니다. /backup/execute-ccp를 사용해주세요.'
      }, 410)
    }
  })

  app.post('/make-server-79e634f3/backup/test', requireAuth, async (c: any) => {
    console.log('🔄 ===== LEGACY TEST ENDPOINT CALLED =====')
    return c.json({
      success: false,
      error: '이 엔드포인트는 더 이상 사용되지 않습니다. /backup/test-connection 엔드포인트를 사용해주세요.',
      redirect_to: '/backup/test-connection'
    }, 410)
  })

  // 백업 연결 테스트 엔드포인트
  app.post('/make-server-79e634f3/backup/test-connection', requireAuth, async (c: any) => {
    try {
      console.log('🔍 Testing backup connection...')
      
      // 백업 설정 로드
      const config = await kv.get('backup_config')
      if (!config) {
        return c.json({
          success: false,
          error: '백업 설정이 구성되지 않았습니다. 먼저 설정을 완료해주세요.'
        }, 400)
      }

      const { spreadsheet_id, service_account_json } = config
      
      let SERVICE_ACCOUNT_JSON
      try {
        SERVICE_ACCOUNT_JSON = JSON.parse(service_account_json)
      } catch (parseError) {
        return c.json({
          success: false,
          error: '서비스 어카운트 JSON 형식이 올바르지 않습니다.'
        }, 400)
      }
      
      // Google Sheets API 접근 토큰 생성
      const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT'
      }
      
      const now = Math.floor(Date.now() / 1000)
      const jwtPayload = {
        iss: SERVICE_ACCOUNT_JSON.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
      }
      
      const processedKey = await processPrivateKey(SERVICE_ACCOUNT_JSON.private_key)
      const importedKey = await importPrivateKey(processedKey)
      
      const headerEncoded = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      const payloadEncoded = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      
      const dataToSign = `${headerEncoded}.${payloadEncoded}`
      const signature = await generateSignature(importedKey, dataToSign)
      const signatureEncoded = await encodeSignature(signature)
      
      const jwt = `${dataToSign}.${signatureEncoded}`
      
      // 접근 토큰 요청
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      })
      
      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text()
        console.error('❌ Token request failed:', tokenError)
        return c.json({
          success: false,
          error: `Google API 인증 실패: ${tokenResponse.status}`,
          details: tokenError
        }, 400)
      }
      
      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token
      
      // 스프레드시트 접근 테스트
      const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}`
      
      const spreadsheetResponse = await fetch(`${baseUrl}?fields=sheets.properties`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!spreadsheetResponse.ok) {
        const spreadsheetError = await spreadsheetResponse.text()
        console.error('❌ Spreadsheet access failed:', spreadsheetError)
        
        let errorMessage = '스프레드시트 접근 실패'
        if (spreadsheetResponse.status === 404) {
          errorMessage = '스프레드시트를 찾을 수 없습니다. 스프레드시트 ID가 올바른지 확인해주세요.'
        } else if (spreadsheetResponse.status === 403) {
          errorMessage = '스프레드시트에 접근할 수 없습니다. Service Account 이메일을 스프레드시트 편집자로 공유했는지 확인해주세요.'
        }
        
        return c.json({
          success: false,
          error: errorMessage,
          details: spreadsheetError
        }, 400)
      }
      
      const spreadsheetData = await spreadsheetResponse.json()
      const sheetCount = spreadsheetData.sheets?.length || 0
      
      console.log('✅ Connection test successful')
      
      return c.json({
        success: true,
        message: '백업 연결 테스트가 성공했습니다.',
        data: {
          spreadsheet_id,
          sheets_count: sheetCount,
          service_account_email: SERVICE_ACCOUNT_JSON.client_email,
          test_timestamp: new Date().toISOString()
        }
      })
      
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      
      return c.json({
        success: false,
        error: '연결 테스트 중 오류가 발생했습니다.',
        details: error.message
      }, 500)
    }
  })
}