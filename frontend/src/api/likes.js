// 여행 좋아요 서버 호출 (담당: 팀 공동, D-042). docs/API-SPEC.md 8절.
// 누르기·취소 모두 좋아요 상태 { trip_id, like_count, liked }를 돌려준다.

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

export function likeTrip(tripId) {
  return request('/api/likes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip_id: tripId }),
  })
}

export function unlikeTrip(tripId) {
  return request(`/api/likes?trip_id=${encodeURIComponent(tripId)}`, { method: 'DELETE' })
}
