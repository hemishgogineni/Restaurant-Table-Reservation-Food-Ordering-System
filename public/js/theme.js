// ======================================
// THEME SYSTEM - THEME SWITCHER
// ======================================

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'gourmet-reserve-theme';
    this.LIGHT_THEME = 'light';
    this.DARK_THEME = 'dark';
    
    // Initialize theme immediately (before paint)
    this.initTheme();
  }

  /**
   * Initialize theme on page load
   * Called before paint to avoid flash
   */
  initTheme() {
    const savedTheme = this.getSavedTheme();
    const prefersDark = this.prefersColorScheme();
    const theme = savedTheme || (prefersDark ? this.DARK_THEME : this.LIGHT_THEME);
    
    this.applyTheme(theme, false); // false = don't save yet
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage access denied:', e);
      return null;
    }
  }

  /**
   * Check if user prefers dark color scheme
   */
  prefersColorScheme() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme, save = true) {
    const html = document.documentElement;
    
    // Ensure valid theme
    if (theme !== this.LIGHT_THEME && theme !== this.DARK_THEME) {
      theme = this.LIGHT_THEME;
    }

    // Apply data-theme attribute
    html.setAttribute('data-theme', theme);
    
    // Update theme toggle button
    this.updateThemeButton(theme);

    // Save to localStorage
    if (save) {
      try {
        localStorage.setItem(this.STORAGE_KEY, theme);
      } catch (e) {
        console.warn('Failed to save theme:', e);
      }
    }

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
    const newTheme = current === this.LIGHT_THEME ? this.DARK_THEME : this.LIGHT_THEME;
    this.applyTheme(newTheme, true);
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
  }

  /**
   * Update theme toggle button icon
   */
  updateThemeButton(theme) {
    const button = document.getElementById('theme-toggle-btn');
    if (!button) return;

    const icon = button.querySelector('i');
    if (!icon) return;

    if (theme === this.DARK_THEME) {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }
}

// Initialize theme manager on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}

// Global toggle function for HTML onclick handlers
function toggleTheme() {
  if (window.themeManager) {
    window.themeManager.toggleTheme();
  }
}
