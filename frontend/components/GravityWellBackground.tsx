'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * GravityWellBackground - A WebGL shader background using react-three-fiber.
 * It renders a massive 3D grid plane that dynamically distorts (z-axis displacement)
 * towards the user's cursor, creating a "black hole" / gravity well effect.
 */
function GridMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { mouse, viewport } = useThree()

  // Create a custom shader material for the red neon grid with displacement
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color('#FF2A1E') },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      varying vec2 vUv;
      varying float vElevation;

      void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        
        // Calculate distance from mouse (mouse is mapped to -0.5 to 0.5 roughly)
        // We need to map mouse screen coords to world coords approximately
        vec2 worldMouse = vec2(uMouse.x * 20.0, uMouse.y * 20.0);
        float dist = distance(modelPosition.xy, worldMouse);
        
        // Gravity well effect: pull Z down heavily near the mouse
        float wellRadius = 8.0;
        float depth = 15.0;
        float pull = smoothstep(wellRadius, 0.0, dist);
        
        modelPosition.z -= pull * depth;
        
        // Add some slow ambient breathing wave
        modelPosition.z += sin(modelPosition.x * 0.5 + uTime * 0.5) * 0.5;
        modelPosition.z += cos(modelPosition.y * 0.5 + uTime * 0.5) * 0.5;

        vElevation = modelPosition.z;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vElevation;

      void main() {
        // Create a sharp grid pattern
        vec2 grid = fract(vUv * 40.0);
        float lineThickness = 0.05;
        
        float isLine = step(grid.x, lineThickness) + step(grid.y, lineThickness);
        isLine = clamp(isLine, 0.0, 1.0);
        
        // Fade out grid in the distance/depth (in the well)
        float depthFade = clamp(1.0 + (vElevation * 0.1), 0.0, 1.0);
        
        // Neon edge glow mapping
        vec3 finalColor = uColor * isLine * depthFade;
        
        // Add pure black background and blend
        gl_FragColor = vec4(finalColor, isLine * depthFade * 0.8);
      }
    `,
    transparent: true,
    wireframe: false,
    side: THREE.DoubleSide
  }), [viewport.width, viewport.height])

  useFrame((state) => {
    if (meshRef.current) {
      // Smoothly interpolate mouse position into the uniform
      const mat = meshRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uTime.value = state.clock.elapsedTime
      
      // Lerp mouse for smooth gravity well tracking
      mat.uniforms.uMouse.value.x += (state.mouse.x - mat.uniforms.uMouse.value.x) * 0.1
      mat.uniforms.uMouse.value.y += (state.mouse.y - mat.uniforms.uMouse.value.y) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} material={material} rotation={[-Math.PI / 3, 0, 0]} position={[0, -2, -5]}>
      {/* High segment count needed for smooth displacement */}
      <planeGeometry args={[100, 100, 150, 150]} />
    </mesh>
  )
}

export function GravityWellBackground() {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none opacity-50 bg-[#15161A]">
      <Canvas camera={{ position: [0, 1, 5], fov: 75 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <fog attach="fog" args={['#15161A', 5, 25]} />
        <GridMesh />
      </Canvas>
    </div>
  )
}
