import { useState } from 'react'
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
  const [color, setColor] = useState(PAINTS[0].value)
  const [view, setView] = useState<CameraView>('front')
  const [panelOpen, setPanelOpen] = useState(true)
  const [animationRequest, setAnimationRequest] = useState<{ name: string; id: number } | null>(null)

  const play = (name: string) => setAnimationRequest({ name, id: Date.now() })

  const downloadImage = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.car-canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `terramar-${color.slice(1)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <main>
      <CarScene color={color} view={view} animationRequest={animationRequest} />

      <header className="topbar">
        <div>
          <p className="eyebrow">UNOFFICIAL VISUAL CONFIGURATOR</p>
          <h1>TERRAMAR</h1>
        </div>
        <button className="outline-button" onClick={downloadImage}>Download image</button>
      </header>

      <nav className="view-switcher" aria-label="Camera views">
        {(['front', 'side', 'rear', 'interior'] as CameraView[]).map((item) => (
          <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>
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

      <p className="hint">Drag to rotate · Scroll to zoom</p>
    </main>
  )
}
