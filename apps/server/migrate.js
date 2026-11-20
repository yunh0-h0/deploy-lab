import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { makePool, dbInfo, dbError } from './db.js'
const pool = makePool()
if (!pool) { console.error('DATABASE_URL이 없거나 형식이 틀렸습니다'); process.exit(1) }
let client
try {
  console.log('마이그레이션 대상:', dbInfo().location, dbInfo().host)
  client = await pool.connect()
  await client.query('BEGIN')
  await client.query('SELECT pg_advisory_xact_lock(12613001)')
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())')
  const dir = new URL('./migrations/', import.meta.url)
  for (const name of (await readdir(dir)).filter(n => /^\d+_[a-z0-9_]+\.sql$/.test(n)).sort()) {
    const sql = await readFile(new URL(name, dir), 'utf8')
    if (sql.includes('-- [작성 전]')) throw Object.assign(Error(`${name}은 아직 작성 전입니다. SQL을 쓰고 첫 줄 '-- [작성 전]'을 지운 뒤 다시 실행하세요`), { safe: true })
    const checksum = createHash('sha256').update(sql).digest('hex')
    const old = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [name])
    if (old.rowCount) {
      if (old.rows[0].checksum !== checksum) throw Object.assign(Error('적용한 SQL을 수정했습니다. 기존 파일을 되돌리고 새 마이그레이션을 만드세요'), { safe: true })
      console.log('이미 적용:', name); continue
    }
    await client.query(sql)
    await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [name, checksum])
    console.log('적용:', name)
  }
  await client.query('COMMIT'); console.log('마이그레이션 완료')
} catch (e) {
  if (client) await client.query('ROLLBACK').catch(() => {})
  console.error(e.safe ? e.message : dbError(e)); process.exitCode = 1
} finally { client?.release(); await pool.end() }
