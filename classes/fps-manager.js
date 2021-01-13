class FPSManager {
    constructor() {
        this.interval = 1000;
        this.lastTime = new Date();
        this.frames = 0;
        this.count = 0;
    }

    update() {
        this.count++;
        const time = new Date();
        if (time - this.lastTime > this.interval) {
            this.frames = this.count;
            this.count = 0;
            this.lastTime = time;
        }
    }
}