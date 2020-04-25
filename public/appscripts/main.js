// main.js

// Fills form from object dictionary where keys corresposnd to form input element ids
let fillForm=function(obj, id=""){
	document.getElementById("soundForm").reset(); 
	document.getElementById("currentIDElement").value=id;
	for (key in obj){
		if (key=="_id" || key=="SUBMIT NEW" || key=="UPDATE CURRENT"){
			continue;
		}
		document.getElementById(key).value=obj[key]
	} 
}



// Adds an event listener to the button for each soundSet
// A 'click' then fetches the record for the soundSet from the DB
let retreiveRecord = function(sid){
	return new Promise(function(resolve, reject) { 
		fetch('/one', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({"_id": sid})
				//body: JSON.stringify({"name": "jor"})
			}
			).then ((response)=>{
				console.log("fetch returned " + response)
				resolve ( response.json());
			})
	})
};

// The server side will only zip in an apt.get, so have to send a URL request, not a fetch
let retreiveZippedSSet = function(sid){
	window.open(encodeURI('/zip?sid='+sid), '_blank');
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

        }} : {};

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
			{type: 'seperator'}, //---------------------
            {label: 'Download Zipped', onClick: () => {
            	retreiveZippedSSet(sid)
			}},

			{type: 'seperator'}, //---------------------
            {label: 'Show Soundfiles (new tab)', onClick: () => {
            	retreiveSoundFiles(sid)
				}/* short-cut could go here */},

            {type: 'seperator'}, //---------------------
            {type: 'seperator'}, //---------------------
            delMenuElmt
        ]
    });
}

// Add listeners to all the buttons for the sounds loaded when the db site is first visited
for(let i=0;i<getSoundDataButt.length;i++){
	getSoundDataButt[i].addEventListener('contextmenu', soundButtonAction);
}

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
const formToJSON = elements => [].reduce.call(elements, (data, element) => {
  if (element.name) {data[element.name] = element.value;}
  return data;
}, {});

let replaceButt;

if (dbmodder){
	replaceButt = document.getElementById("replaceButt");

	replaceButt.addEventListener('click', function(){
		let f=document.getElementById("soundForm")
		let data=formToJSON(f.elements);
	    data._id=document.getElementById("currentIDElement").value;
	    if (data._id===""){
	    	confirm("cannot update with out valid id")
	    	return;
	    }

	    console.log("replacement document: " + JSON.stringify(data))

		replaceRecord(data).then((retval) => {
						    		alert(retval);
						    		document.getElementById("soundForm").reset();
						    		window.location.reload() // gets the modified list from theserver. Could be more efficient......
						  		});
	})
}

let replaceRecord = function(obj){
	return new Promise(function(resolve, reject) { 
		fetch('/replace', {
				method: 'post',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(obj)
				//body: JSON.stringify({"name": "jor"})
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
	let myUL = document.getElementById("PSoundSetList");
	for(let i=0;i<getSoundDataButt.length;i++){
			getSoundDataButt[i].removeEventListener('contextmenu', soundButtonAction); // just to be a good citizen
		}
	myUL.innerHTML="";

	let f=document.getElementById("soundForm")
	let searchObj=formToJSON(f.elements);

	searchObj=form2SearchObj(searchObj);
	searchDB(searchObj)

	.then(data=>{
		console.log("search  returned " + JSON.stringify(data))
		
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