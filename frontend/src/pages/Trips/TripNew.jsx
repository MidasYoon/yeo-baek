import { useNavigate } from 'react-router-dom'
import { createTrip } from '../../api/trips.js'
import TripForm from './TripForm.jsx'
import styles from './Trips.module.css'

// 여행 추가 (담당: 서준). SCREEN-SPEC 3절. 주소: /trip/new
export default function TripNew() {
  const navigate = useNavigate()

  async function handleSubmit(values) {
    const trip = await createTrip(values)
    // 저장되면 새 여행의 상세로 간다 (상세 화면은 P-25).
    navigate(`/trip/${trip.id}`)
  }

  function handleCancel() {
    // 이전 화면으로. 주소를 바로 열어 이전 화면이 없으면 목록으로 간다.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/trip')
    }
  }

  return (
    <section className={styles.page}>
      <h1>새 여행 만들기</h1>
      <TripForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </section>
  )
}
