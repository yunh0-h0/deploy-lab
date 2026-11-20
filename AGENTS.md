# deploy-lab 공통 작업 지침

- 프런트 apps/web(React+Vite), 서버 apps/server(Express+pg), DB PostgreSQL. ORM·새 프레임워크는 추가하지 않는다.
- DB 구조 변경은 npm run new-migration -- 이름으로 새 파일을 만들어 작성하고 npm run migrate로 적용한다. 이미 적용한 SQL은 고치지 않는다.
