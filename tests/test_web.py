from __future__ import absolute_import, division, print_function, unicode_literals

import mock

import mopidy.config as config

import tornado.testing
import tornado.web
import tornado.websocket

from mopidy_musicbox_webclient import Extension


class BaseTest(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        musicbox_webclient = Extension()
        self.config = config.Proxy({'musicbox_webclient': {
            'enabled': True,
            'musicbox': True,
            'websocket_host': '',
            'websocket_port': '',
            'search_blacklist': '',
            }
        })
        return tornado.web.Application(musicbox_webclient.factory(self.config, mock.Mock()))


class StaticFileHandlerTest(BaseTest):

    def test_static_handler(self):
        response = self.fetch('/vendors/mopidy/mopidy.js', method='GET')

        self.assertEqual(200, response.code)


class RedirectHandlerTest(BaseTest):

    def test_redirect_handler(self):
        response = self.fetch('/', method='GET', follow_redirects=False)

        self.assertEqual(response.code, 301)
        self.assertEqual(response.headers['Location'], 'index.html')


class IndexHandlerTest(BaseTest):

    def test_index_handler(self):
        response = self.fetch('/index.html', method='GET')
        self.assertEqual(200, response.code)

    def test_get_title(self):
        response = self.fetch('/index.html', method='GET')
        body = tornado.escape.to_unicode(response.body)

        self.assertIn('<title>MusicBox on localhost</title>', body)
