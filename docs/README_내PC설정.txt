===========================================
다른 컴퓨터용 지시사항 (복붙해서 쓰기 좋게 정리)
===========================================

아래 내용을 메모장이나 이 파일로 저장해 두고, 다른 컴퓨터에서도 그대로 따라 하시면 됩니다.

===========================================
1. 새 컴퓨터 초기 세팅
===========================================

■ Git 설치
  - https://git-scm.com 에서 설치
  - 설치 후 터미널에서 git --version 확인

■ Node.js + npm 설치
  - https://nodejs.org 에서 LTS 버전 설치
  - node -v, npm -v로 확인

■ clasp 설치
  npm install -g @google/clasp

■ GitHub 로그인/키 설정 (필요시)
  - GitHub 계정 준비
  - HTTPS 사용 시, 토큰 또는 자격 증명 설정
  - Git 사용자 정보 설정:
    git config --global user.name "limoonsa-byte"
    git config --global user.email "limoonsa@gmail.com"

■ Google Apps Script 로그인
  clasp login
  (브라우저 열리면 Google 계정 선택 후 권한 허용)

===========================================
2. 프로젝트 가져오기
===========================================

■ GitHub에서 프로젝트 클론
  git clone https://github.com/limoonsa-byte/Smart-Field_project.git

■ 프로젝트 폴더로 이동
  cd Smart-Field_project

■ Apps Script 연결 확인
  - .clasp.json 이 존재하는지 확인
  - 필요하면 clasp clone "스크립트ID" 로 다시 연결
  - 또는 .clasp.json.example 파일을 복사하여 .clasp.json 생성 후 Script ID 입력

===========================================
3. 작업 / 저장 / 동기화 규칙
===========================================

■ 작업 전 최신 코드 받기
  git pull
  clasp pull   # Apps Script 기준이 더 최신일 때 사용

■ 코드 수정은 이 폴더 안에서만
  - code.js, index.html, js_*.html 등

■ 작업 중간중간 수동 저장(필요하면)
  
  Apps Script로 업로드:
    clasp push
  
  GitHub에 저장:
    git add .
    git commit -m "작업 내용 한 줄 요약"
    git push

===========================================
4. Cursor + AI 사용할 때 "채팅종료" 규칙
===========================================

이 프로젝트를 Cursor에서 열고 AI에게 작업을 시킨 뒤, 마지막에 꼭 다음을 입력:

"채팅종료"

채팅창에 "채팅종료" 라고 쓰면, AI가 아래를 자동으로 실행하도록 설정해 둠:
  - clasp push → Google Apps Script로 최신 코드 업로드
  - git add, git commit, git push → GitHub에 커밋 + 푸시
  - 로컬, Apps Script, GitHub 상태를 최대한 동일하게 맞춤

> 즉, "오늘 작업 끝!" → 채팅에 "채팅종료" 입력 이라고 기억해두면 됩니다.

===========================================
작업 흐름 요약
===========================================

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

===========================================
