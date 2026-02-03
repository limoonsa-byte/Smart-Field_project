# GitHub 연동 완료 가이드

## ✅ 완료된 작업

1. ✅ `.gitignore` 파일 업데이트 (Apps Script 관련 파일 제외)
2. ✅ `README.md` 파일 생성 (프로젝트 설명 및 가이드)
3. ✅ `.clasp.json.example` 템플릿 파일 생성
4. ✅ Git 저장소 초기화 확인 (이미 완료됨)

## 🔧 남은 작업

### 1. Git 사용자 정보 설정

GitHub에 커밋하기 전에 사용자 정보를 설정해야 합니다:

```powershell
# 전역 설정 (모든 프로젝트에 적용)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 또는 이 프로젝트에만 적용
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2. 변경사항 커밋 및 푸시

```powershell
# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "GitHub 연동 설정 추가: .gitignore 업데이트, README.md 및 .clasp.json.example 추가"

# GitHub에 푸시
git push origin main
```

## 📋 Apps Script 연동 확인

### 현재 설정 상태

- ✅ `.clasp.json` 파일 존재 (scriptId 포함)
- ✅ `appsscript.json` 매니페스트 파일 존재
- ✅ 모든 코드 파일 준비 완료

### clasp를 사용한 배포

```bash
# clasp 설치 (처음 한 번만)
npm install -g @google/clasp

# Google 로그인 (처음 한 번만)
clasp login

# 코드 푸시 (변경사항을 Apps Script에 반영)
clasp push

# 코드 풀 (Apps Script에서 변경사항 가져오기)
clasp pull
```

## 🔐 보안 주의사항

- ⚠️ `.clasp.json` 파일은 `.gitignore`에 포함되어 있어 GitHub에 업로드되지 않습니다
- ⚠️ 각 개발자는 자신의 `.clasp.json` 파일을 로컬에 생성해야 합니다
- ⚠️ `.clasp.json.example` 파일을 참고하여 설정하세요

## 📝 다음 단계

1. Git 사용자 정보 설정
2. 변경사항 커밋 및 푸시
3. GitHub 저장소에서 파일 확인
4. 필요시 `.clasp.json` 파일을 로컬에 생성하여 Apps Script 연동

## 🆘 문제 해결

### Git 사용자 정보 오류
```
Author identity unknown
```
→ 위의 "Git 사용자 정보 설정" 섹션 참고

### 경로 오류 (한글 경로)
→ PowerShell에서 한글 경로가 인식되지 않는 경우, Git Bash 사용 권장

### clasp 로그인 오류
→ `clasp login` 실행 후 브라우저에서 Google 계정 인증 필요

## 📚 참고 자료

- [clasp 공식 문서](https://github.com/google/clasp)
- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Git 기본 사용법](https://git-scm.com/book/ko/v2)