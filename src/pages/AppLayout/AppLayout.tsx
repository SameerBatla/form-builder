import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { countUnloadableRecords } from '../../storage/storageHealth'
import Banner from '../../ui/Banner/Banner'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  // Checked once per app load: bad records only appear through outside edits.
  const [unloadableCount] = useState(countUnloadableRecords)
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false)

  const handleDismissNotice = () => {
    setIsNoticeDismissed(true)
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Form Builder
        </Link>
      </header>
      {unloadableCount > 0 && !isNoticeDismissed && (
        <Banner tone="warning" onDismiss={handleDismissNotice}>
          {unloadableCount === 1
            ? '1 saved item couldn’t be loaded.'
            : `${unloadableCount} saved items couldn’t be loaded.`}{' '}
          Nothing was deleted.
        </Banner>
      )}
      <Outlet />
    </div>
  )
}
