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

// 모든 여행에 걸친 최근 장소 1개. 없으면 null (API-SPEC 3절, Home B 블록)
export function getRecentPlace() {
  return request('/api/places/recent')
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

// 장소 사진 한 장 올리기 (D-033, API-SPEC 1절). 성공하면 { filename }을 돌려준다.
// Content-Type은 브라우저가 multipart 경계와 함께 넣으므로 적지 않는다.
export function uploadPlacePhoto(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/api/uploads', { method: 'POST', body })
}

// 저장된 사진 이름으로 보기 주소를 만든다.
export function photoUrl(filename) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}
