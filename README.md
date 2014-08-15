# OriginateNY Music Server Information

To connect to the raspberry pi, ask someone in the office for login credentials.

## Mopidy
See documentation for [Mopidy](http://docs.mopidy.com/).  Mopidy is running on port 6681.

### Startup Script
The script in `etc/init.d/mopidy` runs mopidy on startup.  It also updates the webclient by pulling from the master branch of this repository.

### Configuration
Mopidy's configuration file is located in `/home/pi/.config/mopidy/mopidy.conf`.  (The startup script uses a symbolic link to this file at `/etc/mopidy/mopidy.conf`.  To edit this file, you can run `mopconfig`.  After editing, you should restart mopidy with `sudo service mopidy restart`.  This configuration file contains account information for Spotify, Dirble, Soundcloud, and other services.  It also specifies the location of the webclient to serve on port 6681.

### Webclient
Mopidy serves the webclient at `/opt/Mopidy-MusicBox-Webclient`.  The client uses websocket connections to control mopidy.  See the [documentation for Mopidy's JavaScript library](http://docs.mopidy.com/en/latest/api/js/).

#### Making Changes
To make changes to the webclient, simply merge changes into master.  The updates will be automatically deployed to the music server at 6am the following day.

#### Setting Up Development Environment on OS X
Follow Mopidy's [installation instructions for OS X](http://docs.mopidy.com/en/latest/installation/osx/).  You should also install the extensions mopidy-soundcloud, mopidy-dirble, mopidy-scrobbler, and mopidy-spotify, availabe via the Mopidy Homebrew tap.  Use a `mopidy.conf` similar to the one on the music server.  Use different Spotify credentials to avoid cutting off the music server while running locally.  Point `static_dir` under `[http]` to your checked out version of the webclient in this repository. 

## NginX
[NginX](http://nginx.com/) is running as a reverse proxy server on ports 80 and 6680.  It forwards incoming HTTP requests on port 80 and incoming websocket connections on port 6680 to mopidy on port 6681.  Note that the music server is using NginX version 1.6, built from source, because previous versions (including 1.4, the latest version available with `apt-get`) don't support websocket proxying.

Currently the reverse proxy server doesn't do anything fancy.  There is a Google OAuth proxy set up on port 4480 (see the startup script at `/etc/init.d/google-oauth`, which uses the `go` utility `google-oauth-proxy` in `/home/gocode/bin`.  The NginX server forwards HTTPS connections on port 443 to this proxy, which authenticates the user and forwards subsequent requests upstream to mopidy on port 6681.  However, logging in will not work until the raspberry pi has an FQDN, which requires us to set up port forwarding on the wireless router.  Once port forwarding is set up, the redirect url in the startup script should be updated to the music server's FQDN.  Still not sure how to display the Google credentials on the client.  For now, HTTPS connections should not be used.

### Startup
NginX runs on startup - see `etc/init.d/nginx`.

### Configuration
The NginX configuration is located at `/etc/nginx/conf.d/mopidy.conf`.  After making changes, restart NginX with `sudo service nginx restart`.

## Miscellaneous

### Daily Reboot
The server reboots every morning at 6am.  To change or remove this behavior, edit the cron job with `sudo crontab -e`.

### Internet
Internet settings are located at `/etc/network/interfaces`.  Currently the music server does not reserve a static IP, but it reserves the hostname `music` and accepts connections at `music.local`.  To change this, edit `/etc/hostname` as well as the `127.0.1.1` entry of `/etc/hosts`, and then run `/etc/init.d/hostname.sh` and reboot.

If the internet is down, the music server will try reconnecting to the network.  The script `/usr/local/bin/checkwifi.sh` is run every five minutes as a cron job.  It does this by pinging the Originate Airport Extreme at 192.168.2.86.  If the router's IP changes, this script should be updated.

*************************
# Mopidy MusicBox Webclient
*************************

With Mopidy MusicBox Webclient, you can play your music on your computer (Rapsberry Pi) and remotely control it from a computer, phone, tablet, laptop. From your couch.

This is a responsive html/js/css client especially written for Mopidy, a music server. Responsive, so it works on desktop and mobile browsers. You can browse, search and play albums, artists, playlists, and it has cover art from Last.fm.

[Mopidy](http://www.mopidy.com/) is a music server which can play music from Spotify, Google Music, SoundCloud, etc or from your hard drive. 

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

At least on Raspbian with Mopidy installed from apt.mopidy.com, the 'webclient/mopidy' symbolic link should be re-linked to '/usr/share/mopidy/mopidy/http/data'. Another missing file/symbolic link is 'webclient/js/radiostations.js', which can be copied from https://github.com/woutervanwijk/Pi-MusicBox/tree/master/filechanges/boot/config.

Then point your browser (modern, with websockets: recent versions of Firefox, Chrome, Safari and IE10) to the ip-address and port of your device. e.g. http://192.168.1.5:6680

Security
========

(Note from Mopidy:) Note that the HTTP frontend does not feature any form of user authentication or authorization. Anyone able to access the web server can use the full core API of Mopidy. Thus, you probably only want to make the web server available from your local network or place it behind a web proxy which takes care or user authentication. You have been warned.
