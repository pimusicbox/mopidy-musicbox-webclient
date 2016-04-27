from __future__ import absolute_import, division, print_function, unicode_literals

import unittest

import mock

import mopidy.config as mopidy_config

from mopidy_musicbox_webclient import Extension
from mopidy_musicbox_webclient.webclient import Webclient


class WebclientTests(unittest.TestCase):

    def setUp(self):
        config = mopidy_config.Proxy(
            {
                'musicbox_webclient': {
                    'enabled': True,
                    'musicbox': False,
                    'websocket_host': 'host_mock',
                    'websocket_port': 999,
                    }
            })

        self.ext = Extension()
        self.mmw = Webclient(config)

    def test_get_version(self):
        assert self.mmw.get_version() == self.ext.version

    def test_get_websocket_url_uses_config_file(self):
        assert self.mmw.get_websocket_url(mock.Mock()) == 'ws://host_mock:999/mopidy/ws'

    def test_get_websocket_url_uses_request_host(self):
        config = mopidy_config.Proxy(
            {
                'musicbox_webclient': {
                    'enabled': True,
                    'musicbox': False,
                    'websocket_host': '',
                    'websocket_port': 999,
                    }
            })

        request_mock = mock.Mock(spec='tornado.HTTPServerRequest')
        request_mock.host = '127.0.0.1'
        request_mock.protocol = 'https'

        self.mmw.config = config
        assert self.mmw.get_websocket_url(request_mock) == 'wss://127.0.0.1:999/mopidy/ws'

    def test_get_websocket_url_uses_http_port(self):
        config = mopidy_config.Proxy(
            {
                'http': {
                    'port': 999
                },
                'musicbox_webclient': {
                    'enabled': True,
                    'musicbox': False,
                    'websocket_host': '127.0.0.1',
                    'websocket_port': '',
                }
            })

        request_mock = mock.Mock(spec='tornado.HTTPServerRequest')
        request_mock.host = '127.0.0.1'
        request_mock.protocol = 'https'

        self.mmw.config = config
        assert self.mmw.get_websocket_url(request_mock) == 'wss://127.0.0.1:999/mopidy/ws'

    def test_has_alarmclock(self):
        assert not self.mmw.has_alarm_clock()

    def test_is_musicbox(self):
        assert not self.mmw.is_music_box()

    def test_default_click_action(self):
        assert self.mmw.get_default_click_action() == 'PLAY_ALL'
