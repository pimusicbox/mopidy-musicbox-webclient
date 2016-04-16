from __future__ import absolute_import, division, print_function, unicode_literals

import unittest

import mock

from mopidy_musicbox_webclient import Extension


class ExtensionTests(unittest.TestCase):

    def test_get_default_config(self):
        ext = Extension()

        config = ext.get_default_config()

        assert '[musicbox_webclient]' in config
        assert 'enabled = true' in config
        assert 'websocket_host =' in config
        assert 'websocket_port =' in config
        assert 'on_track_click = PLAY_ALL' in config

    def test_get_config_schema(self):
        ext = Extension()

        schema = ext.get_config_schema()

        assert 'musicbox' in schema
        assert 'websocket_host' in schema
        assert 'websocket_port' in schema
        assert 'on_track_click' in schema

    def test_setup(self):
        registry = mock.Mock()

        ext = Extension()
        ext.setup(registry)
        calls = [mock.call('http:app', {'name': ext.ext_name, 'factory': ext.factory})]
        registry.add.assert_has_calls(calls, any_order=True)
