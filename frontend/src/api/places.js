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

// 전체 보기 한 페이지 (D-034, API-SPEC 3절). { items, total }을 돌려준다. 항목마다 trip_name이 있다.
export function getPlacePage(page) {
  return request(`/api/places/page?page=${encodeURIComponent(page)}`)
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

// 카카오맵 JavaScript SDK (D-036, ARCHITECTURE 5절). 키는 frontend/.env의 VITE_KAKAO_MAP_KEY.
// 백엔드를 거치지 않고 브라우저가 카카오에서 바로 불러온다. 장소 검색(services)도 함께 불러온다.
const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
const KAKAO_TIMEOUT_MS = 10000
let kakaoPromise = null

// SDK를 한 번만 불러와 kakao.maps를 돌려준다. 키가 없거나 불러오지 못하면 Error를 던진다.
// 실패하면 다음 호출에서 다시 시도한다.
export function loadKakaoMaps() {
  if (kakaoPromise) return kakaoPromise
  kakaoPromise = new Promise((resolve, reject) => {
    if (!KAKAO_KEY) {
      reject(new Error('카카오맵 키가 없어요'))
      return
    }
    const ready = () => window.kakao.maps.load(() => resolve(window.kakao.maps))
    if (window.kakao?.maps) {
      ready()
      return
    }
    const timer = setTimeout(() => reject(new Error('카카오맵을 불러오지 못했어요')), KAKAO_TIMEOUT_MS)
    const script = document.createElement('script')
    script.src =
      'https://dapi.kakao.com/v2/maps/sdk.js' +
      `?appkey=${encodeURIComponent(KAKAO_KEY)}&autoload=false&libraries=services`
    script.async = true
    script.onload = () => {
      clearTimeout(timer)
      if (window.kakao?.maps) ready()
      else reject(new Error('카카오맵을 불러오지 못했어요'))
    }
    script.onerror = () => {
      clearTimeout(timer)
      script.remove()
      reject(new Error('카카오맵을 불러오지 못했어요'))
    }
    document.head.appendChild(script)
  }).catch((error) => {
    kakaoPromise = null
    throw error
  })
  return kakaoPromise
}

// 카카오 장소 검색 (D-036, SCREEN-SPEC 4절 2번). 한 페이지에 5개씩, page는 1부터.
// 카카오는 결과를 최대 45개까지 주므로 페이지는 최대 9개다.
// 돌려주는 값: { items, totalPages }. 결과가 없으면 { items: [], totalPages: 0 }.
// 항목: { id, name, address(도로명, 없으면 지번), addressName(지번), lat, lng }
export const SEARCH_PAGE_SIZE = 5

export async function searchKakaoPlaces(keyword, page = 1) {
  const maps = await loadKakaoMaps()
  return new Promise((resolve, reject) => {
    new maps.services.Places().keywordSearch(
      keyword,
      (data, status, pagination) => {
        if (status === maps.services.Status.ZERO_RESULT) {
          resolve({ items: [], totalPages: 0 })
        } else if (status !== maps.services.Status.OK) {
          reject(new Error('장소를 검색하지 못했어요'))
        } else {
          resolve({
            items: data.map((item) => ({
              id: item.id,
              name: item.place_name,
              address: item.road_address_name || item.address_name,
              addressName: item.address_name || item.road_address_name,
              lat: Number(item.y),
              lng: Number(item.x),
            })),
            totalPages: pagination.last,
          })
        }
      },
      { page, size: SEARCH_PAGE_SIZE },
    )
  })
}
