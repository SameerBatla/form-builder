import styles from './Tabs.module.css'

interface Tab<Id extends string> {
  id: Id
  label: string
}

interface TabsProps<Id extends string> {
  tabs: Tab<Id>[]
  activeTabId: Id
  onChange: (tabId: Id) => void
  /** Prefix for tab/panel ids; the panel should use id `${idPrefix}-panel`. */
  idPrefix: string
}

export default function Tabs<Id extends string>({
  tabs,
  activeTabId,
  onChange,
  idPrefix,
}: TabsProps<Id>) {
  return (
    <div role="tablist" className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`${idPrefix}-${tab.id}`}
          aria-selected={tab.id === activeTabId}
          aria-controls={`${idPrefix}-panel`}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
