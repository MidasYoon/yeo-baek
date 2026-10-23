import { useRef, useState } from 'react'
import Button from '../Button/Button.jsx'
import styles from './PhotoInput.module.css'

// 사진 칸 (팀 공동, D-028·D-033). SCREEN-SPEC 1절 "사진 칸 (폼)", "사진 오류", DESIGN 6절 "사진".
// photos: 지금 사진 파일 이름 목록. max: 최대 장수(여행·일기 1, 장소 4).
// upload(file): 그 기능의 api 파일의 올리기 함수 ({ filename }을 돌려준다). 서버 호출은 api/ 안에만 둔다.
// photoUrl(filename): 보기 주소. onChange(photos): 바뀐 목록. onBusyChange(bool): 올리는 중인지.
// help: (선택) 칸 이름 아래에 늘 보이는 도움말. 있으면 다 찼을 때 따로 안내하지 않고 버튼만 숨긴다.
const MAX_BYTES = 5 * 1024 * 1024

// 확장자마다 받는 형식. 서버(backend/routers/uploads.py)와 같다.
const ALLOWED_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function checkFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ALLOWED_TYPES[ext] !== file.type) return 'jpg·png·webp 사진만 넣을 수 있어요'
  if (file.size > MAX_BYTES) return '5MB 이하 사진만 넣을 수 있어요'
  return null
}

export default function PhotoInput({
  label,
  help,
  alt,
  photos,
  max,
  upload,
  photoUrl,
  onChange,
  onBusyChange,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const errorId = `${label}-photo-error`
  const single = max === 1
  const full = photos.length >= max

  async function handleFile(event) {
    const file = event.target.files[0]
    // 같은 파일을 다시 골라도 change가 일어나도록 비운다.
    event.target.value = ''
    if (!file) return

    const fileError = checkFile(file)
    setError(fileError)
    if (fileError) return

    setUploading(true)
    onBusyChange?.(true)
    try {
      const { filename } = await upload(file)
      onChange(single ? [filename] : [...photos, filename])
    } catch {
      setError('사진을 올리지 못했어요. 다시 시도해 주세요.')
    } finally {
      setUploading(false)
      onBusyChange?.(false)
    }
  }

  function remove(filename) {
    setError(null)
    onChange(photos.filter((name) => name !== filename))
  }

  let pickLabel = '사진 추가'
  if (single && photos.length > 0) pickLabel = '사진 변경'

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {help && <span className={styles.help}>{help}</span>}
      {photos.length > 0 && (
        <ul className={styles.list}>
          {photos.map((filename, index) => (
            <li key={filename} className={styles.item}>
              <img className={styles.preview} src={photoUrl(filename)} alt={alt} />
              {/* 사진 오른쪽 위 × 버튼 (2026-10-23 사람이 정함. 전에는 사진 아래 "사진 빼기" 버튼) */}
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(filename)}
                disabled={uploading}
                aria-label={single ? '사진 빼기' : `사진 ${index + 1} 빼기`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        className={styles.hidden}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFile}
        tabIndex={-1}
        aria-hidden="true"
      />
      {uploading ? (
        <p className={styles.status} role="status">
          사진 올리는 중…
        </p>
      ) : !single && full ? (
        !help && <p className={styles.note}>사진은 {max}장까지 넣을 수 있어요</p>
      ) : (
        <div>
          <Button
            variant="secondary"
            onClick={() => inputRef.current.click()}
            aria-describedby={error ? errorId : undefined}
          >
            {pickLabel}
          </Button>
        </div>
      )}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
