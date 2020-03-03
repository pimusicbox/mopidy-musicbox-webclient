*************************
Mopidy-MusicBox-Webclient
*************************

.. image:: https://img.shields.io/pypi/v/Mopidy-MusicBox-Webclient.svg
    :target: https://pypi.org/project/Mopidy-MusicBox-Webclient/
    :alt: Latest PyPI version

.. image:: https://img.shields.io/circleci/project/pimusicbox/mopidy-musicbox-webclient/develop.svg
    :target: https://circleci.com/gh/pimusicbox/mopidy-musicbox-webclient
    :alt: CircleCI build status

.. image:: https://img.shields.io/codecov/c/github/pimusicbox/mopidy-musicbox-webclient/develop.svg
    :target: https://codecov.io/gh/pimusicbox/mopidy-musicbox-webclient
    :alt: Test coverage

.. image:: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
    :target: http://standardjs.com/
    :alt: JavaScript Standard Style

Mopidy MusicBox Webclient (MMW) is a frontend extension and JavaScript-based web client especially written for
`Mopidy <http://www.mopidy.com/>`_.

Features
========

- Responsive design that works equally well on desktop and mobile browsers.
- Browse content provided by any Mopidy backend extension.
- Add one or more tracks or entire albums to the queue.
- Save the current queue to an easily accessible playlist.
- Search for tracks, albums, or artists from specific backends or all of Mopidy.
- Shows detailed track and album information during playback, with album cover retrieval from Last.fm.
- Support for all of the Mopidy playback controls (consume mode, repeat, shuffle, etc.)
- Deep integration with, and additional features for, the `Pi MusicBox <http://www.pimusicbox.com/>`_.
- Fullscreen mode.

.. image:: https://github.com/pimusicbox/mopidy-musicbox-webclient/raw/develop/screenshots/overview.png
    :width: 1312
    :height: 723

Dependencies
============

- MMW has been tested on the major browsers (Chrome, IE, Firefox, Safari, iOS). It *may* also work on other browsers
  that support websockets, cookies, and JavaScript.

- ``Mopidy`` >= 3.0.0. An extensible music server that plays music from local disk, Spotify, SoundCloud, Google
  Play Music, and more.

Installation
============

Install by running::

    sudo python3 -m pip install Mopidy-MusicBox-Webclient

Or, if available, install the Debian/Ubuntu package from
`apt.mopidy.com <https://apt.mopidy.com/>`_.


Configuration
=============

MMW is shipped with default settings that should work straight out of the box for most users::

    [musicbox_webclient]
    enabled = true
    musicbox = false
    websocket_host =
    websocket_port =
    on_track_click = PLAY_ALL

The following configuration values are available should you wish to customize your installation further:

- ``musicbox_webclient/enabled``: If the MMW extension should be enabled or not. Defaults to ``true``.

- ``musicbox_webclient/musicbox``: Set this to ``true`` if you are connecting to a Mopidy instance running on a
  Pi Musicbox. Expands the MMW user interface to include system control/configuration functionality.

- ``musicbox_webclient/websocket_host``: Optional setting to specify the target host for Mopidy websocket connections.

- ``musicbox_webclient/websocket_port``: Optional setting to specify the target port for Mopidy websocket connections.

- ``musicbox_webclient/on_track_click``: The action performed when clicking on a track. Valid options are: 
  ``PLAY_ALL`` (default), ``PLAY_NOW``, ``PLAY_NEXT``, ``ADD_THIS_BOTTOM``, ``ADD_ALL_BOTTOM``, and ``DYNAMIC`` (repeats last action).

Usage
=====

Enter the address of the Mopidy server that you are connecting to in your browser (e.g. http://localhost:6680/musicbox_webclient)


Project resources
=================

- `Source code <https://github.com/pimusicbox/mopidy-musicbox-webclient>`_
- `Issue tracker <https://github.com/pimusicbox/mopidy-musicbox-webclient/issues>`_
- `Changelog <https://github.com/pimusicbox/mopidy-musicbox-webclient/blob/master/CHANGELOG.rst>`_

Credits
=======

- Original author: `Wouter van Wijk <https://github.com/woutervanwijk>`__
- Current maintainer: `Nick Steel <https://github.com/kingosticks>`__
- `Contributors <https://github.com/pimusicbox/mopidy-musicbox-webclient/graphs/contributors>`_
