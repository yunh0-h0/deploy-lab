import pg from 'pg'
export function dbInfo(url = process.env.DATABASE_URL) {
  if (!url) return { location: '설정 없음', host: null, local: false }
  try {
    const u = new URL(url)
    if (!['postgres:', 'postgresql:'].includes(u.protocol)) throw Error()
    const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(u.hostname)
    return { location: local ? '내 컴퓨터 (Docker)' : u.hostname.endsWith('.neon.tech') ? 'Neon' : '외부 DB', host: u.hostname, local }
  } catch { return { location: '주소 형식 오류', host: null, local: false } }
}
export function makePool(url = process.env.DATABASE_URL) {
  const info = dbInfo(url)
  if (!info.host) return null
  const u = new URL(url)
  u.searchParams.delete('sslmode'); u.searchParams.delete('channel_binding')
  const pool = new pg.Pool({ connectionString: u.toString(), ssl: info.local ? false : true, max: 5, connectionTimeoutMillis: 10000, query_timeout: 10000 })
  pool.on('error', () => console.error('[DB] 유휴 연결 오류. DB 상태를 다시 확인하세요.'))
  return pool
}
export function dbError(err) {
  return ({ ECONNREFUSED: 'DB가 꺼져 있거나 포트가 다릅니다', ENOTFOUND: 'DB 호스트를 찾을 수 없습니다', '28P01': 'DB 계정 또는 비밀번호가 다릅니다', '42P01': '표가 없습니다. db:migrate를 실행하세요', ETIMEDOUT: 'DB 연결 시간 초과' })[err.code] || 'DB 요청 실패. 설정·접속 권한·서버 로그를 확인하세요'
}
