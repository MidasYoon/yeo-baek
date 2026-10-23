// 여행 댓글 서버 호출 (담당: 팀 공동, D-042). docs/API-SPEC.md 9절.

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

// 여행별 댓글 목록. 먼저 쓴 것이 앞.
export function getComments(tripId) {
  return request(`/api/comments?trip_id=${encodeURIComponent(tripId)}`)
}

// 댓글 쓰기. 성공하면 만든 댓글 객체를 돌려준다.
export function createComment(tripId, content) {
  return request('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip_id: tripId, content }),
  })
}

// 댓글 지우기. 쓴 회원만 지운다 (아니면 403).
export function deleteComment(id) {
  return request(`/api/comments/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
