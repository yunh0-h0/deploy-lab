// M13: maxLength를 20으로. M17: minLength를 2로. 먼저 스펙을 읽으세요.
export const RULES = Object.freeze({ minLength: 1, maxLength: 200 })
export const RELEASE = 'starter-1'
export function validate(body) {
  if (typeof body !== 'string') return { error: 'body는 문자열이어야 합니다' }
  const text = body.trim()
  if (text.length < RULES.minLength || text.length > RULES.maxLength) return { error: `공백 제거 후 ${RULES.minLength}~${RULES.maxLength}자로 입력하세요` }
  return { text }
}
