import { useCallback, useEffect, useState } from 'react'
import { loadKakaoMaps, photoUrl, uploadPlacePhoto } from '../../api/places.js'
import Button from '../../components/Button/Button.jsx'
import PhotoInput from '../../components/PhotoInput/PhotoInput.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import PlaceSearchDialog from './PlaceSearchDialog.jsx'
import { regionFromAddress } from './regions.js'
import styles from './PlaceForm.module.css'

// 장소 추가·수정 폼 (담당: 은희). SCREEN-SPEC 4절 2·4·5번.
// trip: 고른 여행 (이름·기간을 보이고 방문 날짜를 검사한다).
// initialValues: 수정할 때 지금 값. onSubmit(values): 저장 요청 (실패하면 던진다).
// 장소는 카카오 장소 검색으로 골라야 저장된다. 고르면 시·도·좌표·카카오 장소 id가 채워진다 (D-036).
const EMPTY = {
  region: '',
  name: '',
  visit_date: '',
  memo: '',
  photos: [],
  lat: null,
  lng: null,
  kakao_place_id: null,
}

function validate(values, trip) {
  const errors = {}
  if (!values.kakao_place_id) errors.place = '장소를 검색해 골라 주세요'
  // 공백만 적은 이름은 화면에서 막지 않는다. 서버가 422로 막는다 (D-021). 글자 수 제한은 없다 (D-036).
  if (values.name === '') errors.name = '장소 이름을 적어 주세요'
  if (values.visit_date === '') {
    errors.visit_date = '방문 날짜를 골라 주세요'
  } else if (values.visit_date < trip.start_date || values.visit_date > trip.end_date) {
    errors.visit_date = `방문 날짜는 여행 기간(${trip.start_date} ~ ${trip.end_date}) 안이어야 해요`
  }
  // 글자 수는 앞뒤 공백을 뺀 길이로 센다 (D-029).
  if (values.memo.trim().length > 20) errors.memo = '20자까지 쓸 수 있어요'
  return errors
}

export default function PlaceForm({ title, trip, initialValues = EMPTY, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues, memo: initialValues.memo ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  // 사진을 올리는 동안은 저장할 수 없다 (SCREEN-SPEC 1절 "사진 칸 (폼)").
  const [photoBusy, setPhotoBusy] = useState(false)

  // 장소 검색 (D-036). kakaoStatus: 'loading' | 'ready' | 'failed'
  const [kakaoStatus, setKakaoStatus] = useState('loading')
  const [keyword, setKeyword] = useState('')
  // 결과 창에서 검색하는 말. null이면 창이 닫혀 있다.
  const [searchKeyword, setSearchKeyword] = useState(null)
  // 고른 장소 상자. 수정 폼에서 좌표가 있으면 저장된 이름·지역으로 채워 연다 (주소는 저장하지 않는다).
  const [picked, setPicked] = useState(
    initialValues.kakao_place_id
      ? { name: initialValues.name, address: null, region: initialValues.region }
      : null,
  )

  function loadKakao() {
    setKakaoStatus('loading')
    loadKakaoMaps()
      .then(() => setKakaoStatus('ready'))
      .catch(() => setKakaoStatus('failed'))
  }

  useEffect(loadKakao, [])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  // "검색"을 누르면 결과 창이 열린다. 창이 검색하고 페이지를 넘긴다.
  function handleSearch() {
    const text = keyword.trim()
    if (!text) return
    setErrors((prev) => ({ ...prev, place: undefined }))
    setSearchKeyword(text)
  }

  const closeSearch = useCallback(() => setSearchKeyword(null), [])

  function handleKeywordKeyDown(event) {
    // 검색 칸의 Enter는 폼 저장이 아니라 검색이다.
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  // 고르지 못하면 결과 창에 보일 오류 문구를 돌려준다.
  function handlePick(item) {
    const region = regionFromAddress(item.addressName)
    if (!region) {
      // 시·도 17개에 맞지 않는 주소는 고르지 않는다. 결과 창은 그대로 둔다.
      return '국내 시·도의 장소만 고를 수 있어요'
    }
    // 이름 칸이 비어 있을 때만 장소 이름으로 채운다. 이미 적은 이름은 바꾸지 않는다 (AI 제안).
    setValues((prev) => ({
      ...prev,
      region,
      lat: item.lat,
      lng: item.lng,
      kakao_place_id: item.id,
      name: prev.name === '' ? item.name : prev.name,
    }))
    setPicked({ name: item.name, address: item.address, region })
    setSearchKeyword(null)
    setErrors((prev) => ({ ...prev, place: undefined, name: undefined }))
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values, trip)
    setErrors(nextErrors)
    setSaveFailed(false)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await onSubmit({ ...values, memo: values.memo === '' ? null : values.memo })
    } catch {
      // 422를 받아도 공통 저장 실패 문구를 보인다 (D-021). 입력한 값은 그대로 둔다.
      setSaveFailed(true)
      setSaving(false)
    }
  }

  function errorLine(name) {
    return errors[name] ? (
      <span id={`${name}-error`} className={styles.error}>
        {errors[name]}
      </span>
    ) : null
  }

  function inputProps(name) {
    return {
      name,
      value: values[name],
      onChange: handleChange,
      className: errors[name] ? `${styles.input} ${styles.invalid}` : styles.input,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    }
  }

  let searchField
  if (kakaoStatus === 'loading') {
    searchField = <p className={styles.help}>장소 검색을 불러오는 중…</p>
  } else if (kakaoStatus === 'failed') {
    searchField = (
      <StatusMessage
        kind="error"
        message="장소 검색을 불러오지 못했어요. 지금은 장소를 저장할 수 없어요."
        onRetry={loadKakao}
      />
    )
  } else {
    searchField = (
      <>
        <div className={styles.searchRow}>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder="장소 이름이나 주소를 입력하고 검색을 눌러 주세요"
            aria-label="장소 검색"
            className={errors.place ? `${styles.input} ${styles.invalid}` : styles.input}
            aria-invalid={Boolean(errors.place)}
            aria-describedby={errors.place ? 'place-error' : undefined}
          />
          <Button variant="secondary" onClick={handleSearch}>
            검색
          </Button>
        </div>
        <span className={styles.help}>국내 장소만 넣을 수 있어요</span>
        {errorLine('place')}
      </>
    )
  }

  return (
    <>
      <div className={styles.head}>
        <h1>{title}</h1>
        <p className={styles.trip}>
          {trip.name} · {trip.start_date} ~ {trip.end_date}
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <span className={styles.label}>장소 검색</span>
          {searchField}
          {picked && (
            <div className={styles.picked}>
              <span className={styles.pickedLabel}>고른 장소</span>
              <span className={styles.pickedName}>{picked.name}</span>
              {picked.address && <span className={styles.resultAddress}>{picked.address}</span>}
              <span className={styles.pickedRegion}>지역 · {picked.region}</span>
            </div>
          )}
        </div>
        <label className={styles.field}>
          <span className={styles.label}>장소 이름</span>
          <input type="text" {...inputProps('name')} />
          {errorLine('name')}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>방문 날짜</span>
          <input type="date" min={trip.start_date} max={trip.end_date} {...inputProps('visit_date')} />
          {errorLine('visit_date')}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>메모</span>
          <input type="text" {...inputProps('memo')} />
          {errorLine('memo')}
        </label>
        <PhotoInput
          label="사진"
          help="사진은 4장까지 넣을 수 있어요"
          alt="장소 사진"
          photos={values.photos}
          max={4}
          upload={uploadPlacePhoto}
          photoUrl={photoUrl}
          onChange={(photos) => setValues((prev) => ({ ...prev, photos }))}
          onBusyChange={setPhotoBusy}
        />
        {saveFailed && <p className={styles.saveError}>저장하지 못했어요. 다시 시도해 주세요.</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          {/* 장소 검색을 불러오지 못하면 장소를 고를 수 없어 저장할 수 없다 (D-036). */}
          <Button type="submit" disabled={saving || photoBusy || kakaoStatus === 'failed'}>
            저장
          </Button>
        </div>
      </form>
      {searchKeyword !== null && (
        <PlaceSearchDialog keyword={searchKeyword} onPick={handlePick} onClose={closeSearch} />
      )}
    </>
  )
}
