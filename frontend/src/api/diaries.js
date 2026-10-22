// 여행 다이어리 서버 호출 (담당: 건용). docs/API-SPEC.md 4절.

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

export function getDiaries(tripId) {
  return request(`/api/diaries?trip_id=${encodeURIComponent(tripId)}`)
}
