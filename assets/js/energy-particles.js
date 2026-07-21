/**
 * Rynkar Games - Energy Particles Effect
 * A performance-friendly background animation with interactive particles.
 */

class EnergyParticles {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 40;
        this.mouse = { x: 0, y: 0, active: false };
        this.attractionRadius = 150;
        this.colors = ['#6366f1', '#a855f7', '#fbbf24']; // Indigo, Purple, Amber (Yellow energy)
        
        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        this.canvas.style.opacity = '0.6';
        document.body.appendChild(this.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Track mouse movement
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });
        
        // Listen for clicks on the window
        window.addEventListener('mousedown', (e) => this.handleClick(e));
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }

        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle(x, y, isExplosion = false, fromEdge = false) {
        let posX = x ?? Math.random() * this.canvas.width;
        let posY = y ?? Math.random() * this.canvas.height;

        if (fromEdge && x === undefined && y === undefined) {
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            const padding = 20;
            switch(edge) {
                case 0: posX = Math.random() * this.canvas.width; posY = -padding; break;
                case 1: posX = this.canvas.width + padding; posY = Math.random() * this.canvas.height; break;
                case 2: posX = Math.random() * this.canvas.width; posY = this.canvas.height + padding; break;
                case 3: posX = -padding; posY = Math.random() * this.canvas.height; break;
            }
        }

        return {
            x: posX,
            y: posY,
            baseSize: Math.random() * (isExplosion ? 4 : 3) + 1,
            size: 0, // Will be set in animate
            speedX: (Math.random() - 0.5) * (isExplosion ? 10 : 1.5),
            speedY: (Math.random() - 0.5) * (isExplosion ? 10 : 1.5),
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            life: isExplosion ? 1.0 : 0, 
            decay: Math.random() * 0.02 + 0.015,
            noiseOffset: Math.random() * 1000,
            isAttracted: false
        };
    }

    handleClick(e) {
        const target = e.target;
        if (target.closest('button') || target.closest('a') || target.closest('iframe') || target.closest('.game-card') || target.closest('.cursor-zoom-in')) {
            return;
        }

        // Only explode if there are attracted particles
        const attractedParticles = this.particles.filter(p => p.isAttracted && p.life === 0);
        
        if (attractedParticles.length > 0) {
            // Explode the attracted particles
            attractedParticles.forEach(p => {
                p.life = 1.0;
                p.speedX = (Math.random() - 0.5) * 15;
                p.speedY = (Math.random() - 0.5) * 15;
            });

            // Add some extra sparks for the "combining" effect
            for (let i = 0; i < 15; i++) {
                this.particles.push(this.createParticle(e.clientX, e.clientY, true));
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            if (p.life === 0) {
                // Check attraction to mouse
                let dx = this.mouse.x - p.x;
                let dy = this.mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (this.mouse.active && distance < this.attractionRadius) {
                    p.isAttracted = true;
                    // Move towards mouse (magnetic effect)
                    p.x += dx * 0.05;
                    p.y += dy * 0.05;
                    
                    // Orbit/Atomic movement around mouse
                    p.noiseOffset += 0.05;
                    p.x += Math.sin(p.noiseOffset * 2) * 2;
                    p.y += Math.cos(p.noiseOffset * 2) * 2;
                    
                    // Grow size
                    p.size = p.baseSize * 1.5;
                } else {
                    p.isAttracted = false;
                    p.noiseOffset += 0.01;
                    p.x += Math.sin(p.noiseOffset) * 0.5 + p.speedX;
                    p.y += Math.cos(p.noiseOffset) * 0.5 + p.speedY;
                    p.size = p.baseSize;
                }
                
                // Wrap around screen
                if (p.x < -50) p.x = this.canvas.width + 50;
                if (p.x > this.canvas.width + 50) p.x = -50;
                if (p.y < -50) p.y = this.canvas.height + 50;
                if (p.y > this.canvas.height + 50) p.y = -50;
            } else {
                // Explosion particle movement
                p.x += p.speedX;
                p.y += p.speedY;
                p.life -= p.decay;
                p.size = p.baseSize * p.life;
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    
                    // Replenish regular particles if they were exploded
                    const regularCount = this.particles.filter(p => p.life === 0).length;
                    if (regularCount < this.particleCount) {
                        // Add 1 or 2 new ones as requested
                        this.particles.push(this.createParticle(undefined, undefined, false, true));
                        if (Math.random() > 0.5) {
                            this.particles.push(this.createParticle(undefined, undefined, false, true));
                        }
                    }
                    continue;
                }
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color + (p.life > 0 ? Math.floor(p.life * 255).toString(16).padStart(2, '0') : '');
            
            if (p.life > 0 || p.isAttracted) {
                this.ctx.shadowBlur = p.isAttracted ? 15 : 10;
                this.ctx.shadowColor = p.color;
            } else {
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fill();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EnergyParticles();
});
