import { makePool, dbInfo, dbError } from './db.js'
const pool = makePool()
try {
  if (!pool) throw Error('설정 없음')
  const r = await pool.query('SELECT name FROM schema_migrations ORDER BY name')
  const c = await pool.query('SELECT count(*)::int AS count FROM records')
  console.log(JSON.stringify({ ok: true, ...dbInfo(), migrations: r.rows.map(x => x.name), records: c.rows[0].count }, null, 2))
} catch(e) { console.error(dbError(e)); process.exitCode = 1 }
finally { await pool?.end() }
