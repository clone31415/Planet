const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d")
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let curr_x, curr_y, right = false // num = canvas.width * canvas.height / 12000

class Vector2D{
    constructor(x = 0, y = 0){
        this.x = x
        this.y = y
    }

    add(other){
        return new Vector2D(this.x + other.x, this.y + other.y)
    }

    sub(other){
        return new Vector2D(this.x - other.x, this.y - other.y)
    }

    scale(n){
        return new Vector2D(this.x * n, this.y * n)
    }

    norm(){
        let mag = this.mag
        return mag == 0 ? new Vector2D(0, 0) : new Vector2D(this.x / mag, this.y / mag)
    }

    get mag(){
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    get magSq(){
        return this.x ** 2 + this.y ** 2
    }
}


class Planets{
	static G = 6.6743e-11

	constructor(ctx, integrator){
		this.dt = 1
		this.split = 10
		this.tail = 30

		this.ctx = ctx
		this.integrator = integrator.bind(this)
		this.planets = []
	}

	add(mass, x, y, vx, vy, size, colour){
		const id = Math.random().toString().slice(2)

		this.planets.push({
			id, 
			mass, // kg
			pos: new Vector2D(x, y), // m
			vel: new Vector2D(vx, vy), // ms^-1
			size, // pixel
			colour, 
			prev: []
		})

		return id
	}

	setAcc(){
		this.planets = this.planets.map(planet => ({
			...planet,
			acc: new Vector2D() 
		})).sort((planet1, planet2) => !planet1.mass - !planet2.mass)

		for (let i = 0; i < this.planets.length - 1; i++){
			for (let j = i + 1; j < this.planets.length; j++){
				if (!this.planets[i].mass && !this.planets[j].mass) return

				let diff = this.planets[i].pos.sub(this.planets[j].pos)

				if (diff.magSq != 0){
					diff = diff.scale(Planets.G * diff.magSq ** -1.5)

					if (this.planets[j].mass) this.planets[i].acc = this.planets[i].acc.add(diff.scale(-this.planets[j].mass))
					this.planets[j].acc = this.planets[j].acc.add(diff.scale(this.planets[i].mass))
				}
			}
		}
	}

	draw(){
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		ctx.globalAlpha = 0.7

		for (const planet of this.planets){
			// planet.prev.push(planet.pos)

			// if (planet.prev.length > this.tail / this.dt) planet.prev.shift()

			ctx.strokeStyle = planet.colour

			ctx.beginPath()
			ctx.moveTo(planet.prev[0].x, planet.prev[0].y)
			for (const pos of planet.prev.slice(1)) ctx.lineTo(pos.x, pos.y)
			ctx.stroke()
		}

		ctx.globalAlpha = 1

		for (const planet of this.planets){
			ctx.fillStyle = planet.colour

			ctx.beginPath()
			ctx.arc(planet.pos.x, planet.pos.y, planet.size, 0, 2 * Math.PI)
			ctx.fill()
		}
	}

	move(){
		for (let i = 0; i < this.split; i++){
			this.integrator()
			
			for (const planet of this.planets){
				planet.prev.push(planet.pos)

				if (planet.prev.length > 300) planet.prev.shift()
			}
		}
		this.draw()
		// console.log(this.energy)

		requestAnimationFrame(this.move.bind(this))
	}

	get energy(){
		let energy = this.planets[0].mass * this.planets[0].vel.magSq / 2
		
		for (let i = 0; i < this.planets.length - 1; i++){
			energy += this.planets[i + 1].mass * this.planets[i + 1].vel.magSq / 2

			for (let j = i + 1; j < this.planets.length; j++) energy -= Planets.G * this.planets[i].mass * this.planets[j].mass / this.planets[i].pos.sub(this.planets[j].pos).mag
		}

		return energy
	}

	static splitStep(coeff){
		return function(){
			for (let i = 0; i < coeff.length; i++){
				if (i % 2 == 0) for (const planet of this.planets) planet.pos = planet.pos.add(planet.vel.scale(coeff[i] * this.dt / this.split))
				else{
					this.setAcc()

					for (const planet of this.planets) planet.vel = planet.vel.add(planet.acc.scale(coeff[i] * this.dt / this.split))
				}
			}
		}
	}

	static get euler(){
		return Planets.splitStep([1, 1])
	}

	static get leapfrog(){ 
		return Planets.splitStep([0.5, 1, 0.5])
	}

	static yoshida(order){
		if (order < 2 && order % 2 !== 0) throw new Error("Invalid order")
	
		let coeff = [0.5, 1, 0.5]
	
		if (order > 2) {
			for (let n = 1; n < order / 2; n++){
				let alpha = 2 ** (1 / (2 * n + 1)), x1 = 1/ (2 - alpha), x0 = -alpha * x1, TC = coeff.map(i => i * x0), TL = coeff.map(i => i * x1)
	
				coeff = [
					...TL.slice(0, TL.length - 1),
					TL[TL.length - 1] + TC[0],
					...TC.slice(1, TC.length - 1), 
					TC[TC.length - 1] + TL[0], 
					...TL.slice(1)
				]
			}
		}

		return Planets.splitStep(coeff)
	}

	static rk4(){

	}
}


const planets = new Planets(ctx, Planets.yoshida(6))
	
planets.add(1, 400, 450, 0, 30, 3, "cyan")
planets.add(3e15, 800, 400, -30, 0, 10, "white")
planets.add(3e15, 800, 500, 30, 0, 10, "white")

planets.move()

onclick = () => planets.add(0, event.clientX, event.clientY, 0, 0, 5, "red") // Math.random() * 0.8 + 1)

onmousedown = () => {
	right = event.which == 3
	
	if (event.which == 2) planets.pop()
}

onmouseup = () => {right = false}

oncontextmenu = () => {event.preventDefault()}

// onload = () => {	
//  	for (var count = 0; count < num; count++) planets.push({mass: 10, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: Math.random() * 4 - 2, vy: Math.random() * 4 - 2, size: Math.random() * 0.8 + 1, previous: []})
// }

onresize = () => {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
}

onmousemove = () => {
	curr_x = event.clientX
	curr_y = event.clientY
}

onmouseout = () => {curr_x = curr_y = undefined}
