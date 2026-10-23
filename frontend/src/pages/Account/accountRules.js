// 회원 입력 규칙과 안내 문구 (팀 공동, D-042). PRD 7절 3번, SCREEN-SPEC 8절 4번.
// 규칙은 서버(backend/routers/users.py)와 같다.

const LOGIN_ID_PATTERN = /^[a-z0-9_]{4,20}$/
// 공백을 뺀 영문·숫자·기호(ASCII ! ~ ~) 8~20자
const PASSWORD_PATTERN = /^[!-~]{8,20}$/

export const LOGIN_ID_HELP = '영문 소문자·숫자·_ 4~20자'
export const PASSWORD_HELP = '영문·숫자·기호 8~20자'
export const NICKNAME_HELP = '2~10자'

export function checkLoginId(value) {
  if (value === '') return '아이디를 적어 주세요'
  if (!LOGIN_ID_PATTERN.test(value)) return '영문 소문자·숫자·_로 4~20자를 적어 주세요'
  return null
}

export function checkPassword(value) {
  if (value === '') return '비밀번호를 적어 주세요'
  if (!PASSWORD_PATTERN.test(value)) return '영문·숫자·기호로 8~20자를 적어 주세요'
  return null
}

export function checkPasswordConfirm(password, confirm) {
  return password === confirm ? null : '비밀번호가 서로 달라요'
}

export function checkNickname(value) {
  if (value.trim() === '') return '닉네임을 적어 주세요'
  const length = Array.from(value.trim()).length
  if (length < 2 || length > 10) return '닉네임은 2~10자로 적어 주세요'
  return null
}

// 값이 null인 칸을 뺀 오류 객체
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}
