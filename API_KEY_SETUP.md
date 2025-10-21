# 🔑 API 키 설정 가이드

## 📋 **Gemini API 키 발급 방법**

### 1️⃣ **Google AI Studio 접속**
- [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- Google 계정으로 로그인

### 2️⃣ **API 키 생성**
- "Create API Key" 버튼 클릭
- 새 API 키가 생성됨
- **복사해서 안전한 곳에 보관**

### 3️⃣ **확장 프로그램에 설정**

#### 방법 1: UI를 통한 설정
1. 확장 프로그램 팝업 열기
2. **🔑 API Key** 버튼 클릭
3. API 키 입력
4. **✅ 저장 완료**

#### 방법 2: 코드 직접 수정
```javascript
// ai/gemini-client.js 파일에서
GEMINI_API_KEY: '여기에_실제_API_키_입력',
```

## 🆓 **무료 사용량**
- **일일 1,500 요청** (무료)
- **분당 15 요청** 제한
- **충분한 테스트 가능**

## ⚠️ **주의사항**
- API 키는 **절대 공유하지 마세요**
- GitHub에 올릴 때는 **반드시 제거**
- `.env` 파일이나 Chrome Storage 사용 권장

## 🚀 **테스트 방법**
1. API 키 설정 후
2. 웹페이지에서 **요약** 버튼 클릭
3. 정상 작동 확인

---
**💡 팁**: API 키가 없어도 확장 프로그램은 로드되지만, AI 기능은 작동하지 않습니다.
