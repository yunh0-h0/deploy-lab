# 함께 보는 짧은 메모
수업용 가상 메모를 여러 기기에서 저장·조회한다. 로그인·사용자별 격리는 없다. 개인정보는 입력하지 않는다.

브라우저 → Express /api/records → PostgreSQL records. Adminer는 DB 확인 도구이며 앱 요청 경로에 들어가지 않는다.

제공판은 trim 후 1~200자다. 002·003은 아직 구현하지 않았다. 실제 작업 뒤 현재 동작과 검증·배포 상태를 갱신한다.

GET /api/records → 200 {records:[{id,body,createdAt}]} (최신 100개)
POST /api/records JSON {body:"메모"} → 201 {record:{id,body,createdAt}}, 검증 실패 400, DB 실패 503.
/health는 실행·규칙·배포 커밋, /db-check는 접속·스키마 준비를 확인한다. 둘만으로 저장 성공을 판단하지 않는다.
