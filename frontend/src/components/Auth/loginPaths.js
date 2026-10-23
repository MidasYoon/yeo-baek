// 로그인과 관련된 주소 규칙 (팀 공동, D-042). SCREEN-SPEC 1절 "로그인이 필요한 화면", 8절 1번.

// 로그인해야 열 수 있는 화면. 로그아웃하면 이 화면에서는 Home으로 간다 (SCREEN-SPEC 8절 3번).
// 이 화면들은 App.jsx에서 RequireLogin으로 감싼다.
const LOGIN_REQUIRED_PATHS = [
  /^\/trip\/new$/,
  /^\/trip\/[^/]+\/edit$/,
  /^\/place\/new$/,
  /^\/place\/[^/]+\/edit$/,
  /^\/diary\/new$/,
  /^\/diary\/[^/]+\/edit$/,
  /^\/me\/edit$/,
]

export function isLoginRequiredPath(pathname) {
  return LOGIN_REQUIRED_PATHS.some((pattern) => pattern.test(pathname))
}

// next에는 "/"로 시작하는 앱 안 주소만 받는다. 아니면 "/" (다른 사이트로 보내지 않기 위해서다).
export function safeNext(next) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}

// 로그인 화면 주소. next가 "/"면 붙이지 않는다.
export function loginUrl(next, page = '/login') {
  return next && next !== '/' ? `${page}?next=${encodeURIComponent(next)}` : page
}
