# Parameterised Sound DB (PSDB)
PSDB is a node/mongodb sound database system. It supports: 
  - Administrator and Client views of the DB with a shared code base
  - Mulitple file uploads and downloads
  - Previewing sounds
  - Downloading zipped sound sets that are converted to user-desired sample-rates and zipped on the fly (on the server)

## Under the hood
  - Uses pure node driver code for mongodb (no mongoose or other libs)
  - Served securely with certbot certs
  - Calls out to python code for sample rate conversion
  - Multer for mulitple file upload
  - ejs templates for dynamic page creation (admin vs client views)

### Installation
Install the dependencies and devDependencies and start the server.
```sh
$ cd PSDB
$ npm install 
```
  - install [mongodb (community edition)](https://docs.mongodb.com/manual/administration/install-community/)
  - run it (I use a collection named pSoundSets and a database named=Parameterized-Sound-Sets - of course, the server has to know about these. These are set up in the mongodb shell:)
```sh
> use Parameterized-Sound-Sets 
> db.createCollection(pSoundSets)
> show collections
```
  - install libsndfile (apt-get install .....) 
  - install resampy and PySoundFile with pip3 (the server uses a python3 script for sample rate conversion)
  - create 'uploads' and 'PSOUNDSET' directories where model files and soundfiles that are uploaded with form data will be stored. 
  - run on any port for clients, port 55555 for admins (or change the port number in sounddbserver.js):
```sh
$ nohup node soundbserver.js (portnum} &> logfile &
```

I protect access to the admin view with a minimal firewall set up on Linux thus:
```sh
$ sudo iptables -I INPUT -p tcp --dport 55555 -s 202.133.209.92 -j ACCEPT 
$ sudo iptables -A INPUT -p tcp --dport 55555 -j DROP
```
To transfer between machines once you have populated with some data, you have to move the 'uploads' and 'PSOUNDSETS' folders, and to transfer the databse itself, you can use:
```sh
$ mongoexport --collection=pSoundSets --db=Parameterized-Sound-Sets --out=BK/pSoundSets.json
```
to save on one machine, transfer the backup file, and on the other machine:
```sh
$ mongoimport --db Parameterized-Sound-Sets --collection pSoundSets --drop --file BK/pSoundSets.json
```
(--drop removes all previous data so that the database will only contain the imported data.)

License
----

MIT
