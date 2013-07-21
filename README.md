*********************
Mopidy Browser Client
*********************

With Mopidy Browser Client, you can play your music on your computer (or Rapsberry Pi) and remotely control it from a computer, phone, tablet, laptop. From your couch.

This is a responsive html/js/css client especially written for Mopidy, a music server. Responsive, so it works on desktop and mobile browsers. You can browse, search and play albums, artists, playlists, and it has cover art from Last.fm.

[Mopidy](http://www.mopidy.com/) is a music server which can play music from `Spotify (http://www.spotify.com/) or from your hard drive. 

Development
===========

Note: this Git-version is under development! As Mopidy changes, this client changes as well. It tries to follow the Master-branch of Mopidy for now, so update Mopidy as you update the client.


Installation
============

To install Mopidy, check out [the installation docs](http://docs.mopidy.com/en/latest/installation/), [the settings docs](http://docs.mopidy.com/en/latest/settings/) and [even more detailed information](http://docs.mopidy.com/en/latest/modules/frontends/http/#http-frontend). 

If you want to use the web client on a Raspberry Pi, do yourself a favor and use my custom built SD-image: [Pi MusicBox](http://www.woutervanwijk.nl/pimusicbox/).

Quick install
=============

Drop the 'webclient' folder in a folder on your Mopidy-system. Then change the [settings of Mopidy](http://docs.mopidy.com/en/latest/config/) to make it work. 

Example (assuming the webclient is in /opt/webclient):
```code
[http]
enabled = true
hostname = ::
port = 6680
static_dir = /opt/webclient
```

Then point your browser (modern, with websockets: recent versions of Firefox, Chrome, Safari and IE10) to the ip-address and port of your device. e.g. http://192.168.1.5:6680

Security
========

(Note from Mopidy:) Note that the HTTP frontend does not feature any form of user authentication or authorization. Anyone able to access the web server can use the full core API of Mopidy. Thus, you probably only want to make the web server available from your local network or place it behind a web proxy which takes care or user authentication. You have been warned.