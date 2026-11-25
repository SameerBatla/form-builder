import type { FillInputProps } from '../uiTypes'
import type { SectionHeaderSize } from './sectionHeaderSchema'
import styles from './SectionHeaderInput.module.css'

// The form title is the page's h1, so sections use h2 (XL) down to h6 (XS).
const headingTags: Record<SectionHeaderSize, 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  xl: 'h2',
  lg: 'h3',
  md: 'h4',
  sm: 'h5',
  xs: 'h6',
}

/** Not an input: Section Header only displays its label as a heading. */
export default function SectionHeaderInput({ field }: FillInputProps<'sectionHeader'>) {
  const { size } = field.config
  const Heading = headingTags[size]
  return (
    <Heading className={`${styles.heading} ${styles[size]}`}>
      {field.label.trim() || 'Untitled section'}
    </Heading>
  )
}
