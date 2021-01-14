let fpsManager;
let rain;
let splashes = new Set();
let forces = {};

let rainEdge;
let screenSize;

const gui = new dat.GUI();

const colors = {
    fpsText: '#ed225d',
    rainDrop: 'rgba(255, 255, 255, 0.2)',
    splash: 'rgba(255, 255, 255, 0.4)',
    background: 'rgb(20, 20, 20)',
};

const settings = {
    showFPS: true,
    rainEdgeMargin: 0,
    forces: {
        gravity: 0.3,
        wind: 0.1,
    },
    rain: {
        count: 300,
        offset: 300,
        minSpeed: 10,
        maxSpeed: 20,
        minLength: 10,
        maxLength: 120,
        width: 1,
    },
    splash: {
        count: 10,
        minSpeed: 2,
        maxSpeed: 6,
        minSize: 2,
        maxSize: 4,
    },
};

function randomInteger(min, max) {
    const realMin = Math.min(min, max);
    const realMax = Math.max(min, max);
    return realMin + Math.floor(Math.random() * (realMax - realMin));
}

function updateScreenSize() {
    const bodyRect = document.body.getBoundingClientRect();
    screenSize = {
        width: bodyRect.width,
        height: bodyRect.height,
    };
    resizeCanvas(screenSize.width, screenSize.height)

    rainEdge = {
        left: settings.rainEdgeMargin,
        top: settings.rainEdgeMargin,
        right: screenSize.width - settings.rainEdgeMargin,
        bottom: screenSize.height - settings.rainEdgeMargin,
    };
}

function generateGUISettings() {
    const forcesFolder = gui.addFolder('Forces');
    forcesFolder.add(settings.forces, 'gravity', 0.1, 2.0)
        .step(0.1)
        .onChange(value => forces.gravity.value.y = value);
    forcesFolder.add(settings.forces, 'wind', -0.4, 0.4)
        .step(0.1)
        .onChange(value => forces.wind.value.x = value);
    forcesFolder.open();

    const rainFolder = gui.addFolder('Rain');
    rainFolder.add(settings.rain, 'count', 10, 1000)
        .step(10)
        .onChange(count => rain.setCount(count));
    rainFolder.add(settings.rain, 'minLength', 1, 170).step(1);
    rainFolder.add(settings.rain, 'maxLength', 1, 170).step(1);
    rainFolder.add(settings.rain, 'width', 1, 5).step(1);
    rainFolder.add(settings.rain, 'minSpeed', 0, 100).step(1);
    rainFolder.add(settings.rain, 'maxSpeed', 0, 100).step(1);
    rainFolder.open();

    const splashFolder = gui.addFolder('Splash');
    splashFolder.add(settings.splash, 'count', 5, 30).step(5);
    splashFolder.add(settings.splash, 'minSize', 1, 10).step(1);
    splashFolder.add(settings.splash, 'maxSize', 1, 10).step(1);
    splashFolder.add(settings.splash, 'minSpeed', 1, 15).step(1);
    splashFolder.add(settings.splash, 'maxSpeed', 1, 15).step(1);
    splashFolder.open();

    gui.add(settings, 'showFPS');
}

function createFPSManager() {
    fpsManager = new FPSManager();
}

function createSplash(position) {
    const particlesSystem = new ParticlesSystem();
    particlesSystem.getPosition = () => {
        return createVector(position.x, screenSize.height);
    };
    particlesSystem.getSpeed = () => {
        const { minSpeed, maxSpeed } = settings.splash;
        const randomAngle = random(PI, TWO_PI);
        const speedMagnitude = randomInteger(minSpeed, maxSpeed);
        return p5.Vector.fromAngle(randomAngle, speedMagnitude);
    };
    particlesSystem.getData = () => {
        const { minSize, maxSize } = settings.splash;
        return {
            size: randomInteger(minSize, maxSize),
        };
    };
    particlesSystem.destroyCondition = (particle) => {
        return particle.position.y - particle.data.size > rainEdge.bottom;
    };
    particlesSystem.setCount(settings.splash.count);

    particlesSystem.addForce(forces.gravity);
    particlesSystem.addForce(forces.wind);

    particlesSystem.allPariclesDestroyed = () => {
        splashes.delete(particlesSystem);
    };

    return particlesSystem;
}

function createRain() {
    const particlesSystem = new ParticlesSystem();
    const rainOffset = settings.rain.offset;
    particlesSystem.getInitialPosition = () => {
        const x = randomInteger(-rainOffset, screenSize.width + rainOffset);
        const y = randomInteger(0, screenSize.height);
        return createVector(x, y);
    };
    particlesSystem.getPosition = () => {
        const x = randomInteger(-rainOffset, screenSize.width + rainOffset);
        const y = randomInteger(-screenSize.height, 0);
        return createVector(x, y);
    };
    particlesSystem.getSpeed = () => {
        const { minSpeed, maxSpeed } = settings.rain;
        const speed = randomInteger(minSpeed, maxSpeed);
        return createVector(0, speed);
    };
    particlesSystem.getData = () => {
        const { minLength, maxLength } = settings.rain;
        return {
            length: randomInteger(minLength, maxLength),
        };
    };
    particlesSystem.destroyCondition = (particle) => {
        return particle.position.y - particle.data.length > rainEdge.bottom;
    };
    particlesSystem.addParticles(settings.rain.count, true);
    particlesSystem.setEdge(rainEdge);

    particlesSystem.addForce(forces.gravity);
    particlesSystem.addForce(forces.wind);

    particlesSystem.particleDestoyed = (particle) => {
        const splash = createSplash(particle.position);
        splashes.add(splash);
        particlesSystem.addParticle();
    };
    particlesSystem.allPariclesDestroyed = () => {
        console.log('rain destroyed');
    };

    return particlesSystem;
}

function createForces() {
    forces.gravity = new Force(0, settings.forces.gravity);
    forces.wind = new Force(settings.forces.wind, 0);
}

function setup() {
    createCanvas();
    createFPSManager();

    updateScreenSize();
    generateGUISettings();

    window.addEventListener('resize', () => {
        updateScreenSize();
    });

    createForces();
    rain = createRain();
}

function clearCanvas() {
    noStroke();
    fill(colors.background);
    rect(0, 0, screenSize.width, screenSize.height);
}

function drawFPS() {
    textSize(32);
    noStroke();
    fill(colors.fpsText);
    text(fpsManager.frames, 10, 35);
}

function drawRain() {
    strokeWeight(settings.rain.width);
    stroke(colors.rainDrop);
    rain.particles.forEach(particle => {
        const { position: { x, y }, data: { length } } = particle;
        const speed = particle.speed.copy().setMag(length);
        line(x - speed.x, y - speed.y, x, y);
    });
}

function drawSplashes() {
    noStroke();
    fill(colors.splash);
    splashes.forEach(splash => {
        splash.particles.forEach(particle => {
            const { position: { x, y }, data: { size } } = particle;
            circle(x, y, size);
        });
    });
}

function draw() {
    clearCanvas();

    drawRain();
    drawSplashes();
    settings.showFPS && drawFPS();

    update();
}


function updateFPS() {
    fpsManager.update();
}

function updateSplashes() {
    splashes.forEach(splash => splash.update());
}

function update() {
    rain.update();
    updateSplashes();
    updateFPS();
}