// AI 여행지 추천 서버 호출 (담당: 팀 공동). docs/API-SPEC.md 6절, D-037·D-038.

// 성공하면 JSON을 돌려주고, 실패하면 status와 detail을 담은 Error를 던진다.
async function request(url, options) {
  const res = await fetch(url, options)
  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(`요청 실패: ${res.status}`)
    error.status = res.status
    error.detail = body?.detail ?? null
    throw error
  }
  return body
}

// answers: { mood, styles, companion, duration, note }. { items }를 돌려준다 (3곳).
// 키가 없으면 status 503, 그 밖의 실패는 502·422 등으로 던진다.
export function getRecommendation(answers) {
  return request('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  })
}
