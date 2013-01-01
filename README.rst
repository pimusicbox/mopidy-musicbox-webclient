*********************
Mopidy Browser Client
*********************

Mopidy is a music server which can play music from `Spotify
<http://www.spotify.com/>`_ or from your local hard drive. 

This is a responsive html/js/css client for Mopidy. Responsive, so it works on desktop and mobile browsers.

Installation

To install Mopidy, check out
`the installation docs <http://docs.mopidy.com/en/latest/installation/>`_ or `the settings docs <http://docs.mopidy.com/en/latest/settings/>`_. 

Quick install

Drop the files from this client in a folder on your Mopidy-system. Then change the settings.py (in the root directory of the Mopidy code) to make it work. Add a line *mopidy.frontends.http.HttpFrontend* to the FRONTENDS section, and set the *HTTP_SERVER_STATIC_DIR* to point to the folder with the files from the web client.