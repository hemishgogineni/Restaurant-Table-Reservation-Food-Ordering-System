// ======================================
// GALAXY BACKGROUND - COSMIC PARTICLES
// ======================================

class GalaxyBackground {
  constructor(canvasId = 'galaxy-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isAnimating = false;

    // Reduce particle count on small screens
    const screenWidth = window.innerWidth;
    this.particleCount = screenWidth < 768 ? 150 : screenWidth < 1024 ? 200 : 300;

    this.init();
  }

  /**
   * Initialize canvas and particles
   */
  init() {
    this.resizeCanvas();
    this.createParticles();
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.animate();
      }
    });
  }

  /**
   * Resize canvas to match window
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Create cosmic particles in double spiral pattern
   */
  createParticles() {
    this.particles = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.max(this.canvas.width, this.canvas.height) / 2;

    // Keep the particles visible against the light-only login background.
    const colors = [
      'rgba(31, 78, 121, 0.48)',       // Deep blue
      'rgba(76, 139, 245, 0.42)',      // Sky blue
      'rgba(212, 160, 23, 0.42)',      // Gold
      'rgba(193, 68, 14, 0.34)',       // Terracotta
      'rgba(94, 106, 128, 0.3)',       // Slate
    ];

    // Create particles in spiral pattern
    for (let i = 0; i < this.particleCount; i++) {
      const t = (i / this.particleCount) * Math.PI * 4; // Two complete spirals
      const radiusProgress = i / this.particleCount;
      const radius = radiusProgress * maxRadius;

      // Add some randomness to spiral
      const randomness = (Math.random() - 0.5) * maxRadius * 0.15;
      const randomAngle = (Math.random() - 0.5) * 0.3;

      const x = centerX + Math.cos(t + randomAngle) * radius + randomness;
      const y = centerY + Math.sin(t + randomAngle) * radius + randomness;

      // Particles closer to center are brighter and larger
      const brightness = 1 - radiusProgress * 0.7;
      const size = brightness * 2.5;
      const opacity = brightness * 0.8;

      this.particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity,
        baseOpacity: opacity,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.3,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.0005,
        age: Math.random() * 1000,
      });
    }
  }

  /**
   * Update particle positions and opacity (twinkling)
   */
  update() {
    this.particles.forEach((particle) => {
      particle.age += 1;

      // Slow drift in circular motion
      particle.driftAngle += particle.driftSpeed;
      particle.x = particle.baseX + Math.cos(particle.driftAngle) * 20;
      particle.y = particle.baseY + Math.sin(particle.driftAngle) * 20;

      // Twinkling effect
      particle.opacity = particle.baseOpacity * (0.5 + 0.5 * Math.sin(particle.age * particle.twinkleSpeed));
    });
  }

  /**
   * Draw particles and glow effect
   */
  draw() {
    // Clear the light canvas while preserving a faint particle trail.
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw radial gradient glow behind center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
    gradient.addColorStop(0, 'rgba(76, 139, 245, 0.06)');
    gradient.addColorStop(1, 'rgba(76, 139, 245, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw particles
    this.particles.forEach((particle) => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.opacity;

      // Draw glowing circle
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Add subtle glow for brighter particles
      if (particle.opacity > 0.5) {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.size * 0.5;
        this.ctx.globalAlpha = particle.opacity * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }

  /**
   * Animation loop (~30fps)
   */
  animate() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationFrame();
    }
  }

  /**
   * Animation frame with throttling
   */
  animationFrame() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animationFrame());
  }

  /**
   * Pause animation
   */
  pause() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Resume animation
   */
  resume() {
    this.animate();
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.galaxyBg = new GalaxyBackground('galaxy-canvas');
  });
} else {
  window.galaxyBg = new GalaxyBackground('galaxy-canvas');
}
