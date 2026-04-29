import Image from 'next/image'

export function DetectionImage({
  src,
  alt,
  className = '',
  emptyLabel = 'No image',
}: {
  src: string | null
  alt: string
  className?: string
  emptyLabel?: string
}) {
  if (!src) {
    return (
      <div className={`bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 text-xs ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 opacity-40">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
        </svg>
        {emptyLabel}
      </div>
    )
  }
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 400px"
      />
    </div>
  )
}
