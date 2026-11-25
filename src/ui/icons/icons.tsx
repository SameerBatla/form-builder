import type { ReactNode, SVGProps } from 'react'

/*
 * Hand-written line icons (no icon library): 24×24 grid, 1.75px stroke, currentColor.
 * Decorative by default (aria-hidden) because a text label always sits next to them.
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }

function IconBase({ size = 16, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* Field types */

export function TextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 6h14M12 6v13M9 19h6" />
    </IconBase>
  )
}

export function MultiLineIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h10" />
    </IconBase>
  )
}

export function NumberIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />
    </IconBase>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </IconBase>
  )
}

export function RadioIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function CheckboxIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.5 2.5 5-5" />
    </IconBase>
  )
}

export function PaperclipIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />
    </IconBase>
  )
}

export function HeadingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 5v14M18 5v14M6 12h12" />
    </IconBase>
  )
}

export function SigmaIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 5H6l6 7-6 7h12" />
    </IconBase>
  )
}

/* Interface */

export function GripIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      {[6, 12, 18].map((y) => (
        <g key={y} fill="currentColor" stroke="none">
          <circle cx="9" cy={y} r="1.4" />
          <circle cx="15" cy={y} r="1.4" />
        </g>
      ))}
    </IconBase>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </IconBase>
  )
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </IconBase>
  )
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </IconBase>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.6-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </IconBase>
  )
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 5-7 7 7 7" />
    </IconBase>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </IconBase>
  )
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </IconBase>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
    </IconBase>
  )
}

export function BranchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="5.5" r="2" />
      <circle cx="6" cy="18.5" r="2" />
      <circle cx="18" cy="8.5" r="2" />
      <path d="M6 7.5v9M18 10.5c0 4-5 3.5-10.5 6.5" />
    </IconBase>
  )
}

export function FormIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </IconBase>
  )
}
