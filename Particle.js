// Particle Classes

export class Particle {
    constructor(x, y, color, ctx) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.ctx = ctx;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 100;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.vx *= 0.98; // Friction
        this.vy *= 0.98;
        this.life--;
        this.alpha = this.life / 100;
    }

    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.alpha;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}

export class BloodParticle {
    constructor(x, y, ctx, color = '#8A0707') {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.color = color;
        this.size = Math.random() * 2 + 1;
        this.life = 40;
        this.alpha = 1;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;
        this.life--;
        this.alpha = this.life / 40;
    }

    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.alpha;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}

export class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update() {
        const time = Date.now();
        this.opacity += Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.1;
        this.opacity = Math.max(0.3, Math.min(1.0, this.opacity));
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class SmokeParticle {
    constructor(x, y, ctx) {
        this.x = x + (Math.random() - 0.5) * 50;
        this.y = y + (Math.random() - 0.5) * 20;
        this.ctx = ctx;
        this.size = Math.random() * 30 + 20;
        this.initialSize = this.size;
        this.alpha = 0;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = Math.random() * 0.5 + 0.5;
        this.life = 200 + Math.random() * 100;
        this.maxLife = this.life;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.01;
        this.rotation += this.rotationSpeed;
        this.size += 0.2;
        this.life--;

        const fadeInDuration = this.maxLife * 0.2;
        const fadeOutDuration = this.maxLife * 0.8;
        if (this.life > this.maxLife - fadeInDuration) {
            this.alpha = 1 - ((this.maxLife - this.life) / fadeInDuration);
        } else {
            this.alpha = (this.life / fadeOutDuration);
        }
        this.alpha = Math.max(0, this.alpha * 0.6);
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);
        this.ctx.globalAlpha = this.alpha;

        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, 'rgba(200, 200, 200, 0.6)');
        gradient.addColorStop(0.5, 'rgba(180, 180, 180, 0.4)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}

export class TextPopUp {
    constructor(x, y, text, color, ctx) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.ctx = ctx;
        this.startTime = Date.now();
        this.duration = 1500;
        this.alpha = 1.0;
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.alpha = 0;
            return true;
        }
        this.y -= 0.5;
        this.alpha = 1.0 - (elapsed / this.duration);
        return false;
    }

    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.alpha;
        this.ctx.fillStyle = this.color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(this.text, this.x, this.y);
        this.ctx.fillText(this.text, this.x, this.y);
        this.ctx.restore();
    }
}

// Helper functions
export function createExplosion(x, y, color, count, particles, ctx) {
    for (let i = 0; i < count; i++) {
        if (particles.length > 300) { particles.shift(); }
        particles.push(new Particle(x, y, color, ctx));
    }
}

export function createBloodSplatter(x, y, color, bloodParticles, ctx) {
    for (let i = 0; i < 10; i++) {
        if (bloodParticles.length > 200) { bloodParticles.shift(); }
        bloodParticles.push(new BloodParticle(x, y, ctx, color));
    }
}
