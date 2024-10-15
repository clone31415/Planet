class Planets{
	constructor(table){
		this.list = list; 
		this.planets = []; 
		this.offset_x = this.offset_y = 0; 
	}

	addPlanet(planet){
		this.planets.push({
			name: planet.name, 
			mass: planet.mass, 
			x: planet.x, 
			y: planet.y, 
			vx: planet.vx, 
			vy: planet.vy, 
			size: planet.size, 
			colour: planet.colour, 
			previous: []
		}); 
	}

	move(){
		this.list.innerHTML = ""; 

		ctx.clearRect(0, 0, canvas.width, canvas.height); 
		
		for (const planet of this.planets){			
			for (const _planet of this.planets){
				const distance = (planet.x - _planet.x) ** 2 + (planet.y - _planet.y) ** 2; 
				
				if (distance > 0){
					planet.vx += (_planet.x - planet.x) * _planet.mass / distance ** 1.5 * 2; 
					planet.vy += (_planet.y - planet.y) * _planet.mass / distance ** 1.5 * 2; 
				}
			}

			// if (planet.x < 100) planet.vx -= planet.x / 500 - 0.2; 
			// if (planet.x > canvas.width - 100) planet.vx -= (planet.x - canvas.width) / 500 + 0.2;
			// if (planet.y < 100) planet.vy -= planet.y / 500 - 0.2; 
			// if (planet.y > canvas.height - 100) planet.vy -= (planet.y - canvas.height) / 500 + 0.2; 
			
			planet.previous.push([planet.x, planet.y]); 
	
			if (planet.previous.length == 51) planet.previous.shift(); 
	
			ctx.strokeStyle = ctx.fillStyle = planet.colour; 
			
			ctx.beginPath(); 
			ctx.moveTo(planet.previous[0][0] + this.offset_x, planet.previous[0][1] + this.offset_y); 
			for (const pos of planet.previous.slice(1)) ctx.lineTo(pos[0] + this.offset_x, pos[1] + this.offset_y); 
			ctx.stroke(); 
			
			ctx.beginPath();
			ctx.arc(planet.x + this.offset_x, planet.y + this.offset_y, planet.size, 0, 2 * Math.PI);
			ctx.fill();

			this.list.innerHTML += planet.name; 
		}
	
		for (const planet of this.planets){
			// if (planet.vx ** 2 + planet.vy ** 2 > 0.01){
			// 	planet.vx *= 0.999; 
			// 	planet.vy *= 0.999; 
			// }
			planet.x += planet.vx; 
			planet.y += planet.vy; 
		}
	}
}


const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d"), controls = document.getElementById("controls"), planets = new Planets(document.getElementById("list")); 
let drag_sep = false, drag_canvas = false, start_x, start_y, curr_x, curr_y; 

canvas.width = window.innerWidth / 3 * 2 - 4; 
canvas.height = window.innerHeight; 
controls.style.width = window.innerWidth / 3 - 4; 

// planets.addPlanet({name: "Planet A", mass: 1800, x: 300, y: 200, vx: 0, vy: 3, size: 3, colour: "red"}); 
// planets.addPlanet({name: "Planet B", mass: 1800, x: 100, y: 200, vx: 0, vy: -3, size: 3, colour: "green"}); 

planets.addPlanet({name: "Planet", mass: 1, x: 200, y: 450, vx: 0, vy: 30, size: 2, colour: "white"}); 
planets.addPlanet({name: "Sun A", mass: 100000, x: 600, y: 400, vx: -30, vy: 0, size: 5, colour: "red"}); 
planets.addPlanet({name: "Sun B", mass: 100000, x: 600, y: 500, vx: 30, vy: 0, size: 5, colour: "red"}); 

const toggle = element => {
	element = element ? document.getElementById("planets") : document.getElementById("settings"); 

	if (element.style.maxHeight == "0px") element.style.maxHeight = "1000px"; 
	else element.style.maxHeight = "0px"; 
}

const adj_len = element => {
	var test = document.getElementById("length");
	test.innerHTML = element.value; 

	element.style.width = Math.max(20, test.clientWidth + 5) + "px"; 
}

const move = () => {
	planets.move(); 

	requestAnimationFrame(move); 
}

canvas.oncontextmenu = () => {
	event.preventDefault(); 
	planets.addPlanet({name: "", mass: 1, x: event.clientX - planets.offset_x, y: event.clientY - planets.offset_y, vx: 0, vy: 0, size: Math.random() * 0.8 + 1, colour: "white"}); 
}

onload = () => {
	move(); 
}

separator.onmousedown = () => {drag_sep = true}

canvas.onmousedown = () => {
	drag_canvas = true; 
	start_x = event.clientX - planets.offset_x; 
	start_y = event.clientY - planets.offset_y; 
}

onmouseup = () => {
	drag_sep = drag_canvas = false; 
}

onmousemove = () => {
	if (drag_sep){
		if (event.clientX - 5 < window.innerWidth / 10){
			canvas.width = window.innerWidth / 10 - 5; 
			controls.style.width = window.innerWidth / 10 * 9 - 5; 
		}else if (window.innerWidth - event.clientX - 5 < window.innerWidth / 10){
			canvas.width = window.innerWidth / 10 * 9 - 5; 
			controls.style.width = window.innerWidth / 10 - 5; 
		}else{
			canvas.width = event.clientX - 5; 
			controls.style.width = window.innerWidth - event.clientX - 5; 
		}
	}

	if (drag_canvas){
		console.log(1)
		planets.offset_x = event.clientX - start_x; 
		planets.offset_y = event.clientY - start_y; 
	}
}
