/* needed by both index files */


// The server side will only zip in an apt.get, so have to send a URL request, not a fetch
let retreiveZippedSSet = function(sid, sr=16000){
	//alert("calling for zipped set with params sid=" + sid + ", and sr="+sr);
	//window.open(encodeURI('/zip?sid='+sid+'&sr='+sr), 'foo');

	let w = window.open('/zip?sid='+sid+'&sr='+sr, '_self')
	
};