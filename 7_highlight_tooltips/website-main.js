window.onload = function() {
	document.getElementById("gist-code-button").addEventListener("click", (e) => {toggle_visibility("gist-code");});

	function toggle_visibility(id) {
		const element = document.getElementById(id);
		console.log(element.style.display);
		element.style.display = (element.style.display == "block" ) ? "none" : "block";
	}


};
