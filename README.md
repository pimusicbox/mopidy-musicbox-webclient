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

Drop the 'webclient' folder in a folder on your Mopidy-system. Then change the settings.py (in the root directory of the Mopidy code) to make it work. 
Add a line *mopidy.frontends.http.HttpFrontend* to the FRONTENDS section of your settings.py in the .config directory, and set the *HTTP_SERVER_STATIC_DIR* to point to the folder with the files from the web client.

Something like this:
```python
FRONTENDS = (
    'mopidy.frontends.mpd.MpdFrontend',
    'mopidy.frontends.http.HttpFrontend',
    'mopidy.frontends.lastfm.LastfmFrontend',
    'mopidy.frontends.mpris.MprisFrontend',
)
HTTP_SERVER_HOSTNAME = u'0.0.0.0'
HTTP_SERVER_PORT = 6680
HTTP_SERVER_STATIC_DIR = u'/opt/webclient'
```

Then point your browser (modern, with websockets: recent versions of Firefox, Chrome, Safari and IE10) to the ip-address and port of your device, which you added to the settings.py. e.g. http://192.168.1.5:6680

Security
========

(Note from Mopidy:) Note that the HTTP frontend does not feature any form of user authentication or authorization. Anyone able to access the web server can use the full core API of Mopidy. Thus, you probably only want to make the web server available from your local network or place it behind a web proxy which takes care or user authentication. You have been warned.