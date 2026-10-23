import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getRecommendation } from '../../api/recommend.js'
import Button from '../Button/Button.jsx'
import styles from './RecommendChat.module.css'

// AI 여행지 추천 버튼과 대화창 (팀 공동, D-037). SCREEN-SPEC 7절, DESIGN 6절 "AI 추천 버튼과 대화창".
// 공통 레이아웃이 모든 화면에 붙인다. 고른 답과 추천은 저장하지 않는다 (닫으면 지워짐).

const GREETING = '안녕하세요! 몇 가지만 고르면 어울리는 국내 여행지 3곳을 추천해 드릴게요.'

// 질문 순서 (SCREEN-SPEC 7절 2번 "질문 흐름")
const QUESTIONS = {
  mood: { text: '요즘 기분은 어떠세요?', options: ['지침', '설렘', '평온', '심심', '우울'] },
  styles: {
    text: '어떤 여행이 좋으세요? 여러 개 골라도 돼요.',
    options: ['자연', '바다', '맛집', '역사·문화', '액티비티', '휴식'],
  },
  companion: { text: '누구와 함께 가세요?', options: ['혼자', '친구', '연인', '가족'] },
  duration: { text: '며칠 동안 다녀오세요?', options: ['당일', '1박 2일', '2박 3일', '3박 이상'] },
  note: { text: '더 하고 싶은 말이 있으면 적어 주세요. 없으면 바로 추천 받기를 눌러도 돼요.' },
}
const NEXT_STEP = { mood: 'styles', styles: 'companion', companion: 'duration', duration: 'note' }
const MAX_NOTE = 100

const NO_KEY_TEXT = 'AI 키가 설정되지 않아 추천을 받을 수 없어요.'
const FAILED_TEXT = '추천을 받지 못했어요. 다시 시도해 주세요.'

function firstMessages() {
  return [
    { from: 'ai', text: GREETING },
    { from: 'ai', text: QUESTIONS.mood.text },
  ]
}

export default function RecommendChat() {
  const [open, setOpen] = useState(false)
  // step: 'mood' | 'styles' | 'companion' | 'duration' | 'note' | 'loading' | 'result' | 'nokey' | 'error'
  const [step, setStep] = useState('mood')
  const [messages, setMessages] = useState(firstMessages)
  const [answers, setAnswers] = useState({})
  const [pickedStyles, setPickedStyles] = useState([])
  const [note, setNote] = useState('')
  const [items, setItems] = useState([])

  const location = useLocation()
  const openButtonRef = useRef(null)
  const panelRef = useRef(null)
  const bodyRef = useRef(null)
  const footerRef = useRef(null)
  const requestId = useRef(0) // 닫은 뒤 온 응답을 버리려고 요청마다 번호를 붙인다
  const wasOpen = useRef(false)

  function reset() {
    requestId.current += 1
    setStep('mood')
    setMessages(firstMessages())
    setAnswers({})
    setPickedStyles([])
    setNote('')
    setItems([])
  }

  function close() {
    setOpen(false)
    reset()
  }

  // 다른 화면으로 가면 닫은 것과 같다 (SCREEN-SPEC 7절 3번)
  useEffect(() => {
    setOpen(false)
    reset()
  }, [location.pathname])

  // Esc로 닫기
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // 닫으면 포커스를 추천 버튼으로 돌린다
  useEffect(() => {
    if (wasOpen.current && !open) openButtonRef.current?.focus()
    wasOpen.current = open
  }, [open])

  // 새 줄이 생기면 마지막 줄이 보이게 내린다
  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [open, messages, step])

  // 단계가 바뀌면 꼬리의 첫 버튼(또는 입력 칸)으로 포커스를 옮긴다. 꼬리가 비면 창에 둔다.
  useEffect(() => {
    if (!open) return
    const first = footerRef.current?.querySelector('button, input')
    if (first) first.focus()
    else panelRef.current?.focus()
  }, [open, step])

  function answer(key, value, label) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    const next = NEXT_STEP[key]
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: label },
      { from: 'ai', text: QUESTIONS[next].text },
    ])
    setStep(next)
  }

  function toggleStyle(style) {
    setPickedStyles((prev) =>
      prev.includes(style) ? prev.filter((item) => item !== style) : [...prev, style],
    )
  }

  function submitStyles() {
    // 고른 순서가 아니라 선택지 순서대로 보낸다
    const ordered = QUESTIONS.styles.options.filter((style) => pickedStyles.includes(style))
    answer('styles', ordered, ordered.join(', '))
  }

  async function fetchItems(body) {
    const id = ++requestId.current
    setStep('loading')
    try {
      const result = await getRecommendation(body)
      if (id !== requestId.current) return
      setItems(result.items)
      setStep('result')
    } catch (error) {
      if (id !== requestId.current) return
      setStep(error.status === 503 ? 'nokey' : 'error')
    }
  }

  function submitNote(event) {
    event.preventDefault()
    const trimmed = note.trim()
    const body = { ...answers, note: trimmed || null }
    setAnswers(body)
    setMessages((prev) => [...prev, { from: 'user', text: trimmed || '없어요' }])
    fetchItems(body)
  }

  function renderFooter() {
    if (step === 'mood' || step === 'companion' || step === 'duration') {
      return (
        <div className={styles.options}>
          {QUESTIONS[step].options.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.option}
              onClick={() => answer(step, option, option)}
            >
              {option}
            </button>
          ))}
        </div>
      )
    }
    if (step === 'styles') {
      return (
        <>
          <div className={styles.options}>
            {QUESTIONS.styles.options.map((option) => {
              const picked = pickedStyles.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  className={picked ? `${styles.option} ${styles.picked}` : styles.option}
                  aria-pressed={picked}
                  onClick={() => toggleStyle(option)}
                >
                  {option}
                </button>
              )
            })}
          </div>
          <div className={styles.actions}>
            <Button onClick={submitStyles} disabled={pickedStyles.length === 0}>
              다음
            </Button>
          </div>
        </>
      )
    }
    if (step === 'note') {
      return (
        <form className={styles.noteForm} onSubmit={submitNote}>
          <input
            className={styles.noteInput}
            type="text"
            value={note}
            maxLength={MAX_NOTE}
            placeholder="예: 사람 많은 곳은 피하고 싶어요"
            aria-label="더 하고 싶은 말"
            onChange={(event) => setNote(event.target.value)}
          />
          <Button type="submit">추천 받기</Button>
        </form>
      )
    }
    if (step === 'result' || step === 'nokey') {
      return (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={reset}>
            다시 하기
          </Button>
        </div>
      )
    }
    if (step === 'error') {
      return (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={reset}>
            다시 하기
          </Button>
          <Button onClick={() => fetchItems(answers)}>다시 시도</Button>
        </div>
      )
    }
    return null // loading: 꼬리는 비어 있다
  }

  if (!open) {
    return (
      <button
        ref={openButtonRef}
        type="button"
        className={styles.openButton}
        aria-label="AI 여행지 추천"
        onClick={() => setOpen(true)}
      >
        {/* 말풍선 선 아이콘 */}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5h16v11H10l-4 3.5V16H4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M8 9.5h8M8 12.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    )
  }

  const footer = renderFooter()

  return (
    <section
      ref={panelRef}
      className={styles.panel}
      role="dialog"
      aria-labelledby="recommend-chat-title"
      tabIndex={-1}
    >
      <header className={styles.head}>
        <span className={styles.stripe} aria-hidden="true" />
        <h2 id="recommend-chat-title" className={styles.title}>
          AI 여행지 추천
        </h2>
        <button type="button" className={styles.close} aria-label="추천 창 닫기" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </header>

      <div ref={bodyRef} className={styles.body} aria-live="polite">
        {messages.map((message, index) => (
          <p key={index} className={message.from === 'ai' ? styles.ai : styles.user}>
            {message.text}
          </p>
        ))}
        {step === 'loading' && <p className={`${styles.ai} ${styles.waiting}`}>여행지를 고르는 중…</p>}
        {step === 'result' && (
          <>
            <p className={styles.ai}>이런 곳은 어떠세요?</p>
            <ol className={styles.cards}>
              {items.map((item, index) => (
                <li key={index} className={styles.card}>
                  <p className={styles.cardTitle}>
                    <span className={styles.cardNumber}>{index + 1}.</span> {item.city} · {item.region}
                  </p>
                  <p className={styles.reason}>{item.reason}</p>
                  <ul className={styles.activities}>
                    {item.activities.map((activity) => (
                      <li key={activity}>{activity}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <p className={styles.notice}>AI가 고른 추천이에요. 떠나기 전에 정보를 확인해 주세요.</p>
          </>
        )}
        {step === 'nokey' && <p className={styles.error}>{NO_KEY_TEXT}</p>}
        {step === 'error' && <p className={styles.error}>{FAILED_TEXT}</p>}
      </div>

      {footer && (
        <div ref={footerRef} className={styles.foot}>
          {footer}
        </div>
      )}
    </section>
  )
}
