function canvas_render(canvas) {
	console.log("Rerendering canvas");
	//Display The Canvas's dimensions.
	//Display mouse position. 
	//Capture all keyboard input except keyboard reserved by browser and windows.
	//Capture Mouse Input
}

function body_mutation_callback(entries) {
	console.log(entries);
	const canvas = document.getElementsByTagName("canvas")[0];
	canvas.height = entries[0].contentRect.height;
	canvas.width = entries[0].contentRect.width;
	canvas_render(canvas);
}

function main() {
	console.log("JS linked");
	const body_el = document.getElementsByTagName("body")[0];
	body_el.style.margin = 'none';
	const canvas = document.createElement("canvas");
	body_el.appendChild(canvas);

	body_resize_observer = new ResizeObserver(body_mutation_callback);
	body_resize_observer.observe(body_el);
}


document.body.onload = main;
