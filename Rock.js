// Rock and RockFragment Classes

export class Rock {
    constructor(startX, startY, endX, endY, owner, ctx) {
        this.x = startX;
        this.y = startY;
        this.endX = endX;
        this.endY = endY;
        this.owner = owner;
        this.ctx = ctx;
        this.size = 5 + Math.random() * 10;
        this.speed = 0.3 + Math.random() * 0.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        const dx = endX - startX;
        const dy = endY - startY;
        const dist = Math.hypot(dx, dy);
        this.velocityX = (dx / dist) * this.speed;
        this.velocityY = (dy / dist) * this.speed;
    }

    update(dt) {
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.rotation += this.rotationSpeed * dt;
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);
        this.ctx.fillStyle = '#696969';
        this.ctx.strokeStyle = '#5C4033';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }
}

export class RockFragment {
    constructor(x, y, vx, vy, owner, ctx) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.ctx = ctx;
        this.size = 3 + Math.random() * 5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.life = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.rotation += this.rotationSpeed;
        this.life--;
        return this.life <= 0;
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        this.ctx.restore();
    }
}
