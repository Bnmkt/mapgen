const voronoi = require("voronoi-diagram")
const SimplexNoise = require("simplex-noise")

export const game = {
    canvas: document.querySelector('#game'),
    frame: 0,
    mouse: { x: undefined, y: undefined, right: false, left: false },
    x: 0,
    y: 0,
    ctx: undefined,
    init(w = 800, h = 600) {
        this.ctx = this.canvas.getContext("2d")
        this.canvas.width = w
        this.canvas.height = h
        this.mainColor = this.random(360, 0)
        this.ctx.strokeStyle = `hsl(${this.mainColor},50%,50%)`
        this.ctx.fillStyle = "white"
        this.canvas.addEventListener("mouseleave", e => {
            this.mouse.x = undefined;
            this.mouse.y = undefined;
        }, false)
        window.addEventListener("keydown", e => { this.keyEvent(e) }, false)
        this.canvas.addEventListener("mousemove", (e) => { this.mouseMove(e) }, false);
        this.canvas.addEventListener("click", (e) => { this.mouse.left = true })
        this.simplex = new SimplexNoise(Math.random())
        this.temperature = new SimplexNoise(Math.random())
        this.sites = []
        this.vetexRealPos = []
        this.colors = []
        for (let i = 0; i < 3000; i++) {
            this.addSite();
        }

        this.update()


    },
    keyEvent(e) {
        const key = e.code
        console.log(key)
        switch (key) {
            case "ArrowRight":
                this.x++;
                break;
            case "ArrowLeft":
                this.x--;
                break;
            case "ArrowUp":
                this.y--;
                break;
            case "ArrowDown":
                this.y++;
                break;
        }
    },
    mouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    },
    square(x, y, size) {
        this.ctx.save()
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(x, y, size, size)
        this.ctx.restore()
    },
    random(max = 1, min = 0) {
        return (Math.random() * (max - min)) + min;
    },
    randomColor() {
        return `hsl(${this.random(this.mainColor+10, this.mainColor)}, ${this.random(100, 40)}%, ${this.random(60, 40)}%)`
    },
    addSite(x = Math.random(), y = Math.random()) {
        this.sites.push([x, y])
        this.colors.push(this.randomColor())
    },
    removeSite(indice) {
        this.sites.splice(indice, 1)
        this.colors.splice(indice, 1)
    },
    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        const diagram = voronoi(this.sites)
        const points = diagram.positions
        const cells = diagram.cells
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i]
            if (cell.indexOf(-1) >= 0) {
                continue
            }
            const context = this.ctx

            context.beginPath()
            context.moveTo(points[cell[0]][0] * this.canvas.width, points[cell[0]][1] * this.canvas.height)
                //context.fillStyle = this.colors[i];
                //context.strokeStyle = this.colors[i];
                //console.log(context.fillStyle)
            for (var j = 1; j < cell.length; ++j) {
                const vertex = points[cell[j]];
                context.lineTo(vertex[0] * this.canvas.width, vertex[1] * this.canvas.height)
                if (this.frame % 0 === 0) {
                    const ui = Math.random()
                    if (ui < .5) vertex[0] += .001
                    if (ui > .5) vertex[0] += -.001
                    if (ui < .5) vertex[1] += .001
                    if (ui > .5) vertex[1] += -.001
                }
                const a = this.mouse.x - vertex[0] * this.canvas.width;
                const b = this.mouse.y - vertex[1] * this.canvas.height;
                const distance = Math.sqrt(a * a + b * b)
                if (distance < 50) {
                    const angle = Math.atan2(this.mouse.y - vertex[1] * this.canvas.height, this.mouse.x - vertex[0] * this.canvas.width)
                    const dx = Math.cos(angle)
                    const dy = Math.sin(angle)
                    const distRatio = (distance - 20) / 40;
                    this.sites[i][0] -= (dx / this.canvas.width) * distRatio
                    this.sites[i][1] -= (dy / this.canvas.height) * distRatio
                    if (this.mouse.left) {
                        console.log(`
                        vX: ${a}
                        vY: ${b}
                        clientX: ${this.mouse.x}
                        clientY: ${this.mouse.y}
                        `)
                    }
                } else {
                    const siteX = (Math.round(this.sites[i][0] * this.canvas.width) / 200) + this.x / 100
                    const siteY = (Math.round(this.sites[i][1] * this.canvas.height) / 200) + this.y / 100
                    const noiseForPts = this.simplex.noise2D(siteX, siteY);
                    let tempPts = this.temperature.noise2D(siteX / 20, siteY / 20);
                    if (tempPts < 0) {
                        tempPts *= -1;
                    }
                    if (noiseForPts <= .4) {
                        context.fillStyle = `hsl(${225-noiseForPts*10}, 50%, ${50+(noiseForPts*10) + tempPts*30}%)`
                    }
                    if (noiseForPts > .4) {
                        context.fillStyle = `hsl(${115-noiseForPts*80}, 50%, ${50-(noiseForPts*20) + tempPts*30}%)`
                    }

                    if (noiseForPts > .8) {
                        context.fillStyle = `hsl(${40-noiseForPts*20}, 50%, ${50-(noiseForPts*30) + tempPts*30}%)`
                    }

                    //context.fillStyle = this.colors[i]
                }
            }
            context.closePath()
            context.strokeStyle = context.fillStyle
            context.stroke()
            context.fill()
            context.fillStyle = "black"
                //this.square(this.sites[i][0] * this.canvas.width, this.sites[i][1] * this.canvas.height, 3)

        };
        if (this.frame % (300 - Math.round(Math.random() * 300)) === 0) {
            this.addSite();
        }
        if (this.frame % (300 - Math.round(Math.random() * 300)) === 0) {
            if (Math.random() > .1) this.removeSite(Math.random() * this.sites.length - 1)

        }
        this.mouse.left = false;
        this.x += 10;
        this.y += 1;
        window.requestAnimationFrame(e => {
            this.frame++;
            this.update()
        })
    }
}