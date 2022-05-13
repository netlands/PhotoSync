# Simple Photo Sync

Also known as poor man's tether, a basic camera to PC photo sync application implemented as a small Node-based webserver.

## Problem

Many (older) cameras do not allow the camera to be tethered to your PC while taking pictures. Although you can often connect the camera via a USB cable, you need specialized software or a workaround to review/process the pictures.

I previously used a dedicated tether app for my camera (Lumon DMC-GX8) but after a few years, this app understandably looks to be no longer maintained or supported. I needed an alternative way to review pictures that I had taken on my computer screen to verify the colors and layout.

Workflow: Connect camera to PC > Take picture > Automatically transfer or Review on a PC screen and optionally transfer the picture > Move to the next picture.

One additional requirement for me was the ability to check the layout of the pictures, especially straight lines and centering (product photography). Having an option to overlay a grid and quickly zoom in was a secondary requirement. I also was looking for a quick "one-click" non-destructive way to sort/triage files for further processing (keep, star, discard). 

## Requirements
Node.js

In order to access pictures on a camera's memory card, the camera needs to be connected to your PC and needs to be accessible via Explorer as a drive letter. 

## Installation

    npm install

For the application to work the camera's memory needs to be "mounted" as a drive (USB Mass Storage mode), or you will need to map a drive letter to the camera "MTP device".

I suggest using the MTPdrive (https://www.mtpdrive.com/) application for this purpose.

MTPdrive can automate the process of mapping/assigning a dedicated drive letter to a connected MTP device and optionally start a specific application on connection. 

## Configuration

Configure folder locations in the **config.json** file.

If you use git to pull updates rename config.json to **config.local.json** to keep local defaults between updates.

The config file alows you to set some defaults. 

## Start

Open a terminal windows or command line:

    node app

The application will be accessible in your web browser.
 
    http://localhost:3000
 
To streamline the startup process, use your browser to create an app from the webpage, and create a batch file to start the server and the app. Optionally start the batch file when the camera connects to the PC.
