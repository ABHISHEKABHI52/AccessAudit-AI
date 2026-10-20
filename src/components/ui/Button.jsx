const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark border border-transparent',
  outline: 'bg-surface text-primary border border-primary hover:bg-blue-50',
  ghost: 'bg-transparent text-ink hover:bg-subtle border border-transparent',
}

const sizes = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}