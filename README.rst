*********************
Mopidy Browser Client
*********************

With Mopidy Browser Client, you can play your music on your computer (or Rapsberry Pi) and remotely control it from a computer, phone, tablet, laptop. From your couch.

This is a responsive html/js/css client especially written for Mopidy, a music server. Responsive, so it works on desktop and mobile browsers. You can browse, search and play albums, artists, playlists, and it has cover art from Last.fm.

`Mopidy <http://www.mopidy.com/>`_ is a music server which can play music from `Spotify <http://www.spotify.com/>`_ or from your hard drive. 

Development
===========

Note: this Git-version is under heavy development! As Mopidy changes, this client changes as well. It tries to follow the development-branch of Mopidy for now, so update Mopidy as you update the client.


Installation
============

If you use an older version of Mopidy, you should use this version:
`0.11.x <https://github.com/woutervanwijk/Mopidy-Webclient/archive/9d69aa7d751e5e429ec4a81edc5592d456757d96.zip>`_

There is another option if you want to use 0.11 with the recent version of the webclient. You can patch the playlists.py file of core (in linux located in  /usr/share/pyshared/mopidy/core or in OSX  /Library/Python/2.7/site-packages/mopidy/core ). You can use `this patch <https://github.com/mopidy/mopidy/commit/2eb9ad710a2acf23fc037ecf992b58e9c12584d6.patch>`_ or you can manually change the function get_playlists to this:

    def get_playlists(self, include_tracks=True):
       futures = [
           b.playlists.playlists for b in self.backends.with_playlists]
       results = pykka.get_all(futures)
       playlists = list(itertools.chain(*results))
       if not include_tracks:
           playlists = [p.copy(tracks=[]) for p in playlists]
       return playlists

To install Mopidy, check out `the installation docs <http://docs.mopidy.com/en/latest/installation/>`_, `the settings docs <http://docs.mopidy.com/en/latest/settings/>`_ and `even more detailed information <http://docs.mopidy.com/en/latest/modules/frontends/http/#http-frontend>`_. 

Quick install
=============

Drop the 'webclient' folder in a folder on your Mopidy-system. Then change the settings.py (in the root directory of the Mopidy code) to make it work. Add a line *mopidy.frontends.http.HttpFrontend* to the FRONTENDS section, and set the *HTTP_SERVER_STATIC_DIR* to point to the folder with the files from the web client.
Then point your browser (modern, with websockets: recent versions of Firefox, Chrome, Opera, and maybe IE10) to the ip-address and port of your device, which you added to the settings.py. e.g. http://192.168.1.5:6680

Security
========

(Note from Mopidy:) As a simple security measure, the web server is by default only available from localhost. To make it available from other computers, change :attr:`mopidy.settings.HTTP_SERVER_HOSTNAME`. Before you do so, note that the HTTP frontend does not feature any form of user authentication or authorization. Anyone able to access the web server can use the full core API of Mopidy. Thus, you probably only want to make the web server available from your local network or place it behind a web proxy which takes care or user authentication. You have been warned.