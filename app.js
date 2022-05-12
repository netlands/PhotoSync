const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const chokidar = require('chokidar');
const { exec } = require("child_process");
const fs = require('fs');

//var sourceFolder = '.\\original\\';
//var targetFolder = '.\\copy\\';
//var extension = "jpg";
//var autocopy = true;

// https://github.com/paulmillr/chokidar
// https://github.com/gomfunkel/node-exif
// https://stackabuse.com/executing-shell-commands-with-node-js/
// https://stackoverflow.com/questions/7076958/read-exif-and-determine-if-the-flash-has-fired
// https://stackoverflow.com/questions/23575218/convert-decimal-number-to-fraction-in-javascript-or-closest-fraction
// https://socket.io/get-started/chat
// https://expressjs.com/en/starter/static-files.html
// https://stackoverflow.com/questions/32556463/overlay-grid-on-responsive-image
// https://www.base64-image.de/

// https://syntaxfix.com/question/14577/black-transparent-overlay-on-image-hover-with-only-css
// https://codepen.io/michaelsboost/pen/DEQzoN

let rawdata = fs.readFileSync('config.json');
let config = JSON.parse(rawdata);
let sourceFolder = config.source;
let targetFolder = config.target;
let extension = config.extension;
let autoCopy = config.autocopy;

if (fs.existsSync('config.local.json')) {
	rawdata = fs.readFileSync('config.local.json');
	config = JSON.parse(rawdata);
	sourceFolder = config.source;
	targetFolder = config.target;
	extension = config.extension;
	autoCopy = config.autocopy;
  } else {
	// no local config
  }

const inspector = require('inspector');
// function isInDebugMode() { return inspector.url() !== undefined; }

// Read command line argument
if (inspector.url() !== undefined) {
	console.log("DEBUG MODE");
} else {
	if (process.argv.length >= 3) {
		sourceFolder = process.argv[2];
	}
}

app.use(express.static("."));
const favicon = require('express-favicon');
app.use(favicon(__dirname + '/camera.ico'));

app.get('/', (req, res) => {
	// res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname + '/index.html');
  });
  
  server.listen(3000, () => {
	console.log('listening on *:3000');
  });

  io.on('connection', (socket) => {
	console.log('page accessed');
	socket.on('disconnect', () => {
	  console.log('connection reset');
	});
  socket.on('delete target', (msg) => {
	fs.unlink(targetFile, (err) => {
		if (err) {
		  console.error(err)
		  return
		}
		console.log('deleted file: ' + targetFile);
	  })
  });
  socket.on('delete camera', (msg) => {
	fs.unlink(sourceFile, (err) => {
		if (err) {
		  console.error(err)
		  return
		}
		console.log('deleted file: ' + sourceFile);
	  }) 
  });
  socket.on('copy source', (msg) => {
	fs.copyFileSync(msg, targetFile);
	console.log('Manually copied ' + msg);
  });
  socket.on('sort', (msg) => {
	var path = require('path');
	switch (msg) {
		case "keep" :
			console.log("sort action: " + msg);
			break;
		case "discard" :
			console.log("sort action: " + msg);
			break;
		case "star" :
			console.log("sort action: " + msg);
			break;			
		default :		
	}

	var originalFile = targetFile;
	if (!(autoCopy)) { originalFile = sourceFile; }
	if (!(fs.existsSync(path.join(targetFolder, msg)))) {
		fs.mkdirSync(path.join(targetFolder, msg));
	}	
	fs.renameSync(originalFile, path.join(targetFolder, msg, filename))
		
  }); 
  
});


/*chokidar.watch('.\\original').on('all', (event, path) => {
  console.log(event, path);

	if (event == "add") {
		processFile(path);
	}	
});*/

var watcher = chokidar.watch(sourceFolder, {
  ignored: /[\/\\]\./,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: true
});    

console.log("Watching " + sourceFolder + " for ." + extension + " files" );
console.log("autocopy: " + autoCopy );

var sourceFile, targetFile, filename;

watcher
      .on('change',  function(path) { console.log(" ~ File " + path + " has been changed"); })
      .on('add',  function(path) { console.log(" + File " + path + " has been added"); processFile(path); })
	  .on('unlink',  function(path) { console.log(" - File " + path + " has been deleted"); });
	  // add, change, unlink, addDir, unlinkDir

	  
function processFile(path) {

	sourceFile = path;

	if (getExtension(path).toLowerCase() == extension) {


	if (!(targetFolder.endsWith("\\"))) { targetfolder = targetFolder + "\\"}
	var p = require('path');
	filename = p.parse(path).base;
	var target = targetFolder + filename;
	targetFile = target;

	// File destination.txt will be created or overwritten by default.
	/*fs.copyFile(path, target, (err) => {
	  if (err) throw err;
	  console.log(path + ' was copied to destination');
	});*/
	
	var imageAsBase64 			
	
	if (autoCopy) { 
		fs.copyFileSync(path, target); 		
	} else {
		target = path;	
	}

	imageAsBase64 = "data:image/jpeg;base64, " + fs.readFileSync(target, 'base64');
	// console.log(imageAsBase64);
	io.emit('new photo', imageAsBase64);

	var ExifImage = require('exif').ExifImage;
	var exif = {};
	exif.filename = filename;
	exif.source = sourceFile;
	exif.target = targetFile;
	exif.autocopy = autoCopy;

	try {
		new ExifImage({ image : target }, function (error, exifData) {
			if (error) {
				console.log('Error: '+error.message);
				exif.SS = "";
				exif.F = "";
				exif.ISO = "";
				exif.EV = "";
				exif.flash = "";
				io.emit('new data', exif);				
			} else {
				// console.log(exifData); // Do something with your data!
				exif.SS = fra_to_dec(exifData.exif.ExposureTime);
				exif.F = exifData.exif.FNumber;
				exif.ISO = exifData.exif.ISO;
				exif.EV = exifData.exif.ExposureCompensation;
				exif.flash = flashFired(exifData.exif.Flash);
				io.emit('new data', exif);
			}
		});
	} catch (error) {
		console.log('Error: ' + error.message);
			exif.SS = "";
			exif.F = "";
			exif.ISO = "";
			exif.EV = "";
			exif.flash = "";
			io.emit('new data', exif);
	}	


	/* exec("notepad.exe " + target, 1, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
			return;
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
			return;
		}
		console.log(`stdout: ${stdout}`); 
	}); */
	
}	
}


function flashFired(exifValue) {
	//check if the number is even
	if(exifValue % 2 == 0) {
		return("did not fire");
	}

	// if the number is odd
	else {
		return("fired");
	}	
}	


function fra_to_dec(value){
	num = value;
    var test=(String(num).split('.')[1] || []).length;
    var num=(num*(10**Number(test)))
    var den=(10**Number(test))
    function reduce(numerator,denominator){
        var gcd = function gcd(a,b) {
            return b ? gcd(b, a%b) : a;
        };
        gcd = gcd(numerator,denominator);
        return [numerator/gcd, denominator/gcd];
    }
	if (reduce(num,den)[0] == "1") {
		return (reduce(num,den)[0]+"/"+reduce(num,den)[1])
	} else {
		return(Math.round(value * 1000) / 1000)
	}
    
}


// https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
function getExtension(path) {
    var basename = path.split(/[\\/]/).pop(),  // extract file name from full path ...
                                               // (supports `\\` and `/` separators)
        pos = basename.lastIndexOf(".");       // get last position of `.`

    if (basename === "" || pos < 1)            // if file name is empty or ...
        return "";                             //  `.` not found (-1) or comes first (0)

    return basename.slice(pos + 1);            // extract extension ignoring `.`
}

