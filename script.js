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
		this.split = 1
		this.tail = 30

		this.ctx = ctx
		this.integrator = integrator.bind(this)
		this.planets = []
	}

	add(mass, x, y, vx, vy, ax, ay, size){
		this.planets.push({
			id: Math.random().toString().slice(2), 
			mass, // kg
			pos: new Vector2D(x, y), // m
			vel: new Vector2D(vx, vy), // ms^-1
			acc: new Vector2D(ax, ay), // ms^-2
			size, // pixel
			prev: []
		})
	}

	setAcc(){
		for (let i = 0; i < this.planets.length; i++) this.planets[i].acc = new Vector2D()

		for (let i = 0; i < this.planets.length - 1; i++){
			for (let j = i + 1; j < this.planets.length; j++){
				const diff = this.planets[i].pos.sub(this.planets[j].pos), _diff = diff.scale(Planets.G * diff.magSq ** -1.5)

				this.planets[i].acc = this.planets[i].acc.add(_diff.scale(-this.planets[j].mass))
				this.planets[j].acc = this.planets[j].acc.add(_diff.scale(this.planets[i].mass))
			}
		}
	}

	draw(){
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		
		for (const planet of this.planets){
			planet.prev.push(planet.pos)

			if (planet.prev.length > this.tail / this.dt) planet.prev.shift()

			ctx.fillStyle = "white"
			ctx.strokeStyle = "#bbbbbb"
			
			ctx.beginPath()
			ctx.moveTo(planet.prev[0].x, planet.prev[0].y)
			for (const pos of planet.prev.slice(1)) ctx.lineTo(pos.x, pos.y)
			ctx.stroke()
			
			ctx.beginPath()
			ctx.arc(planet.pos.x, planet.pos.y, planet.size, 0, 2 * Math.PI)
			ctx.fill()
		}

	}

	move(){
		for (let i = 0; i < this.split; i++) this.integrator()
		this.draw()
		console.log(this.energy)

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

	static euler(){
		this.setAcc()

		for (const planet of this.planets){
			planet.vel = planet.vel.add(planet.acc.scale(this.dt / this.split))
			planet.pos = planet.pos.add(planet.vel.scale(this.dt / this.split))
		}
	}

	static leapfrog(){ // same as velocity verlet
		for (const planet of this.planets) planet.pos = planet.pos.add(planet.vel.scale(this.dt / this.split / 2))

		this.setAcc()

		for (const planet of this.planets){
			planet.vel = planet.vel.add(planet.acc.scale(this.dt / this.split))
			planet.pos = planet.pos.add(planet.vel.scale(this.dt / this.split / 2))
		}
	}

	static get yoshida4(){
		// const cbrt2 = Math.cbrt(2), w1 = 1 / (2 - cbrt2), w0 = -cbrt2 * w1, coeff = {c: [w1 / 2, (w0 + w1) / 2, (w0 + w1) / 2, w1 / 2], d: [w1, w0, w1]}

		// function symplectic_integrator_numeric(order) {
		// 	if (order % 2 !== 0) {
		// 		console.log("This integrator is only for even order");
		// 		return;
		// 	}
		
		// 	let S = [0.5, 1, 0.5];
		
		// 	if (order > 2) {
		// 		for (let n = 1; n < order / 2; n++) {
		// 			let alpha = Math.pow(2.0, (1.0 / (2.0 * n + 1)));
		// 			let x0 = -alpha / (2.0 - alpha);
		// 			let x1 = 1.0 / (2.0 - alpha);
		// 			console.log(x0,x1)
		
		// 			let TC = S.map(i => i * x0);
		// 			let TL = S.map(i => i * x1);
		
		// 			let T = [];
		
		// 			// Loop for TL[ : -1 ]
		// 			for (let i = 0; i < TL.length - 1; i++) {
		// 				T.push(TL[i]);
		// 			}
		
		// 			// Add the last part of T
		// 			T.push(TL[TL.length - 1] + TC[0]);
		
		// 			// Loop for TC[1: -1]
		// 			for (let i = 1; i < TC.length - 1; i++) {
		// 				T.push(TC[i]);
		// 			}
		
		// 			// Add the first part of T
		// 			T.push(TC[TC.length - 1] + TL[0]);
		
		// 			// Loop for TL[1:]
		// 			for (let i = 1; i < TL.length; i++) {
		// 				T.push(TL[i]);
		// 			}
		
		// 			S = T;
		// 		}
		// 	}
		
		// 	return S;
		// }

		const coeff = {c: [0.7936124638611216, -0.20627658481643976, -0.20627658481643976, -0.11800886788129283, 0.20627658481643976, 0.20627658481643976, -0.11800886788129283, -0.20627658481643976, -0.20627658481643976, 0.7936124638611216], d: [1.5872249277222432, -1.999778097355123, 1.5872249277222432, -1.8232426634848289, 2.2971418107909303, -1.8232426634848289, 1.5872249277222432, -1.999778097355123, 1.5872249277222432]}
		
		return function(){
			for (const planet of this.planets) planet.pos = planet.pos.add(planet.vel.scale(coeff.c[0] * this.dt / this.split))

			for (let i = 0; i < coeff.d.length; i++){
				this.setAcc()
	
				for (const planet of this.planets){
					planet.vel = planet.vel.add(planet.acc.scale(coeff.d[i] * this.dt / this.split))
					planet.pos = planet.pos.add(planet.vel.scale(coeff.c[i + 1] * this.dt / this.split))
				}
			}
		}
	}
}


const planets = new Planets(ctx, Planets.yoshida4)
	
planets.add(1, 400, 450, 0, 30, 0, 0, 3)
planets.add(3e15, 800, 400, -30, 0, 0, 0, 10)
planets.add(3e15, 800, 500, 30, 0, 0, 0, 10)

planets.move()

onclick = () => planets.add(1, event.clientX, event.clientY, 0, 0, 0, 0, Math.random() * 0.8 + 1)

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
