// class 


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
	static scale = 1e100

	constructor(ctx, integrator){
		this.dt = 1
		this.split = 10
		this.tail = 30

		this.ctx = ctx
		this.integrator = integrator.bind(this)
		this.planets = []
		this.offset = new Vector2D()
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
		this.ctx.clearRect(0, 0, canvas.width, canvas.height)

		this.ctx.globalAlpha = 0.7

		for (const planet of this.planets){
			// planet.prev.push(planet.pos)

			// if (planet.prev.length > this.tail / this.dt) planet.prev.shift()

			this.ctx.strokeStyle = planet.colour

			this.ctx.beginPath()
			this.ctx.moveTo(planet.prev[0].x + this.offset.x, planet.prev[0].y + this.offset.y)
			for (const pos of planet.prev.slice(1)) this.ctx.lineTo(pos.x + this.offset.x, pos.y + this.offset.y)
			this.ctx.stroke()
		}

		this.ctx.globalAlpha = 1

		for (const planet of this.planets){
			this.ctx.fillStyle = planet.colour

			this.ctx.beginPath()
			this.ctx.arc(planet.pos.x + this.offset.x, planet.pos.y + this.offset.y, planet.size, 0, 2 * Math.PI)
			this.ctx.fill()
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
				let alpha = 2 ** (1 / (2 * n + 1)), x1 = 1 / (2 - alpha), x0 = -alpha * x1, TC = coeff.map(i => i * x0), TL = coeff.map(i => i * x1)
	
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


const canvas = document.getElementById("canvas"), controls = document.getElementById("controls"), planets = new Planets(canvas.getContext("2d"), Planets.yoshida(10))
let dragSep = false, dragCanvas = false, start
canvas.width = window.innerWidth / 3 * 2 - 4
canvas.height = window.innerHeight
controls.style.width = window.innerWidth / 3 - 4

planets.add(1, 400, 450, 0, 30, 3, "cyan")
planets.add(3e15, 800, 400, -30, 0, 10, "white")
planets.add(3e15, 800, 500, 30, 0, 10, "white")

planets.move()

const toggle = element => {
	element = element ? document.getElementById("planets") : document.getElementById("settings"); 

	if (element.style.maxHeight == "0px") element.style.maxHeight = "1000px"; 
	else element.style.maxHeight = "0px"; 
}

const adjLen = element => {
	var test = document.getElementById("length");
	test.innerHTML = element.value; 

	element.style.width = Math.min(Math.max(20, test.clientWidth + 5), 200) + "px"
}

oncontextmenu = () => {event.preventDefault()}

separator.onmousedown = () => {dragSep = true}

canvas.onclick = () => planets.add(0, event.clientX, event.clientY, 0, 0, 5, "red") // Math.random() * 0.8 + 1)

canvas.onmousedown = () => {
	if (event.which == 3){
		dragCanvas = true
		start = (new Vector2D(event.clientX, event.clientY)).sub(planets.offset)
	}
}

onmouseup = () => {
	dragSep = dragCanvas = false; 
}

onmousemove = () => {
	if (dragSep){
		if (event.clientX - 5 < window.innerWidth / 10){
			canvas.width = window.innerWidth / 10 - 5; 
			controls.style.width = window.innerWidth / 10 * 9 - 5; 
		}else if (window.innerWidth - event.clientX - 4 < window.innerWidth / 10){
			canvas.width = window.innerWidth / 10 * 9 - 5; 
			controls.style.width = window.innerWidth / 10 - 5; 
		}else{
			canvas.width = event.clientX - 5; 
			controls.style.width = window.innerWidth - event.clientX - 5; 
		}
	}

	if (dragCanvas){
		planets.offset = new Vector2D(event.clientX, event.clientY).sub(start)
	}
}

onresize = () => {
	canvas.width = window.innerWidth / 3 * 2 - 4
	canvas.height = window.innerHeight
	controls.style.width = window.innerWidth / 3 - 4
}