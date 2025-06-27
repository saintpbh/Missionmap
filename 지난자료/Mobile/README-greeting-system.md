# 인사말 시스템 분리

## 개요
기존에 `index.html`과 `mobile.css`에 포함되어 있던 인사말 관련 코드를 모듈화하여 별도 파일로 분리했습니다.

## 파일 구조

### 1. JSON 데이터 파일
- **파일**: `js/greetings.json`
- **역할**: 시간대별(아침/오후/저녁) 다국어 인사말 데이터 저장
- **구조**:
  ```json
  {
    "morning": [{"country": "한국", "text": "좋은 아침입니다!"}, ...],
    "afternoon": [...],
    "evening": [...]
  }
  ```

### 2. CSS 스타일 파일
- **파일**: `css/greeting.css`
- **역할**: 인사말 표시 관련 모든 스타일
- **포함 요소**:
  - 인사말 컨테이너 스타일
  - 시간대별 색상 클래스 (morning, afternoon, evening)
  - 플립 애니메이션 효과
  - 호버 효과

### 3. JavaScript 관리 클래스
- **파일**: `js/greetingManager.js`
- **역할**: 인사말 시스템의 모든 로직 관리
- **주요 기능**:
  - JSON 데이터 비동기 로딩
  - 시간대 감지 및 분류
  - 자동 인사말 순환 (10초 간격)
  - 사용자 상호작용 처리
  - 플립 애니메이션 제어

## 주요 개선사항

### 1. 모듈화
- 데이터, 스타일, 로직이 각각 분리되어 유지보수성 향상
- 각 파일이 단일 책임을 가지도록 구조화

### 2. 확장성
- JSON 파일로 새로운 언어 추가가 쉬워짐
- CSS 클래스 기반으로 새로운 스타일 적용 용이
- JavaScript 클래스로 기능 확장 가능

### 3. 성능 최적화
- 필요한 경우에만 CSS와 JS 로드 가능
- JSON 데이터 캐싱으로 중복 요청 방지
- 에러 처리 및 폴백 시스템 구축

## 사용법

### HTML에서 사용
```html
<!-- CSS 파일 로드 -->
<link rel="stylesheet" href="css/greeting.css">

<!-- JavaScript 파일 로드 -->
<script src="js/greetingManager.js"></script>

<!-- HTML 구조 -->
<div class="greeting-display">
  <span id="greeting-text" class="greeting-text"></span>
</div>

<!-- 초기화 -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  if (window.GreetingManager) {
    new GreetingManager();
  }
});
</script>
```

### 새로운 언어 추가
`js/greetings.json` 파일에 새로운 객체 추가:
```json
{
  "country": "새언어",
  "text": "새로운 인사말!"
}
```

### 스타일 커스터마이징
`css/greeting.css`에서 색상이나 애니메이션 수정:
```css
.greeting-text.morning {
  color: #새로운색상;
}
```

## 기술적 특징

### 비동기 데이터 로딩
- `fetch()` API를 사용한 JSON 데이터 로딩
- 에러 발생 시 폴백 데이터 제공

### 시간대 자동 감지
- 현재 시간을 기준으로 아침/오후/저녁 자동 분류
- 시간대별 다른 색상 테마 적용

### 사용자 상호작용
- 클릭/터치 시 즉시 다음 인사말로 변경
- 사용자 활동 감지로 자동 순환 타이밍 조절

### 메모리 관리
- `destroy()` 메서드로 타이머 정리
- 이벤트 리스너 적절한 관리

## 호환성
- 모던 브라우저 (ES6+ 지원)
- 모바일 터치 이벤트 지원
- Firebase 등 외부 시스템과 독립적으로 동작 