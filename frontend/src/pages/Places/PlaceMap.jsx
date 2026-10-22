import mapSvg from '../../assets/Map_of_South_Korea-blank.svg?raw'
import { MAP_VIEW_BOX, PIN_POSITIONS, REGIONS } from './regions.js'
import styles from './PlaceMap.module.css'

// 지도와 깃발 핀 (담당: 은희). SCREEN-SPEC 4절 2·3번, DESIGN 6절 "지도".
// 시·도 색은 그림 안의 id(seoul, gangwon …)로 CSS에서 칠한다. 그림 파일은 고치지 않는다 (D-030).
// 깃대 아래 끝(그림 좌표 8, 46)이 그 시·도의 핀 위치를 가리킨다.
// 지도 API를 쓰지 않고 그림 한 장 위에 핀을 올린다 (README "만들지 않는 것", D-028).
// places: 고른 여행의 장소 목록. selectedRegion: 눌린 핀의 시·도 (없으면 null).
// onSelect(region): 핀을 누르면 그 시·도를 넘긴다.

// 그림의 고정 크기를 빼고 보일 부분만 남겨, 감싼 칸의 폭에 맞춰 줄어들게 한다.
const { x, y, width, height } = MAP_VIEW_BOX
const mapMarkup = mapSvg
  .replace(/^[\s\S]*?(<svg)/, '$1')
  .replace(/\swidth="[^"]*"/, '')
  .replace(/\sheight="[^"]*"/, '')
  .replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${width} ${height}" aria-hidden="true"`)

export default function PlaceMap({ places, selectedRegion, onSelect }) {
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
        const selected = region === selectedRegion
        return (
          <button
            key={region}
            type="button"
            className={selected ? `${styles.pin} ${styles.selected}` : styles.pin}
            style={{
              left: `${((px - x) / width) * 100}%`,
              top: `${((py - y) / height) * 100}%`,
            }}
            aria-label={`${region} ${counts[region]}곳`}
            aria-pressed={selected}
            onClick={() => onSelect(region)}
          >
            <svg className={styles.flag} viewBox="0 0 40 48" aria-hidden="true">
              <ellipse className={styles.flagShadow} cx="8" cy="46" rx="5" ry="1.6" />
              <path className={styles.flagPole} d="M8 46V3" />
              <path className={styles.flagBanner} d="M8 4H36L30.5 13L36 22H8Z" />
              <text className={styles.flagCount} x="19.5" y="18.5" textAnchor="middle">
                {counts[region]}
              </text>
            </svg>
          </button>
        )
      })}
    </div>
  )
}
