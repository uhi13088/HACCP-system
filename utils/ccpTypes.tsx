// CCP 타입 관리 유틸리티

export interface CCPFieldSetting {
  name: string;
  dataType: 'number' | 'text' | 'select' | 'boolean';
  unit?: string;
  required: boolean;
  minValue?: string;
  maxValue?: string;
  defaultValue?: string;
  selectOptions?: string[];
  description?: string;
}

export interface CCPTypeSettings {
  tempRange?: { min: number; max: number; unit: string };
  phRange?: { min: number; max: number; unit: string };
  timeRange?: { min: number; max: number; unit: string };
  concentrationRange?: { min: number; max: number; unit: string };
  sensitivity?: { fe: string; sus: string; al: string };
  checkInterval?: number;
  testInterval?: number;
  alertEnabled?: boolean;
  requiredFields: string[];
  fieldSettings?: CCPFieldSetting[];
  description?: string;
  criticalLimits?: Record<string, any>;
  hazard?: string;
  monitoringMethod?: string;
  frequency?: string;
  unit?: string;
}

export interface CCPType {
  id: string;
  name: string;
  color: string;
  settings: CCPTypeSettings;
}

export interface CCPFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'datetime-local' | 'select' | 'checkbox' | 'time';
  required?: boolean;
  options?: string[];
  unit?: string;
}

export interface CCPTypeConfig {
  id: string;
  name: string;
  fields: CCPFieldConfig[];
  description: string;
}

// localStorage 키
const CCP_TYPES_STORAGE_KEY = 'smart_haccp_ccp_types';

// 기본 CCP 타입들
const DEFAULT_CCP_TYPES: CCPType[] = [
  {
    id: 'oven_bread',
    name: '오븐공정_빵류',
    color: 'orange',
    settings: {
      tempRange: { min: 180, max: 220, unit: '°C' },
      timeRange: { min: 15, max: 45, unit: '분' },
      checkInterval: 30,
      requiredFields: ['가열온도', '가열시간', '중심온도'],
      fieldSettings: [
        {
          name: '가열온도',
          dataType: 'number',
          unit: '°C',
          required: true,
          minValue: '180',
          maxValue: '220',
          description: '오븐 내부 온도'
        },
        {
          name: '가열시간',
          dataType: 'number',
          unit: '분',
          required: true,
          minValue: '15',
          maxValue: '45',
          description: '가열 시간'
        },
        {
          name: '가열후품온',
          dataType: 'number',
          unit: '°C',
          required: true,
          minValue: '75',
          maxValue: '85',
          description: '가열 후 제품 중심부 온도'
        }
      ],
      alertEnabled: true,
      description: '빵류 제품의 오븐 가열 공정 관리',
      criticalLimits: {
        temp: { min: 180, max: 220 },
        time: { min: 15, max: 45 },
        coreTemp: { min: 75, max: 85 }
      },
      hazard: '병원성 미생물 생존',
      monitoringMethod: '적외선 온도계를 이용하여 오븐 내부 온도를 측정하고, 제품 중심부 온도를 확인합니다. 설정 온도와 실제 온도의 차이가 ±5°C 이내인지 확인하며, 온도 기록지에 시간별로 기록합니다.',
      frequency: '30분마다',
      unit: '°C'
    }
  },
  {
    id: 'cream_manufacturing',
    name: '크림제조 공정',
    color: 'blue',
    settings: {
      tempRange: { min: 2, max: 8, unit: '°C' },
      phRange: { min: 6.0, max: 7.0, unit: 'pH' },
      checkInterval: 60,
      requiredFields: ['제조직후온도', '소진직전온도', '작업장온도'],
      fieldSettings: [
        {
          name: '배합시간',
          dataType: 'text',
          required: true,
          description: '크림 배합 시간'
        },
        {
          name: '배합량',
          dataType: 'number',
          unit: 'kg',
          required: true,
          description: '크림 배합량'
        },
        {
          name: '제조직후온도',
          dataType: 'number',
          unit: '°C',
          required: true,
          minValue: '2',
          maxValue: '8',
          description: '제조 직후 크림 온도'
        },
        {
          name: '소진직전온도',
          dataType: 'number',
          unit: '°C',
          required: true,
          minValue: '2',
          maxValue: '8',
          description: '소진 직전 크림 온도'
        },
        {
          name: '소진시간',
          dataType: 'text',
          required: true,
          description: '크림 소진 시간'
        },
        {
          name: '작업장온도',
          dataType: 'number',
          unit: '°C',
          required: true,
          description: '작업장 환경 온도'
        }
      ],
      alertEnabled: true,
      description: '크림류 제품의 제조 및 품질 관리',
      criticalLimits: {
        temp: { min: 2, max: 8 },
        workplaceTemp: { min: 20, max: 25 }
      },
      hazard: '병원성 미생물 증식',
      monitoringMethod: '냉장실 온도계와 제품 내부 온도계를 이용하여 크림 제조 전후의 온도를 측정합니다. 제조 환경의 온도와 습도도 함께 모니터링하며, 모든 데이터는 실시간으로 기록 시스템에 저장됩니다.',
      frequency: '1시간마다',
      unit: '°C'
    }
  },
  {
    id: 'washing_process',
    name: '세척공정',
    color: 'green',
    settings: {
      tempRange: { min: 60, max: 80, unit: '°C' },
      concentrationRange: { min: 200, max: 500, unit: 'ppm' },
      checkInterval: 60,
      requiredFields: ['원료량', '세척수량', '세척시간'],
      fieldSettings: [
        {
          name: '원료량',
          dataType: 'number',
          unit: 'kg',
          required: true,
          description: '세척할 원료량'
        },
        {
          name: '세척수량',
          dataType: 'number',
          unit: 'L',
          required: true,
          description: '사용한 세척수량'
        },
        {
          name: '세척시간',
          dataType: 'number',
          unit: '분',
          required: true,
          description: '세척 소요 시간'
        }
      ],
      alertEnabled: true,
      description: '용기 및 기구의 세척 및 위생 관리',
      criticalLimits: {
        concentration: { min: 200, max: 500 },
        temp: { min: 60, max: 80 }
      },
      hazard: '화학적 위해요소 잔류',
      monitoringMethod: '염소 테스트 스트립을 이용하여 세척수의 염소 농도를 측정하고, pH 미터로 세척수의 pH를 확인합니다. 세척 후 잔류 세제 여부는 TDS 미터로 측정하며, 모든 결과는 세척 기록지에 작성합니다.',
      frequency: '세척시마다',
      unit: 'ppm'
    }
  },
  {
    id: 'metal_detection',
    name: '금속검출공정',
    color: 'purple',
    settings: {
      sensitivity: { fe: '1.5mm', sus: '2.0mm', al: '2.5mm' },
      testInterval: 60,
      checkInterval: 30,
      requiredFields: ['Fe테스트', 'SUS테스트', '제품통과'],
      fieldSettings: [
        {
          name: 'Fe감도테스트',
          dataType: 'boolean',
          required: true,
          description: 'Fe(철) 감도 테스트 통과 여부'
        },
        {
          name: 'SUS감도테스트',
          dataType: 'boolean',
          required: true,
          description: 'SUS(스테인리스) 감도 테스트 통과 여부'
        },
        {
          name: '제품단독통과',
          dataType: 'boolean',
          required: true,
          description: '제품만 단독 통과 여부'
        },
        {
          name: 'Fe제품통과',
          dataType: 'boolean',
          required: true,
          description: 'Fe + 제품 통과 테스트'
        },
        {
          name: 'SUS제품통과',
          dataType: 'boolean',
          required: true,
          description: 'SUS + 제품 통과 테스트'
        }
      ],
      alertEnabled: true,
      description: '완제품의 금속 이물질 검출 및 제거',
      criticalLimits: {
        detection: { min: 0, max: 0 }
      },
      hazard: '물리적 위해요소 (금속이물)',
      monitoringMethod: '금속검출기의 감도를 매일 테스트 샘플(Fe 1.5mm, SUS 2.0mm)로 점검하고, 모든 제품이 금속검출기를 통과하도록 합니다. 검출기 이상시 즉시 생산을 중단하고 점검 후 재가동하며, 모든 검사 결과는 자동으로 기록됩니다.',
      frequency: '제품별 전수검사',
      unit: 'mm'
    }
  }
];

// CCP 타입을 CCPFieldConfig 형식으로 변환
export const convertCCPTypeToConfig = (ccpType: CCPType): CCPTypeConfig => {
  const fields: CCPFieldConfig[] = [];
  
  // 기본 필드들 추가
  fields.push(
    { key: 'productName', label: '품명', type: 'text', required: true },
    { key: 'measureTime', label: '측정시각', type: 'datetime-local', required: true }
  );
  
  // fieldSettings를 기반으로 필드들 추가
  if (ccpType.settings.fieldSettings) {
    ccpType.settings.fieldSettings.forEach((fieldSetting, index) => {
      const field: CCPFieldConfig = {
        key: `field_${index}`,
        label: fieldSetting.name,
        type: fieldSetting.dataType === 'boolean' ? 'checkbox' : 
              fieldSetting.dataType === 'select' ? 'select' : 
              fieldSetting.dataType === 'number' ? 'number' : 'text',
        required: fieldSetting.required,
        unit: fieldSetting.unit
      };
      
      if (fieldSetting.selectOptions) {
        field.options = fieldSetting.selectOptions;
      }
      
      fields.push(field);
    });
  }
  
  // 기본 필드들 추가
  fields.push(
    { key: 'compliance', label: '적합/부적합', type: 'select', required: true, options: ['적합', '부적합'] },
    { key: 'signature', label: '서명', type: 'text', required: true }
  );
  
  return {
    id: ccpType.id,
    name: ccpType.name,
    fields,
    description: ccpType.settings.description || ''
  };
};

// CCP 타입 저장
export const saveCCPTypes = (ccpTypes: CCPType[]): void => {
  try {
    localStorage.setItem(CCP_TYPES_STORAGE_KEY, JSON.stringify(ccpTypes));
    console.log('CCP types saved to localStorage:', ccpTypes.length);
  } catch (error) {
    console.error('Failed to save CCP types to localStorage:', error);
  }
};

// CCP 타입 불러오기
export const loadCCPTypes = (): CCPType[] => {
  try {
    const saved = localStorage.getItem(CCP_TYPES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('CCP types loaded from localStorage:', parsed.length);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load CCP types from localStorage:', error);
  }
  
  // 기본값 반환 및 저장
  console.log('Using default CCP types');
  saveCCPTypes(DEFAULT_CCP_TYPES);
  return DEFAULT_CCP_TYPES;
};

// CCP 타입 업데이트  
export const updateCCPType = (typeId: string, updatedType: CCPType): CCPType => {
  const currentTypes = loadCCPTypes();
  const updatedTypes = currentTypes.map(type => 
    type.id === typeId ? updatedType : type
  );
  saveCCPTypes(updatedTypes);
  return updatedType;
};

// CCP 타입 추가
export const addCCPType = (newType: CCPType): CCPType => {
  const currentTypes = loadCCPTypes();
  const updatedTypes = [...currentTypes, newType];
  saveCCPTypes(updatedTypes);
  return newType;
};

// CCP 타입 삭제
export const deleteCCPType = (typeId: string): void => {
  const currentTypes = loadCCPTypes();
  const updatedTypes = currentTypes.filter(type => type.id !== typeId);
  saveCCPTypes(updatedTypes);
};

// CCP 타입 검색
export const getCCPType = (typeId: string): CCPType | undefined => {
  const currentTypes = loadCCPTypes();
  return currentTypes.find(type => type.id === typeId);
};

// 모든 CCP 타입을 CCPTypeConfig로 변환
export const getAllCCPTypeConfigs = (): CCPTypeConfig[] => {
  const ccpTypes = loadCCPTypes();
  return ccpTypes.map(convertCCPTypeToConfig);
};