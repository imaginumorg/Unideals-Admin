import { memo } from 'react'
import BrandLoader from './BrandLoader'

// Full-area loading state (route suspense, session restore): the Unideals
// "U" draw-on loader from the storefront, centred in the content area.
// fullScreen: viewport-centred, mark only (matches the storefront).
const Loader = ({ label = '', fullScreen = false }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-dvh bg-canvas' : 'min-h-[50vh]'}`}>
    <BrandLoader size="md" label={label} />
  </div>
)

export default memo(Loader)
