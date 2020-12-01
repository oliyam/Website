var loader;
	function loadNow(opacity){
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

	function hideLoader() {
		loader.style.display = "none";
	}

	window.onload = function() {
		loader = document.getElementById("preloader");
		loadNow(1);
	};