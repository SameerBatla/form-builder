import FormControl from '../../ui/FormControl/FormControl'
import SegmentedControl from '../../ui/SegmentedControl/SegmentedControl'
import OptionsEditor from '../shared/OptionsEditor'
import type { ConfigPanelProps } from '../uiTypes'
import type { SingleSelectDisplay } from './singleSelectSchema'

const displayOptions: { value: SingleSelectDisplay; label: string }[] = [
  { value: 'radio', label: 'Radio' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'tiles', label: 'Tiles' },
]

export default function SingleSelectConfig({
  field,
  onChange,
}: ConfigPanelProps<'singleSelect'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`

  return (
    <>
      <FormControl label="Display as" htmlFor={`${idPrefix}-display`} isGroupLabel>
        <SegmentedControl
          label="Display as"
          options={displayOptions}
          value={config.display}
          onChange={(display) => onChange({ ...field, config: { ...config, display } })}
        />
      </FormControl>
      <FormControl label="Options" htmlFor={`${idPrefix}-options`} isGroupLabel>
        <OptionsEditor
          idPrefix={idPrefix}
          options={config.options}
          onChange={(options) => onChange({ ...field, config: { ...config, options } })}
        />
      </FormControl>
    </>
  )
}
