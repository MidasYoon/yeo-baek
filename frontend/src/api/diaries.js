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

// 모든 여행에 걸친 최근 일기 1개. 없으면 null (API-SPEC 4절, Home C 블록에서 씀)
export function getRecentDiary() {
  return request('/api/diaries/recent')
}

export function getDiary(id) {
  return request(`/api/diaries/${encodeURIComponent(id)}`)
}

export function createDiary(data) {
  return request('/api/diaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateDiary(id, data) {
  return request(`/api/diaries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteDiary(id) {
  return request(`/api/diaries/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 일기 사진 올리기 (D-033, API-SPEC 1절). 성공하면 { filename }을 돌려준다.
// Content-Type은 브라우저가 multipart 경계와 함께 넣으므로 적지 않는다.
export function uploadDiaryPhoto(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/api/uploads', { method: 'POST', body })
}

// 저장된 사진 이름으로 보기 주소를 만든다.
export function photoUrl(filename) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}
