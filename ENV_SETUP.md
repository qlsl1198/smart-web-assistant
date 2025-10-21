# 🔑 환경변수 설정 가이드

Smart Web Assistant에서 Gemini API를 사용하기 위한 환경변수 설정 방법입니다.

## 🚀 **빠른 설정**

### **방법 1: 브라우저 개발자 도구 사용 (권장)**

1. **Chrome 확장 프로그램 설치 후**
2. **F12 키를 눌러 개발자 도구 열기**
3. **Console 탭에서 다음 명령어 실행:**

```javascript
// API 키 설정
localStorage.setItem('GEMINI_API_KEY', 'your_actual_api_key_here');

// 설정 확인
console.log('API Key set:', localStorage.getItem('GEMINI_API_KEY'));
```

### **방법 2: 확장 프로그램 UI 사용**

1. **확장 프로그램 아이콘 클릭**
2. **아무 기능이나 사용** (API 키 설정 다이얼로그가 나타남)
3. **API 키 입력 후 저장**

## 🔧 **개발자용 고급 설정**

### **환경변수 파일 생성**

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env 파일
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### **환경변수 로더 사용**

```javascript
// JavaScript에서 환경변수 사용
const envLoader = new EnvLoader();

// API 키 가져오기
const apiKey = envLoader.get('GEMINI_API_KEY');

// API 키 설정
envLoader.set('GEMINI_API_KEY', 'your_api_key');
```

## 🔐 **API 키 발급 방법**

### **1. Google AI Studio 방문**
- [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
- Google 계정으로 로그인

### **2. API 키 생성**
- "Create API Key" 버튼 클릭
- 프로젝트 선택 또는 새 프로젝트 생성
- API 키 복사

### **3. API 키 설정**
- 위의 방법 중 하나를 사용하여 API 키 설정
- 확장 프로그램 재시작

## 🧪 **설정 확인**

### **환경변수 확인**
```javascript
// 개발자 도구 Console에서 실행
console.log('Current API Key:', localStorage.getItem('GEMINI_API_KEY'));
```

### **API 키 유효성 검사**
```javascript
// API 키 테스트
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY')
  .then(response => response.json())
  .then(data => console.log('API Key valid:', data));
```

## 🔒 **보안 주의사항**

- ✅ **환경변수 파일을 Git에 커밋하지 마세요**
- ✅ **API 키를 공개 저장소에 업로드하지 마세요**
- ✅ **`.env` 파일을 `.gitignore`에 추가하세요**
- ✅ **프로덕션 환경에서는 안전한 키 관리 시스템을 사용하세요**

## 🐛 **문제 해결**

### **API 키가 인식되지 않는 경우**
1. 브라우저 캐시 삭제
2. 확장 프로그램 재시작
3. 개발자 도구에서 `localStorage.clear()` 실행

### **CORS 오류가 발생하는 경우**
- API 키가 올바른지 확인
- 네트워크 연결 상태 확인
- Chrome 확장 프로그램 권한 확인

### **API 호출 제한에 걸린 경우**
- Google AI Studio에서 사용량 확인
- API 키의 할당량 확인
- 필요시 결제 정보 추가

## 📞 **지원**

문제가 지속되면 다음을 확인하세요:
- [Google AI Studio 문서](https://ai.google.dev/docs)
- [Chrome 확장 프로그램 개발 가이드](https://developer.chrome.com/docs/extensions/)
- 프로젝트 GitHub Issues
