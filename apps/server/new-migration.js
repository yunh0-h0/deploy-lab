// 새 마이그레이션 파일을 만든다. DB에는 아무것도 하지 않는다. 적용은 npm run migrate.
// 사용: npm run new-migration -- add_title  →  migrations/002_add_title.sql
import { readdir, writeFile } from 'node:fs/promises'
const DRAFT_MARK = '-- [작성 전]'
const name = (process.argv[2] || '').trim().toLowerCase()
if (!/^[a-z][a-z0-9_]*$/.test(name)) {
  console.error('사용: npm run new-migration -- 이름   (영문 소문자·숫자·밑줄, 예: add_title)')
  process.exit(1)
}
const dir = new URL('./migrations/', import.meta.url)
const numbers = (await readdir(dir)).map(n => /^(\d+)_[a-z0-9_]+\.sql$/.exec(n)?.[1]).filter(Boolean).map(Number)
const next = String(Math.max(0, ...numbers) + 1).padStart(3, '0')
const file = `${next}_${name}.sql`
const body = `${DRAFT_MARK} 아래에 SQL을 쓰고 이 줄을 지운 뒤 npm run migrate 한다.
-- 한 번 적용한 뒤에는 이 파일을 고치지 않는다. 다시 바꾸려면 새 마이그레이션을 만든다.
-- 예: ALTER TABLE records ADD COLUMN title TEXT;
`
await writeFile(new URL(file, dir), body, { flag: 'wx' }) // 같은 이름이 있으면 덮어쓰지 않고 실패
console.log(`만듦: apps/server/migrations/${file}`)
console.log('다음: 파일에 SQL을 쓰고 첫 줄을 지운 뒤 npm run migrate')
