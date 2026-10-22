import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import NotFound from './components/Layout/NotFound.jsx'
import Home from './pages/Home/Home.jsx'
import Trips from './pages/Trips/Trips.jsx'
import TripNew from './pages/Trips/TripNew.jsx'
import TripDetail from './pages/Trips/TripDetail.jsx'
import TripEdit from './pages/Trips/TripEdit.jsx'
import Places from './pages/Places/Places.jsx'
import Diary from './pages/Diary/Diary.jsx'

// 팀 공동 파일 (D-013). 화면 주소를 넣을 때는 팀이 합의한다.
// 각 화면의 안쪽 주소(/trip/:id 등)는 담당자가 정해 여기에 넣는다 (D-012).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trip" element={<Trips />} />
        <Route path="/trip/new" element={<TripNew />} />
        <Route path="/trip/:id" element={<TripDetail />} />
        <Route path="/trip/:id/edit" element={<TripEdit />} />
        <Route path="/place" element={<Places />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
