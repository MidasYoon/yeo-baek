import { Link } from 'react-router-dom'
import styles from './Button.module.css'

// 공통 버튼 (팀 공동, D-028). DESIGN 6절 "버튼".
// variant: 'primary'(주요) | 'secondary'(보조) | 'text'(글자)
// to를 주면 화면 이동용 링크(<a>)로, 없으면 <button>으로 그린다 (DESIGN 8절).
export default function Button({
  variant = 'primary',
  to,
  type = 'button',
  className,
  children,
  ...rest
}) {
  const classNames = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={classNames} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classNames} {...rest}>
      {children}
    </button>
  )
}
