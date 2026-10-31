import { ContactShadows, Html, OrbitControls, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type CameraView = 'free' | 'front' | 'side' | 'rear' | 'interior'

type AnimationRequest = { name: string; id: number }

type SceneProps = {
  color: string
  view: CameraView
  animationRequest: AnimationRequest | null
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

const MODEL_URL = '/assets/cupra-terramar.glb'

// This GLB was authored with its wheel bottoms below the scene origin. Lift it
// above the studio floor so tyres are not visually clipped by the ground plane.
const CAR_FLOOR_OFFSET = 0.11

const CAMERA_PRESETS: Record<Exclude<CameraView, 'free'>, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [7.2, 2.5, 7.2], target: [0, 0.8, 0] },
  side: { position: [9.1, 2.1, 0], target: [0, 0.8, 0] },
  rear: { position: [-7.2, 2.5, -7.2], target: [0, 0.8, 0] },
  interior: { position: [1.9, 1.55, 2.1], target: [0, 1.15, -0.45] },
}

function Loader() {
  const { progress } = useProgress()
  return <Html center className="three-loader">Loading model {Math.round(progress)}%</Html>
}

function CameraController({ view }: { view: CameraView }) {
  const controls = useRef<any>(null)
  const { camera } = useThree()
  const desired = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const previousView = useRef<CameraView>(view)
  const restoringFreeView = useRef(false)
  const freePosition = useRef(camera.position.clone())
  const freeTarget = useRef(new THREE.Vector3(...CAMERA_PRESETS.front.target))

  useFrame((_, delta) => {
    // Save the exact free-orbit position before a view preset starts moving.
    if (previousView.current !== view) {
      if (previousView.current === 'free' && view !== 'free') {
        freePosition.current.copy(camera.position)
        freeTarget.current.copy(controls.current?.target ?? new THREE.Vector3())
      }
      restoringFreeView.current = view === 'free' && previousView.current !== 'free'
      previousView.current = view
    }

    if (view === 'free') {
      if (!restoringFreeView.current) return
      desired.copy(freePosition.current)
      desiredTarget.copy(freeTarget.current)
    } else {
      const preset = CAMERA_PRESETS[view]
      desired.set(...preset.position)
      desiredTarget.set(...preset.target)
    }

    const speed = 1 - Math.exp(-delta * 3.4)
    camera.position.lerp(desired, speed)
    controls.current?.target.lerp(desiredTarget, speed)
    controls.current?.update()

    if (view === 'free' && camera.position.distanceTo(desired) < 0.015 && controls.current?.target.distanceTo(desiredTarget) < 0.015) {
      restoringFreeView.current = false
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={3.2}
      maxDistance={14}
      minPolarAngle={0.05}
      // A polar angle beyond 90 degrees would take the camera under the studio floor.
      maxPolarAngle={Math.PI / 2 - 0.08}
      enableDamping
      dampingFactor={0.07}
      target={CAMERA_PRESETS.front.target}
    />
  )
}

function CupraModel({ color, animationRequest }: Pick<SceneProps, 'color' | 'animationRequest'>) {
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, scene)
  const paintMaterials = useRef<THREE.Material[]>([])

  useEffect(() => {
    const configured: THREE.Material[] = []

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return

      // The source model reuses paint materials inside the cabin. We only clone
      // the exterior body, doors, tailgate, and roof so interior surfaces stay intact.
      const isExterior = /EXTERIOR|ANIM_EXT_DOOR|ANIM_EXT_TAILGATE|ALIAS_Roof/i.test(object.name)
      if (!isExterior) return

      const source = Array.isArray(object.material) ? object.material : [object.material]
      const mapped = source.map((material) => {
        if (!/^M_CarPaint/i.test(material.name)) return material
        const paint = material.clone()
        configured.push(paint)
        return paint
      })
      object.material = Array.isArray(object.material) ? mapped : mapped[0]
      object.castShadow = true
      object.receiveShadow = true
    })

    paintMaterials.current = configured
    return () => configured.forEach((material) => material.dispose())
  }, [scene])

  useEffect(() => {
    paintMaterials.current.forEach((material) => {
      if ('color' in material && material.color instanceof THREE.Color) {
        material.color.set(color)
      }
      if ('roughness' in material) material.roughness = 0.23
      if ('metalness' in material) material.metalness = 0.68
      if ('clearcoat' in material) material.clearcoat = 1
      if ('clearcoatRoughness' in material) material.clearcoatRoughness = 0.12
      material.needsUpdate = true
    })
  }, [color])

  useEffect(() => {
    if (!animationRequest) return
    if (animationRequest.name === 'RESET') {
      Object.values(actions).forEach((action) => {
        action?.stop()
        action?.reset()
      })
      return
    }

    const action = actions[animationRequest.name]
    if (!action) return
    action.reset().setLoop(THREE.LoopOnce, 1).play()
    action.clampWhenFinished = true
  }, [actions, animationRequest])

  return <primitive object={scene} />
}

export default function CarScene({ color, view, animationRequest, onCanvasReady }: SceneProps) {
  return (
    <Canvas
      className="car-canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: CAMERA_PRESETS.front.position, fov: 33 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => onCanvasReady?.(gl.domElement)}
    >
      <color attach="background" args={['#1c222b']} />
      <fog attach="fog" args={['#1c222b', 14, 32]} />
      <hemisphereLight intensity={0.7} groundColor="#11151c" color="#b8c5d7" />
      <spotLight castShadow intensity={6.5} position={[4.5, 8, 5]} angle={0.55} penumbra={0.95} decay={1.4} shadow-mapSize={[2048, 2048]} />
      <spotLight intensity={3.2} position={[-6, 4.5, 1]} color="#8eabc8" angle={0.7} penumbra={1} decay={1.3} />
      <spotLight intensity={2.8} position={[-3, 2.5, -6]} color="#4e6786" angle={0.75} penumbra={1} decay={1.4} />
      <Suspense fallback={<Loader />}>
        <group position={[0, CAR_FLOOR_OFFSET, 0]}>
          <CupraModel color={color} animationRequest={animationRequest} />
        </group>
      </Suspense>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.03, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#242c37" roughness={0.74} metalness={0.08} />
      </mesh>
      <ContactShadows position={[0, -0.018, 0]} opacity={0.78} scale={13} blur={2.1} far={8} />
      <CameraController view={view} />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
