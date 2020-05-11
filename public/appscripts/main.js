// main.js
if (dbmodder){
	document.getElementById("modelFile").addEventListener("change", function(ev){
		document.getElementById("modelFileName").value=ev.target.files[0].name;
	})

	document.getElementById("soundFiles").addEventListener("change", function(ev){
		document.getElementById("soundFilesName").value=ev.target.files[0].name;
	})

}

// Fills form from object dictionary where keys corresposnd to form input element ids
let fillForm=function(obj, id=""){
	document.getElementById("soundForm").reset(); 
	document.getElementById("currentIDElement").value=id;
	for (key in obj){
	    if (key=="_id" || key=="SUBMIT NEW" || key=="UPDATE CURRENT"){
		continue;
	    }
	    if ((! dbmodder) && key== "soundFilesName") { continue;}
	    try {
		document.getElementById(key).value=obj[key]
	    }
	    catch(err){
		console.log("key = " + key + "; Error: "+ err);
	    }
	} 
}



// Adds an event listener to the button for each soundSet
// A 'click' then fetches the record for the soundSet from the DB
let retreiveRecord = function(sid, q={}){
	return new Promise(function(resolve, reject) { 
		fetch('/one', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({"_id": sid, "projectFields" : q})
				//body: JSON.stringify({"_id": sid})
				//body: JSON.stringify({"name": "jor"})
			}
			).then ((response)=>{
				console.log("fetch returned " + JSON.stringify(response));
				resolve ( response.json());
			})
	})
};



// I don't know how to do this with a fetch
// Get an HTML page constructed for the list of sounds in the soundSet
let retreiveSoundFiles = function(sid){
	window.open(encodeURI('/soundfiles?sid='+sid), '_blank');
};


let deleteRecord = function(sid){
	return new Promise(function(resolve, reject) { 
		fetch('/one', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				// send id only for deleting
				body: JSON.stringify({"_id": sid})
				//body: JSON.stringify({"name": "jor"})
			}
			).then ((response)=>{
				console.log("delete returned " + response)
				resolve ( response.json());
			})
	})
}


// *******************************************************************************
//               Per- SounbdSet buttons with Contex Menu 
//********************************************************************************
// a list of the buttons created for each sound in the db created by index.ejs when the page loads
const getSoundDataButt = document.getElementsByClassName("soundNameButt")

// Create a button for each sound in our list with a menu for taking actions (deleting or fetching)
// All soundDataButtons use this soundButtonAction which pops up a context menue with potential actions
let soundButtonAction=function(ev){
    event.preventDefault();
    let sid = ev.target.id;

    /*
    retreiveRecord(sid, {"sr" : 1})
	.then(res=>{
		console.log("SR QUERY RESULT is " + JSON.stringify(res));
		let nativeSR=res.sr;
		// for some reason, I can't put my menu constructors in the .then!!!!!
	});	
	*/

		let nativeSR=document.getElementById(sid).getAttribute("data-sr");
		console.log("nativeSR is " + nativeSR)
	    //Add contextual menu here
	    // We will only define a delete menu item if this is for the db administrator
	    let delMenuElmt= dbmodder ? 
	    	{label: 'Delete', onClick: () => {
	        	if (confirm(`deleting ${sid}`)) {
					console.log(`deleting ${sid}`)

					deleteRecord(sid)
					.then((data) => {
			    		alert(data);
			    		window.location.reload() // gets the modified list from theserver. Could be more efficient......
			  		});
				}

	        }} : {label : ""};

	     console.log("now create contextual menu")
 

	    new Contextual({
	        isSticky: false,
	        items: [
	        	{label: "ID: " + sid
	        	},
	        	{type: 'seperator'}, //---------------------
	            {label: 'Show Metadata', onClick: () => {
	            	retreiveRecord(sid)
					.then((data) => {
			    		console.log(data);
			    		fillForm(data, sid);
			  		});
					}/* short-cut could go here */},
				/*
				{type: 'seperator'}, //---------------------
				{type: 'submenu', label: 'Sub menu', items: [
	                        {label: 'Subitem 1', onClick: () => {}},
	                        {label: 'Subitem 2', onClick: () => {}},
	                        {label: 'Subitem 3', onClick: () => {}},
	                    ]},
	                    */
		    {type: 'seperator'}, //---------------------
	                        {label: 'Show Soundfiles (new tab)', onClick: () => {
	            	              retreiveSoundFiles(sid)
				}/* short-cut could go here */},

	            {type: 'seperator'}, //---------------------
		    {type: 'seperator'}, //---------------------     
				{type: 'hovermenu', label: 'Download Zipped', items: [
	                        {label: '44100 sr ' + (nativeSR=="44100" ? "(orig)" : "(resampled)"), onClick: () => {retreiveZippedSSet(sid, 44100)}},
	                        {label: '22050 sr ' + (nativeSR=="22050" ? "(orig)" : "(resampled)"), onClick: () => {retreiveZippedSSet(sid, 22050)}},
	                        {label: '16000 sr ' + (nativeSR=="16000" ? "(orig)" : "(resampled)"), onClick: () => {retreiveZippedSSet(sid, 16000)}},
	                    ]},

	            {type: 'seperator'}, //---------------------
	            delMenuElmt
	        ]
	    }); // new Contextual

//	}); //.then

}

// Add listeners to all the buttons for the sounds loaded when the db site is first visited
for(let i=0;i<getSoundDataButt.length;i++){
	getSoundDataButt[i].addEventListener('contextmenu', soundButtonAction);
}

document.getElementById("modelFileButt").addEventListener("click", function(){
	let sid=document.getElementById("currentIDElement").value
	//window.open(encodeURI('/modelFile?sid='+sid), '_blank');
	window.open('/modelFile?sid='+sid);
	/*
	 fetch('/modelFile/'+document.getElementById("currentIDElement").value, {
      method: 'get',
      headers: {'Content-Type': 'application/json'},
    }).then(results => {
    	console.log("so downloading?")
    })
    */
})
// *******************************************************************************
//                         Set default values for form
//********************************************************************************

// This just creates today's date in a format for filling the date field on the form
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

// Button for setting some fields to their most commonly-used values
document.getElementById("defaultValsButt").addEventListener("click", function(){
	document.getElementById("creationDate").value = new Date().toDateInputValue();
	document.getElementById("format").value = "wav";
	document.getElementById("channels").value = 1;
	document.getElementById("sr").value = 16000;
	document.getElementById("bitDepth").value = 32;
	document.getElementById("durationType").value = "uniform"
	document.getElementById("lengthSecs").value = 20;

	document.getElementById("submittedBy").value = "Lonce Wyse";
	document.getElementById("numFiles").value = 21;
	document.getElementById("numParams").value = 1;

	document.getElementById("sourceType").value = "synthetic";
	document.getElementById("paramType").value = "constant";

});

document.getElementById("clearValsButt").addEventListener("click", function(){
	document.getElementById("soundForm").reset(); 
	document.getElementById("currentIDElement").value="";
});


// *******************************************************************************
// REPLACE (update) a record         
//
//	This is a MANUAL FORM SUBMIT because we need to add the -_id attribute that 
//      we aren't storing in the form
//********************************************************************************
const form2JSON = elements => [].reduce.call(elements, (data, element) => {
	if (element.name) {
		data[element.name] = element.value;
	}
  return data;
}, {});

let replaceButt;

if (dbmodder){
	replaceButt = document.getElementById("replaceButt");

	replaceButt.addEventListener('click', function(){
		let f=document.getElementById("soundForm")

		let currentID=document.getElementById("currentIDElement").value;
		if (currentID==""){
			alert("Cant replace a sound with no ID. Pay attention.");
			return;
		}

		// Basic sanity check
		if (document.getElementById("name").value==""){
			if (! confirm("Update sound with no name? Really?")){
				return;
			}
		}
		

		//let data=form2JSON(f.elements);

		let data = new FormData(document.getElementById("soundForm"))

	    //data._id=document.getElementById("currentIDElement").value;
	    // FormData is a special object with its very own append function for adding attributes
	    data.append("_id", currentID)
	    console.log("..........data.id = " + data._id)
	    if (data._id===""){
	    	confirm("cannot update with out valid id")
	    	return;
	    }

	    console.log("replacement document: " + JSON.stringify(data))

		replaceRecord(data).then((retval) => {
						    		alert(JSON.stringify(retval));
						    		document.getElementById("soundForm").reset();
						    		console.log("replaced, no reload from db");
						    		window.location.reload() // gets the modified list from theserver. Could be more efficient......
						  		});
	})
}

let replaceRecord = function(obj){
	console.log("sending replacement : " + JSON.stringify(obj));
	return new Promise(function(resolve, reject) { 
		fetch('/replace', {
				method: 'post',
				//headers: { 'Content-Type': 'application/json' },
				enctype: "multipart/form-data", // because we might have a file
				//body: JSON.stringify(obj)
				//data: obj
				body: obj
			}
			).then ((response)=>{
				console.log("replace  returned " + response)
				resolve ( response.json());
			})
	})
};

let searchDB = function(obj){
	return new Promise(function(resolve, reject) { 
		fetch('/search', {
				method: 'post',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(obj)
				//body: JSON.stringify({"name": "jor"})
			}
			).then ((response)=>{
				console.log("search  returned " + response)
				resolve ( response.json());
			})
	})
};

// *******************************************************************************
// SEARCH        
//
//	This is a MANUAL FORM SUBMIT because we need to add the -_id attribute that 
//      we aren't storing in the form
//********************************************************************************
searchButt = document.getElementById("searchButt");

searchButt.addEventListener('click', function(){

	// First remove the list of sounds that were on the page already
	let myUL = document.getElementById("PSoundSetList");   // current list of sounds listed underneath the form
	for(let i=0;i<getSoundDataButt.length;i++){
			getSoundDataButt[i].removeEventListener('contextmenu', soundButtonAction); // just to be a good citizen
		}
	myUL.innerHTML="";  // clear the list before repopulating with what we get from the database search

	let f=document.getElementById("soundForm")
	let searchObj=form2JSON(f.elements);

	// now remove empty items that we don't want to include in the search
	searchObj=form2SearchObj(searchObj);
	searchDB(searchObj)

	.then(data=>{
		console.log("search  returned " + JSON.stringify(data))
		
		// Create html for list of sounds, each with a button and the list of keywords
		data.forEach((item)=>{
			let li=document.createElement('li');
			let b=document.createElement('input');
			b.setAttribute("type", "button");
			b.setAttribute("value", item.name);
			b.setAttribute("id", item._id);
			b.setAttribute("class", "soundNameButt");
			b.addEventListener('contextmenu', soundButtonAction); 
			b.addEventListener('contextmenu', soundButtonAction);
			li.appendChild(b);
			let tspan=document.createElement('span');
			//tspan.innerHTML=`(keywords) ${item.keywords} (description) ${item.description}`;
			tspan.innerHTML=`  ${item.keywords}`;
			li.appendChild(tspan);
			li.appendChild(document.createElement('br'));
			myUL.appendChild(li);
		})

	});

	console.log("OK will search using " + JSON.stringify(searchObj) );
});


/////////
// removeEmptyAttributes
////////
let form2SearchObj=function(obj){
	let retObj={};

	// combine keywords and description into a text search on the text index in in the database
	let textSearch = obj.keywords+" "+obj.description
	if (textSearch.trim().length != 0) { retObj['$text'] ={'$search' : textSearch} }

	// grab the non-empty attributes of the obj and put them on our new object to return
	Object.keys(obj).forEach(item=>{if (obj[item].trim().length != 0) {retObj[item]=obj[item]};});

	// delete these now that they are combined for a keyword search
	delete retObj.keywords;
	delete retObj.description; 

	return retObj;
}

