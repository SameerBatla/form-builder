import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'medium' | 'small'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

function buttonClassName(
  { variant = 'secondary', size = 'medium' }: StyleProps,
  extra?: string,
) {
  const classNames = [styles.button, styles[variant]]
  if (size === 'small') {
    classNames.push(styles.small)
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
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size }, className)}
      {...rest}
    />
  )
}

type LinkButtonProps = StyleProps & LinkProps

/** A navigation link that looks like a button. */
export function LinkButton({ variant, size, className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClassName({ variant, size }, className)} {...rest} />
}
