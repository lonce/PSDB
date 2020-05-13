//https://www.npmjs.com/package/debug
let debug=require('debug')('sounddbserver')
//===================================================
const express = require('express');
const https = require('https');
const bodyParser= require('body-parser')

//--------------------------------------------------
// for modelFile uploads
const multer = require('multer');

sfsetdir='PSOUNDSET';  // storage location for sound files 

const fileStorage= multer.diskStorage({
    destination: (req, file, cb) => {
	console.log("    %%%%%%%%%%%%%%%% file object " + JSON.stringify(file));
    	if (file.fieldname === "modelFile") { // if uploading model code
	      cb(null, './uploads/modelFiles/');
	} else { // else uploading soundFiles
	    // timeStamp added to req in middleware so all files in one upload will go to the same directory
	    debug(" creating directory named " + req.body.name.replace(/ /g, '')+ '-' + req.timeStamp);
	    let newdir=sfsetdir +'/'+req.body.name.replace(/ /g, '')+ '-' + req.timeStamp;
	    if (! fs.existsSync(newdir)){
		fs.mkdirSync(newdir);
	    }
	    cb(null, newdir);
	}
    },
    
    filename: (req, file, cb) => {
    	if (file.fieldname === "modelFile") {
	      	cb(null, file.originalname + '-' + myDate())
	    } else { //file.fieldname === "soundFiles"
	    	/* uploading files */
	    	cb(null, file.originalname );
	    }
	}
});

const upload = multer({storage: fileStorage});


// for mongodb --------------------------------------
// Good ref for node's mongodb driver API:
// https://mongodb.github.io/node-mongodb-native/3.4/api/index.html
const MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID;
//---------------------------------------------------

// for getting directory listings ----------
const path = require('path');
const fs = require('fs');

// for zipping files in-line before sending
// https://www.npmjs.com/package/express-zip
var zip = require('express-zip');

 
//----------for resampling saudio in python -----------
// https://www.npmjs.com/package/python-shell
let {PythonShell} = require('python-shell')

//-----------------------------------------

const app = express();
portnum=process.argv[2] || 3000;


const https_options = {
  key: fs.readFileSync("/etc/letsencrypt/live/sonicthings.org/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/sonicthings.org/fullchain.pem") // these paths might differ for you, make sure to copy from the certbot output
};

// The sounds can by accessed (and played) if they users have the path starting from inside PSOUNDSET
app.use(express.static(sfsetdir),function (req, res, next) {
  //debug('Request Type:', req.url);
  next()
});

// This is where we will store main.js
app.use(express.static('public'))
let dbmodder=false; // will use to render capabilities for db admin (modify db) vs user (search db)

if (portnum==55555){
	dbmodder=true; // flip some switches for code generation: admin vs user
} 

//app.listen(portnum, function(){
//	console.log("server listening on port " + portnum)
//});

const httpsServer = https.createServer(https_options, app);
httpsServer.listen(portnum, () => {
	console.log('HTTPS Server running on port ' + portnum);
});


// Make sure you place body-parser before your CRUD handlers!
// Extract data from the <form> element and add them to the body property in the request object.
app.use(bodyParser.urlencoded({ extended: true }))
app.use( bodyParser.json() );
// timeStamp used by fileStorage to create directories for sound files loaded together
app.use(function (req, res, next) {
    req.timeStamp=myDate();
    next();
})

//=================================================
app.set('view engine', 'ejs')

//=================================================
// global paramters
//=================================================
// standard filter - data fields not to be sent to client
const clientProjection = {'modelFile' : 0, 'soundFiles' : 0}


let connectionString="mongodb://localhost:27017"
MongoClient.connect(connectionString, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database')
    const db = client.db('Parameterized-Sound-Sets')
	// get the collection or create if does not exist (I guess)
    const pSoundSetsCollection = db.collection('pSoundSets')


      //-------------------------------------------------------------------------
	// Render the whole web page with the form in index.ejs and the list of pSoundSets in the database
	app.get('/', (req, res) => {
		db.collection('pSoundSets').find({},{'projection' : clientProjection}).toArray()
	    .then(results => {
	    	//results=clientFilterArray(results);
	      res.render('index.ejs', { pSoundSets: results, dbmodder : dbmodder })
	    })
	    .catch(/* ... */)
	})

	//-------------------------------------------------------------------------
	// UPLOAD one sound
	// The <form> uses the POST method and sends '/pSoundSets' as the action attribute 
	//    modelFile is the name of the html element in the form for files
    app.post('/pSoundSets', upload.fields([{
           name: 'modelFile', maxCount: 1
         }, {
             name: 'soundFiles', maxCount: 101, myNewDir:"yabadabadoo!"
         }]), (req, res) => {

    	debug("**********adding new pset : " + JSON.stringify(req.body));

    	//save the file data on the db record so we have access to it later - is there a better way?
    	if (req.files && req.files['modelFile']){
    		//console.log("==================pset uploading modelFile " + JSON.stringify(req.files['modelFile'][0]));
    		req.body.modelFile=req.files['modelFile'][0];
    	}
    	//console.log("and the modelFile path is "+ JSON.stringify(req.body.modelFile))
    	
    	
    	if (req.files && req.files['soundFiles']){
    		//console.log("++++++++++++++++++++ pset uploading soundfile " + JSON.stringify(req.files['soundFiles']));
    		req.body.soundFiles=req.files['soundFiles'];
    	}
    	//console.log("and the soundFiles destination(path) is "+ req.body.soundFiles[0].destination)
    	

	  // the req.body is the complete JSON object parsed from the <form>
	  	pSoundSetsCollection.insertOne(req.body)
	    .then(result => {
	      res.redirect('/');
    })
    	.catch(error => console.error(error))
	})

    //------------------------------------------------------------------
    // REPLACE (update)
	// Replace an existing document with another (used for updateing entire document)
	app.post('/replace', upload.fields([{
           name: 'modelFile', maxCount: 1
         }, {
           name: 'soundFiles', maxCount: 101
         }]), (req, res) => {
		console.log("Replacing " + req.body._id);
		if (req.files && req.files['modelFile']){
    		debug("==================replacing with  soundfile " + JSON.stringify(req.files['modelFile'][0]));
    	}
		req.body=prepareID(req.body);

		// first get the old record in case we need to get its file attribute
		let removeOldModelFile=true;
		let removeOldSoundFiles=true;
		pSoundSetsCollection.findOne({"_id": req.body._id})
		.then(oldRecord => {
			if (req.files && req.files['modelFile']){ // if new has a file, it is intended to also replace the old one
				req.body.modelFile=req.files['modelFile'][0];
			} else {
				debug("in replace, no file attribute");
				if (req.body.modelFileName && (req.body.modelFileName == oldRecord.modelFileName)){ // then the intention is to retain the previous file attribute
					debug("in replace, modelFileName of old and new are the same, so keep old file")
					req.body.modelFile=oldRecord.modelFile;
					removeOldModelFile=false
				}
			}
			if (removeOldModelFile){
				debug("in replace, call deleteModelFile on old record")
				deleteModelFile(pSoundSetsCollection, oldRecord);
			}

			// NOW DO THE SAME FOR THE SOUND FILES
			if (req.files && req.files['soundFiles']){ // if new has a file, it is intended to also replace the old one
				req.body.soundFiles=req.files['soundFiles'];
			} else {
				debug("////////IN REPLACE, no soundFiles attribute, so keep old file") /// TRANSFER FROM OLD TO NEW
				req.body.soundFiles=oldRecord.soundFiles;
				removeOldSoundFiles=false;
			}
			if (removeOldSoundFiles){
				debug("/////////////IN REPLACE, call deleteOldSoundFiles on old record")
				deleteSoundFiles(pSoundSetsCollection, oldRecord);
			}

			// now we are ready to do the replacement with our updated req.body
			pSoundSetsCollection.replaceOne({"_id": req.body._id}, req.body)
			.then(result => {
		      if (result.deletedCount === 0) {
		        return res.json('No sound to replace')
		      }
		      debug("result of replaceOne ............. " + JSON.stringify(result));
		      res.send(result);
		    })
	    	.catch(error => console.error(error))

	    })
		.catch(error => console.error(error)) 
	});

	//----------------------------------------------------------------------------
	// SEARCH with constraints, possibly return many
	app.post('/search', (req, res) => {
		//console.log("Server Searching " + req.body);

		req.body=prepareID(req.body);
		
		//db.collection('pSoundSets').findOne({"_id": new ObjectId(req.body._id)})
		pSoundSetsCollection.find(req.body, {'projection' : clientProjection}).toArray()
			.then(result => {
		      //res.send(clientFilterArray(result));
		      res.send(result);
		    })
	    .catch(error => console.error(error)) 
	});

	//---------------------------------------------------------------------------------
	// RETREIVE a single record by ID
	app.put('/one', (req, res) => {
		//console.log("requesting to retrieve : " + req.body._id);

		//req.body=prepareID(req.body);
		let sid = req.body._id;
		debug("in sound record request /one, sid = " + sid)
		let qobj={"_id":  new ObjectId(sid)}

		let pfields = req.body.projectFields;

		if (Object.keys(pfields) != 0) {
			pSoundSetsCollection.findOne(qobj, {'projection' : pfields})
				.then(result => {
				    debug("OK, send projected result: " + JSON.stringify(result));
				    res.send(result);
			    })
		    	.catch(error => console.error(error)) 

		} else {

			debug("----------------FIND ONE with clientProjection = " + JSON.stringify(clientProjection));
			pSoundSetsCollection.findOne(qobj, {'projection' : clientProjection})
				.then(result => {
					//result=clientFilterObj(result);
				    debug("OK, send result: " + JSON.stringify(result));
				    res.send(result);
			    })
		    	.catch(error => console.error(error)) 
		}
		
	});

	//--------------------------------------------------------------------
	// ZIP and download fileset
	app.get('/zip', (req, res) => {
		let sid = req.query.sid;
		debug("in soundfile request, sid = " + sid)
		let qobj={"_id":  new ObjectId(sid)}

		let sr=req.query.sr;



		//pSoundSetsCollection.findOne(req.body)
		pSoundSetsCollection.findOne(qobj)
			.then(result => {
				debug("OK, send result: " + result);

				let myPath;
				if (result && result.soundFiles){
					//console.log("in zip, it has a soundfiles attribute")
					myPath = result.soundFiles[0].destination;
				 } 

				 if (result.sr != sr){  // run some python if sr requires conversion

				 	let newdir = '/scratch/'+result.name
				 	if (! fs.existsSync(newdir)){
				      	fs.mkdirSync(newdir);
				    }

				 	let options = {
					  mode: 'text',
					  pythonPath: '/usr/bin/python3',
					  pythonOptions: ['-u'], // get print results in real-time
					  scriptPath: './python',
					  args: [myPath, newdir, sr]
					};

					debug("...........Calling python with args " + JSON.stringify(options.args));

					
					 
					PythonShell.run('convert.py', options, function (err, pyresults) {
						if (err) throw err;
						// results is an array consisting of messages collected during execution
						//console.log('results: %j', pyresults);
						console.log("done with convert")
						//zipnsend(newdir, result.name+"_"+sr2shorthand(sr), res.zip)
					
						let nm=result.name+"_"+sr2shorthand(sr);

						readdir(newdir)
					    .then(farray =>{
					      	farray.forEach(function (item, index, arr){
					      		arr[index] = {path : newdir + '/'+item, name: nm + "/"+item}
					      	});
					      	//debug("Here is what we will zip " + JSON.stringify(farray))
					     	res.zip(farray, nm+".zip");

					     	// now clean up the temporary directory of converted files
					     	fs.rmdir(newdir, { recursive: true }, (error) => { 
								if (error) { 
									console.log(error); 
								} 
								else { 
									console.log("deleted temporary dir " + newdir);
								}
							});

						})

					})

				 } else{ // no need to run the python sr conversion script 

					readdir(myPath)
				    .then(farray =>{
				      	farray.forEach(function (item, index, arr){
				      		arr[index] = {path : myPath + '/'+item, name: result.name+"_pSoundSet/"+item}
				      	});
				      	//debug("Here is what we will zip " + JSON.stringify(farray));
				     	res.zip(farray, result.name+"_pSoundSet"+".zip");
		    		})
				}
			})
	    	.catch(error => {
	    		console.error(error);
	    		res.send("cannot find sound " + sid)
	    	});
		});
	


	//------------------------------------------------------------------------------
	// CREATE a webpage of the list of playabile files in a fileset - return
	// Retireive by ID  
	// This respnds to a URL request with a query parameter
	app.get('/soundfiles', (req, res) => {
		let sid = req.query.sid;
		//debug("in soundfile request, sid = " + sid);
		let qobj={"_id":  new ObjectId(sid)}

		//pSoundSetsCollection.findOne(req.body)
		pSoundSetsCollection.findOne(qobj)
			.then(result => {
		      debug("OK, found the record for soundfile request: " + result.name);

		      let myPath;
		      if (result && result.soundFiles){
		  		//debug("creating soundFiles pg, record does have a soundfiles attribute")
		  		myPath = result.soundFiles[0].destination;

		  	  } 
		      //let myPath=result.name+"/"+result.name+"_16k/";
		      //readdir('PSOUNDSET/'+result.name+"/"+result.name+"_16k")
		      readdir(myPath)
		      .then(farray =>{
		      	res.render('soundFileList.ejs', {path : path.relative(sfsetdir,myPath), ssname:result.name, sid: sid, sflist: farray, sr: result.sr})
		      })
		      .catch(error => {
		      	console.error(error);
		      	res.send("soundfiles do not exist");
		      });
		    })
	    	.catch(error => {
	    		console.error(error);
	    		res.send("soundfiles do not exist");
	    	});
	});

	// --------------------------------------------------------
	// DOWNLOAD the modelFile
	app.get('/modelFile',(req,res)=>{  
		let sid = req.query.sid;
		console.log("in modelFile request, sid = " + sid)
		let qobj={"_id":  new ObjectId(sid)}

		pSoundSetsCollection.findOne(qobj)
		.then(result => {
			  if (result.modelFile){
			  	debug("will download " + result.modelFile.path + " to " + result.modelFile.originalname);
			  	res.download(result.modelFile.path, result.modelFile.originalname, function(err){
			  		if (err){
			  			console.log("something went wrong with the download: " + err)
			  		} else {
			  			console.log("seemed to work .....")
			  		}
			  	});
			  }
		      else{
		      	console.log("Doesn't look like this record has a model file stored");
		      }
	    })
    	.catch(error => console.error(error))
    })


	//----------------------------------------------------
	// DELETE one record
	app.delete('/one', (req, res) => {
		req.body=prepareID(req.body); // deletee requests come in with _id attributes only

		debug("/////////////////DELETE")

		// First delete the modelFile if it has one
		deleteModelFile(pSoundSetsCollection, req.body);
		// and the sound files
		deleteSoundFiles(pSoundSetsCollection, req.body);
    	// now delete the db record
		pSoundSetsCollection.deleteOne(req.body)
	    .then(result => {
	      if (result.deletedCount === 0) {
	        return res.json('No sound to delete')
	      }
	      res.json(`Deleted sound`)
	    })
	    .catch(error => console.error(error))
	})

  })
  .catch(error => console.error(error))

//
//=======================================================================
//                             Utilities
//=======================================================================
let prepareID=function(obj){
  	if (Object.keys(obj).includes("_id")) {
			obj._id = new ObjectId(obj._id);
		}
	return obj;
  }


const readdir = (path) => {
 return new Promise((resolve, reject) => {
  fs.readdir(path, (error, files) => {
   error ? reject(error) : resolve(files);
  });
 });
}


// If the obj is on the db, and it has a modelFile, then delete it
const deleteModelFile = function(collection, obj){
	collection.findOne(obj)
	.then(result => {
	  	if (result && result.modelFile){
	  		console.log("now delete " + result.modelFile.path)
			fs.unlink(result.modelFile.path, function(){
				console.log("deleted modelFile " + result.modelFile.path)
			})
		}
    })
	.catch(error => console.error(error)) 
}

const deleteSoundFiles = function(collection, obj){
	collection.findOne(obj)
	.then(result => {
		debug("in deleteSoundFiles, found our target record")
	  	if (result && result.soundFiles){
	  		debug("in deleteSoundFiles, it has a soundfiles attribute")
	  		let soundFilesDestination = result.soundFiles[0].destination;
	  		debug("now delete " + soundFilesDestination) 
			fs.rmdir(soundFilesDestination, { recursive: true }, (error) => { 
				  if (error) { 
				    console.log(error); 
				  } 
				  else { 
				    console.log("deleted modelFile " + soundFilesDestination);
				}
			});
		};
	});
}


const myDate=function(){
	let d=new Date()
	return(`${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}.${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}`);
}

const sr2shorthand=function(sr){
	switch(sr) {
	  case '16000':
	    return "16k"
	  case '22050':
	    return "22K"
	  case '44100':
	    return "44K"
	  default:
	    return ''
	}  
}

