// 회원 서버 호출 (담당: 팀 공동, D-042). docs/API-SPEC.md 7절.
// 로그인 쿠키(HttpOnly)는 브라우저가 같은 주소로 저절로 보낸다. 화면 코드는 쿠키를 읽지 않는다.

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

function sendJson(url, method, data) {
  return request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

// 지금 로그인한 회원. 로그인하지 않았으면 null.
export function getMe() {
  return request('/api/users/me')
}

// 회원가입. 성공하면 바로 로그인되고 회원 객체를 돌려준다. 아이디가 겹치면 409.
export function signup(data) {
  return sendJson('/api/users', 'POST', data)
}

// 로그인. 아이디·비밀번호가 틀리면 401.
export function login(data) {
  return sendJson('/api/users/login', 'POST', data)
}

export function logout() {
  return request('/api/users/logout', { method: 'POST' })
}

// 회원정보수정. 지금 비밀번호가 틀리면 403, 로그인이 풀렸으면 401.
export function updateMe(data) {
  return sendJson('/api/users/me', 'PUT', data)
}

// 프로필사진 올리기 (D-033, API-SPEC 1절). 성공하면 { filename }을 돌려준다.
// Content-Type은 브라우저가 multipart 경계와 함께 넣으므로 적지 않는다.
export function uploadProfilePhoto(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/api/uploads', { method: 'POST', body })
}

// 저장된 사진 이름으로 보기 주소를 만든다.
export function photoUrl(filename) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}
