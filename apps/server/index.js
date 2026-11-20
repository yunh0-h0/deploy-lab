import express from 'express'
import { makePool, dbInfo, dbError } from './db.js'
import { RULES, RELEASE, validate } from './rules.js'
const app = express()
const pool = makePool()
const info = dbInfo()
const PORT = Number(process.env.PORT || 3000)
const origins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim().replace(/\/+$/, ''))
const startedAt = new Date().toISOString()
app.disable('x-powered-by')
app.use((req,res,next) => {
  res.set('Cache-Control','no-store')
  if (['/health','/db-check'].includes(req.path)) res.set('Access-Control-Allow-Origin','*')
  else if (origins.includes(req.get('Origin'))) {
    res.set('Access-Control-Allow-Origin',req.get('Origin'))
    res.set('Vary','Origin')
    res.set('Access-Control-Allow-Methods','GET, POST, OPTIONS')
    res.set('Access-Control-Allow-Headers','Content-Type')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use(express.json({ limit: '8kb' }))
app.get('/health',(req,res) => res.json({ ok:true, release:RELEASE, commit:process.env.RENDER_GIT_COMMIT || process.env.LAB_COMMIT || null, rules:RULES, startedAt }))
app.get('/db-check',async(req,res) => {
  try {
    if (!pool) throw Error('설정 없음')
    await pool.query('SELECT 1')
    const schema = await pool.query("SELECT to_regclass('public.records') IS NOT NULL AS ready")
    res.json({ ok:true, location:info.location, host:info.host, schemaReady:schema.rows[0].ready })
  } catch(e) { res.status(503).json({ ok:false, location:info.location, reason:dbError(e) }) }
})
app.get('/api/records',async(req,res) => {
  try {
    if (!pool) throw Error()
    const r = await pool.query('SELECT id::text,body,created_at AS "createdAt" FROM records ORDER BY id DESC LIMIT 100')
    res.json({ records:r.rows })
  } catch(e) { res.status(503).json({ error:dbError(e) }) }
})
app.post('/api/records',async(req,res) => {
  const v = validate(req.body?.body)
  if (v.error) return res.status(400).json({ error:v.error })
  try {
    if (!pool) throw Error()
    const r = await pool.query('INSERT INTO records(body) VALUES($1) RETURNING id::text,body,created_at AS "createdAt"',[v.text])
    res.status(201).json({ record:r.rows[0] })
  } catch(e) { res.status(503).json({ error:dbError(e) }) }
})
app.use((req,res) => res.status(404).json({ error:'없는 경로', available:['/health','/db-check','/api/records'] }))
app.use((e,req,res,next) => res.status(e.status===413?413:400).json({ error:'JSON 형식 또는 요청 크기를 확인하세요' }))
const server=app.listen(PORT,'0.0.0.0',() => console.log(`[서버] ${PORT} / DB: ${info.location} / 스키마는 db:migrate로 적용`))
for (const sig of ['SIGINT','SIGTERM']) process.on(sig,() => { server.close(async() => { await pool?.end(); process.exit(0) }) })
