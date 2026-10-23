import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { photoUrl, signup, uploadProfilePhoto } from '../../api/users.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import { loginUrl, safeNext } from '../../components/Auth/loginPaths.js'
import Button from '../../components/Button/Button.jsx'
import PhotoInput from '../../components/PhotoInput/PhotoInput.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TextField from './TextField.jsx'
import {
  LOGIN_ID_HELP,
  NICKNAME_HELP,
  PASSWORD_HELP,
  checkLoginId,
  checkNickname,
  checkPassword,
  checkPasswordConfirm,
  compactErrors,
} from './accountRules.js'
import styles from './Account.module.css'

// 회원가입 (팀 공동, D-042). SCREEN-SPEC 8절. 주소: /signup?next=돌아갈 주소
const EMPTY = { login_id: '', password: '', password_confirm: '', nickname: '', profile_photo: null }

export default function Signup() {
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  if (loading) return <StatusMessage kind="loading" />
  // 이미 로그인했으면 폼을 보이지 않고 돌아갈 주소로 간다.
  if (user && !saving) return <Navigate to={next} replace />

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = compactErrors({
      login_id: checkLoginId(values.login_id),
      password: checkPassword(values.password),
      password_confirm: checkPasswordConfirm(values.password, values.password_confirm),
      nickname: checkNickname(values.nickname),
    })
    setErrors(nextErrors)
    setSaveFailed(false)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      // "비밀번호 확인"은 화면에서만 검사하고 보내지 않는다 (API-SPEC 7절 3번).
      const me = await signup({
        login_id: values.login_id,
        password: values.password,
        nickname: values.nickname,
        profile_photo: values.profile_photo,
      })
      setUser(me)
      navigate(next, { replace: true })
    } catch (error) {
      if (error.status === 409) {
        setErrors({ login_id: '이미 쓰는 아이디예요' })
      } else {
        // 422를 받아도 공통 저장 실패 문구를 보인다 (D-021). 입력한 값은 그대로 둔다.
        setSaveFailed(true)
      }
      setSaving(false)
    }
  }

  function handleCancel() {
    // 이전 화면으로. 주소를 바로 열어 이전 화면이 없으면 Home으로 간다.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <section className={styles.formPage}>
      <h1>회원가입</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          name="login_id"
          label="아이디"
          value={values.login_id}
          onChange={handleChange}
          error={errors.login_id}
          help={LOGIN_ID_HELP}
          autoComplete="username"
          maxLength={20}
        />
        <TextField
          name="password"
          label="비밀번호"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          help={PASSWORD_HELP}
          autoComplete="new-password"
          maxLength={20}
        />
        <TextField
          name="password_confirm"
          label="비밀번호 확인"
          type="password"
          value={values.password_confirm}
          onChange={handleChange}
          error={errors.password_confirm}
          autoComplete="new-password"
          maxLength={20}
        />
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
        {saveFailed && <p className={styles.saveError}>저장하지 못했어요. 다시 시도해 주세요.</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleCancel}>
            취소
          </Button>
          <Button type="submit" disabled={saving || photoBusy}>
            가입하기
          </Button>
        </div>
      </form>
      <p className={styles.switch}>
        이미 회원이신가요?
        <Link to={loginUrl(next)}>로그인</Link>
      </p>
    </section>
  )
}
