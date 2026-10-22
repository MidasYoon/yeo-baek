// 409 안내에 쓸 "장소 N곳, 일기 N편" 글자 (담당: 서준). SCREEN-SPEC 3절 4번.
// N이 0인 쪽은 빼고 적는다. 상세(지우기)와 폼(기간 수정)이 함께 쓴다.
export function countText({ place_count: placeCount, diary_count: diaryCount }) {
  const parts = []
  if (placeCount > 0) parts.push(`장소 ${placeCount}곳`)
  if (diaryCount > 0) parts.push(`일기 ${diaryCount}편`)
  return parts.join(', ')
}
