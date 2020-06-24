/* needed by both index files */


// The server side will only zip in an apt.get, so have to send a URL request, not a fetch
let retreiveZippedSSet = function(sid, sr=16000){
	//alert("calling for zipped set with params sid=" + sid + ", and sr="+sr);
	//window.open(encodeURI('/zip?sid='+sid+'&sr='+sr), 'foo');

	let modal = document.querySelector(".modal")
	modal.style.display = "block"
	let w = window.open('/zip?sid='+sid+'&sr='+sr, '_self')

	/*
	var downloading = browser.downloads.download({
	  url : '/zip?sid='+sid+'&sr='+sr,
	  conflictAction : 'uniquify'
	});

	downloading.then(function(){
		console.log("download started")}, 
		function(){console.log("download failed")});

	});
	*/
	
};

//let modalBtn = document.getElementById("modal-btn")
let modal = document.querySelector(".modal")
/*
let closeBtn = document.querySelector(".close-btn")
modalBtn.onclick = function(){
  modal.style.display = "block"
}
closeBtn.onclick = function(){
  modal.style.display = "none"
}
*/
window.onclick = function(e){
  if(e.target == modal){
    modal.style.display = "none"
  }
}

window.addEventListener('keydown',function(e){if(e.keyIdentifier=='U+000A'||e.keyIdentifier=='Enter'||e.keyCode==13){if(e.target.nodeName=='INPUT'&&e.target.type=='text'){e.preventDefault();return false;}}},true);

document.getElementById("downloadModal").addEventListener("click", function(){
	console.log("Got the click")
	modal.style.display = "none"
})
