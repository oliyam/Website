var background = document.getElementById("background");

function input_validate(x) {
	if(x.value.length>0)
		x.style.background = "white";
	else
		x.style.background = "#ff546e";
}