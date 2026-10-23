// 주인 확인 (팀 공동, D-042). 장소·일기는 그 여행의 주인을 따른다.
// 화면은 주인이 아니면 버튼을 숨기고, 서버는 401·403으로 한 번 더 막는다 (API-SPEC 1절 "로그인").

// 로그인한 회원이 그 여행(user_id)의 주인인지. 주인 없는 여행(null)은 누구의 것도 아니다.
export function isTripOwner(user, tripUserId) {
  return Boolean(user) && tripUserId != null && user.id === tripUserId
}
