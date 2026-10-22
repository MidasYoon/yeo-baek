// 여행기록 서버 호출 (담당: 서준). docs/API-SPEC.md 2절.

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

export function getTrips() {
  return request('/api/trips')
}

export function getTrip(id) {
  return request(`/api/trips/${encodeURIComponent(id)}`)
}

export function createTrip(data) {
  return request('/api/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateTrip(id, data) {
  return request(`/api/trips/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteTrip(id) {
  return request(`/api/trips/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 대표사진 올리기 (D-033, API-SPEC 1절). 성공하면 { filename }을 돌려준다.
// Content-Type은 브라우저가 multipart 경계와 함께 넣으므로 적지 않는다.
export function uploadTripPhoto(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/api/uploads', { method: 'POST', body })
}

// 저장된 사진 이름으로 보기 주소를 만든다.
export function photoUrl(filename) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}
