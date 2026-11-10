import { memo, useState } from 'react'
import { initialsOf } from '../lib/format'

/**
 * Accepts a string URL, { url }, or { avatar: { url } }.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const extractAvatarUrl = (source) => {
  if (!source) return null
  if (typeof source === 'string') return source.trim() || null
  if (typeof source === 'object') {
    if (typeof source.url === 'string') return source.url.trim() || null
    if (source.avatar) return extractAvatarUrl(source.avatar)
  }
  return null
}

// Stable hue per name so the same person always gets the same color.
const HUES = [
  'from-[#4B45FF] to-[#7472F5]',
  'from-[#0EA5E9] to-[#6366F1]',
  'from-[#10B981] to-[#0EA5E9]',
  'from-[#F59E0B] to-[#EF4444]',
  'from-[#EC4899] to-[#8B5CF6]',
  'from-[#8B5CF6] to-[#4B45FF]',
]
const hueFor = (name = '') => HUES[[...String(name)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % HUES.length]

const Avatar = ({ src, name, initials, className = 'h-9 w-9 text-xs', ringClassName = '', alt }) => {
  const [failedUrl, setFailedUrl] = useState(null)
  const url = extractAvatarUrl(src)
  const showImage = Boolean(url) && failedUrl !== url

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white select-none ${
        showImage ? 'bg-surface-3' : `bg-gradient-to-br ${hueFor(name)}`
      } ${ringClassName} ${className}`}
    >
      {showImage ? (
        <img src={url} alt={alt || name || 'Avatar'} onError={() => setFailedUrl(url)} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="leading-none tracking-wide">{initials || initialsOf(name)}</span>
      )}
    </span>
  )
}

export default memo(Avatar)
