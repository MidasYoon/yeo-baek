import { useNavigate } from 'react-router-dom'

// 없는 주소 화면 (담당: 건용). SCREEN-SPEC 2절 5번.
export default function NotFound() {
  const navigate = useNavigate()

  return (
    <section>
      <p>찾을 수 없는 화면이에요.</p>
      <button type="button" onClick={() => navigate('/')}>
        Home으로
      </button>
    </section>
  )
}
