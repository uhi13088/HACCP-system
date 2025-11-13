# Smart HACCP 관리 시스템

식품 안전 관리를 위한 종합적인 웹 기반 HACCP(Hazard Analysis Critical Control Point) 관리 시스템입니다. 실시간 모니터링, 중요 관리점(CCP) 추적, 문서 관리, 위험 분석, 그리고 자동화된 백업 기능을 제공합니다.

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [시스템 구조](#시스템-구조)
- [사용자 역할 및 권한](#사용자-역할-및-권한)
- [CCP 관리](#ccp-관리)
- [백업 시스템](#백업-시스템)
- [센서 관리](#센서-관리)
- [문서 관리](#문서-관리)
- [환경 변수 설정](#환경-변수-설정)
- [개발 가이드](#개발-가이드)

## 주요 기능

### 1. 실시간 모니터링 대시보드
- 실시간 온도/습도 센서 데이터 모니터링
- CCP 상태 및 알림 표시
- 센서 상태 추적 (온라인/오프라인/오류)
- 배터리 레벨 및 마지막 업데이트 시간 표시
- 통계 및 트렌드 분석

### 2. 중요 관리점(CCP) 관리
다양한 공정별 맞춤형 CCP 타입 지원:
- **오븐공정_빵류**: 가열온도, 가열시간, 가열후품온
- **크림제조 공정**: 살균온도, 살균시간, pH, 산도
- **세척공정**: 세척온도, 세척시간, 농도, pH
- **금속검출공정**: Fe 감도, SUS 감도, Al 감도, 테스트 주기
- **냉장보관공정**: 보관온도, 습도, 보관시간

각 CCP 타입은 다음 기능을 제공:
- 맞춤형 필드 구성
- 임계값 설정 및 자동 알림
- 실시간 모니터링
- 데이터 기록 및 추적
- Google Sheets 자동 백업

### 3. 문서 관리 시스템
체계적인 카테고리별 문서 관리:

#### 일간문서
- 생산 일지
- 냉장고 온도 관리

#### 주간문서
- 방충·방서 주간 점검
- 시설 주간 점검

#### 월간문서
- 각종 월간 보고서

#### 각종문서
- 원료 수불 관리
- 위생 점검
- 사고 보고서
- 방문자 관리
- 교육 훈련 기록

### 4. 환경 모니터링
- 실시간 온도/습도 데이터 수집
- 센서별 데이터 추적
- 이상치 감지 및 알림
- 데이터 시각화 및 차트
- Excel 내보내기

### 5. 위험 분석 (Hazard Analysis)
- 위해요소 식별 및 평가
- 위험도 계산 및 분류
- 관리 방안 수립
- 위험 추적 및 모니터링

### 6. 체크리스트 관리
- 카테고리별 체크리스트 구성
- 일일/주간/월간 점검 항목
- 완료 상태 추적
- 서명 및 승인 기능

### 7. 시스템 관리 (관리자 전용)
6개의 주요 관리 탭으로 구성:

#### 사용자 관리
- 사용자 생성, 수정, 삭제
- 역할 할당 (admin, manager, operator)
- 권한 관리
- 사용자 상태 모니터링

#### 시스템 설정
- 전역 설정 관리
- 알림 설정
- 시스템 파라미터 구성

#### 백업 관리
- Google Sheets 백업 설정
- 탭별 개별 스프레드시트 ID 구성
- Google Service Account 설정
- 자동/수동 백업 실행
- 백업 히스토리 조회

#### 센서 관리
- 센서 추가/삭제
- 센서 상태 모니터링 (온라인/오프라인/오류)
- 배터리 레벨 추적
- 센서 보정 일정 관리
- 센서 위치 및 타입 설정

#### 감사 로그
- 시스템 활동 추적
- 사용자 액션 로그
- 변경 이력 관리
- 보안 이벤트 기록

#### 데이터 관리
- 데이터베이스 백업/복원
- 데이터 정리 및 최적화
- 데이터 내보내기/가져오기

### 8. 공급업체 관리
- 공급업체 등록 및 관리
- 연락처 정보
- 제공 품목 추적
- 평가 및 모니터링

## 기술 스택

### Frontend
- **React 18**: 사용자 인터페이스 구축
- **TypeScript**: 타입 안전성
- **Tailwind CSS v4.0**: 스타일링
- **Shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘
- **Recharts**: 데이터 시각화
- **Sonner**: 토스트 알림

### Backend & Database
- **Supabase**: 백엔드 서비스
  - PostgreSQL 데이터베이스
  - 실시간 데이터 동기화
  - 사용자 인증 및 권한 관리
  - 서버리스 함수 (Edge Functions)
  - 스토리지

### 통합 & 자동화
- **Google Sheets API**: 데이터 백업
- **Google Service Account**: 안전한 API 접근

## 시작하기

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정
- Google Cloud Platform 계정 (백업 기능 사용 시)

### 설치

1. **저장소 클론**
```bash
git clone [repository-url]
cd smart-haccp-system
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
`.env` 파일을 생성하고 다음 변수들을 설정:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Supabase 데이터베이스 설정**

Supabase 프로젝트에서 다음 테이블들을 생성:

```sql
-- 사용자 프로필
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'operator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CCP 기록
CREATE TABLE ccp_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 데이터
CREATE TABLE sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id TEXT NOT NULL,
  sensor_name TEXT NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 정보
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  type TEXT,
  status TEXT CHECK (status IN ('online', 'offline', 'error')),
  battery_level INTEGER,
  last_calibration DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 체크리스트
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  items JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 위험 분석
CREATE TABLE hazard_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_type TEXT NOT NULL,
  description TEXT,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  probability INTEGER CHECK (probability BETWEEN 1 AND 5),
  risk_level INTEGER,
  control_measures TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 백업 설정
CREATE TABLE backup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id TEXT UNIQUE NOT NULL,
  spreadsheet_id TEXT,
  sheet_name TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  last_backup TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 설정 (KV 스토어)
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 감사 로그
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 공급업체
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  products JSONB,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

5. **개발 서버 실행**
```bash
npm run dev
```

애플리케이션이 `http://localhost:5173`에서 실행됩니다.

### 초기 설정

1. **관리자 계정 생성**
   - 애플리케이션 첫 실행 시 회원가입
   - Supabase 대시보드에서 해당 사용자의 role을 'admin'으로 변경

2. **Google Service Account 설정** (백업 기능 사용 시)
   - Google Cloud Console에서 Service Account 생성
   - Google Sheets API 활성화
   - 서비스 계정 키 JSON 다운로드
   - 시스템관리 > 백업 관리에서 Service Account 설정

3. **센서 등록**
   - 시스템관리 > 센서 관리에서 센서 추가
   - 센서 ID, 이름, 위치, 타입 설정

## 시스템 구조

### 디렉토리 구조

```
smart-haccp-system/
├── components/              # React 컴포넌트
│   ├── ui/                 # Shadcn UI 컴포넌트
│   ├── Dashboard.tsx       # 대시보드
│   ├── CCPManager.tsx      # CCP 관리
│   ├── ChecklistManager.tsx # 체크리스트
│   ├── EnvironmentMonitoring.tsx # 환경 모니터링
│   ├── HazardAnalysis.tsx  # 위험 분석
│   ├── AdminPanel.tsx      # 관리자 패널
│   └── ...                 # 기타 컴포넌트
├── contexts/               # React Context
│   └── AuthContext.tsx    # 인증 컨텍스트
├── utils/                  # 유틸리티 함수
│   ├── api.tsx            # API 함수
│   ├── ccpTypes.tsx       # CCP 타입 정의
│   ├── sensorDataUtils.tsx # 센서 데이터 유틸
│   ├── backupScheduler.tsx # 백업 스케줄러
│   └── supabase/          # Supabase 클라이언트
├── supabase/
│   └── functions/         # Edge Functions
│       └── server/        # 서버 엔드포인트
├── styles/
│   └── globals.css        # 전역 스타일
├── App.tsx                # 메인 앱 컴포넌트
└── README.md              # 이 파일
```

### 주요 컴포넌트 설명

#### App.tsx
- 애플리케이션의 메인 진입점
- 라우팅 및 네비게이션 관리
- 카테고리별 메뉴 구조 구현
- 실시간 센서 모니터링 제어

#### Dashboard.tsx
- 실시간 데이터 시각화
- CCP 상태 요약
- 알림 및 경고 표시
- 센서 상태 모니터링

#### CCPManager.tsx
- CCP 데이터 입력 및 수정
- 타입별 맞춤 폼
- 실시간 유효성 검증
- Google Sheets 백업 연동

#### AdminPanel.tsx
6개의 탭으로 구성된 관리자 전용 패널:
1. **사용자 관리**: 사용자 CRUD 및 역할 관리
2. **시스템 설정**: 전역 설정 및 파라미터
3. **백업 관리**: Google Sheets 백업 구성
4. **센서 관리**: 센서 CRUD 및 상태 모니터링
5. **감사 로그**: 시스템 활동 추적
6. **데이터 관리**: 데이터베이스 관리

#### EnvironmentMonitoring.tsx
- 실시간 온도/습도 데이터
- 센서별 차트 및 그래프
- 데이터 필터링 및 검색
- Excel 내보내기

## 사용자 역할 및 권한

### Admin (관리자)
**전체 시스템 접근 권한**
- ✅ 모든 메뉴 접근
- ✅ 사용자 관리
- ✅ 시스템 설정 변경
- ✅ 백업 관리
- ✅ 센서 관리
- ✅ CCP 데이터 CRUD
- ✅ 모든 문서 CRUD
- ✅ 감사 로그 조회
- ✅ 데이터 관리

### Manager (매니저)
**운영 및 모니터링 권한**
- ✅ 대시보드 조회
- ✅ CCP 데이터 입력 및 수정
- ✅ 체크리스트 관리
- ✅ 환경 모니터링
- ✅ 위험 분석
- ✅ 문서 작성 및 수정
- ✅ 보고서 생성
- ❌ 시스템 관리 접근 불가
- ❌ 사용자 관리 불가

### Operator (작업자)
**데이터 입력 및 조회 권한**
- ✅ 대시보드 조회
- ✅ CCP 데이터 입력
- ✅ 체크리스트 작성
- ✅ 환경 모니터링 조회
- ✅ 문서 조회
- ❌ 데이터 삭제 불가
- ❌ 설정 변경 불가
- ❌ 시스템 관리 접근 불가

## CCP 관리

### 지원되는 CCP 타입

#### 1. 오븐공정_빵류
```typescript
{
  가열온도: number (180-220°C),
  가열시간: number (15-45분),
  가열후품온: number (75-85°C),
  비고: text
}
```

#### 2. 크림제조 공정
```typescript
{
  살균온도: number (75-85°C),
  살균시간: number (15-30분),
  pH: number (4.0-7.0),
  산도: number (0.1-1.0%),
  비고: text
}
```

#### 3. 세척공정
```typescript
{
  세척온도: number (40-90°C),
  세척시간: number (5-60분),
  농도: number (100-500 ppm),
  pH: number (6.0-8.0),
  비고: text
}
```

#### 4. 금속검출공정
```typescript
{
  Fe감도: select (1.5mm, 2.0mm, 2.5mm),
  SUS감도: select (2.5mm, 3.0mm, 3.5mm),
  Al감도: select (2.0mm, 2.5mm, 3.0mm),
  테스트주기: number (시간),
  테스트결과: select (합격, 불합격),
  비고: text
}
```

#### 5. 냉장보관공정
```typescript
{
  보관온도: number (0-10°C),
  습도: number (50-90%),
  보관시간: number (시간),
  제품상태: select (양호, 주의, 불량),
  비고: text
}
```

### CCP 타입 커스터마이징

1. **시스템관리 > 시스템 설정**에서 CCP 타입 추가/수정
2. 각 필드별 다음 속성 설정 가능:
   - 필드명
   - 데이터 타입 (number, text, select, boolean)
   - 단위
   - 최소/최대 값
   - 필수 여부
   - 기본값
   - Select 옵션 (드롭다운인 경우)

3. 임계값 및 알림 설정
4. 저장 후 즉시 적용

## 백업 시스템

### Google Sheets 자동 백업

시스템의 모든 데이터를 Google Sheets에 자동으로 백업하는 기능을 제공합니다.

#### 특징
- **탭별 개별 백업**: 각 메뉴 탭마다 독립적인 스프레드시트 지정 가능
- **실시간 동기화**: 데이터 입력 시 자동 백업
- **수동 백업**: 관리자가 수동으로 백업 실행 가능
- **백업 히스토리**: 모든 백업 이력 추적

#### 설정 방법

1. **Google Service Account 생성**
   ```
   1. Google Cloud Console 접속
   2. 새 프로젝트 생성
   3. Google Sheets API 활성화
   4. Service Account 생성
   5. 키 생성 (JSON 형식)
   ```

2. **Service Account 등록**
   - 시스템관리 > 백업 관리 탭
   - "Service Account 설정" 클릭
   - JSON 키 파일 내용 붙여넣기
   - 저장

3. **스프레드시트 ID 설정**
   ```
   각 메뉴별로:
   1. Google Sheets에서 새 스프레드시트 생성
   2. URL에서 스프레드시트 ID 복사
      예: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   3. Service Account 이메일에 편집 권한 부여
   4. 시스템관리 > 백업 관리에서 해당 메뉴의 스프레드시트 ID 입력
   ```

#### 백업 가능한 메뉴
- CCP 관리 (각 CCP 타입별 개별 시트)
- 체크리스트
- 환경 모니터링
- 위험 분석
- 생산 일지
- 냉장고 온도 관리
- 방충·방서 점검
- 시설 점검
- 원료 수불
- 위생 점검
- 사고 보고서
- 방문자 관리
- 교육 훈련 기록
- 공급업체 관리

#### 백업 실행

**자동 백업**
- 데이터 입력/수정/삭제 시 자동 실행
- 실패 시 재시도 메커니즘

**수동 백업**
```
1. 시스템관리 > 백업 관리
2. 원하는 메뉴의 "백업 실행" 버튼 클릭
3. 진행 상태 확인
4. 완료 메시지 확인
```

#### 백업 데이터 구조

각 스프레드시트의 시트 구성:
- **첫 번째 행**: 컬럼 헤더
- **두 번째 행부터**: 실제 데이터
- **자동 업데이트**: 새 데이터 추가 시 자동으로 행 추가

## 센서 관리

### 센서 등록

1. **시스템관리 > 센서 관리**
2. "센서 추가" 클릭
3. 다음 정보 입력:
   - 센서 ID (고유 식별자)
   - 센서 이름
   - 위치 (예: 냉장고-1, 오븐-A)
   - 타입 (온도, 습도, 온습도)
   - 초기 상태

### 센서 상태

#### Online (온라인)
- 🟢 정상 작동 중
- 데이터 전송 정상
- 배터리 충분

#### Offline (오프라인)
- 🔴 연결 끊김
- 일정 시간 이상 데이터 미수신
- 관리자에게 알림 발송

#### Error (오류)
- 🟡 오류 상태
- 데이터 이상치 감지
- 센서 고장 의심
- 즉시 점검 필요

### 센서 모니터링

- **배터리 레벨**: 실시간 배터리 상태 (0-100%)
- **마지막 보정일**: 센서 보정 이력 추적
- **데이터 추세**: 실시간 차트로 데이터 시각화
- **알림 설정**: 임계값 초과 시 자동 알림

### 센서 데이터 수집

```typescript
// 센서 데이터 구조
interface SensorData {
  id: string;
  sensor_id: string;
  sensor_name: string;
  temperature: number;
  humidity: number;
  timestamp: Date;
  created_at: Date;
}
```

## 문서 관리

### 카테고리별 문서

#### 일간문서
**생산 일지**
- 일일 생산량 기록
- 제품별 생산 현황
- 작업자 정보
- 특이사항

**냉장고 온도 관리**
- 시간별 온도 기록
- 냉장고별 데이터
- 이상 온도 알림

#### 주간문서
**방충·방서 점검**
- 주간 방역 현황
- 포획 내역
- 조치 사항

**시설 점검**
- 주간 시설 상태 점검
- 유지보수 이력
- 개선 필요사항

#### 각종문서
**원료 수불 관리**
- 원료 입고/출고
- 재고 현황
- 유통기한 관리

**사고 보고서**
- 사고 발생 내역
- 원인 분석
- 재발 방지 대책

**교육 훈련 기록**
- 교육 일정
- 참석자 명단
- 교육 내용
- 평가 결과

### 문서 작성 프로세스

1. **작성**: 해당 문서 메뉴에서 새 문서 작성
2. **검토**: 매니저 검토
3. **승인**: 관리자 최종 승인
4. **보관**: 자동으로 데이터베이스 및 Google Sheets에 저장
5. **조회**: 언제든지 이력 조회 가능

## 환경 변수 설정

### 필수 환경 변수

```env
# Supabase 설정
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Sheets (선택사항 - 백업 기능 사용 시)
# Service Account는 시스템 UI에서 설정
```

### Supabase 설정

1. **Supabase 프로젝트 생성**
   - https://supabase.com 접속
   - 새 프로젝트 생성
   - 프로젝트 URL 및 anon key 확인

2. **인증 설정**
   - Email/Password 인증 활성화
   - 필요시 소셜 로그인 추가

3. **보안 정책 (RLS) 설정**
   ```sql
   -- 프로필은 인증된 사용자만 조회 가능
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = id);
   
   -- CCP 기록은 역할별 접근 제어
   ALTER TABLE ccp_records ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Operators can insert CCP records"
     ON ccp_records FOR INSERT
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM profiles
         WHERE id = auth.uid()
         AND role IN ('admin', 'manager', 'operator')
       )
     );
   
   -- 센서 데이터는 인증된 사용자 조회 가능
   ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Authenticated users can view sensor data"
     ON sensor_data FOR SELECT
     USING (auth.uid() IS NOT NULL);
   ```

## 개발 가이드

### 개발 환경 설정

1. **코드 편집기**: VS Code 권장
2. **필수 확장 프로그램**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript and JavaScript Language Features

### 코딩 컨벤션

#### TypeScript
```typescript
// 인터페이스 정의
interface ComponentProps {
  title: string;
  onSubmit: () => void;
}

// 함수형 컴포넌트
export function MyComponent({ title, onSubmit }: ComponentProps) {
  // 컴포넌트 로직
}
```

#### Tailwind CSS
```tsx
// 클래스명 정렬
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  {/* 컨텐츠 */}
</div>
```

### 새로운 CCP 타입 추가

1. **타입 정의** (`utils/ccpTypes.tsx`)
```typescript
const newCCPType: CCPType = {
  id: 'unique_id',
  name: '새로운 공정',
  color: 'blue',
  settings: {
    requiredFields: ['필드1', '필드2'],
    fieldSettings: [
      {
        name: '필드1',
        dataType: 'number',
        unit: '단위',
        required: true,
        minValue: '0',
        maxValue: '100'
      }
    ]
  }
};
```

2. **UI 업데이트**: CCPManager.tsx에서 자동으로 반영됨

### 새로운 문서 타입 추가

1. **컴포넌트 생성** (`components/NewDocument.tsx`)
```typescript
export function NewDocument() {
  // 문서 로직
  return (
    <Card>
      {/* 문서 UI */}
    </Card>
  );
}
```

2. **App.tsx에 등록**
```typescript
import { NewDocument } from "./components/NewDocument";

// navigationStructure에 추가
{
  id: "new_document",
  name: "새 문서",
  icon: FileText,
  component: NewDocument,
  roles: ['admin', 'manager', 'operator']
}
```

### API 함수 추가

`utils/api.tsx`에서 API 함수 정의:

```typescript
export const api = {
  // 기존 함수들...
  
  async createNewData(data: any) {
    const { data: result, error } = await supabase
      .from('table_name')
      .insert(data);
    
    if (error) throw error;
    return result;
  }
};
```

### 테스트

```bash
# 유닛 테스트 실행 (설정 필요)
npm test

# 타입 체크
npm run type-check

# 린팅
npm run lint
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 보안 고려사항

### 인증 및 권한
- ✅ Supabase Auth를 통한 안전한 인증
- ✅ Row Level Security (RLS)로 데이터 보호
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ JWT 토큰 기반 세션 관리

### 데이터 보호
- ✅ 모든 통신은 HTTPS 암호화
- ✅ 민감한 데이터는 암호화 저장
- ✅ Google Service Account 키는 안전하게 보관
- ✅ 환경 변수로 시크릿 관리

### 감사 및 모니터링
- ✅ 모든 중요 작업은 감사 로그 기록
- ✅ 비정상적인 활동 감지
- ✅ 정기적인 로그 검토

## 문제 해결

### 자주 발생하는 문제

#### 1. Supabase 연결 실패
```
해결책:
- .env 파일의 Supabase URL과 Key 확인
- Supabase 프로젝트가 활성 상태인지 확인
- 네트워크 연결 확인
```

#### 2. Google Sheets 백업 실패
```
해결책:
- Service Account 키가 올바르게 설정되었는지 확인
- 스프레드시트 ID가 정확한지 확인
- Service Account에 스프레드시트 편집 권한이 있는지 확인
- Google Sheets API가 활성화되었는지 확인
```

#### 3. 센서 데이터 미수신
```
해결책:
- 센서 상태 확인 (시스템관리 > 센서 관리)
- 센서 배터리 레벨 확인
- 센서 네트워크 연결 확인
- 센서 펌웨어 업데이트 확인
```

#### 4. 권한 오류
```
해결책:
- 사용자 역할 확인 (시스템관리 > 사용자 관리)
- Supabase RLS 정책 확인
- 로그아웃 후 재로그인
```

### 로그 확인

브라우저 개발자 도구 콘솔에서 상세 로그 확인:
```javascript
// 콘솔에서 디버그 모드 활성화
localStorage.setItem('debug', 'true');
```

## 업데이트 및 유지보수

### 정기 유지보수

#### 일일
- 센서 상태 확인
- 백업 실행 확인
- 알림 검토

#### 주간
- 감사 로그 검토
- 데이터 정합성 확인
- 사용자 활동 분석

#### 월간
- 센서 보정
- 시스템 업데이트 확인
- 데이터베이스 최적화
- 백업 복원 테스트

### 시스템 업데이트

```bash
# 의존성 업데이트
npm update

# 보안 취약점 확인
npm audit

# 취약점 자동 수정
npm audit fix
```

## 라이선스

이 프로젝트는 [라이선스 유형]에 따라 라이선스가 부여됩니다.

## 지원 및 문의

- **기술 문의**: [이메일 주소]
- **버그 리포트**: [GitHub Issues URL]
- **기능 요청**: [GitHub Discussions URL]

## 기여

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 변경 이력

### v1.0.0 (2025-11-13)
- ✅ 초기 릴리스
- ✅ 실시간 모니터링 대시보드
- ✅ CCP 관리 (5가지 공정 타입)
- ✅ 환경 모니터링
- ✅ 체크리스트 관리
- ✅ 위험 분석
- ✅ 문서 관리 시스템
- ✅ Google Sheets 백업
- ✅ 센서 관리
- ✅ 사용자 역할 및 권한 관리
- ✅ 시스템 관리 패널 (6개 탭)
- ✅ 감사 로그
- ✅ 공급업체 관리

---

**Smart HACCP 관리 시스템**으로 식품 안전을 효율적으로 관리하세요! 🎯
