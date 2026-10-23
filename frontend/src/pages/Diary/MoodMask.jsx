import { useId } from 'react'

// 기분을 귀여운 하회탈 얼굴로 보인다 (담당: 건용, 2026-10-23 팀 결정. 전에는 이모지).
// 설렘 부네탈(쪽머리·반짝이는 눈), 행복 양반탈(갓·갓끈·활짝 웃음), 평온 각시탈(곤지·감은 눈),
// 피곤 이매탈(무거운 눈꺼풀·하품), 아쉬움 할미탈(흰머리·눈물). DESIGN 7절 "하회탈".
// 크기는 글자 크기(1em)를 따른다. 화면 읽기 프로그램용 기분 이름은 감싸는 요소가 갖는다 (aria-hidden).
// 한 화면에 여러 번 그려지므로 그러데이션 id를 탈마다 다르게 만든다.
export default function MoodMask({ mood, className }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name) => `${uid}-${name}`
  const url = (name) => `url(#${id(name)})`
  const old = mood === '아쉬움'

  return (
    <svg className={className} viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={id('face')} cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stopColor={old ? '#FBE6CC' : '#FFF1DE'} />
          <stop offset="0.55" stopColor={old ? '#ECCBA2' : '#F3D5B0'} />
          <stop offset="1" stopColor={old ? '#D9AC7E' : '#E2B78A'} />
        </radialGradient>
        <radialGradient id={id('blush')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F09A92" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F09A92" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('hair')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={old ? '#D3CBC2' : '#4A382C'} />
          <stop offset="1" stopColor={old ? '#A69C92' : '#241A14'} />
        </linearGradient>
      </defs>

      {/* 공통 얼굴: 바닥 그림자, 나무빛 얼굴, 볼터치, 코 */}
      <ellipse cx="24" cy="45" rx="11" ry="1.6" fill="#2B211B" opacity=".12" />
      <circle cx="24" cy="27" r="17" fill={url('face')} stroke="#B5865A" strokeWidth="1.3" />
      <ellipse cx="13.8" cy="32.2" rx="4.4" ry="3" fill={url('blush')} />
      <ellipse cx="34.2" cy="32.2" rx="4.4" ry="3" fill={url('blush')} />
      <path d="M23 30.2Q24 31.2 25 30.2" fill="none" stroke="#C08A5C" strokeWidth="1.1" strokeLinecap="round" />

      {mood === '설렘' && <Bune url={url} />}
      {mood === '행복' && <Yangban url={url} />}
      {mood === '평온' && <Gaksi url={url} />}
      {mood === '피곤' && <Imae />}
      {mood === '아쉬움' && <Halmi url={url} />}
    </svg>
  )
}

const INK = '#2E211A'
const LIP = '#9A3F33'

// 쪽머리 (부네·할미): 가르마 없는 둥근 머리 + 뒤로 묶은 쪽
function Bun({ url, shine }) {
  return (
    <>
      <path d="M7.5 25C8 14 15 10 24 10S40 14 40.5 25C36 18 30 16 24 16S12 18 7.5 25Z" fill={url('hair')} />
      <circle cx="24" cy="8" r="3.8" fill={url('hair')} />
      <path d="M12 19Q17 13.5 23 13" fill="none" stroke="#fff" strokeOpacity={shine} strokeWidth="1.3" strokeLinecap="round" />
    </>
  )
}

function Bune({ url }) {
  return (
    <>
      <Bun url={url} shine=".28" />
      <path d="M27.6 8.6l2.2 1.4-2.2 1.4z" fill="#C99A2E" />
      <ellipse cx="18" cy="26.8" rx="2.3" ry="2.9" fill={INK} />
      <ellipse cx="30" cy="26.8" rx="2.3" ry="2.9" fill={INK} />
      <circle cx="18.9" cy="25.7" r=".95" fill="#fff" />
      <circle cx="30.9" cy="25.7" r=".95" fill="#fff" />
      <circle cx="17.4" cy="28" r=".45" fill="#fff" />
      <circle cx="29.4" cy="28" r=".45" fill="#fff" />
      <path d="M21.3 34.2Q24 36.9 26.7 34.2" fill="none" stroke={LIP} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M40.2 11.5l1.7 1.7-1.7 1.7-1.7-1.7zM43.6 18l1 1-1 1-1-1z" fill="#C99A2E" />
    </>
  )
}

function Yangban({ url }) {
  return (
    <>
      <path d="M11 14Q10.5 30 15 40M37 14Q37.5 30 33 40" fill="none" stroke="#3A2A20" strokeWidth=".8" strokeDasharray="1.4 1.6" opacity=".55" />
      <ellipse cx="24" cy="12.8" rx="15.5" ry="2.8" fill={url('hair')} />
      <path d="M18 12.8C18 4.6 30 4.6 30 12.8Z" fill={url('hair')} />
      <path d="M20 7.6Q22 6.2 24.5 6.4" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M15.3 27.4Q18 23.6 20.7 27.4M27.3 27.4Q30 23.6 32.7 27.4" fill="none" stroke={INK} strokeWidth="2.3" strokeLinecap="round" />
      <path d="M18.3 32.6Q24 40 29.7 32.6Z" fill="#8E3B2F" />
      <path d="M21.3 36.3Q24 34.8 26.7 36.3Q24 38.3 21.3 36.3Z" fill="#E98A80" />
      <path d="M14 37Q24 45.5 34 37" fill="none" stroke="#B5865A" strokeWidth=".9" opacity=".6" />
    </>
  )
}

function Gaksi({ url }) {
  return (
    <>
      <path d="M7.5 25C8 14 15 10 24 10S40 14 40.5 25C35 19 28 17 24 13C20 17 13 19 7.5 25Z" fill={url('hair')} />
      <path d="M11.5 19Q15 14 21 12.4" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M24 18.3l1.7 1.7-1.7 1.7-1.7-1.7z" fill="#E0665E" />
      <path d="M15.3 26.6Q18 29.4 20.7 26.6M27.3 26.6Q30 29.4 32.7 26.6" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M15.3 26.6l-1 .9M32.7 26.6l1 .9" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M22.2 34.2Q24 35.7 25.8 34.2" fill="none" stroke={LIP} strokeWidth="1.7" strokeLinecap="round" />
    </>
  )
}

function Imae() {
  return (
    <>
      <path d="M15.3 26.4Q18 23.9 20.7 26.4ZM27.3 26.4Q30 23.9 32.7 26.4Z" fill="#D9AE82" />
      <path d="M15.3 26.4Q18 23.9 20.7 26.4M27.3 26.4Q30 23.9 32.7 26.4" fill="none" stroke={INK} strokeWidth="1.1" />
      <path d="M15.6 27H20.4M27.6 27H32.4" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />
      <ellipse cx="24" cy="35" rx="2" ry="2.6" fill="#8E3B2F" />
      <ellipse cx="24" cy="36" rx="1.2" ry="1" fill="#E98A80" />
      <path d="M33 7.5h4l-4 4h4M39.6 3.2h2.7L39.6 6h2.7" fill="none" stroke="#7A6A5C" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
    </>
  )
}

function Halmi({ url }) {
  return (
    <>
      <Bun url={url} shine=".45" />
      <path d="M20.5 8.2h7" stroke="#8A5A3B" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14.8 22.8L19.4 21.3M33.2 22.8L28.6 21.3" stroke="#6E5A4C" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="18" cy="27.3" rx="2.1" ry="2.5" fill={INK} />
      <ellipse cx="30" cy="27.3" rx="2.1" ry="2.5" fill={INK} />
      <circle cx="18.8" cy="26.3" r=".85" fill="#fff" />
      <circle cx="30.8" cy="26.3" r=".85" fill="#fff" />
      <path d="M21 35.3Q24 32.6 27 35.3" fill="none" stroke={LIP} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M32.6 30.2q1.8 2.8 0 4q-1.8-1.2 0-4z" fill="#8DB0D4" stroke="#5F86AE" strokeWidth=".5" />
    </>
  )
}
