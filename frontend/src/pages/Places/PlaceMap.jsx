import { useEffect, useRef } from 'react'
import mapSvg from '../../assets/Map_of_South_Korea-blank.svg?raw'
import { MAP_VIEW_BOX, PIN_POSITIONS, REGION_CENTERS, REGIONS } from './regions.js'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import styles from './PlaceMap.module.css'

// 지도와 솟대 핀 (담당: 은희). SCREEN-SPEC 4절 2·3번, DESIGN 6절 "지도".
// 카카오맵에 장소의 좌표로 핀을 찍고, 같은 곳(kakao_place_id가 같음)은 핀 하나로 묶는다 (D-036).
// 카카오맵을 불러오지 못하면 그림 지도(SVG)에 시·도 핀을 찍는다 (D-030, D-014).
// places: 장소 목록. mode: 'loading' | 'kakao' | 'svg'. selectedKey: 눌린 핀의 키 (없으면 null).
// onSelect(key): 핀을 누르면 그 핀의 키를 넘긴다. 카드 강조는 pinKeyOf로 같은 키를 찾는다.

// 장소가 어느 핀에 묶이는지. 카카오맵에서 좌표가 없는 장소와 그림 지도는 시·도로 묶는다.
export function pinKeyOf(place, mode) {
  return mode === 'kakao' && place.kakao_place_id ? `k:${place.kakao_place_id}` : `r:${place.region}`
}

// 솟대 그림 (그림 좌표 40×56, 화면에서도 40×56px, 2026-10-23 사람이 고름. 전에는 깃발 → 노리개).
// 마을 어귀 장대 위 나무 새. 장대 아래 끝(20, 55)이 핀 위치를 가리킨다.
// 묶인 핀(2곳 이상)만 장대 옆 작은 패에 개수를 쓴다. 장대 뒤에 흰 테두리를 깔아 어느 지도 바탕에서도 보이게 한다.
function sotdaeMarkup(count) {
  const badge =
    count === null
      ? ''
      : `<rect class="${styles.badge}" x="25" y="18" width="13" height="11" rx="2" />` +
        `<text class="${styles.count}" x="31.5" y="26.6" text-anchor="middle">${count}</text>`
  return (
    `<svg class="${styles.marker}" viewBox="0 0 40 56" aria-hidden="true">` +
    `<ellipse class="${styles.markerShadow}" cx="20" cy="55" rx="6" ry="1.6" />` +
    `<path class="${styles.halo}" d="M20 55V16" />` +
    `<path class="${styles.pole}" d="M20 55V16" />` +
    `<path class="${styles.base}" d="M15 54h10" />` +
    `<g class="${styles.bird}">` +
    `<path class="${styles.birdBody}" d="M9 14Q14 7 22 9Q27 5 31 6Q28 9 29 11L33 12Q28 15 22 15Q14 17 9 14Z" />` +
    `<path class="${styles.beak}" d="M31 6l3.5-.8-2.3 2.6z" />` +
    `<circle class="${styles.eye}" cx="28" cy="8.6" r=".9" />` +
    `<path class="${styles.wing}" d="M12 13.5Q16 11.5 21 12.5" />` +
    '</g>' +
    badge +
    '</svg>'
  )
}

export default function PlaceMap({ places, mode, selectedKey, onSelect }) {
  if (mode === 'loading') {
    return (
      <div className={styles.frame}>
        <div className={styles.loading}>
          <StatusMessage kind="loading" message="지도를 불러오는 중…" />
        </div>
      </div>
    )
  }
  if (mode === 'kakao') {
    return <KakaoMap places={places} selectedKey={selectedKey} onSelect={onSelect} />
  }
  return (
    <div>
      <SvgMap places={places} selectedKey={selectedKey} onSelect={onSelect} />
      <p className={styles.fallbackNote}>카카오맵을 불러오지 못해 그림 지도로 보여요.</p>
    </div>
  )
}

// 카카오맵 (D-036). 칸 크기는 DESIGN 6절 "지도".
function KakaoMap({ places, selectedKey, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const fitRef = useRef(null) // 지금 핀이 모두 보이게 범위를 맞추는 함수
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // 지도는 한 번만 만든다. 칸 크기가 바뀌면(처음 그릴 때, 768px 전후, 창 크기) 다시 그리고 범위를 다시 맞춘다.
  // 크기가 정해지기 전에 맞춘 범위는 틀어지므로 가운데만 지키지 않고 다시 맞춘다.
  useEffect(() => {
    const { maps } = window.kakao
    const [lat, lng] = REGION_CENTERS.충북
    const map = new maps.Map(containerRef.current, { center: new maps.LatLng(lat, lng), level: 13 })
    mapRef.current = map
    const observer = new ResizeObserver(() => {
      map.relayout()
      fitRef.current?.()
    })
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null))
      overlaysRef.current = []
      mapRef.current = null
    }
  }, [])

  // 장소가 바뀌면 핀을 다시 찍고, 핀이 모두 보이게 범위를 맞춘다.
  useEffect(() => {
    const { maps } = window.kakao
    const map = mapRef.current
    overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null))

    // 같은 키끼리 묶는다. 위치는 첫 장소의 좌표, 좌표가 없으면 시·도 가운데.
    const groups = new Map()
    for (const place of places) {
      const key = pinKeyOf(place, 'kakao')
      const group = groups.get(key)
      if (group) {
        group.count += 1
      } else {
        const [lat, lng] = place.kakao_place_id ? [place.lat, place.lng] : REGION_CENTERS[place.region]
        const label = place.kakao_place_id ? place.name : place.region
        groups.set(key, { key, lat, lng, label, count: 1 })
      }
    }

    const bounds = new maps.LatLngBounds()
    overlaysRef.current = [...groups.values()].map((group) => {
      const position = new maps.LatLng(group.lat, group.lng)
      bounds.extend(position)
      const button = document.createElement('button')
      button.type = 'button'
      button.className = styles.pin
      button.setAttribute('aria-label', `${group.label} ${group.count}곳`)
      // 1곳이면 숫자를 쓰지 않는다. 묶인 핀(2곳 이상)만 개수를 보인다 (D-036).
      button.innerHTML = sotdaeMarkup(group.count >= 2 ? group.count : null)
      button.addEventListener('click', () => onSelectRef.current(group.key))
      // 장대 아래 끝(누르는 곳 48×64px 안에서 24, 55px)이 좌표에 오게 한다.
      const overlay = new maps.CustomOverlay({
        position,
        content: button,
        xAnchor: 24 / 48,
        yAnchor: 55 / 64,
        clickable: true,
      })
      overlay.setMap(map)
      return { key: group.key, overlay, button }
    })

    fitRef.current = () => {
      if (groups.size === 1) {
        // 핀이 하나면 그 핀을 가운데에 두고 동네가 보이게 확대한다 (AI 제안).
        const [only] = groups.values()
        map.setLevel(5)
        map.setCenter(new maps.LatLng(only.lat, only.lng))
      } else if (groups.size > 1) {
        // 솟대는 장대 끝에서 위로 약 55px, 좌우로 약 15px 뻗으므로 위를 더 띄운다.
        map.setBounds(bounds, 72, 32, 24, 32)
      }
    }
    fitRef.current()
  }, [places])

  // 눌린 핀은 다른 핀과 구분되게 보이고 위로 올라온다. 한 번에 하나만 눌린다.
  useEffect(() => {
    for (const { key, overlay, button } of overlaysRef.current) {
      const selected = key === selectedKey
      button.className = selected ? `${styles.pin} ${styles.selected}` : styles.pin
      button.setAttribute('aria-pressed', String(selected))
      overlay.setZIndex(selected ? 1 : 0)
    }
  }, [selectedKey, places])

  return (
    <div ref={containerRef} className={styles.frame} />
  )
}

// 그림 지도 (카카오맵을 불러오지 못할 때). 시·도 색은 그림 안의 id(seoul, gangwon …)로 CSS에서 칠한다.
// 그림 파일은 고치지 않는다 (D-030). 그림의 고정 크기를 빼고 보일 부분만 남겨, 칸의 폭에 맞춰 줄어들게 한다.
const { x, y, width, height } = MAP_VIEW_BOX
const mapMarkup = mapSvg
  .replace(/^[\s\S]*?(<svg)/, '$1')
  .replace(/\swidth="[^"]*"/, '')
  .replace(/\sheight="[^"]*"/, '')
  .replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${width} ${height}" aria-hidden="true"`)

function SvgMap({ places, selectedKey, onSelect }) {
  // 시·도마다 장소 개수를 센다. 1곳이어도 숫자를 보인다 (R-P-006, D-014).
  const counts = {}
  for (const place of places) {
    counts[place.region] = (counts[place.region] ?? 0) + 1
  }

  return (
    <div className={styles.map} style={{ aspectRatio: `${width} / ${height}` }}>
      <div className={styles.land} dangerouslySetInnerHTML={{ __html: mapMarkup }} />
      {REGIONS.filter((region) => counts[region]).map((region) => {
        const [px, py] = PIN_POSITIONS[region]
        const key = `r:${region}`
        const selected = key === selectedKey
        return (
          <button
            key={region}
            type="button"
            className={selected ? `${styles.pin} ${styles.svgPin} ${styles.selected}` : `${styles.pin} ${styles.svgPin}`}
            style={{
              left: `${((px - x) / width) * 100}%`,
              top: `${((py - y) / height) * 100}%`,
            }}
            aria-label={`${region} ${counts[region]}곳`}
            aria-pressed={selected}
            onClick={() => onSelect(key)}
            dangerouslySetInnerHTML={{ __html: sotdaeMarkup(counts[region]) }}
          />
        )
      })}
    </div>
  )
}
