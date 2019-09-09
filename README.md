<p align="center">
  <img src="/promo/Icon-512.png" alt="PiPer logo" width="200" />
</p>

<h1 align="center">
  PiPer
</h1>

<p align="center">
  PiPer is the browser extension to watch video Picture in Picture.
</p>

<p align="center">
  <a href="#installation">Install</a> · 
  <a href="https://paypal.me/adampmarcus">Donate</a> · 
  <a href="https://github.com/amarcu5/PiPer/issues">Report an issue</a>
</p>

***

## Contents
- [Features](#features)
- [Installation](#installation)
  * [Safari](#safari)
  * [Chrome](#chrome)
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
* Supports closed captions in Picture and Picture mode (Safari only)
* Supports Safari and Chrome
* Free and open source

## Installation
### Safari
Install from the [Mac App Store](https://itunes.apple.com/app/id1421915518?mt=12&ls=1) by clicking "Get"  
<sub>(The [Safari Extension Gallery](https://safari-extensions.apple.com/details/?id=com.amarcus.safari.piper-BQ6Q24MF9X) is now [deprecated](https://developer.apple.com/documentation/safariextensions))</sub>
### Chrome
Install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/piper/jbjleapidaddpbncgofepljddfeoghkc) by clicking "Add to Chrome"
  
<sub>...or live life on the edge with the latest [development build](https://github.com/amarcu5/PiPer/tree/develop-1.0.x/out) (IMPORTANT: these builds do not update automatically!)</sub>

## Supported sites
* [9Now](http://www.9now.com.au)
* [Amazon Video](http://www.amazon.com/PrimeVideo)
* [Česká televize](http://www.ceskatelevize.cz)
* [CollegeHumor](http://www.collegehumor.com)
* [Crunchyroll](http://www.crunchyroll.com)
* [CuriosityStream](http://www.curiositystream.com)
* [Eurosport player](http://www.eurosportplayer.com)
* [FuboTV](http://www.fubo.tv)
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
* [PBS](http://www.pbs.org)
* [Periscope](http://www.periscope.tv)
* [Plex](http://www.plex.tv)
* [Seznam Zprávy](http://www.seznam.cz/zpravy)
* [Stream.cz](http://www.stream.cz)
* [Streamable](http://streamable.com)
* [TED](http://www.ted.com)
* [The Onion](http://www.theonion.com)
* [Twitch](http://www.twitch.tv)
* [Udemy](http://www.udemy.com)
* [Vevo](http://www.vevo.com)
* [Vice](http://www.vice.com)
* [Vid.me](http://www.vid.me)
* [Video Aktálně](http://video.aktualne.cz)
* [Vier](http://www.vier.be)
* [Vijf](http://www.vijf.be)
* [VK](http://www.vk.com)
* [VRV](http://www.vrv.co)
* [VRT NU](http://www.vrt.be/vrtnu/)
* [Yelo Play](http://www.yeloplay.be)
* [YouTube](http://www.youtube.com)
* [Zes](http://www.zes.be)

## Changelog
You can find information about releases [here](https://github.com/amarcu5/PiPer/releases)

## Development

### Building

#### Prerequisites
* Operating system
  * macOS: 10.12 Sierra or newer (required to build Safari extension)
  * Windows: Vista or newer using [Cygwin](https://cygwin.com/install.html)
  * Linux: 64-bit Ubuntu 14.04+, Debian 8+, openSUSE 13.3+, or Fedora Linux 24+
* Software
  * [Node.js](https://nodejs.org)
  * [Java](https://www.java.com/en/download/) (Windows only)


#### Build tools
The following build tools are used to build the extension:
* [csso](https://github.com/css/csso) for compressing CSS
* [svgo](https://github.com/svg/svgo) for compressing SVG images
* [xarjs](https://github.com/robertknight/xar-js) for packaging Safari legacy extension
* [google-closure-compiler](https://github.com/google/closure-compiler) for compiling JavaScript

These can be installed by executing the following command:
```Shell
npm install -g csso-cli svgo xar-js google-closure-compiler
```

#### Steps
1. Clone the repository
2. Run `make.sh` 
    1. By default this builds the unoptimized and unpackaged development version for all targets into the `./out/` directory
    2. Alternatively:
       * `./make.sh -p release` to build the optimized release versions for all targets
       * `./make.sh -p release -t chrome` to build the optimized release version for the Chrome browser
       * `./make.sh -h` to see the full list of options

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
We would start by adding a new file `example.js`  in the [resources directory](https://github.com/amarcu5/PiPer/tree/master/src/common/scripts/resources):
```JavaScript
export const domain = 'example';

export const resource = {
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
};
```
We might want to style the button so that it integrates with the page better:
```JavaScript
export const resource = {
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
};
```
For more examples, please see the [source](https://github.com/amarcu5/PiPer/tree/master/src/)

## Acknowledgements
* [Pied PíPer](https://github.com/JoeKuhns/PiedPiPer.safariextension) for the original inspiration
