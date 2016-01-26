*************************
Mopidy-MusicBox-Webclient
*************************

.. image:: https://img.shields.io/pypi/v/Mopidy-MusicBox-Webclient.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-MusicBox-Webclient/
    :alt: Latest PyPI version

.. image:: https://img.shields.io/pypi/dm/Mopidy-MusicBox-Webclient.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-MusicBox-Webclient/
    :alt: Number of PyPI downloads

With Mopidy MusicBox Webclient, you can play your music on your computer (`Rapsberry Pi <http://www.raspberrypi.org/>`_) and remotely control it using your computer, tablet or phone.

This is a responsive webclient especially written for Mopidy, a music server. Responsive, so it works on desktop and mobile browsers. You can browse, search and play albums, artists, playlists, and it has cover art from Last.fm.

`Mopidy <http://www.mopidy.com/>`_ is a music server which can play music from Spotify, Google Music, SoundCloud, etc or from your hard drive. 

If you want to run Mopidy with this webclient on a Raspberry Pi, do yourself a favor and use my custom built SD-image: `Pi MusicBox <http://www.pimusicbox.com/>`_.

.. image:: https://github.com/pimusicbox/mopidy-musicbox-webclient/raw/master/screenshots/playlists_desktop.png


Installation
============

Install by running::

    pip install Mopidy-MusicBox-Webclient


Alternatively, clone the repository and run ``sudo python setup.py install`` from within the project directory. e.g. ::

    $ git clone https://github.com/pimusicbox/mopidy-musicbox-webclient
    $ cd mopidy-musicbox-webclient
    $ sudo python setup.py install


Usage
=====

Point your (modern) browser at Mopidy-MusicBox-Webclient running on your Mopidy server e.g. http://localhost:6680/musicbox_webclient.


Project resources
=================

- `Source code <https://github.com/pimusicbox/mopidy-musicbox-webclient>`_
- `Issue tracker <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues>`_
- `Download development snapshot <https://github.com/pimusicbox/mopidy-musicbox-webclient/archive/develop.tar.gz#egg=Mopidy-MusicBox-Webclient-dev>`_


Changelog
=========

v2.0.1 (UNRELEASED)
-------------------
- Added optional websocket_host and websocket_port config settings.
- Fixed slow to start playing from a large tracklist of browsed tracks.
- Added link to `Alarm Clock <https://pypi.python.org/pypi/Mopidy-AlarmClock/>`_ (if present).
- Added ability to save Queue as local Playlist.
- Added ability to manually initiate refresh of Playlists.
- Increase volume slider handle by 30% to make it easier to grab on mobile devices
- Add application cache manifest file for quicker loads and to allow client devices to detect when local caches should be invalidated.
- Fix vertical alignment of playback control buttons in footer.
- Use standard Mopidy mixer methods to mute / un-mute playback.

v2.0.0 (26-3-2015)
------------------
- Pausing a stream will now actually stop it.
- Fix keyboard shortcuts in some browsers.
- Use relative path for script files to fix proxy support.
- Description text for control icons.
- Added consume and single playback modes.
- Changed from a static webclient to a dynamic webapp.
- New musicbox config setting to hide Musicbox specific content.
- Added popup tracks menu to the Browse interface.
- Fixed wrong jQuery version on some pages.

v1.0.4
------

- Added AudioAddict icon
- Bugfixes of course

v1.0.2 
------

- A friendlier welcome with a home page with buttons to the most used functions
- Converted Radio Stations to Streams, so user can add streams for youtube, spotify, soundcloud, podcasts
- Enhanced radio/streams interface
- Search: select service to search
- Fixed single quote bug #39
- Better handling of coverart
- Youtube icons added
- Bugfixes (search, popups, etc)

v1.0.1 (20-9-2014)
------------------

- Small fixes for Pypi distro

v1.0.0 (20-9-2014)
------------------

- Compatible with Mopidy v0.19
- Made pip installable
- A lot of fixes
- Works with mopidy-websettings extension

v0.1.0 (2013-07-21)
-------------------

- Compatible with Mopidy 0.14+
- More ways to add a song to the Queue (play next, add to bottom, etc)
- Better Queue popup
- Button to clear the Queue
- A bit more speed
- Local files show up in search
- Bugs fixed
- New instructions in the read me
