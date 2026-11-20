# 서버 전용
루트 AGENTS.md를 따른다. npm run dev / db:migrate / db:check / test를 이 폴더에서 실행한다. 새 마이그레이션 파일은 루트의 npm run new-migration -- 이름으로 만든다. 서버 규칙은 rules.js에 있다. 모든 입력을 서버에서 재검증하고 SQL 매개변수를 사용한다. /health·/db-check는 비밀값을 반환하지 않는다. CORS는 인증이 아니다. DB 스키마 변경이 없으면 새 마이그레이션은 필요 없다.
