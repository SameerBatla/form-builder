import type { ReactNode } from 'react'
import styles from './Badge.module.css'

interface BadgeProps {
  tone?: 'neutral' | 'danger'
  children: ReactNode
}

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
