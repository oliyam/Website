var background = document.getElementById("background");
	
	/*
	function smooth(opacity){
		var width = background.clientWidth;
		var height = background.clientHeight;

		var x = event.clientX;
		var y = event.clientY;

		if(opacity <= 0){
			hideLoader();
		}
		else{
			loader.style.opacity = opacity;
			window.setTimeout(function() { 
				loadNow(opacity - 0.05);
			}, 50);
		}
	}
	*/

	function moveImg(event) {
			background.style.backgroundPosition = -event.clientX/100 + " " + -event.clientY/100;
	}

	function input_validate(x) {
		if(x.value.length>0)
			x.style.background = "white";
		else
			x.style.background = "#ff546e";
	}

	var coll = document.getElementsByClassName("collapsible");
	var transition = document.querySelector('.content');
	var cycle = 0;

	transition.addEventListener('transitionend', () => {
		cycle=cycle^1;
		console.log(cycle);
	});

	for (var i = 0; i < coll.length; i++) {
		coll[i].addEventListener("click", function() {
			var content = this.nextElementSibling;
			this.classList.toggle("active");
			if (content.style.maxHeight){
				content.style.maxHeight = null;
			}
			else{
				content.style.maxHeight = content.scrollHeight + "px";
			} 
		});
	}