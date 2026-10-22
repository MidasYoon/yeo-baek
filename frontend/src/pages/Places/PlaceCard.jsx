import styles from './PlaceCard.module.css'

// 장소 카드 하나 (담당: 은희). SCREEN-SPEC 4절 2번, DESIGN 6절 "카드".
// highlighted: 핀을 눌렀을 때 강조한다 (P-29).
// actions: 수정·삭제 버튼 자리 (P-28). 여행 상세 안 목록(P-34)에서는 넘기지 않는다.
export default function PlaceCard({ place, highlighted = false, actions = null }) {
  const className = highlighted ? `${styles.card} ${styles.highlighted}` : styles.card

  return (
    <article className={className}>
      <h3 className={styles.name}>{place.name}</h3>
      <p className={styles.meta}>
        {place.region} · {place.visit_date}
      </p>
      {place.memo && <p className={styles.memo}>{place.memo}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
