export function uncover(index) {
	loader = document.getElementById("preloader"+index);
	loadNow(1);

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
};

window.onload = () => {
	uncover('');
};