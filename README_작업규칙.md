# 다른 컴퓨터용 설정 및 작업 규칙

> 이 문서는 다른 컴퓨터에서도 프로젝트를 설정하고 작업할 때 참고하는 가이드입니다.

## 📋 목차

1. [새 컴퓨터 초기 세팅](#1-새-컴퓨터-초기-세팅)
2. [프로젝트 가져오기](#2-프로젝트-가져오기)
3. [작업 / 저장 / 동기화 규칙](#3-작업--저장--동기화-규칙)
4. [Cursor + AI 사용 시 "채팅종료" 규칙](#4-cursor--ai-사용-시-채팅종료-규칙)

---

## 1. 새 컴퓨터 초기 세팅

### Git 설치

1. https://git-scm.com 에서 Git 다운로드 및 설치
2. 설치 후 터미널에서 확인:
   ```bash
   git --version
   ```

### Node.js + npm 설치

1. https://nodejs.org 에서 **LTS 버전** 다운로드 및 설치
2. 설치 후 확인:
   ```bash
   node -v
   npm -v
   ```

### clasp 설치

```bash
npm install -g @google/clasp
```

### GitHub 로그인/키 설정 (필요시)

- **GitHub 계정 준비**: https://github.com/limoonsa-byte
- **HTTPS 사용 시**: 토큰 또는 자격 증명 설정 필요
- **Git 사용자 정보 설정**:
  ```bash
  git config --global user.name "limoonsa-byte"
  git config --global user.email "limoonsa@gmail.com"
  ```

### Google Apps Script 로그인

```bash
clasp login
```

- 브라우저가 자동으로 열리면 Google 계정 선택 후 권한 허용

---

## 2. 프로젝트 가져오기

### GitHub에서 프로젝트 클론

```bash
git clone https://github.com/limoonsa-byte/Smart-Field_project.git
```

### 프로젝트 폴더로 이동

```bash
cd Smart-Field_project
```

### Apps Script와 연결 설정

1. **`.clasp.json` 파일 확인**
   - 파일이 없으면 `.clasp.json.example` 파일을 복사하여 `.clasp.json` 생성
   - Script ID를 실제 Apps Script 프로젝트 ID로 변경

2. **또는 clasp로 직접 연결**:
   ```bash
   clasp clone "스크립트ID"
   ```
   > Script ID는 Apps Script 에디터에서 확인 가능 (프로젝트 설정 → Script ID)

---

## 3. 작업 / 저장 / 동기화 규칙

### 작업 전 최신 코드 받기

```bash
# GitHub에서 최신 코드 가져오기
git pull

# Apps Script에서 최신 코드 가져오기 (Apps Script 기준이 더 최신일 때)
clasp pull
```

### 코드 수정

- **작업은 이 폴더 안에서만**:
  - `code.js` - Apps Script 메인 코드
  - `index.html` - 메인 HTML 파일
  - `js_*.html` - JavaScript 파일들
  - `css.html` - CSS 스타일

### 작업 중간중간 수동 저장 (필요하면)

#### Apps Script로 업로드:
```bash
clasp push
```

#### GitHub에 저장:
```bash
git add .
git commit -m "작업 내용 한 줄 요약"
git push
```

---

## 4. Cursor + AI 사용 시 "채팅종료" 규칙

### ⚠️ 중요: 작업 종료 시 반드시 실행

이 프로젝트를 Cursor에서 열고 AI에게 작업을 시킨 뒤, **마지막에 꼭 다음을 입력**:

```
채팅종료
```

### "채팅종료" 입력 시 자동 실행되는 작업

AI가 자동으로 다음을 실행합니다:

1. **`clasp push`** → Google Apps Script로 최신 코드 업로드
2. **`git add .`** → 변경사항 스테이징
3. **`git commit -m "..."`** → 커밋 생성
4. **`git push`** → GitHub에 푸시

> 즉, **"오늘 작업 끝!" → 채팅에 "채팅종료" 입력** 이라고 기억해두면 됩니다.

### 목적

로컬, Apps Script, GitHub 상태를 **최대한 동일하게 맞춤**

---

## 📝 작업 흐름 요약

```
1. 작업 시작 전
   git pull          # GitHub에서 최신 코드 받기
   clasp pull        # Apps Script에서 최신 코드 받기 (필요시)

2. 코드 수정
   (로컬에서 파일 수정)

3. 중간 저장 (선택사항)
   clasp push        # Apps Script에 업로드
   git add . && git commit -m "..." && git push  # GitHub에 저장

4. 작업 종료 시
   "채팅종료" 입력   # 자동으로 clasp push + git push 실행
```

---

## 🔧 문제 해결

### Git 사용자 정보 오류
```bash
git config --global user.name "limoonsa-byte"
git config --global user.email "limoonsa@gmail.com"
```

### clasp 로그인 오류
```bash
clasp login
# 브라우저에서 Google 계정 인증
```

### 경로 오류 (한글 경로)
- PowerShell에서 한글 경로가 인식되지 않는 경우 Git Bash 사용 권장

### Script ID 확인 방법
1. Google Apps Script 에디터 접속
2. 프로젝트 설정 (⚙️ 아이콘)
3. Script ID 복사

---

## 📚 참고 자료

- [clasp 공식 문서](https://github.com/google/clasp)
- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Git 기본 사용법](https://git-scm.com/book/ko/v2)
- [프로젝트 README.md](./README.md)

---

**마지막 업데이트**: 2026년 2월