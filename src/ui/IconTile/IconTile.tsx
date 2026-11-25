import type { ReactNode } from 'react'
import styles from './IconTile.module.css'

interface IconTileProps {
  tone?: 'accent' | 'outline'
  children: ReactNode
}

/** A small rounded square holding an icon (template cards, palette items). */
export default function IconTile({ tone = 'outline', children }: IconTileProps) {
  return <span className={`${styles.tile} ${styles[tone]}`}>{children}</span>
}
