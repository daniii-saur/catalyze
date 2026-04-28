import Image from 'next/image'

export function DetectionImage({
  src,
  alt,
  className = '',
}: {
  src: string | null
  alt: string
  className?: string
}) {
  if (!src) {
    return (
      <div className={`bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm ${className}`}>
        No image
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
