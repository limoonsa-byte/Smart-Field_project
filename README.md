# 스마트 현장관리 시스템 V6.1

Google Apps Script 기반의 현장 관리 및 견적 시스템입니다.

## 주요 기능

- 🎨 **도면 그리기**: 벽체, 가구, 문 등을 그려서 현장 도면 작성
- 📦 **도면 보관함**: 작성한 도면을 Google Sheets에 저장 및 관리
- 💰 **견적 내기**: 도면 기반으로 자동 견적서 생성
- ⚙️ **관리자 세팅**: 단가표 및 품목 관리

## 기술 스택

- **Backend**: Google Apps Script
- **Frontend**: HTML5, JavaScript, Bootstrap 5
- **Storage**: Google Sheets

## 프로젝트 구조

```
Smart Field_project/
├── code.js              # Apps Script 메인 코드
├── index.html           # 메인 HTML 파일
├── css.html             # CSS 스타일
├── js_main.html         # 메인 JavaScript
├── js_drawing.html      # 도면 그리기 JavaScript
├── js_history.html      # 보관함 JavaScript
├── js_estimate.html     # 견적 JavaScript
├── js_settings.html     # 설정 JavaScript
├── appsscript.json      # Apps Script 매니페스트
└── .clasp.json          # clasp 설정 (로컬 전용)
```

## 설정 방법

### 1. Google Apps Script 프로젝트 생성

1. [Google Apps Script](https://script.google.com/)에 접속
2. 새 프로젝트 생성
3. 프로젝트 이름을 "스마트 현장관리"로 설정

### 2. clasp 설치 및 설정

```bash
# clasp 설치 (Node.js 필요)
npm install -g @google/clasp

# Google 로그인
clasp login

# 프로젝트 연결
clasp clone --scriptId YOUR_SCRIPT_ID_HERE
```

### 3. .clasp.json 설정

`.clasp.json.example` 파일을 복사하여 `.clasp.json`을 만들고, `YOUR_SCRIPT_ID_HERE`를 실제 Script ID로 변경하세요.

```bash
# Windows PowerShell
Copy-Item .clasp.json.example .clasp.json

# 또는 수동으로 생성
```

`.clasp.json` 파일 내용:
```json
{
  "scriptId": "여기에_실제_Script_ID_입력",
  "rootDir": "",
  "scriptExtensions": [".js", ".gs"],
  "htmlExtensions": [".html"],
  "jsonExtensions": [".json"],
  "filePushOrder": [],
  "skipSubdirectories": false
}
```

### 4. Google Sheets 설정

1. 새 Google Sheets 문서 생성
2. Apps Script 에디터에서 `setupPriceTables()` 함수 실행
   - 이 함수는 모든 단가표 시트를 자동으로 생성합니다
3. 웹 앱으로 배포
   - Apps Script 에디터 → 배포 → 새 배포
   - 유형: 웹 앱
   - 실행 사용자: 나
   - 액세스 권한: 모든 사용자

### 5. 코드 배포

```bash
# 코드 푸시
clasp push

# 코드 풀 (서버에서 변경사항 가져오기)
clasp pull
```

## GitHub 연동

### 저장소 초기화

```bash
# Git 저장소 초기화
git init

# 원격 저장소 추가 (GitHub에서 생성한 저장소 URL 사용)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: 스마트 현장관리 시스템"

# GitHub에 푸시
git branch -M main
git push -u origin main
```

### 주의사항

- `.clasp.json` 파일은 `.gitignore`에 포함되어 있어 GitHub에 업로드되지 않습니다
- 각 개발자는 자신의 `.clasp.json` 파일을 로컬에 생성해야 합니다
- `.clasp.json.example` 파일을 참고하여 설정하세요

## 사용 방법

1. Google Sheets에서 웹 앱 URL로 접속
2. 메인 화면에서 원하는 기능 선택:
   - **도면 그리기**: 현장 도면 작성
   - **도면 보관함**: 저장된 도면 확인 및 관리
   - **견적 내기**: 도면 기반 견적서 생성
   - **관리자 세팅**: 단가표 및 품목 관리 (비밀번호: 2021)

## 개발 가이드

### 로컬 개발

1. 코드 수정 후 `clasp push`로 Apps Script에 반영
2. 웹 앱에서 변경사항 확인

### 디버깅

- Apps Script 에디터의 실행 로그 확인
- 브라우저 개발자 도구 콘솔 확인
- `code.js`의 `Logger.log()` 사용

## 라이선스

이 프로젝트는 개인/내부 사용 목적으로 제작되었습니다.

## 버전 정보

- **현재 버전**: V6.1
- **최종 업데이트**: 2026년 2월

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.