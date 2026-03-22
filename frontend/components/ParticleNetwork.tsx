'use client'

import { useEffect, useRef } from 'react'

/**
 * 3D Particle Constellation / Connecting Dots Network Background.
 * Renders an animated HTML5 canvas forming a neural/tech mesh pattern.
 */
export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    
    // Mouse interaction state
    let mouse = { x: -1000, y: -1000, radius: 150 }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 50 : 120
    const connectionDistance = 160
    const speed = 0.4

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      baseX: number
      baseY: number

      constructor() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.baseX = this.x
        this.baseY = this.y
        this.vx = (Math.random() - 0.5) * speed
        this.vy = (Math.random() - 0.5) * speed
        this.size = Math.random() * 2 + 0.5
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Mouse Repel Physics
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance
          const forceDirectionY = dy / distance
          const force = (mouse.radius - distance) / mouse.radius
          const directionX = forceDirectionX * force * 5
          const directionY = forceDirectionY * force * 5
          
          this.x -= directionX
          this.y -= directionY
        }

        if (this.x < 0) this.x = canvas!.width
        if (this.x > canvas!.width) this.x = 0
        if (this.y < 0) this.y = canvas!.height
        if (this.y > canvas!.height) this.y = 0
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = 'rgba(255, 42, 30, 0.8)' // neon red dots
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const init = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.update()
        p.draw()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = 1 - (distance / connectionDistance)
            ctx.strokeStyle = `rgba(255, 42, 30, ${opacity * 0.5})`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    init()
    animate()

    window.addEventListener('resize', init)
    return () => {
      window.removeEventListener('resize', init)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] opacity-90"
      style={{ willChange: 'transform' }}
    />
  )
}
