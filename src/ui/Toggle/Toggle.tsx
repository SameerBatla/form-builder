import styles from './Toggle.module.css'

interface ToggleProps {
  label: string
  isOn: boolean
  onChange: (isOn: boolean) => void
}

export default function Toggle({ label, isOn, onChange }: ToggleProps) {
  const handleClick = () => {
    onChange(!isOn)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      className={styles.toggle}
      onClick={handleClick}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      {label}
    </button>
  )
}
