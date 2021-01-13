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
        gravity: 0.7,
        wind: 0.1,
    },
    rain: {
        count: 60,
        minLength: 7,
        maxLength: 100,
        width: 1,
    },
    splash: {
        count: 10,
        speed: 5,
        minSpeed: 4,
        maxSpeed: 7,
        size: 4,
        minSize: 2,
        maxSize: 4,
    },
};

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
    forcesFolder.add(settings.forces, 'gravity', 0.1, 1.0).step(0.1);
    forcesFolder.add(settings.forces, 'wind', -0.4, 0.4).step(0.1);
    forcesFolder.open();

    const rainFolder = gui.addFolder('Rain');
    rainFolder.add(settings.rain, 'count', 10, 200)
        .step(10)
        .onChange(count => rain.setCount(count));
    rainFolder.add(settings.rain, 'maxLength', 10, 200).step(10);
    rainFolder.add(settings.rain, 'width', 1, 5).step(1);
    rainFolder.open();

    const splashFolder = gui.addFolder('Splash');
    splashFolder.add(settings.splash, 'count', 5, 30).step(5);
    splashFolder.add(settings.splash, 'minSize', 1, 4).step(1);
    splashFolder.add(settings.splash, 'maxSize', 4, 8).step(1);
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
        const randomAngle = random(PI, TWO_PI);
        const speedMagnitude = random(settings.splash.minSpeed, settings.splash.maxSpeed);
        return p5.Vector.fromAngle(randomAngle, speedMagnitude);
    };
    particlesSystem.getData = () => {
        return {
            size: random(settings.splash.minSize, settings.splash.maxSize),
        };
    };
    particlesSystem.destroyCondition = (particle) => {
        return particle.position.y > rainEdge.bottom;
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
    particlesSystem.getPosition = () => {
        return createVector(random(screenSize.width), random(-screenSize.height, 0));
    };
    particlesSystem.destroyCondition = (particle) => {
        return particle.position.y > rainEdge.bottom;
    };
    particlesSystem.setCount(settings.rain.count);
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
        const { x, y } = particle.position;
        const speed = particle.speed.copy().limit(settings.rain.maxLength);

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