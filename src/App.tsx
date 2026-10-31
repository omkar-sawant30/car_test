import { useEffect, useRef, useState } from 'react'
import CarScene, { CameraView } from './CarScene'

const PAINTS = [
  { name: 'Violet Aurora', value: '#5f1f83' },
  { name: 'Graphene Grey', value: '#49505a' },
  { name: 'Glacier White', value: '#e6e7e5' },
  { name: 'Midnight Black', value: '#111216' },
  { name: 'Ember Red', value: '#9c241f' },
  { name: 'Petrol Blue', value: '#0d4d63' },
]

const ANIMATIONS = [
  ['anim_DOOR_FRONT_LEFT_4', 'Open front left'],
  ['anim_DOOR_FRONT_RIGHT_3', 'Open front right'],
  ['anim_DOOR_REAR_LEFT_2', 'Open rear left'],
  ['anim_DOOR_REAR_RIGHT_1', 'Open rear right'],
  ['anim_TAILGATE_0', 'Open tailgate'],
] as const

export default function App() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  const [color, setColor] = useState(PAINTS[0].value)
  const [view, setView] = useState<CameraView>('free')
  const [panelOpen, setPanelOpen] = useState(() => !window.matchMedia('(max-width: 700px)').matches)
  const [viewControlsVisible, setViewControlsVisible] = useState(true)
  const [animationRequest, setAnimationRequest] = useState<{ name: string; id: number } | null>(null)
  const [imageMessage, setImageMessage] = useState('')
  const hideViewsTimer = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const play = (name: string) => setAnimationRequest({ name, id: Date.now() })

  const clearViewTimer = () => {
    if (hideViewsTimer.current !== null) window.clearTimeout(hideViewsTimer.current)
  }

  const showViewControls = () => {
    clearViewTimer()
    setViewControlsVisible(true)
  }

  const hideViewControlsSoon = () => {
    clearViewTimer()
    hideViewsTimer.current = window.setTimeout(() => setViewControlsVisible(false), 2400)
  }

  useEffect(() => {
    hideViewControlsSoon()
    return clearViewTimer
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const updateCompactMode = () => setCompact(media.matches)
    media.addEventListener('change', updateCompactMode)
    return () => media.removeEventListener('change', updateCompactMode)
  }, [])

  const chooseView = (nextView: Exclude<CameraView, 'free'>) => {
    // Clicking the active preset is a deselect: it returns to the saved free-orbit pose.
    setView((currentView) => currentView === nextView ? 'free' : nextView)
    hideViewControlsSoon()
  }

  const shareImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) {
      setImageMessage('Scene is still loading')
      return
    }

    const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!imageBlob) {
      setImageMessage('Could not create image')
      return
    }

    const file = new File([imageBlob], `terramar-${color.slice(1)}.png`, { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Terramar configuration', files: [file] })
        setImageMessage('Image shared')
      } else {
        const link = document.createElement('a')
        link.download = file.name
        link.href = URL.createObjectURL(imageBlob)
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(link.href), 0)
        setImageMessage('Image downloaded')
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setImageMessage('Share unavailable')
    }
  }

  return (
    <main>
      <CarScene color={color} view={view} animationRequest={animationRequest} compact={compact} onCanvasReady={(canvas) => { canvasRef.current = canvas }} />

      <header className="topbar">
        <div>
          <p className="eyebrow">UNOFFICIAL VISUAL CONFIGURATOR</p>
          <h1>TERRAMAR</h1>
        </div>
        <div className="share-area">
          <button className="outline-button" onClick={shareImage}>Share image</button>
          {imageMessage && <span>{imageMessage}</span>}
        </div>
      </header>

      <button className={`view-peek ${viewControlsVisible ? 'hidden' : ''}`} onClick={showViewControls} aria-label="Show camera views">
        Views
      </button>
      <nav
        className={`view-switcher ${viewControlsVisible || view !== 'free' ? 'visible' : ''}`}
        aria-label="Camera views"
        onMouseEnter={showViewControls}
        onMouseLeave={hideViewControlsSoon}
        onFocus={showViewControls}
        onBlur={hideViewControlsSoon}
      >
        {(['front', 'side', 'rear', 'interior'] as Exclude<CameraView, 'free'>[]).map((item) => (
          <button
            key={item}
            className={view === item ? 'active' : ''}
            onClick={() => chooseView(item)}
            title={view === item ? 'Return to free view' : `Show ${item} view`}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className={`config-panel ${panelOpen ? 'open' : ''}`}>
        <button className="panel-toggle" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen}>
          {panelOpen ? 'Hide options' : 'Configure'}
        </button>
        <div className="panel-content">
          <div className="panel-heading">
            <p className="eyebrow">EXTERIOR</p>
            <h2>Paint finish</h2>
            <span className="color-name">{PAINTS.find((paint) => paint.value === color)?.name ?? 'Custom paint'}</span>
          </div>
          <div className="swatches" role="list" aria-label="Paint colors">
            {PAINTS.map((paint) => (
              <button
                key={paint.value}
                className={paint.value === color ? 'swatch selected' : 'swatch'}
                style={{ background: paint.value }}
                title={paint.name}
                aria-label={paint.name}
                onClick={() => setColor(paint.value)}
              />
            ))}
            <label className="custom-color" title="Choose a custom color">
              <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
              +
            </label>
          </div>

          <div className="divider" />
          <p className="eyebrow">INTERACTION</p>
          <div className="animation-grid">
            {ANIMATIONS.map(([name, label]) => <button key={name} onClick={() => play(name)}>{label}</button>)}
            <button className="reset-button" onClick={() => play('RESET')}>Reset panels</button>
          </div>
        </div>
      </section>

      <p className="hint">{compact ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom'}</p>
    </main>
  )
}
