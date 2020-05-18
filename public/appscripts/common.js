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