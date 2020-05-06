const express = require('express');
const bodyParser= require('body-parser')

//--------------------------------------------------
// for modelFile uploads
const multer = require('multer');
const upload = multer({dest: 'uploads/modelFiles/'})
// for mongodb --------------------------------------
const MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID;
//---------------------------------------------------

// for getting directory listings ----------
const path = require('path');
const fs = require('fs');
//zip!
var zip = require('express-zip');
//------------------------------------------

let verbose=true;

const app = express();

portnum=process.argv[2] || 3000;

app.use(express.static('PSOUNDSET'),function (req, res, next) {
  if (verbose){console.log('Request Type:', req.url)}
  next()
});

// This is where we will store main.js
app.use(express.static('public'))
let dbmodder=false; // will use to render capabilities for db admin (modify db) vs user (search db)

if (portnum==55555){
	//app.listen(portnum, 'localhost', function(){
	//	console.log("server listening on port " + portnum)
	//});
	dbmodder=true;
} //else{
	app.listen(portnum, function(){
		console.log("server listening on port " + portnum)
	});

//}

// Make sure you place body-parser before your CRUD handlers!
// Extract data from the <form> element and add them to the body property in the request object.
app.use(bodyParser.urlencoded({ extended: true }))
app.use( bodyParser.json() );

// All your handlers here...
// app.get('/', (req, res) => {/*...*/})
//app.post('/quotes', (req, res) => {
//	console.log(req.body)
//})
//=================================================
app.set('view engine', 'ejs')

let connectionString="mongodb://localhost:27017"
MongoClient.connect(connectionString, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database')
    const db = client.db('Parameterized-Sound-Sets')
	// get the collection or create if does not exist (I guess)
    const pSoundSetsCollection = db.collection('pSoundSets')


	// Render the whole web page with the form in index.ejs and the list of pSoundSets in the database
	app.get('/', (req, res) => {
		db.collection('pSoundSets').find().toArray()
	    .then(results => {
	    	results=clientFilterArray(results);
	      //if (verbose){console.log("psets to return through res.render: " + JSON.stringify(results))}
	      res.render('index.ejs', { pSoundSets: results, dbmodder : dbmodder })
	    })
	    .catch(/* ... */)
	})


	// The <form> uses the POST method and sends '/pSoundSets' as the action attribute 
	//    modelFile is the name of the html element in the form for files
    app.post('/pSoundSets', upload.single("modelFile"), (req, res) => {
    	//if (verbose){console.log("adding new pset : " + JSON.stringify(req.body))}
    	console.log("==================uploading soundfile " + JSON.stringify(req.file));
    	req.file && (req.body.modelFile=req.file);

    	if (verbose){console.log("**********adding new pset : " + JSON.stringify(req.body))}


	  // the req.body is the complete JSON object parsed from the <form>
	  	pSoundSetsCollection.insertOne(req.body)
	    .then(result => {
	      res.redirect('/');
    })
    	.catch(error => console.error(error))
	})

	// Replace an existing document with another (used for updateing entire document)
	app.post('/replace', upload.single("modelFile"), (req, res) => {
		if (verbose){console.log("Replacing " + req.body._id);}
		console.log("=====================uploading soundfile " + JSON.stringify(req.file));
		req.body=prepareID(req.body);

		// first get the old record in case we need to get its file attribute
		let removeOldModelFile=true;
		pSoundSetsCollection.findOne({"_id": req.body._id})
		.then(oldRecord => {
			if (req.file){ // if new has a file, it is intended to also replace the old one
				req.body.modelFile=req.file
			} else {
				console.log("in replace, no file attribute")
				if (req.body.modelFileName && (req.body.modelFileName == oldRecord.modelFileName)){ // then the intention is to retain the previous file attribute
					console.log("in replace, modelFileName of old and new are the same, so keep old file")
					req.body.modelFile=oldRecord.modelFile;
					removeOldModelFile=false
				}
			}

			if (removeOldModelFile){
				console.log("in replace, call deleteModelFile on old record")
				deleteModelFile(pSoundSetsCollection, oldRecord);
			}

			// now we are ready to do the replacement with our updated req.body
			pSoundSetsCollection.replaceOne({"_id": req.body._id}, req.body)
			.then(result => {
		      if (result.deletedCount === 0) {
		        return res.json('No sound to replace')
		      }
		      console.log("result of replaceOne ............. " + JSON.stringify(result));
		      res.send(result);
		    })
	    	.catch(error => console.error(error))


	    })
		.catch(error => console.error(error)) 
	});

	//----------------------------------------------------------------------------
	// SEARCH
	app.post('/search', (req, res) => {
		if (verbose){console.log("Server Searching " + req.body)};

		req.body=prepareID(req.body);
		
		//db.collection('pSoundSets').findOne({"_id": new ObjectId(req.body._id)})
		pSoundSetsCollection.find(req.body).toArray()
			.then(result => {
		      res.send(clientFilterArray(result));
		    })
	    .catch(error => console.error(error)) 
	});

//---------------------------------------------------------------------------------
	// Retireive a single record
	app.put('/one', (req, res) => {
		if (verbose){console.log("requesting to retrieve : " + req.body._id)};

		req.body=prepareID(req.body);
		
		
		//db.collection('pSoundSets').findOne({"_id": new ObjectId(req.body._id)})
		pSoundSetsCollection.findOne(req.body)
			.then(result => {
				  result=clientFilterObj(result);
			      if (verbose){console.log("OK, send result: " + JSON.stringify(result))};
			      res.send(result);
		    })
	    	.catch(error => console.error(error)) 
	});

/*
	// Retireive a singe record
	app.put('/zip', (req, res) => {
		console.log("preparing to zip up sounds for " + req.body._id);
		req.body=prepareID(req.body);
		
		//db.collection('pSoundSets').findOne({"_id": new ObjectId(req.body._id)})
		pSoundSetsCollection.findOne(req.body)
			.then(result => {
			      console.log("OK, send result: " + result);
			      res.zip([{path: 'PSOUNDSET/'+result.name+"/"+result.name+"_16k", name: result.name+"_16k"}]);
			
//			      readdir('PSOUNDSET/'+result.name+"/"+result.name+"_16k")
//			      .then(dirs =>{
//			      	dirs.forEach(function (item, index, arr){
//			      		arr[index] = {pathitem * 10;
//			      	})
//			      	//res.send(dirs)

		    })
	    	.catch(error => console.error(error)) 
	});
*/
	app.get('/zip', (req, res) => {
		let sid = req.query.sid;
		if (verbose){console.log("in soundfile request, sid = " + sid)}
		let qobj={"_id":  new ObjectId(sid)}

		//pSoundSetsCollection.findOne(req.body)
		pSoundSetsCollection.findOne(qobj)
			.then(result => {
				if (verbose){console.log("OK, send result: " + result)};
				readdir('PSOUNDSET/'+result.name+"/"+result.name+"_16k")
			    .then(dirs =>{
			      	dirs.forEach(function (item, index, arr){
			      		arr[index] = {path : 'PSOUNDSET/'+result.name+"/"+result.name+"_16k/" + item, name: result.name+"_16k/"+item}
			      	});
			      	if (verbose){console.log("Here is what we will zip " + dirs)}
			     	res.zip(dirs, result.name+"_16k"+".zip");
		    })
	    	.catch(error => {
	    		console.error(error);
	    		res.send("cannot find sound " + sid)
	    	});
		});
	})


//------------------------------------------------------------------------------
	// Retireive a list of all sound files for record with submitted _id 
	// This respnds to a URL request with a query parameter
	// Return: a page rendered with the sound list
	app.get('/soundfiles', (req, res) => {
		let sid = req.query.sid;
		if (verbose){console.log("in soundfile request, sid = " + sid)}
		let qobj={"_id":  new ObjectId(sid)}

		//pSoundSetsCollection.findOne(req.body)
		pSoundSetsCollection.findOne(qobj)
			.then(result => {
			      if (verbose){console.log("OK, found the record for soundfile request: " + result.name)};
			      //console.log("__dirname is " + __dirname)
			      let myPath=result.name+"/"+result.name+"_16k/";
			      readdir('PSOUNDSET/'+result.name+"/"+result.name+"_16k")
			      .then(dirs =>{
			      	//res.send(dirs)
			      	res.render('soundFileList.ejs', {path : myPath, ssname:result.name, sid: sid, sflist: dirs})
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

	// -------------------------
	/*
	app.get('/modelFile/:sid',(req,res)=>{  

		if (verbose){console.log("in modelFile request, sid = " + req.params.sid)}// + sid)}
		let qobj={"_id":  new ObjectId(req.params.sid)}
	*/
	app.get('/modelFile',(req,res)=>{  
		let sid = req.query.sid;
		if (verbose){console.log("in modelFile request, sid = " + sid)}
		let qobj={"_id":  new ObjectId(sid)}

		pSoundSetsCollection.findOne(qobj)
		.then(result => {
			  console.log("in downloading, findOne returned  " + JSON.stringify(result));
			  if (result.modelFile){
			  	console.log("ok, looks good - download the file " + result.modelFile.originalname)
			  	console.log("will download " + result.modelFile.path);
			  	//res.download(path.join(__dirname,result.modelFile.path), result.modelFile.originalname)
			  	//res.download(path.join(__dirname,result.modelFile.path))

			  	//res.writeHead(200, {'Content-Disposition': 'attachment'});
				//res.setHeader('Content-Disposition', 'attachment; filename='+result.modelFile.originalname);
				//res.setHeader('Content-type', 'text');
				console.log("will use file name " + result.modelFile.originalname)
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
	  /*
	*/
		// First delete the modelFile if it has one
		deleteModelFile(pSoundSetsCollection, req.body);
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


    //app.use(/* ... */)
    //app.get(/* ... */)
    //app.post(/* ... */)
    //app.listen(/* ... */)
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

const clientFilterObj=function(item){

	if (item.modelFile){
		console.log("  don't send client the modelFile attribute  ")
		// modelFileName corresponds to html element name on client side
		//item.modelFileName = item.modelFile.originalname;
		delete item.modelFile;
	}
	return item;
}


const clientFilterArray=function(sarray){

	sarray.forEach((item)=> {
		item=clientFilterObj(item);
	})
	return sarray;
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