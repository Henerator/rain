class ParticlesSystem {
    edge = new Edge();
    forces = new Set();
    particles = new Set();

    maxSpeed = null;

    particleDestoyed() {
    }

    allPariclesDestroyed() {
    }

    setEdge(edge) {
        this.edge = edge;
    }

    getPosition() {
        return createVector(0, 0);
    }

    getSpeed() {
        return createVector(0, 0);
    }

    getData() {
        return null;
    }

    addParticle() {
        const position = this.getPosition();
        const speed = this.getSpeed();
        const data = this.getData();
        const particle = new Particle(position, speed, data);

        this.particles.add(particle);
    }

    addParticles(count) {
        while (count > 0) {
            count--;
            this.addParticle();
        }
    }

    removeParticle(particle) {
        this.particles.delete(particle);
        this.particleDestoyed(particle);

        if (this.particles.size === 0) {
            this.allPariclesDestroyed();
        }
    }

    removeParticles(count) {
        [...this.particles.values()]
            .slice(0, count)
            .forEach(value => this.particles.delete(value));
    }

    setMaximumSpeed(maxSpeed) {
        this.maxSpeed = maxSpeed;
    }

    setCount(count) {
        const currentCount = this.particles.size;
        if (currentCount === count) {
            return;
        } else if (currentCount < count) {
            this.addParticles(count - currentCount);
        } else {
            this.removeParticles(currentCount - count);
        }
    }

    addForce(force) {
        this.forces.add(force);
    }

    removeForce(force) {
        this.forces.delete(force);
    }

    applyForces(particle) {
        this.forces.forEach(force => {
            particle.speed.add(force.value);

            if (this.maxSpeed) {
                particle.speed.limit(this.maxSpeed);
            }
        });
    }

    destroyCondition() {
        return false;
    }

    update() {
        this.particles.forEach(particle => {
            this.applyForces(particle);
            particle.position.add(particle.speed);

            if (this.destroyCondition(particle)) {
                this.removeParticle(particle);
            }
        });
    }
}