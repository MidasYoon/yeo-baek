import styles from './PlaceCard.module.css'

// 장소 목록의 줄 하나 (담당: 은희). SCREEN-SPEC 4절 2번, DESIGN 6절 "카드".
// 시안(한지 노을 · 여행지 정보)처럼 한 판 안에 줄로 쌓는다. 판 모양은 목록(ul)이 그린다.
// highlighted: 핀을 눌렀을 때 강조한다 (P-29).
// actions: 수정·삭제 버튼 자리 (P-28). 여행 상세 안 목록(P-34)에서는 넘기지 않는다.
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
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
