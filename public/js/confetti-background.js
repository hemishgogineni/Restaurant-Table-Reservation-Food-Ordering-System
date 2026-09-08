// ======================================
// CONFETTI BACKGROUND - SCATTERED PARTICLES
// ======================================

class ConfettiBackground {
  constructor(canvasId = 'confetti-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isAnimating = false;
    this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    // Reduce particle count on small screens
    const screenWidth = window.innerWidth;
    this.particleCount = screenWidth < 768 ? 80 : screenWidth < 1024 ? 120 : 180;

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

    // Update theme on theme change
    window.addEventListener('theme-changed', (e) => {
      this.isDarkMode = e.detail.theme === 'dark';
      this.updateColors();
    });

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
   * Get color palette based on theme
   */
  getColorPalette() {
    if (this.isDarkMode) {
      // Galaxy colors for dark mode
      return [
        'rgba(76, 139, 245, 0.7)',      // Bright blue
        'rgba(245, 166, 35, 0.7)',      // Warm orange
        'rgba(255, 255, 255, 0.8)',     // White
        'rgba(200, 220, 255, 0.6)',     // Soft blue-white
        'rgba(255, 180, 100, 0.6)',     // Warm peachy
      ];
    } else {
      // Confetti colors for light mode
      return [
        'rgba(193, 68, 14, 0.8)',       // Terracotta
        'rgba(212, 160, 23, 0.8)',      // Gold
        'rgba(231, 90, 124, 0.8)',      // Pink
        'rgba(100, 150, 255, 0.7)',     // Light blue
        'rgba(255, 150, 80, 0.7)',      // Coral
      ];
    }
  }

  /**
   * Create scattered particles
   */
  createParticles() {
    this.particles = [];
    const colorPalette = this.getColorPalette();

    for (let i = 0; i < this.particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;

      this.particles.push({
        x,
        y,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.1 + 0.05,
        size: Math.random() * 6 + 2,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        opacity: Math.random() * 0.5 + 0.3,
        baseOpacity: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        bobSpeed: Math.random() * 0.02 + 0.01,
        bobAmount: Math.random() * 20 + 10,
        bobPhase: Math.random() * Math.PI * 2,
        age: 0,
      });
    }
  }

  /**
   * Update color palette when theme changes
   */
  updateColors() {
    const colorPalette = this.getColorPalette();
    this.particles.forEach((particle) => {
      particle.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    });
  }

  /**
   * Update particle positions
   */
  update() {
    this.particles.forEach((particle) => {
      particle.age += 1;

      // Gentle drifting
      particle.x += particle.vx;
      particle.bobPhase += particle.bobSpeed;
      particle.y = particle.baseY + Math.sin(particle.bobPhase) * particle.bobAmount;

      // Rotation
      particle.rotation += particle.rotationSpeed;

      // Wrap around screen
      if (particle.x < -20) particle.x = this.canvas.width + 20;
      if (particle.x > this.canvas.width + 20) particle.x = -20;
      if (particle.y > this.canvas.height + 20) {
        particle.y = -20;
        particle.baseY = -20;
      }

      // Subtle opacity variation
      particle.opacity = particle.baseOpacity * (0.7 + 0.3 * Math.sin(particle.age * 0.01));
    });
  }

  /**
   * Draw particles
   */
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw particles
    this.particles.forEach((particle) => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);

      // Draw as rounded square/dot
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationFrame();
    }
  }

  /**
   * Animation frame
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
    window.confettiBg = new ConfettiBackground('confetti-canvas');
  });
} else {
  window.confettiBg = new ConfettiBackground('confetti-canvas');
}
