import { useState } from 'react'
import { photoUrl } from '../../api/places.js'
import styles from './PlaceCard.module.css'

// 장소 목록의 줄 하나 (담당: 은희). SCREEN-SPEC 4절 2번, DESIGN 6절 "카드".
// 시안(한지 노을 · 여행지 정보)처럼 한 판 안에 줄로 쌓는다. 판 모양은 목록(ul)이 그린다.
// highlighted: 핀을 눌렀을 때 강조한다 (P-29).
// actions: 수정·삭제 버튼 자리 (P-28). 여행 상세 안 목록(P-34)에서는 넘기지 않는다.
// 사진이 있으면 메모 아래에 작은 사진을 한 줄로 보인다. 없으면 줄을 두지 않는다 (D-033).

// 사진 한 장. 불러오지 못하면 숨긴다 (SCREEN-SPEC 1절 "사진 표시").
function PlacePhoto({ filename }) {
  const [broken, setBroken] = useState(false)
  if (broken) return null
  return (
    <li>
      <img
        className={styles.photo}
        src={photoUrl(filename)}
        alt="장소 사진"
        onError={() => setBroken(true)}
      />
    </li>
  )
}
export default function PlaceCard({ place, highlighted = false, actions = null }) {
  const className = highlighted ? `${styles.row} ${styles.highlighted}` : styles.row

  return (
    <article className={className}>
      <div className={styles.body}>
        <p className={styles.meta}>
          {place.region} · {place.visit_date}
        </p>
        <h3 className={styles.name}>{place.name}</h3>
        {place.memo && <p className={styles.memo}>{place.memo}</p>}
        {place.photos?.length > 0 && (
          <ul className={styles.photos}>
            {place.photos.map((filename) => (
              <PlacePhoto key={filename} filename={filename} />
            ))}
          </ul>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
