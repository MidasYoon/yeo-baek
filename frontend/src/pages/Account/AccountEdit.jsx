import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { photoUrl, updateMe, uploadProfilePhoto } from '../../api/users.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import { loginUrl } from '../../components/Auth/loginPaths.js'
import Button from '../../components/Button/Button.jsx'
import PhotoInput from '../../components/PhotoInput/PhotoInput.jsx'
import TextField from './TextField.jsx'
import {
  NICKNAME_HELP,
  PASSWORD_HELP,
  checkNickname,
  checkPassword,
  checkPasswordConfirm,
  compactErrors,
} from './accountRules.js'
import styles from './Account.module.css'

// 회원정보수정 (팀 공동, D-042). SCREEN-SPEC 8절. 주소: /me/edit (App.jsx에서 RequireLogin으로 감싼다)
export default function AccountEdit() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({
    nickname: user.nickname,
    profile_photo: user.profile_photo,
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  })
  const [errors, setErrors] = useState({})
  // null | 'failed'(공통 저장 실패) | 'loggedOut'(401, 로그인이 풀림)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function goBack() {
    // 이전 화면으로. 주소를 바로 열어 이전 화면이 없으면 Home으로 간다.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    // 비밀번호는 바꿀 때만 적는다. 새 비밀번호가 비어 있으면 비밀번호 칸은 검사하지 않는다.
    const changingPassword = values.new_password !== ''
    const nextErrors = compactErrors({
      nickname: checkNickname(values.nickname),
      current_password:
        changingPassword && values.current_password === '' ? '지금 비밀번호를 적어 주세요' : null,
      new_password: changingPassword ? checkPassword(values.new_password) : null,
      new_password_confirm: changingPassword
        ? checkPasswordConfirm(values.new_password, values.new_password_confirm)
        : null,
    })
    setErrors(nextErrors)
    setSaveError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const me = await updateMe({
        nickname: values.nickname,
        profile_photo: values.profile_photo,
        current_password: changingPassword ? values.current_password : null,
        new_password: changingPassword ? values.new_password : null,
      })
      setUser(me)
      goBack()
    } catch (error) {
      if (error.status === 403) {
        setErrors({ current_password: '지금 비밀번호가 맞지 않아요' })
      } else if (error.status === 401) {
        setSaveError('loggedOut')
      } else {
        // 422를 받아도 공통 저장 실패 문구를 보인다 (D-021). 입력한 값은 그대로 둔다.
        setSaveError('failed')
      }
      setSaving(false)
    }
  }

  return (
    <section className={styles.formPage}>
      <h1>회원정보 수정</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <span className={styles.label}>아이디</span>
          <p className={styles.readonly}>{user.login_id}</p>
        </div>
        <TextField
          name="nickname"
          label="닉네임"
          value={values.nickname}
          onChange={handleChange}
          error={errors.nickname}
          help={NICKNAME_HELP}
          autoComplete="nickname"
        />
        <PhotoInput
          label="프로필사진"
          alt="프로필사진"
          photos={values.profile_photo ? [values.profile_photo] : []}
          max={1}
          upload={uploadProfilePhoto}
          photoUrl={photoUrl}
          onChange={(photos) => setValues((prev) => ({ ...prev, profile_photo: photos[0] ?? null }))}
          onBusyChange={setPhotoBusy}
        />
        <div className={styles.section} role="group" aria-labelledby="password-section-title">
          <h2 id="password-section-title" className={styles.sectionTitle}>
            비밀번호 바꾸기
          </h2>
          <p className={styles.sectionHelp}>바꿀 때만 적어 주세요</p>
          <TextField
            name="current_password"
            label="지금 비밀번호"
            type="password"
            value={values.current_password}
            onChange={handleChange}
            error={errors.current_password}
            autoComplete="current-password"
          />
          <TextField
            name="new_password"
            label="새 비밀번호"
            type="password"
            value={values.new_password}
            onChange={handleChange}
            error={errors.new_password}
            help={PASSWORD_HELP}
            autoComplete="new-password"
            maxLength={20}
          />
          <TextField
            name="new_password_confirm"
            label="새 비밀번호 확인"
            type="password"
            value={values.new_password_confirm}
            onChange={handleChange}
            error={errors.new_password_confirm}
            autoComplete="new-password"
            maxLength={20}
          />
        </div>
        {saveError === 'failed' && (
          <p className={styles.saveError}>저장하지 못했어요. 다시 시도해 주세요.</p>
        )}
        {saveError === 'loggedOut' && (
          <p className={styles.saveError}>
            로그인이 풀렸어요. 다시 로그인해 주세요.{' '}
            {/* 화면에 남은 로그인 상태를 비워야 로그인 화면이 폼을 보인다 */}
            <Link to={loginUrl(location.pathname + location.search)} onClick={() => setUser(null)}>
              로그인
            </Link>
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={goBack}>
            취소
          </Button>
          <Button type="submit" disabled={saving || photoBusy}>
            저장
          </Button>
        </div>
      </form>
    </section>
  )
}
