# PiPer
Adds Picture in Picture functionality to Safari for YouTube, Netflix, Amazon Video, Twitch, and more!

<img src="/promo/Promo-shot.png" alt="Screenshot of PiPer in action" width="512" />

## Installation

Get the latest release from the [Safari Extension Gallery](https://safari-extensions.apple.com/details/?id=com.amarcus.safari.piper-BQ6Q24MF9X)

<sub>...or live life on the edge with the latest [developer build](https://rawgit.com/amarcu5/PiPer/develop/out/PiPer.safariextz) (IMPORTANT: these builds do not update automatically!)</sub>

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
* [Netflix](http://www.netflix.com)
* [OCS](http://www.ocs.fr)
* [Openload](http://www.openload.co)
* [Plex](http://www.plex.tv)
* [Streamable](http://streamable.com)
* [The Onion](http://www.theonion.com)
* [Twitch](http://www.twitch.tv)
* [Udemy](http://www.udemy.com)
* [Vevo](http://www.vevo.com)
* [Vice](http://www.vice.com)
* [Vid.me](http://www.vid.me)
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
    2. Alternatively run `./make.sh -p release` to build the optimized and packaged release version (note that this will be unsigned without a private key)

## Acknowledgements
* [Pied PíPer](https://github.com/JoeKuhns/PiedPiPer.safariextension) for the original inspiration and the Netflix icon
* [Google](https://github.com/google/material-design-icons) for the Picture in Picture icon
