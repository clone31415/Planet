class Vector2{
	constructor(x, y){
		Object.assign(this, {x, y}); 
	}

	add(other){
		return new Vector2(this.x + other.x, this.y + other.y); 
	}

	sub(other){
		return new Vector2(this.x - other.x, this.y - other.y); 
	}

	mult(n){
		return new Vector2(n * this.x, n * this.y); 
	}

	mag(){
		return Math.sqrt(this.x ** 2 + this.y ** 2); 
	}

	norm(){
		const mag = this.mag(); 

		return new Vector2(this.x / mag, this.y / mag); 
	}
}

class Target{
	constructor(pos, vel, acc){
		Object.assign(this, {pos, vel, acc}); 
	}

	update(){
		this.vel = this.vel.add(this.acc); 
		this.pos = this.pos.add(this.vel); 
	}
}

class Missile{
	constructor(pos, vel, acc){
		Object.assign(this, {pos, vel, acc}); 
	}

	calc(target){
		const N = 3, Nt= 9.8, _RTM_new = target.pos.sub(this.pos); 
		
		if (typeof this.RTM_old == "undefined"){
			this.RTM_old = _RTM_new; 
			return new Vector2(0, 0); 
		}
		
		RTM_new = _RTM_new.norm(); 
		RTM_old = this.RTM_old.norm(); 

		const LOS_delta = RTM_new.sub(RTM_old), LOS_rate = LOS_delta.mag(), Vc = -LOS_rate; 

		this.RTM_old = _RTM_new; 
		
		return RTM_new.mult(N * Vc * LOS_rate).add(LOS_delta.mult(Nt * N / 2)); 
	}

	update(target){
	    console.log(this); 
		this.acc = this.calc(target); 
		this.vel = this.vel.add(this.acc); 
		this.pos = this.pos.add(this.vel); 
	}
}


const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d"); 
canvas.width = innerWidth; 
canvas.height = innerHeight; 

const target = new Target(new Vector2(10, 100), new Vector2(0.2, 0.3), new Vector2(0.1, 0.5)); 
const missile = new Missile(new Vector2(20, 50), new Vector2(0, 0), new Vector2(0, 0)); 

setInterval(() => {
	target.update(); 
	missile.update(target); 
	
	ctx.fillStyle = ctx.strokeStyle = "red"; 
	ctx.beginPath(); 
	ctx.clearRect(0, 0, innerWidth, innerHeight); 
	ctx.arc(target.pos.x, target.pos.y, 3, 0, 2 * Math.PI); 
	ctx.stroke(); 
	ctx.fill(); 
	
	ctx.fillStyle = ctx.strokeStyle = "blue"; 
	ctx.beginPath(); 
	ctx.arc(missile.pos.x, missile.pos.y, 3, 0, 2 * Math.PI); 
	ctx.stroke(); 
	ctx.fill(); 
}, 1000)
