*************************
Mopidy-MusicBox-Webclient
*************************

.. image:: https://img.shields.io/pypi/v/Mopidy-MusicBox-Webclient.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-MusicBox-Webclient/
    :alt: Latest PyPI version

.. image:: https://img.shields.io/pypi/dm/Mopidy-MusicBox-Webclient.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-MusicBox-Webclient/
    :alt: Number of PyPI downloads

.. image:: https://img.shields.io/travis/pimusicbox/mopidy-musicbox-webclient/develop.svg?style=flat
    :target: https://travis-ci.org/pimusicbox/mopidy-musicbox-webclient
    :alt: Travis CI build status

.. image:: https://img.shields.io/coveralls/pimusicbox/mopidy-musicbox-webclient/develop.svg?style=flat
   :target: https://coveralls.io/r/pimusicbox/mopidy-musicbox-webclient?branch=develop
   :alt: Test coverage

.. image:: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
    :target: http://standardjs.com/
    :alt: JavaScript Standard Style

With Mopidy MusicBox Webclient (MMW), you can play your music on your computer (`Rapsberry Pi <http://www.raspberrypi.org/>`_)
and remotely control it using your computer, tablet or phone.

This is a responsive webclient especially written for `Mopidy <http://www.mopidy.com/>`_: a music server that can play
music from many different sources including Spotify, Google Music, SoundCloud, etc. or from your hard drive. The
webclient is responsive, so it works on desktop and mobile browsers. You can browse, search and play albums, artists,
playlists, and it has cover art from Last.fm.


If you want to run Mopidy with this webclient on a Raspberry Pi, do yourself a favor and use my custom built SD-image:
`Pi MusicBox <http://www.pimusicbox.com/>`_.

.. image:: https://github.com/pimusicbox/mopidy-musicbox-webclient/raw/master/screenshots/playlists_desktop.png


Installation
============

Install by running::

    pip install mopidy-musicbox-webclient


Alternatively, clone the repository and run ``sudo python setup.py install`` from within the project directory. e.g. ::

    $ git clone https://github.com/pimusicbox/mopidy-musicbox-webclient
    $ cd mopidy-musicbox-webclient
    $ sudo python setup.py install


Usage
=====

Point your (modern) browser at Mopidy-MusicBox-Webclient running on your Mopidy server e.g.
http://localhost:6680/musicbox_webclient.


Project resources
=================

- `Source code <https://github.com/pimusicbox/mopidy-musicbox-webclient>`_
- `Issue tracker <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues>`_
- `Download development snapshot <https://github.com/pimusicbox/mopidy-musicbox-webclient/archive/develop.tar.gz#egg=Mopidy-MusicBox-Webclient-dev>`_


Changelog
=========

v2.3.0 (UNRELEASED)
-------------------

- Enhance build workflow to include style checks and syntax validation for HTML, CSS, and Javascript.
- Now displays album and artist info when browsing tracks. (Addresses: `#99 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/99>`_).
- Now remembers which backend was searched previously, and automatically selects that backend as the default search target.
  (Addresses: `#130 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/130>`_).
- Upgrade Media Progress Timer to version 3.0.0.
- Now retrieves album cover and artist images using MusicBrainzID, if available.

**Fixes**

- Don't create Mopidy models manually. (Fixes: `#172 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/172>`_).
- Context menu is now available for all tracks in browse pane. (Fixes: `#126 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/126>`_).
- last.fm artist image lookups should now always return the correct image for similarly named artists.

v2.2.0 (2016-03-01)
-------------------

- Split vendor-provided JavaScript and CSS libraries into separate folders to make them easier to identify and maintain.
  (Addresses: `#143 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/143>`_).
- Upgrade Font-Awesome libraries to version 4.5.0.
- Upgrade jQuery libraries to version 1.12.0.
- Upgrade last.fm JavaScript libraries to the latest version available on the GitHub master branch of the repository.
- Mopidy-Musicbox-Webclient is now distributed with a vendor copy of Mopidy.js. (Addresses: `#175 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/175>`_).

**Fixes**

- Remove unused iScroll libraries and references.
- Remove unused jQuery.Mobile.iScrollView libraries and references.
- Remove unused jQuery.Truncate libraries and references.
- Avoid polling for current track and time changes. (Fixes: `#40 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/40>`_).
- Prevent mobile devices from scaling when used in landscape mode. (Fixes: `#157 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/157>`_).
- Scrolling now works in full screen mode for Chrome and Safari as well. (Fixes: `#53 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/53>`_).
- No longer interferes with changes to Mopidy's volume levels that are triggered externally. (Fixes: `#162 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/162>`_).
- Volume slider now works with Mopidy-ALSAMixer again. (Fixes: `#168 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/168>`_).
- Now falls back to track artist if album artist is not available for rendering cover art. (Fixes: `#128 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/128>`_).
- Replace Javascript prompt with jQuery Mobile equivalent. (Fixes: `#113 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/113>`_).
- Fix playlist refresh button. (Fixes: `#173 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/173>`_).
- Update save queue functionality to use 'm3u' format. (Fixes: `#177 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/177>`_).

v2.1.1 (2016-02-04)
-------------------

- Replace Javascript for truncating text with more reliable CSS equivalent. (Fixes: `#155 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/155>`_).

v2.1.0 (2016-02-04)
-------------------

**Enhancements and improvements**

- Added optional ``websocket_host`` and ``websocket_port`` config settings.
- Added link to `Alarm Clock <https://pypi.python.org/pypi/Mopidy-AlarmClock/>`_ (if present).
- Added ability to save Queue as local Playlist. (Addresses: `#106 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/106>`_).
- Add support for ``static_dir`` configurations.
  (Addresses: `#105 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/105>`_).
- Added ability to manually initiate refresh of Playlists.
  (Addresses: `#107 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/107>`_).
- Now updates the track name when the stream title changes.
- Adding a browsed radio station to the tracklist now also starts playback of the station.
  (Addresses: `#98 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/98>`_).
- Increase volume slider handle by 30% to make it easier to grab on mobile devices.
- Add application cache manifest file for quicker loads and to allow client devices to detect when local caches should
  be invalidated.
- Use standard Mopidy mixer methods to mute / un-mute playback.
- Streams are now saved to the '[Radio Streams].m3u' playlist and are accessible from all clients.
  Users with existing streamUris stored as browser cookies will be prompted to convert them to the new m3u backed scheme.
- Mopidy-Musicbox-Webclient now requires at least Mopidy v1.1.0 or greater to be installed.

**Fixes**

- Ensure that only the currently playing track is highlighted in the queue.
  (Fixes: `#81 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/81>`_).
- Fixed slow to start playing from a large tracklist of browsed tracks.
  (Fixes: `#85 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/85>`_).
- Clean up unused Javascript code. (Fixes: `#100 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/100>`_).
- Mopidy 1.1.0 compatibility fixes. (Fixes: `#109 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/109>`_,
  `#111 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/111>`_,
  `#121 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/121>`_, and
  `#123 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/123>`_).
- Fix incorrect identification of user's Spotify starred playlist.
  (Fixes: `#110 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/110>`_).
- Initiating track playback from a folder that contains subfolders now correctly identifies the tracks that should be
  played. (Fixes: `#112 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/112>`_).
- Adding search results to tracklist now works as expected.
  (Fixes: `#49 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/49>`_ and
  `#135 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/135>`_).
- Fix Javascript syntax errors. (Fixes: `#122 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/122>`_).
- Fix vertical alignment of playback control buttons in footer.
- Increase width of header so that more text can be rendered in the title bar.
  (Fixes: `#144 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/144>`_).
- Re-align the menu and search buttons in the title bar.
  (Fixes: `#148 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/148>`_).
- Use explicit Mopidy.js calling convention. (Fixes: `#79 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/79>`_).
- Added event handling for 'muteChanged' event. (Fixes: `#141 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/141>`_).
- Remove support for defunct Grooveshark service.
  (Fixes: `#120 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/120>`_).

v2.0.0 (2015-03-26)
-------------------

- Pausing a stream will now actually stop it.
- Fix keyboard shortcuts in some browsers.
- Use relative path for script files to fix proxy support.
- Description text for control icons.
- Added consume and single playback modes.
- Changed from a static webclient to a dynamic webapp.
- New musicbox config setting to hide Musicbox specific content.
- Added popup tracks menu to the Browse interface.
- Fixed wrong jQuery version on some pages.

v1.0.4 (2014-11-24)
-------------------

- Added AudioAddict icon.
- Bugfixes of course.

v1.0.2 
------

- A friendlier welcome with a home page with buttons to the most used functions.
- Converted Radio Stations to Streams, so user can add streams for youtube, spotify, soundcloud, podcasts.
- Enhanced radio/streams interface.
- Search: select service to search.
- Fixed single quote bug. (Fixes: `#39 <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues/39>`_).
- Better handling of coverart.
- Youtube icons added.
- Bugfixes (search, popups, etc.).

v1.0.1 (2014-09-20)
-------------------

- Small fixes for PyPI distro.

v1.0.0 (2014-09-20)
-------------------

- Compatible with Mopidy v0.19.
- Made pip installable.
- A lot of fixes.
- Works with mopidy-websettings extension.

v0.1.0 (2013-07-21)
-------------------

- Compatible with Mopidy 0.14+.
- More ways to add a song to the Queue (play next, add to bottom, etc).
- Better Queue popup.
- Button to clear the Queue.
- A bit more speed.
- Local files show up in search.
- Bugs fixed.
- New instructions in the read me.
