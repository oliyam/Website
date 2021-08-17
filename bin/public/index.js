var background = document.getElementById("background");

function moveImg(event) {
	background.style.backgroundPosition = -event.clientX/200 + " " + -event.clientY/200;
}

function input_validate(x) {
	if(x.value.length>0)
		x.style.background = "white";
	else
		x.style.background = "#ff546e";
}