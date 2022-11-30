const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const chokidar = require("chokidar");
const { exec } = require("child_process");
const fs = require("fs");

const ExifReader = require("exifreader");

//var sourceFolder = '.\\original\\';
//var targetFolder = '.\\copy\\';
//var extension = "jpg";
//var autocopy = true;

// https://github.com/paulmillr/chokidar
// https://github.com/mattiasw/ExifReader (Replaced https://github.com/gomfunkel/node-exif)
// camera specific exif https://exiftool.org/TagNames/Panasonic.html https://exiftool.org/TagNames/EXIF.html https://exiv2.org/tags-panasonic.html
// https://stackabuse.com/executing-shell-commands-with-node-js/
// https://stackoverflow.com/questions/7076958/read-exif-and-determine-if-the-flash-has-fired
// https://stackoverflow.com/questions/23575218/convert-decimal-number-to-fraction-in-javascript-or-closest-fraction
// https://socket.io/get-started/chat
// https://expressjs.com/en/starter/static-files.html
// https://www.base64-image.de/

// in case additional server side image processing or conversions are needed https://sharp.pixelplumbing.com/

const path = require("path");

let rawdata = fs.readFileSync(path.join(__dirname, "config.json"));
let config = JSON.parse(rawdata);
let sourceFolder = checkFolderFormat(config.source);
let targetFolder = checkFolderFormat(config.target);
let extension = config.extension;
let autoCopy = config.settings.autocopy;

let remoteAddress = "127.0.0.1";
let serverPort = 3000;

let exepath = __dirname.toString();
console.log(exepath);
var regExp = /(.+\\)resources\\.+/g;
if (regExp.test(exepath)) {
  if (exepath.match(regExp).length > 0) {
    match = regExp.exec(exepath);
    exepath = match[1];
  }
}

function checkFolderFormat(folderIn) {
  if (!folderIn.endsWith("\\")) {
    folderIn = folderIn + "\\";
  }
  return folderIn;
}

function readConfig(configFile) {
  rawdata = fs.readFileSync(configFile);
  config = JSON.parse(rawdata);
  sourceFolder = config.source;
  targetFolder = config.target;
  extension = config.extension;
  autoCopy = config.settings.autocopy;
}

function writeConfig(configFile, configData) {
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, configData);
  }
}

function getReferenceFile(referencepath) {
  refFile = referencepath; // 'reference.jpg'
  if (fs.existsSync(refFile)) {
    imageAsBase64 =
      "data:image/jpeg;base64," + fs.readFileSync(refFile, "base64");
    io.emit("reference", imageAsBase64);
  }
}

const inspector = require("inspector");
// function isInDebugMode() { return inspector.url() !== undefined; }

let isApp = false;

// Read command line argument
if (inspector.url() !== undefined) {
  console.log("DEBUG MODE");
} else {
  if (isElectron()) {
    isApp = true;
    console.log("Electron");
    appConfig = path.join(exepath, "config.local.json");
    console.log(exepath);
    if (fs.existsSync(appConfig)) {
      readConfig(appConfig);
      console.log("Read settings from " + appConfig);
    } else {
      console.log(appConfig);
      writeConfig(appConfig, rawdata);
    }
  } else {
    isApp = false;
    if (fs.existsSync("config.local.json")) {
      readConfig(path.join(__dirname, "config.local.json"));
      console.log(
        "Read settings from " + path.join(__dirname, "config.local.json")
      );
    } else {
      // no local config
      writeConfig(path.join(__dirname, "config.local.json"), rawdata);
    }
    if (process.argv.length >= 3) {
      sourceFolder = process.argv[2];
    }
  }
}

app.use(express.static("."));
const favicon = require("express-favicon");
app.use(favicon(__dirname + "/SimplePhotoSync.ico"));

app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' 'unsafe-inline' http://localhost:" +
      serverPort +
      " https://ajax.googleapis.com https://code.getmdl.io https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdnjs.com https://code.jquery.com; font-src 'self' fonts.googleapis.com fonts.gstatic.com; style-src * 'self' 'unsafe-inline'; img-src 'self' 'unsafe-inline' data:;"
  );
  return next();
});

app.get("/", (req, res) => {
  // res.send('<h1>Hello world</h1>');
  res.sendFile(__dirname + "/index.html");
});

app.get("/test/", (req, res) => {
  res.sendFile(__dirname + "/test/test.html");
});



server.listen(serverPort, () => {
  remoteAddress = getServerIp();
  console.log(
    "listening on http://localhost:" +
      serverPort +
      " and http://" +
      remoteAddress +
      ":" +
      serverPort
  );
});

function getServerIp() {
  var os = require("os");
  var ifaces = os.networkInterfaces();
  var values = Object.keys(ifaces).map(function (name) {
    return ifaces[name];
  });
  values = [].concat.apply([], values).filter(function (val) {
    return val.family == "IPv4" && val.internal == false;
  });
  for (let i = 0; i < values.length; i++) {
    // console.log(values[i].address);
    if (!values[i].address.startsWith("172")) {
      return values[i].address;
    }
  }
  // return values.length ? values[1].address : '0.0.0.0';
}

io.on("connection", (socket) => {
  console.log("page accessed");
  socket.on("disconnect", () => {
    console.log("connection reset");
  });

  socket.on("getconfig", (msg) => {
    config.remoteaddress = remoteAddress;
    io.emit("config", config);
  });

  socket.on("getreference", (msg) => {
    getReferenceFile(path.join(exepath, "reference.jpg"));
  });

  socket.on("getexepath", (msg) => {
    io.emit("exepath", exepath);
  });

  socket.on("settargetfolder", (msg) => {
    targetFolder = checkFolderFormat(msg);
  });

  socket.on("setsourcefolder", (msg) => {
    watcher.unwatch(sourceFolder);
    sourceFolder = checkFolderFormat(msg);
    watcher.add(sourceFolder);
  });

  socket.on("setconfig", (msg) => {
    //console.log(msg);
    targetFolder = msg.target;
    extension = msg.extension;
    autoCopy = msg.settings.autocopy;
    watcher.unwatch(sourceFolder);
    sourceFolder = msg.source;
    watcher.add(sourceFolder);
    console.log("Now watching " + sourceFolder);
    console.log("autocopy: " + autoCopy);
    msg.remoteaddress = remoteAddress;
    io.emit("config", msg);
  });

  socket.on("updateconfig", (msg) => {
    console.log("Saved setting to " + path.join(exepath, "config.local.json"));
    fs.writeFileSync(
      path.join(exepath, "config.local.json"),
      JSON.stringify(msg, null, 2)
    );
  });

  socket.on("delete target", (msg) => {
    fs.unlink(targetFile, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("deleted file: " + targetFile);
    });
  });

  socket.on("delete camera", (msg) => {
    fs.unlink(sourceFile, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("deleted file: " + sourceFile);
    });
  });

  socket.on("copy source", (msg) => {
    fs.copyFileSync(msg, targetFile);
    console.log("Manually copied " + msg);
  });

  socket.on("sort", (msg) => {
    var path = require("path");
    switch (msg) {
      case "keep":
        console.log("sort action: " + msg);
        break;
      case "discard":
        console.log("sort action: " + msg);
        msg = "trash"; // for folder name
        break;
      case "star":
        console.log("sort action: " + msg);
        msg = "starred"; // for folder name
        break;
      default:
    }

    if (!fs.existsSync(path.join(targetFolder, msg))) {
      fs.mkdirSync(path.join(targetFolder, msg));
    }

    if (!autoCopy) {
      // COPY source
      fs.copyFileSync(sourceFile, path.join(targetFolder, msg, filename));
    } else {
      // MOVE copy
      fs.renameSync(targetFile, path.join(targetFolder, msg, filename));
    }
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
  awaitWriteFinish: true,
});

console.log("Watching " + sourceFolder + " for ." + extension + " files");
console.log("autocopy: " + autoCopy);

var sourceFile, targetFile, filename;

watcher
  .on("change", function (path) {
    console.log(" ~ File " + path + " has been changed");
  })
  .on("add", function (path) {
    console.log(" + File " + path + " has been added");
    io.emit("ping", "new");
    processFile(path);
  })
  .on("unlink", function (path) {
    console.log(" - File " + path + " has been deleted");
  });
// add, change, unlink, addDir, unlinkDir

function processFile(path) {
  sourceFile = path;

  if (getExtension(path).toLowerCase() == extension) {
    if (!targetFolder.endsWith("\\")) {
      targetfolder = targetFolder + "\\";
    }
    var p = require("path");
    filename = p.parse(path).base;
    var target = targetFolder + filename;
    targetFile = target;

    // File destination.txt will be created or overwritten by default.
    /*fs.copyFile(path, target, (err) => {
	  if (err) throw err;
	  console.log(path + ' was copied to destination');
	});*/

    var imageAsBase64;

    if (autoCopy) {
      fs.copyFileSync(path, target);
    } else {
      target = path;
    }

    var sourceType = "jpeg";
    imageAsBase64 =
      "data:image/" +
      sourceType +
      ";base64," +
      fs.readFileSync(target, "base64");
    // console.log(imageAsBase64);
    io.emit("new photo", imageAsBase64);

    var exif = {};
    exif.filename = filename;
    exif.source = sourceFile;
    exif.target = targetFile;
    exif.autocopy = autoCopy;

    try {
      const tags = ExifReader.load(fs.readFileSync(target));
      // console.log(tags);
      // console.log(tags['DateTimeOriginal'].description);
      exif.SS = tags["ExposureTime"].description;
      exif.F = tags["FNumber"].description;
      exif.ISO = tags["ISOSpeedRatings"].description;
      exif.EV = tags["ExposureBiasValue"].description;
      exif.mode = getMode(tags["ExposureProgram"].value);
      exif.flash = flashFired(tags["Flash"].description);
      exif.WB = tags["WhiteBalance"].description.toString().split(" ")[0];
      exif.ratio = ratio(tags["Image Width"].value, tags["Image Height"].value);
      io.emit("new data", exif);
    } catch (error) {
      console.log("No exif data"); // error.message
      exif.SS = "";
      exif.F = "";
      exif.ISO = "";
      exif.EV = "";
      exif.flash = "";
      exif.mode = "";
      exif.WB = "";
      exif.ratio = "";
      io.emit("new data", exif);
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

function getMode(exifValue) {
  /* 1 = Manual
	2 = Program AE
	3 = Aperture-priority AE
	4 = Shutter speed priority AE */
  switch (exifValue) {
    case 1:
      mode = "M";
      break;
    case 2:
      mode = "iA";
      break;
    case 3:
      mode = "A";
      break;
    case 4:
      mode = "S";
      break;
    default:
      mode = exifValue;
  }
  return mode;
}

function flashFired(exifValue) {
  answer = exifValue.toString().split(",")[0];
  return answer;
  /*
	//check if the number is even
	if(exifValue % 2 == 0) {
		return("did not fire");
	}

	// if the number is odd
	else {
		return("fired");
	} */
}

function fra_to_dec(value) {
  num = value;
  var test = (String(num).split(".")[1] || []).length;
  var num = num * 10 ** Number(test);
  var den = 10 ** Number(test);
  function reduce(numerator, denominator) {
    var gcd = function gcd(a, b) {
      return b ? gcd(b, a % b) : a;
    };
    gcd = gcd(numerator, denominator);
    return [numerator / gcd, denominator / gcd];
  }
  if (reduce(num, den)[0] == "1") {
    return reduce(num, den)[0] + "/" + reduce(num, den)[1];
  } else {
    return Math.round(value * 1000) / 1000;
  }
}

function gcd($a, $b) {
  return $a % $b ? gcd($b, $a % $b) : $b;
}
function ratio($x, $y) {
  $gcd = gcd($x, $y);
  return $x / $gcd + ":" + $y / $gcd;
}

// https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
function getExtension(path) {
  var basename = path.split(/[\\/]/).pop(), // extract file name from full path ...
    // (supports `\\` and `/` separators)
    pos = basename.lastIndexOf("."); // get last position of `.`

  if (basename === "" || pos < 1)
    // if file name is empty or ...
    return ""; //  `.` not found (-1) or comes first (0)

  return basename.slice(pos + 1); // extract extension ignoring `.`
}

var folderMissing = false;
var checkInterval = 10000;

// check if watched folder is still available
setInterval(function () {
  if (!fs.existsSync(sourceFolder)) {
    if (!folderMissing) {
      console.log("Source location is not accesible!");
    }
    io.emit("missing sourcefolder", "");
    watcher.unwatch(sourceFolder);
    folderMissing = true;
    checkInterval = 5000;
  } else {
    if (folderMissing) {
      watcher.add(sourceFolder);
      folderMissing = false;
      console.log("Source location is available!");
      io.emit("folder is back", "");
      checkInterval = 10000;
    }
  }
}, checkInterval);

function isElectron() {
  // Renderer process
  if (
    typeof window !== "undefined" &&
    typeof window.process === "object" &&
    window.process.type === "renderer"
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== "undefined" &&
    typeof process.versions === "object" &&
    !!process.versions.electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === "object" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.indexOf("Electron") >= 0
  ) {
    return true;
  }

  return false;
}
