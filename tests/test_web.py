from __future__ import absolute_import, division, print_function, unicode_literals

import mock

import mopidy.config as config

import tornado.testing
import tornado.web
import tornado.websocket

from mopidy_musicbox_webclient import Extension
from mopidy_musicbox_webclient.web import StaticHandler


class BaseTest(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        extension = Extension()
        self.config = config.Proxy({'musicbox_webclient': {
            'enabled': True,
            'musicbox': True,
            'websocket_host': '',
            'websocket_port': '',
            }
        })
        return tornado.web.Application(extension.factory(self.config, mock.Mock()))


class StaticFileHandlerTest(BaseTest):

    def test_static_handler(self):
        response = self.fetch('/vendors/mopidy/mopidy.js', method='GET')

        assert response.code == 200

    def test_get_version(self):
        assert StaticHandler.get_version(None, None) == Extension.version


class RedirectHandlerTest(BaseTest):

    def test_redirect_handler(self):
        response = self.fetch('/', method='GET', follow_redirects=False)

        assert response.code == 301
        response.headers['Location'].endswith('index.html')


class IndexHandlerTest(BaseTest):

    def test_index_handler(self):
        response = self.fetch('/index.html', method='GET')
        assert response.code == 200

    def test_get_title(self):
        response = self.fetch('/index.html', method='GET')
        body = tornado.escape.to_unicode(response.body)

        assert '<title>MusicBox on localhost</title>' in body

    def test_initialize_sets_dictionary_objects(self):
        response = self.fetch('/index.html', method='GET')
        body = tornado.escape.to_unicode(response.body)

        assert 'data-is-musicbox="true"' in body
        assert 'data-has-alarmclock="false"' in body
        assert 'data-websocket-url=""' in body
