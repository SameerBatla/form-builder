import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghostDanger' | 'danger'
export type ButtonSize = 'medium' | 'small'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Square button holding only an icon; pass an `aria-label`. */
  iconOnly?: boolean
}

function buttonClassName(
  { variant = 'secondary', size = 'medium', iconOnly = false }: StyleProps,
  extra?: string,
) {
  const classNames = [styles.button, styles[variant]]
  if (size === 'small') {
    classNames.push(styles.small)
  }
  if (iconOnly) {
    classNames.push(styles.iconOnly)
  }
  if (extra) {
    classNames.push(extra)
  }
  return classNames.join(' ')
}

type ButtonProps = StyleProps & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant,
  size,
  iconOnly,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, iconOnly }, className)}
      {...rest}
    />
  )
}

type LinkButtonProps = StyleProps & LinkProps

/** A navigation link that looks like a button. */
export function LinkButton({
  variant,
  size,
  iconOnly,
  className,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={buttonClassName({ variant, size, iconOnly }, className)} {...rest} />
  )
}
