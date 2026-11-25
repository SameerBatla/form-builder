import type { ReactNode } from 'react'
import styles from './Banner.module.css'

interface BannerProps {
  tone: 'warning' | 'success'
  children: ReactNode
  onDismiss?: () => void
}

export default function Banner({ tone, children, onDismiss }: BannerProps) {
  return (
    <div className={`${styles.banner} ${styles[tone]}`} role="status">
      <span className={styles.message}>{children}</span>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  )
}
