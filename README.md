# Simple Photo Sync
 Simple camera to PC photo sync application implemented as a small Node based webserver.
 ## Requirements
 In order to access pictures on a camera's memory the camera needs to be connected to your PC and needs to be accessible via Explorer.  
 The camera's memory either needs to be "mounted" as a drive (mass storage mode), or you will need to map a drive letter to the camera "MTP device".  
 I suggest using the MTPDrive (https://www.mtpdrive.com/) application for this purpose.
 ## Installation
 > npm install
 ## Configuration
 Configure folder locations in the config.json file.
 ## Start
 To start the application use the included batch file (edit the folder/file locations if needed).
 Or use the command line:  
 > npm start  
 
 The application will be accessible in your web browser.  
 > http://localhost:3000
 
 
