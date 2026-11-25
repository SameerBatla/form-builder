import { useState } from 'react'
import styles from './Counter.module.css'

/** Example component showing the project conventions. Delete it when the real task starts. */
export default function Counter() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => {
    setCount((prevCount) => {
      const nextCount = prevCount + 1
      return nextCount
    })
  }

  return (
    <button type="button" className={styles.button} onClick={handleIncrement}>
      Count: {count}
    </button>
  )
}
