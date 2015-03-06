from __future__ import unicode_literals

from mopidy_musicbox_webclient import MusicBoxExtension


def test_get_default_config():
    ext = MusicBoxExtension()

    config = ext.get_default_config()

    assert '[musicbox_webclient]' in config
    assert 'enabled = true' in config


def test_get_config_schema():
    ext = MusicBoxExtension()

    schema = ext.get_config_schema()
    assert 'musicbox' in schema


# TODO Write more tests
