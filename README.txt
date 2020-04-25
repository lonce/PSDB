
Here is the basic set-up and start-up page I used for mongodb:
https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

When back at the office using the static IP configuration, will want to bind MongoDB to the IP so that clients (authorized) can connect to it.


++++++++++++++++++++++++==

This database was set up in the shell thus:

> use Parameterized-Sound-Sets
> db.createCollection(pSoundSets)
> show collections
pSoundSets
> db.pSoundSets.createIndex({"keywords" : "text", "description" : "text"})
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 1,
	"numIndexesAfter" : 2,
	"ok" : 1
}


All other data entry (admin) is done through the browser at URL
localhost:55555       // see soundServer.js to see how I set up this port as local-only
						// Also, I use the same code base for admin and user, using a variable to show/hide the admin stuff.

The database can be searched at the URL
xxxxxxxxxx:xxxxx // I haven't made it public yet. 

