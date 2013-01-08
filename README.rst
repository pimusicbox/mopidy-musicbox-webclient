*********************
Mopidy Browser Client
*********************

This is a responsive html/js/css client for Mopidy. Responsive, so it works on desktop and mobile browsers.

`Mopidy <http://www.mopidy.com/>`_ is a music server which can play music from `Spotify <http://www.spotify.com/>`_ or from your local hard drive. 

Development
===========

Note: this Git-version is under heavy development! As Mopidy changes, this client changes as well. It tries to follow the development-branch of Mopidy for now, so update Mopidy as you update the client.
If you use older versions of Mopidy, you can try a Zip-file with the correct version.


Installation
============

To install Mopidy, check out `the installation docs <http://docs.mopidy.com/en/latest/installation/>`_, `the settings docs <http://docs.mopidy.com/en/latest/settings/>`_ and `even more detailed information <http://docs.mopidy.com/en/latest/modules/frontends/http/#http-frontend>`_. 

Quick install
=============

Drop the 'webclient' folder in a folder on your Mopidy-system. Then change the settings.py (in the root directory of the Mopidy code) to make it work. Add a line *mopidy.frontends.http.HttpFrontend* to the FRONTENDS section, and set the *HTTP_SERVER_STATIC_DIR* to point to the folder with the files from the web client.
Then point your browser (modern, with websockets: recent versions of Firefox, Chrome, Opera, and maybe IE10) to the ip-address and port of your device, which you added to the settings.py. e.g. http://192.168.1.5:6680

Security
========

(Note from Mopidy:) As a simple security measure, the web server is by default only available from localhost. To make it available from other computers, change :attr:`mopidy.settings.HTTP_SERVER_HOSTNAME`. Before you do so, note that the HTTP frontend does not feature any form of user authentication or authorization. Anyone able to access the web server can use the full core API of Mopidy. Thus, you probably only want to make the web server available from your local network or place it behind a web proxy which takes care or user authentication. You have been warned.