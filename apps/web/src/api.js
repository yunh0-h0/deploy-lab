// 서버 주소는 여기서만 정한다. 코드 안에 주소를 직접 쓰지 않는다.
//   내 컴퓨터: .env.development 의 VITE_API_URL (http://localhost:3000)
//   Vercel:    Vercel 환경변수 VITE_API_URL (https://○○.onrender.com) → 넣은 뒤 다시 배포해야 반영된다
// VITE_로 시작하는 값은 빌드할 때 코드에 박혀 브라우저에 공개된다. 비밀값을 두지 않는다.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

// 서버에 GET 요청을 보내고 { ok, status, body, ms } 를 돌려준다
export async function getJson(path, { signal } = {}) {
  const t0 = performance.now()
  const res = await fetch(API_URL + path, { signal })
  const body = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, body, ms: Math.round(performance.now() - t0) }
}
