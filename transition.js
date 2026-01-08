/**
 * Logo Page Transition System
 * 
 * Handles the seamless transition effect where a clicked logo
 * expands to fill the screen, then shrinks to its position on the new page.
 * 
 * Supports per-logo customization via data attributes:
 * - data-scale: Scale multiplier (default 15 = 1500%)
 * - data-offset-x: Horizontal offset % during expansion (default 0)
 * - data-offset-y: Vertical offset % during expansion (default 0)
 */

class LogoTransition {
    constructor() {
        this.overlay = null;
        this.transitionLogo = null;
        this.isTransitioning = false;
        this.debugPanel = null;
        this.debugMode = false;

        // Default timing configuration
        this.config = {
            expandDuration: 800,
            shrinkDuration: 600,
            pageLoadDelay: 100,
        };

        // Default transition settings (can be overridden per-logo)
        this.defaults = {
            scale: 15,      // 1500% scale
            offsetX: 0,     // % offset from center
            offsetY: 0,     // % offset from center
        };

        this.init();
    }

    init() {
        this.createOverlay();
        this.checkIncomingTransition();
        this.attachLinkHandlers();
        this.createDebugPanel();
        this.attachKeyboardShortcuts();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'transition-overlay';
        document.body.appendChild(this.overlay);
    }

    attachLinkHandlers() {
        const serviceLinks = document.querySelectorAll('.service-link[data-service]');

        serviceLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isTransitioning) return;

                const targetUrl = link.getAttribute('href');
                const serviceData = this.getServiceData(link);

                this.startTransition(link, targetUrl, serviceData);
            });
        });
    }

    getServiceData(link) {
        const logoWrapper = link.querySelector('.logo-wrapper');
        const svg = logoWrapper.querySelector('svg');
        const serviceName = link.dataset.service;
        const fillColor = link.dataset.color || '#6366f1';

        // Get custom transition settings from data attributes
        const scale = parseFloat(link.dataset.scale) || this.defaults.scale;
        const offsetX = parseFloat(link.dataset.offsetX) || this.defaults.offsetX;
        const offsetY = parseFloat(link.dataset.offsetY) || this.defaults.offsetY;

        return {
            serviceName,
            fillColor,
            svgContent: svg.outerHTML,
            rect: logoWrapper.getBoundingClientRect(),
            // Transition settings
            scale,
            offsetX,
            offsetY,
        };
    }

    async startTransition(link, targetUrl, serviceData) {
        this.isTransitioning = true;
        document.body.classList.add('transitioning');

        // Set background color to logo color to hide any flash during navigation
        document.documentElement.style.setProperty('--transition-color', serviceData.fillColor);
        document.body.style.backgroundColor = serviceData.fillColor;

        // Store transition data for the next page (including custom settings)
        sessionStorage.setItem('transitionData', JSON.stringify({
            fillColor: serviceData.fillColor,
            serviceName: serviceData.serviceName,
            svgContent: serviceData.svgContent,
            scale: serviceData.scale,
            offsetX: serviceData.offsetX,
            offsetY: serviceData.offsetY,
            timestamp: Date.now()
        }));

        this.createTransitionLogo(serviceData);
        await this.expandLogo(serviceData);
        window.location.href = targetUrl;
    }

    createTransitionLogo(serviceData) {
        this.transitionLogo = document.createElement('div');
        this.transitionLogo.className = 'transition-logo';
        this.transitionLogo.innerHTML = serviceData.svgContent;

        const rect = serviceData.rect;
        this.transitionLogo.style.cssText = `
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
        `;

        this.overlay.appendChild(this.transitionLogo);
    }

    async expandLogo(serviceData) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = serviceData.rect;

        const logoSize = Math.max(rect.width, rect.height);
        const maxDimension = Math.max(vw, vh);

        // Use custom scale from data attribute
        const targetScale = serviceData.scale;
        const finalSize = logoSize * targetScale;

        // Calculate center position with offset
        const offsetPixelsX = (serviceData.offsetX / 100) * vw;
        const offsetPixelsY = (serviceData.offsetY / 100) * vh;

        const centerX = vw / 2 - finalSize / 2 + offsetPixelsX;
        const centerY = vh / 2 - finalSize / 2 + offsetPixelsY;

        return new Promise(resolve => {
            // Animate using width/height for sharp vector scaling (not transform)
            const animation = this.transitionLogo.animate([
                {
                    left: `${rect.left}px`,
                    top: `${rect.top}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                    opacity: 1
                },
                {
                    left: `${centerX}px`,
                    top: `${centerY}px`,
                    width: `${finalSize}px`,
                    height: `${finalSize}px`,
                    opacity: 1
                }
            ], {
                duration: this.config.expandDuration,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });

            animation.onfinish = resolve;
        });
    }

    checkIncomingTransition() {
        const transitionData = sessionStorage.getItem('transitionData');

        if (!transitionData) return;

        const data = JSON.parse(transitionData);
        const timeSinceTransition = Date.now() - data.timestamp;

        if (timeSinceTransition > 3000) {
            sessionStorage.removeItem('transitionData');
            return;
        }

        sessionStorage.removeItem('transitionData');

        const servicePage = document.querySelector('.service-page');
        const heroLogo = document.querySelector('.hero-logo');

        if (servicePage && heroLogo) {
            this.completeTransition(data, heroLogo, servicePage);
        }
    }

    async completeTransition(data, heroLogo, servicePage) {
        document.body.classList.add('transitioning');

        // Set background to logo color to prevent any flash
        document.body.style.backgroundColor = data.fillColor;
        heroLogo.style.opacity = '0';

        this.createExpandedOverlay(data);
        await this.delay(50);

        const targetRect = heroLogo.getBoundingClientRect();
        await this.shrinkLogo(targetRect, data);

        heroLogo.classList.add('visible');
        heroLogo.style.opacity = '';
        servicePage.classList.add('visible');

        // Restore background color
        document.body.style.backgroundColor = '';

        this.cleanup();
        document.body.classList.remove('transitioning');
    }

    createExpandedOverlay(data) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        this.transitionLogo = document.createElement('div');
        this.transitionLogo.className = 'transition-logo';
        this.transitionLogo.innerHTML = data.svgContent;

        const logoSize = 64;
        const scale = data.scale || this.defaults.scale;
        const expandedSize = logoSize * scale;

        // Apply the same offset used during expansion
        const offsetPixelsX = ((data.offsetX || 0) / 100) * vw;
        const offsetPixelsY = ((data.offsetY || 0) / 100) * vh;

        const centerX = vw / 2 - expandedSize / 2 + offsetPixelsX;
        const centerY = vh / 2 - expandedSize / 2 + offsetPixelsY;

        this.transitionLogo.style.cssText = `
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${expandedSize}px;
            height: ${expandedSize}px;
        `;

        this.overlay.appendChild(this.transitionLogo);
    }

    async shrinkLogo(targetRect, data) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const logoSize = 64;
        const scale = data.scale || this.defaults.scale;
        const expandedSize = logoSize * scale;

        const offsetPixelsX = ((data.offsetX || 0) / 100) * vw;
        const offsetPixelsY = ((data.offsetY || 0) / 100) * vh;

        const centerX = vw / 2 - expandedSize / 2 + offsetPixelsX;
        const centerY = vh / 2 - expandedSize / 2 + offsetPixelsY;

        return new Promise(resolve => {
            // Animate using width/height for sharp vector scaling
            const animation = this.transitionLogo.animate([
                {
                    left: `${centerX}px`,
                    top: `${centerY}px`,
                    width: `${expandedSize}px`,
                    height: `${expandedSize}px`,
                    opacity: 1
                },
                {
                    left: `${targetRect.left}px`,
                    top: `${targetRect.top}px`,
                    width: `${targetRect.width}px`,
                    height: `${targetRect.height}px`,
                    opacity: 1
                }
            ], {
                duration: this.config.shrinkDuration,
                easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                this.transitionLogo.animate([
                    { opacity: 1 },
                    { opacity: 0 }
                ], {
                    duration: 200,
                    fill: 'forwards'
                }).onfinish = resolve;
            };
        });
    }

    // ==================== DEBUG PANEL ====================

    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.className = 'debug-panel';
        this.debugPanel.innerHTML = `
            <div class="debug-header">
                <h3>🎛️ Transition Controls</h3>
                <span class="debug-hint">Press D to toggle</span>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <label>Select Logo:</label>
                    <select id="debug-logo-select"></select>
                </div>
                <div class="debug-section">
                    <label>Scale: <span id="scale-value">15</span>x</label>
                    <input type="range" id="debug-scale" min="5" max="50" value="15" step="1">
                </div>
                <div class="debug-section">
                    <label>Offset X: <span id="offsetX-value">0</span>%</label>
                    <input type="range" id="debug-offsetX" min="-100" max="100" value="0" step="5">
                </div>
                <div class="debug-section">
                    <label>Offset Y: <span id="offsetY-value">0</span>%</label>
                    <input type="range" id="debug-offsetY" min="-100" max="100" value="0" step="5">
                </div>
                <div class="debug-actions">
                    <button id="debug-preview">Preview</button>
                    <button id="debug-copy">Copy Attributes</button>
                </div>
                <div class="debug-output" id="debug-output"></div>
            </div>
        `;

        // Add styles for debug panel
        const style = document.createElement('style');
        style.textContent = `
            .debug-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(20, 20, 30, 0.95);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 16px;
                min-width: 280px;
                z-index: 10000;
                font-family: 'Inter', sans-serif;
                color: #fff;
                display: none;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .debug-panel.visible { display: block; }
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .debug-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            .debug-hint {
                font-size: 11px;
                color: #888;
            }
            .debug-section {
                margin-bottom: 14px;
            }
            .debug-section label {
                display: block;
                font-size: 12px;
                color: #aaa;
                margin-bottom: 6px;
            }
            .debug-section label span {
                color: #6366f1;
                font-weight: 600;
            }
            .debug-section select,
            .debug-section input[type="range"] {
                width: 100%;
            }
            .debug-section select {
                background: #1a1a2e;
                border: 1px solid rgba(255,255,255,0.1);
                color: #fff;
                padding: 8px;
                border-radius: 6px;
                font-size: 13px;
            }
            .debug-section input[type="range"] {
                -webkit-appearance: none;
                background: #1a1a2e;
                height: 6px;
                border-radius: 3px;
                cursor: pointer;
            }
            .debug-section input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: #6366f1;
                border-radius: 50%;
                cursor: pointer;
            }
            .debug-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
            }
            .debug-actions button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            #debug-preview {
                background: #6366f1;
                color: white;
            }
            #debug-preview:hover { background: #5558e3; }
            #debug-copy {
                background: #2a2a3e;
                color: #aaa;
            }
            #debug-copy:hover { background: #3a3a4e; color: #fff; }
            .debug-output {
                margin-top: 12px;
                padding: 10px;
                background: #0a0a12;
                border-radius: 6px;
                font-family: monospace;
                font-size: 11px;
                color: #6366f1;
                word-break: break-all;
                display: none;
            }
            .debug-output.visible { display: block; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.debugPanel);

        this.initDebugPanel();
    }

    initDebugPanel() {
        const serviceLinks = document.querySelectorAll('.service-link[data-service]');
        const select = document.getElementById('debug-logo-select');

        if (!select || serviceLinks.length === 0) return;

        // Populate logo selector
        serviceLinks.forEach(link => {
            const option = document.createElement('option');
            option.value = link.dataset.service;
            option.textContent = link.dataset.service.charAt(0).toUpperCase() + link.dataset.service.slice(1);
            select.appendChild(option);
        });

        // Load initial values from first logo
        this.loadLogoSettings(serviceLinks[0]);

        // Change logo selection
        select.addEventListener('change', () => {
            const link = document.querySelector(`.service-link[data-service="${select.value}"]`);
            if (link) this.loadLogoSettings(link);
        });

        // Update value displays
        ['scale', 'offsetX', 'offsetY'].forEach(param => {
            const input = document.getElementById(`debug-${param}`);
            const display = document.getElementById(`${param}-value`);
            input.addEventListener('input', () => {
                display.textContent = input.value;
                this.updateLogoSettings();
            });
        });

        // Preview button
        document.getElementById('debug-preview').addEventListener('click', () => {
            const link = document.querySelector(`.service-link[data-service="${select.value}"]`);
            if (link) this.previewTransition(link);
        });

        // Copy button
        document.getElementById('debug-copy').addEventListener('click', () => {
            this.copyAttributes();
        });
    }

    loadLogoSettings(link) {
        const scale = parseFloat(link.dataset.scale) || this.defaults.scale;
        const offsetX = parseFloat(link.dataset.offsetX) || this.defaults.offsetX;
        const offsetY = parseFloat(link.dataset.offsetY) || this.defaults.offsetY;

        document.getElementById('debug-scale').value = scale;
        document.getElementById('debug-offsetX').value = offsetX;
        document.getElementById('debug-offsetY').value = offsetY;

        document.getElementById('scale-value').textContent = scale;
        document.getElementById('offsetX-value').textContent = offsetX;
        document.getElementById('offsetY-value').textContent = offsetY;
    }

    updateLogoSettings() {
        const select = document.getElementById('debug-logo-select');
        const link = document.querySelector(`.service-link[data-service="${select.value}"]`);

        if (link) {
            link.dataset.scale = document.getElementById('debug-scale').value;
            link.dataset.offsetX = document.getElementById('debug-offsetX').value;
            link.dataset.offsetY = document.getElementById('debug-offsetY').value;
        }
    }

    async previewTransition(link) {
        const serviceData = this.getServiceData(link);

        this.createTransitionLogo(serviceData);
        document.body.classList.add('transitioning');
        document.body.style.backgroundColor = serviceData.fillColor;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = serviceData.rect;
        const logoSize = Math.max(rect.width, rect.height);
        const targetScale = serviceData.scale;
        const finalSize = logoSize * targetScale;

        const offsetPixelsX = (serviceData.offsetX / 100) * vw;
        const offsetPixelsY = (serviceData.offsetY / 100) * vh;

        const centerX = vw / 2 - finalSize / 2 + offsetPixelsX;
        const centerY = vh / 2 - finalSize / 2 + offsetPixelsY;

        // Expand using width/height for sharp vector scaling
        await new Promise(resolve => {
            this.transitionLogo.animate([
                { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, opacity: 1 },
                { left: `${centerX}px`, top: `${centerY}px`, width: `${finalSize}px`, height: `${finalSize}px`, opacity: 1 }
            ], { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }).onfinish = resolve;
        });

        // Hold for a moment
        await this.delay(500);

        // Shrink back
        await new Promise(resolve => {
            this.transitionLogo.animate([
                { left: `${centerX}px`, top: `${centerY}px`, width: `${finalSize}px`, height: `${finalSize}px`, opacity: 1 },
                { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, opacity: 1 }
            ], { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }).onfinish = resolve;
        });

        this.cleanup();
        document.body.style.backgroundColor = '';
        document.body.classList.remove('transitioning');
    }

    copyAttributes() {
        const select = document.getElementById('debug-logo-select');
        const scale = document.getElementById('debug-scale').value;
        const offsetX = document.getElementById('debug-offsetX').value;
        const offsetY = document.getElementById('debug-offsetY').value;

        const attrs = `data-scale="${scale}" data-offset-x="${offsetX}" data-offset-y="${offsetY}"`;

        navigator.clipboard.writeText(attrs).then(() => {
            const output = document.getElementById('debug-output');
            output.textContent = `Copied: ${attrs}`;
            output.classList.add('visible');
            setTimeout(() => output.classList.remove('visible'), 3000);
        });
    }

    attachKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
                // Don't toggle if typing in an input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                this.debugMode = !this.debugMode;
                this.debugPanel.classList.toggle('visible', this.debugMode);
            }
        });
    }

    cleanup() {
        if (this.transitionLogo) {
            this.transitionLogo.remove();
            this.transitionLogo = null;
        }
        this.isTransitioning = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LogoTransition();
});
