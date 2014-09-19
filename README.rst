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

If you want to run Mopidy with this webclient on a Raspberry Pi, do yourself a favor and use my custom built SD-image: `Pi MusicBox <http://www.woutervanwijk.nl/pimusicbox/>`_.

.. image:: https://github.com/woutervanwijk/Mopidy-MusicBox-Webclient/raw/master/screenshots/playlists_desktop.png


Installation
============

Install by running::

    pip install Mopidy-MusicBox-Webclient


Alternatively, clone the repository and run ``sudo python setup.py install`` from within the project directory. e.g. ::

    $ git clone https://github.com/woutervanwijk/Mopidy-MusicBox-Webclient
    $ cd Mopidy-MusicBox-Webclient
    $ sudo python setup.py install


Usage
=====

Point your (modern) browser at Mopidy-MusicBox-Webclient running on your Mopidy server e.g. http://localhost:6680/musicbox.



Project resources
=================

- `Source code <https://github.com/woutervanwijk/mopidy-musicbox-webclient>`_
- `Issue tracker <https://github.com/woutervanwijk/mopidy-musicbox-webclient/issues>`_
- `Download development snapshot <https://github.com/woutervanwijk/mopidy-musicbox-webclient/archive/master.tar.gz#egg=Mopidy-MusicBox-Webclient-dev>`_


Changelog
=========

v1.0.1 (20-9-2014)
-------------------

- Small fixes for Pypi distro

v1.0.0 (20-9-2014)
-------------------

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
