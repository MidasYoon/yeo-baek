// 여행지 정보 서버 호출 (담당: 은희). docs/API-SPEC.md 3절.

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

export function getPlaces(tripId) {
  return request(`/api/places?trip_id=${encodeURIComponent(tripId)}`)
}

export function getPlace(id) {
  return request(`/api/places/${encodeURIComponent(id)}`)
}

export function createPlace(data) {
  return request('/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updatePlace(id, data) {
  return request(`/api/places/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deletePlace(id) {
  return request(`/api/places/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
