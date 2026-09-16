'use client'

/* Small shadcn-style UI primitives for the admin panel.
   Marked "use client" so they can be composed inside both server and
   client components. Styling: "Modern Minimalist SaaS" (teal accent). */

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ------------------------------------------------------------------ Button */
type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0'

const buttonVariantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover',
  outline: 'border border-input bg-card text-foreground shadow-xs hover:bg-muted',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline',
}

const buttonSizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4',
  sm: 'h-8 px-3 text-[13px]',
  lg: 'h-11 px-6',
  icon: 'size-10',
}

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(buttonBase, buttonVariantClasses[variant], buttonSizeClasses[size], className)
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
))
Button.displayName = 'Button'

/** Submit button that asks for confirmation before the form posts. */
export function ConfirmSubmit({
  message = 'Are you sure? This cannot be undone.',
  className,
  variant = 'destructive',
  size,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message?: string; variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type="submit"
      className={buttonVariants({ variant, size, className })}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- Card */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 border-b border-border px-6 py-4', className)} {...props} />
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[15px] font-semibold tracking-tight', className)} {...props} />
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 border-t border-border px-6 py-4', className)} {...props} />
}

/* ------------------------------------------------------------------- Badge */
type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'
const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  destructive: 'bg-rose-50 text-rose-700',
  secondary: 'bg-muted text-muted-foreground',
  outline: 'border border-border text-foreground',
}
export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', badgeVariantClasses[variant], className)} {...props} />
}

/* ------------------------------------------------------------ Form controls */
const fieldBase =
  'w-full rounded-lg border border-input bg-card text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, 'h-10 px-3 py-2', className)} {...props} />,
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(fieldBase, 'min-h-20 px-3 py-2', className)} {...props} />,
)
Textarea.displayName = 'Textarea'

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, 'h-10 appearance-none pl-3 pr-9 py-2', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
    </div>
  )
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-[13px] font-medium text-foreground/80', className)} {...props} />
}

/* ------------------------------------------------------------------ Avatar */
export function Avatar({ className, children, src, alt }: { className?: string; children?: React.ReactNode; src?: string | null; alt?: string }) {
  return (
    <span className={cn('inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border', className)}>
      {src ? <img src={src} alt={alt || ''} className="size-full object-cover" /> : children}
    </span>
  )
}
