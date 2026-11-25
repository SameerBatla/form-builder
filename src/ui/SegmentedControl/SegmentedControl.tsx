import styles from './SegmentedControl.module.css'

interface SegmentedControlProps<Value extends string> {
  label: string
  options: { value: Value; label: string }[]
  value: Value
  onChange: (value: Value) => void
}

/** A row of mutually exclusive buttons, e.g. Radio | Dropdown | Tiles. */
export default function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div role="radiogroup" aria-label={label} className={styles.control}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={styles.segment}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
