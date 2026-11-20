// 화면 아래 연결 상태 줄. 지우지 않는다 (교수자가 URL 하나로 세 층을 확인하는 곳).
// 앱이 열리면 서버의 /health 와 /db-check 를 불러 결과를 보여 준다. 비밀값은 보여 주지 않는다.
import { useCallback, useEffect, useRef, useState } from 'react'
import { API_URL, getJson } from './api.js'

const WAKE_HINT_MS = 3000 // 이보다 오래 걸리면 "깨우는 중"이라고 알려 준다
const GIVE_UP_MS = 90000 // 무료 서버가 깨어나는 데 1분쯤 걸릴 수 있어 넉넉히 기다린다

function explainFetchError(err) {
  if (err.name === 'AbortError') return '90초 동안 응답이 없습니다'
  if (location.protocol === 'https:' && API_URL.startsWith('http:')) {
    return 'https 사이트에서 http 서버 주소를 부를 수 없습니다 (VITE_API_URL 확인)'
  }
  return '응답 없음 — 서버가 꺼져 있거나 주소가 틀렸습니다'
}

export default function StatusBar() {
  const [server, setServer] = useState({ state: 'checking' })
  const [db, setDb] = useState({ state: 'waiting' })
  const [round, setRound] = useState(0)
  const timers = useRef([])

  const check = useCallback(async (signal) => {
    setServer({ state: 'checking' })
    setDb({ state: 'waiting' })
    timers.current.push(setTimeout(() => setServer((s) => (s.state === 'checking' ? { state: 'waking' } : s)), WAKE_HINT_MS))

    try {
      // 무료 서버가 깨어나는 동안에는 JSON 대신 안내 화면이 올 수 있다 → 잠시 뒤 다시 묻는다
      const t0 = performance.now()
      let h = await getJson('/health', { signal })
      while (h.body?.ok !== true && h.status !== 404 && performance.now() - t0 < GIVE_UP_MS) {
        setServer({ state: 'waking' })
        await new Promise((r) => setTimeout(r, 3000))
        h = await getJson('/health', { signal })
      }
      if (h.body?.ok !== true) return setServer({ state: 'fail', text: `오류 ${h.status}` })
      const sec = ((performance.now() - t0) / 1000).toFixed(1)
      setServer({ state: 'ok', text: `응답함 (${sec}초)` })
    } catch (err) {
      if (signal.aborted && signal.reason === 'unmount') return
      return setServer({ state: 'fail', text: explainFetchError(err) })
    }

    setDb({ state: 'checking' })
    try {
      const d = await getJson('/db-check', { signal })
      const where = d.body?.location || 'DB'
      if (d.ok) setDb({ state: 'ok', where, text: '연결됨' })
      else setDb({ state: 'fail', where, text: d.body?.reason || `오류 ${d.status}` })
    } catch (err) {
      if (signal.aborted && signal.reason === 'unmount') return
      setDb({ state: 'fail', where: 'DB', text: explainFetchError(err) })
    }
  }, [])

  useEffect(() => {
    if (!API_URL) return
    const ctrl = new AbortController()
    const giveUp = setTimeout(() => ctrl.abort(), GIVE_UP_MS)
    check(ctrl.signal)
    return () => {
      clearTimeout(giveUp)
      timers.current.forEach(clearTimeout)
      timers.current = []
      ctrl.abort('unmount')
    }
  }, [check, round])

  if (!API_URL) {
    return (
      <footer className="status">
        <span className="item">
          <span className="dot fail" />
          <span>
            서버 주소가 없습니다 — Vercel 환경변수에 <code>VITE_API_URL</code>을 넣고 다시 배포하세요
          </span>
        </span>
      </footer>
    )
  }

  const serverLabel = {
    checking: '확인 중…',
    waking: '서버 깨우는 중… (무료 서버는 깨어나는 데 1분쯤 걸립니다)',
  }[server.state] || server.text

  const dbLabel = { waiting: '서버 응답을 기다리는 중', checking: '확인 중…' }[db.state] || db.text

  return (
    <footer className="status">
      <span className="item">
        서버: <code>{API_URL}</code> <span className={`dot ${server.state}`} /> {serverLabel}
      </span>
      <span className="item">
        DB: {db.where || ''} <span className={`dot ${db.state}`} /> {dbLabel}
      </span>
      <button type="button" className="recheck" onClick={() => setRound((r) => r + 1)}>
        다시 확인
      </button>
    </footer>
  )
}
