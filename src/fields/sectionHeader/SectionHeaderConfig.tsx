import FormControl from '../../ui/FormControl/FormControl'
import SegmentedControl from '../../ui/SegmentedControl/SegmentedControl'
import type { ConfigPanelProps } from '../uiTypes'
import type { SectionHeaderSize } from './sectionHeaderSchema'

const sizeOptions: { value: SectionHeaderSize; label: string }[] = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
]

export default function SectionHeaderConfig({
  field,
  onChange,
}: ConfigPanelProps<'sectionHeader'>) {
  return (
    <FormControl label="Size" htmlFor={`config-${field.id}-size`} isGroupLabel>
      <SegmentedControl
        label="Size"
        options={sizeOptions}
        value={field.config.size}
        onChange={(size) => onChange({ ...field, config: { size } })}
      />
    </FormControl>
  )
}
