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

<sub>...or live life on the edge with the latest [development build](https://rawgit.com/amarcu5/PiPer/develop/out/PiPer-safari-legacy.safariextz) (IMPORTANT: these builds do not update automatically!)</sub>

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
* Mac running macOS 10.12 Sierra or later
* [Node.js](https://nodejs.org)

#### Build tools
The following build tools are used to build the extension:
* [csso](https://github.com/css/csso) for compressing CSS
* [svgo](https://github.com/svg/svgo) for compressing SVG images
* [xarjs](https://github.com/robertknight/xar-js) for packaging Safari legacy extension
* [google-closure-compiler-js](https://github.com/google/closure-compiler-js) for compiling JavaScript

These can be installed by executing the following command:
```Shell
npm install -g csso-cli
npm install -g svgo
npm install -g xar-js
npm install -g google-closure-compiler-js
```

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
* [Pied PíPer](https://github.com/JoeKuhns/PiedPiPer.safariextension) for the original inspiration and the Netflix icon
