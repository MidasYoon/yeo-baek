import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/Auth/AuthContext.jsx'
import RequireLogin from './components/Auth/RequireLogin.jsx'
import Layout from './components/Layout/Layout.jsx'
import NotFound from './components/Layout/NotFound.jsx'
import Home from './pages/Home/Home.jsx'
import Trips from './pages/Trips/Trips.jsx'
import TripNew from './pages/Trips/TripNew.jsx'
import TripDetail from './pages/Trips/TripDetail.jsx'
import TripEdit from './pages/Trips/TripEdit.jsx'
import Places from './pages/Places/Places.jsx'
import PlaceNew from './pages/Places/PlaceNew.jsx'
import PlaceEdit from './pages/Places/PlaceEdit.jsx'
import Diary from './pages/Diary/Diary.jsx'
import DiaryNew from './pages/Diary/DiaryNew.jsx'
import DiaryEdit from './pages/Diary/DiaryEdit.jsx'
import Login from './pages/Account/Login.jsx'
import Signup from './pages/Account/Signup.jsx'
import AccountEdit from './pages/Account/AccountEdit.jsx'

// 팀 공동 파일 (D-013). 화면 주소를 넣을 때는 팀이 합의한다.
// 각 화면의 안쪽 주소(/trip/:id 등)는 담당자가 정해 여기에 넣는다 (D-012).
// 로그인 상태(AuthProvider)가 모든 화면을 감싼다 (D-042, ARCHITECTURE 5절).
// 추가·수정 화면과 회원정보수정은 로그인해야 열린다 (RequireLogin, SCREEN-SPEC 1절 "로그인이 필요한 화면").
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/trip" element={<Trips />} />
          <Route
            path="/trip/new"
            element={
              <RequireLogin>
                <TripNew />
              </RequireLogin>
            }
          />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route
            path="/trip/:id/edit"
            element={
              <RequireLogin>
                <TripEdit />
              </RequireLogin>
            }
          />
          <Route path="/place" element={<Places />} />
          <Route
            path="/place/new"
            element={
              <RequireLogin>
                <PlaceNew />
              </RequireLogin>
            }
          />
          <Route
            path="/place/:id/edit"
            element={
              <RequireLogin>
                <PlaceEdit />
              </RequireLogin>
            }
          />
          <Route path="/diary" element={<Diary />} />
          <Route
            path="/diary/new"
            element={
              <RequireLogin>
                <DiaryNew />
              </RequireLogin>
            }
          />
          <Route
            path="/diary/:id/edit"
            element={
              <RequireLogin>
                <DiaryEdit />
              </RequireLogin>
            }
          />
          {/* 회원 화면 (D-042, SCREEN-SPEC 8절) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/me/edit"
            element={
              <RequireLogin>
                <AccountEdit />
              </RequireLogin>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
