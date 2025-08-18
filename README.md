# 숙제 관리자 (Homework Manager)

학원/개인 교습자를 위한 빠르고 간단한 숙제 관리 앱입니다.

## 🎯 주요 기능

- **반/학생 관리**: 반과 학생을 추가, 수정, 삭제할 수 있습니다
- **숙제 확인**: 학생별로 숙제 상태를 빠르게 기록할 수 있습니다
- **통계**: 반별, 학생별 숙제 수행률을 확인할 수 있습니다
- **오프라인 지원**: SQLite를 사용하여 인터넷 없이도 사용 가능합니다

## 🚀 기술 스택

- **Frontend**: React 18 + TypeScript
- **Mobile**: Capacitor 5
- **Database**: SQLite (capacitor-community/sqlite)
- **UI**: TailwindCSS + HeadlessUI
- **Icons**: Heroicons
- **Build Tool**: Vite

## 📱 지원 플랫폼

- ✅ Android (Gradle 빌드 지원)
- 🔄 iOS (향후 지원 예정)
- 🌐 Web (개발용)

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. Android 빌드

```bash
# Capacitor 플랫폼 추가
npm run cap:add

# 웹 빌드
npm run build

# Android 프로젝트에 복사
npm run cap:copy

# Android Studio에서 열기
npm run cap:open:android
```

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Navigation.tsx  # 상단 네비게이션
│   └── LoadingScreen.tsx # 로딩 화면
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx   # 메인 대시보드
│   ├── ClassManagement.tsx # 반 관리
│   ├── StudentManagement.tsx # 학생 관리
│   ├── HomeworkCheck.tsx # 숙제 확인
│   └── Statistics.tsx  # 통계
├── services/           # 비즈니스 로직
│   └── database.ts    # SQLite 데이터베이스 서비스
├── types/              # TypeScript 타입 정의
│   └── database.ts    # 데이터베이스 관련 타입
├── App.tsx            # 메인 앱 컴포넌트
└── main.tsx           # 앱 진입점
```

## 🗄️ 데이터베이스 스키마

### classes (반)
- `id`: 고유 식별자
- `name`: 반 이름
- `description`: 반 설명
- `created_at`: 생성일시
- `updated_at`: 수정일시

### students (학생)
- `id`: 고유 식별자
- `class_id`: 반 ID (외래키)
- `name`: 학생 이름
- `grade`: 학년
- `phone`: 연락처
- `parent_phone`: 보호자 연락처
- `note`: 비고
- `created_at`: 생성일시
- `updated_at`: 수정일시

### homework_records (숙제 기록)
- `id`: 고유 식별자
- `student_id`: 학생 ID (외래키)
- `date`: 날짜
- `status`: 숙제 상태 (done/partial/not_done/absent)
- `note`: 메모
- `created_at`: 생성일시
- `updated_at`: 수정일시

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일과 데스크톱 모두 지원
- **직관적인 인터페이스**: 한 번의 클릭으로 숙제 상태 기록
- **빠른 네비게이션**: 자주 사용하는 기능에 빠르게 접근
- **시각적 피드백**: 색상과 아이콘으로 상태 구분

## 🔮 향후 계획

- [ ] iOS 지원
- [ ] 온라인 동기화 (Supabase 연동)
- [ ] 차트 및 그래프 기능 강화
- [ ] 알림 기능
- [ ] 백업 및 복원 기능
- [ ] 다국어 지원

## 📝 라이선스

MIT License

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**개발자**: Your Name  
**버전**: 1.0.0  
**최종 업데이트**: 2024년
