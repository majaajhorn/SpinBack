// Regenerate icons after changing public/favicon.svg: npm run generate-pwa-assets
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Maskable and Apple icons get a solid background (no transparency allowed there): Sleeve Mint.
const background = { resizeOptions: { background: '#E4EDE8' } }

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, ...background },
    apple: { ...preset.apple, ...background },
  },
  images: ['public/favicon.svg'],
})
