# PiPer
Adds Picture in Picture functionality to Safari for YouTube, Netflix, Amazon Video, Twitch, and more!

<img src="/promo/Promo-shot.png" alt="Screenshot of PiPer in action" width="512" />

## Contents
- [Features](#features)
- [Installation](#installation)
- [Supported sites](#supported-sites)
- [Changelog](#changelog)
- [Development](#development)
  * [Building](#building)
    + [Prerequisites](#prerequisites)
    + [Build tools](#build-tools)
    + [Steps](#steps)
  * [Supporting a new site](#supporting-a-new-site)
- [Acknowledgements](#acknowledgements)

## Features
* Adds a dedicated Picture in Picture button to the video player of [supported sites](#supported-sites)
* Button integrates seamlessly with the player including hover effects and tooltips
* Supports closed captions in Picture and Picture mode
* Free and open source

## Installation
Get the latest release from the [Safari Extension Gallery](https://safari-extensions.apple.com/details/?id=com.amarcus.safari.piper-BQ6Q24MF9X)

<sub>...or live life on the edge with the latest [development build](https://rawgit.com/amarcu5/PiPer/develop/out/PiPer.safariextz) (IMPORTANT: these builds do not update automatically!)</sub>

## Supported sites
* [Amazon Video](http://www.amazon.com/PrimeVideo)
* [CollegeHumor](http://www.collegehumor.com)
* [CuriosityStream](http://www.curiositystream.com)
* [Eurosport player](http://www.eurosportplayer.com)
* [Giant Bomb](http://www.giantbomb.com)
* [Hulu](http://www.hulu.com)
* [LittleThings](http://www.littlethings.com)
* [Mashable](http://www.mashable.com)
* [Metacafe](http://www.metacafe.com)
* [Mixer](http://mixer.com)
* [MLB](http://www.mlb.tv)
* [Netflix](http://www.netflix.com)
* [OCS](http://www.ocs.fr)
* [Openload](http://www.openload.co)
* [Periscope](http://www.periscope.tv)
* [Plex](http://www.plex.tv)
* [Seznam Zprávy](http://www.seznam.cz/zpravy)
* [Stream.cz](http://www.stream.cz)
* [Streamable](http://streamable.com)
* [The Onion](http://www.theonion.com)
* [Twitch](http://www.twitch.tv)
* [Udemy](http://www.udemy.com)
* [Vevo](http://www.vevo.com)
* [Vice](http://www.vice.com)
* [Vid.me](http://www.vid.me)
* [Video Aktálně](http://video.aktualne.cz)
* [VRV](http://www.vrv.co)
* [YouTube](http://www.youtube.com)

## Changelog
You can find information about releases [here](https://github.com/amarcu5/PiPer/releases)

## Development

### Building

#### Prerequisites
* Mac running macOS 10.12 Sierra or later

#### Build tools
For convenience the following Node.js tools have been packaged with [nexe](https://github.com/nexe/nexe) and included in this repository:
* [csso](https://github.com/css/csso) (3.1.1) for compressing CSS
* [svgo](https://github.com/svg/svgo) (0.7.2) for compressing SVG images
* [xarjs](https://github.com/robertknight/xar-js) (0.2.0) for packaging Safari extension
* [google-closure-compiler-js](https://github.com/google/closure-compiler-js) (20170806.0.0) for compiling JavaScript

However it is recommended to install the latest versions with [Node.js](https://nodejs.org):
```Shell
npm install -g csso-cli
npm install -g svgo
npm install -g xar-js
npm install -g google-closure-compiler-js
```

Additionally a reimplementation of the utility PlistBuddy used for automated build numbering is [provided](https://github.com/amarcu5/PiPer/tree/master/build-tools/) but it is advisable to download the original as part of [Xcode](https://itunes.apple.com/gb/app/xcode/id497799835?mt=12) or from [Apple's Command Line Tools](https://developer.apple.com/download/) 

#### Steps
1. Clone the repository
2. Run `make.sh` 
    1. By default this builds the unoptimized and unpackaged development version into the `./out/` directory that can then be installed using Safari's Extension Builder
    2. Alternatively run `./make.sh -p release` to build the optimized and packaged release version (note that packaging requires a private key)

### Supporting a new site
If we wanted to support `example.com` with the source:
```HTML
<div class="video-container">
  <video src="blob:http://example.com/342b3a13-c892-54ec-84f6-281579de03ab"></video>
  <div class="video-captions">
    Example caption
  </div>
  <div class="video-controls">
    <button class="control button-play">Play</button>
    <button class="control button-fullscreen">Fullscreen</button>
  </div>
</div>
```
We would start by adding a new entry in the `resources` object in `main.js`:
```JavaScript
const resources = {
  ...
  'example' : {
    buttonParent: function() {
      // Returns the element that will contain the button
      return document.querySelector('.video-controls');
    },
    videoElement: function() {
      // Returns the video element
      return document.querySelector('.video-container video');
    },
    
    // Optional
    captionElement: function() {
      // Returns the element that contains the video captions
      return document.querySelector('.video-captions');
    },
  },
};
```
We also need to update the extension permissions to support the new site by editing `./src/Info.plist`:
```XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Permissions</key>
  <dict>
    <key>Website Access</key>
    <dict>
      ...
      <key>Allowed Domains</key>
      <array>
        ...
        <string>example.com</string>
        <string>*.example.com</string>
      </array>
    </dict>
  </dict>
</dict>
</plist>
```
We might want to style the button so that it integrates with the page better:
```JavaScript
const resources = {
  ...
  'example' : {
    ...
    // Assign a CSS class
    buttonClassName: 'control',
    // Scale the button
    buttonScale: 0.5,
    // Apply custom CSS styles
    buttonStyle: /** CSS */ (`
      /* Declaring CSS this way ensures it gets optimized when the extension is built */
      cursor: pointer;
      opacity: 0.5;
    `),
    // Apply a custom CSS hover style
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  },
};
```
For more examples, please see the [source](https://github.com/amarcu5/PiPer/tree/master/src/scripts)

## Acknowledgements
* [Pied PíPer](https://github.com/JoeKuhns/PiedPiPer.safariextension) for the original inspiration and the Netflix icon
* [Google](https://github.com/google/material-design-icons) for the Picture in Picture icon
