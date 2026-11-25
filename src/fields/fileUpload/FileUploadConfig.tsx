import { useState } from 'react'
import FormControl from '../../ui/FormControl/FormControl'
import OptionalNumberInput from '../../ui/OptionalNumberInput/OptionalNumberInput'
import TextInput from '../../ui/TextInput/TextInput'
import type { ConfigPanelProps } from '../uiTypes'
import { parseAllowedTypes } from './fileUploadLogic'

export default function FileUploadConfig({
  field,
  onChange,
}: ConfigPanelProps<'fileUpload'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`
  // Typed text is kept as-is and only parsed on blur, so "," and spaces can be typed.
  const [typesDraft, setTypesDraft] = useState(config.allowedTypes.join(', '))

  const handleTypesBlur = () => {
    const allowedTypes = parseAllowedTypes(typesDraft)
    setTypesDraft(allowedTypes.join(', '))
    onChange({ ...field, config: { ...config, allowedTypes } })
  }

  return (
    <>
      <FormControl
        label="Allowed file types"
        htmlFor={`${idPrefix}-types`}
        hint="Comma-separated, e.g. .pdf, .png, image/*. Empty allows any type."
      >
        <TextInput
          id={`${idPrefix}-types`}
          value={typesDraft}
          onChange={(event) => setTypesDraft(event.target.value)}
          onBlur={handleTypesBlur}
          placeholder="Any type"
        />
      </FormControl>
      <FormControl label="Max number of files" htmlFor={`${idPrefix}-max`}>
        <OptionalNumberInput
          id={`${idPrefix}-max`}
          value={config.maxFiles}
          onChange={(maxFiles) =>
            onChange({
              ...field,
              config: { ...config, maxFiles: maxFiles ?? config.maxFiles },
            })
          }
          min={1}
        />
      </FormControl>
    </>
  )
}
