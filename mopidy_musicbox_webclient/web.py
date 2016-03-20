from __future__ import absolute_import, division, print_function, unicode_literals

import functools
import logging
import socket
import string

import mopidy
from mopidy.http.handlers import _send_broadcast
from mopidy.internal import jsonrpc

import tornado.escape
import tornado.ioloop
import tornado.web
import tornado.websocket


import mopidy_musicbox_webclient as mmw

logger = logging.getLogger(__name__)


def make_jsonrpc_wrapper(webclient):
    inspector = jsonrpc.JsonRpcInspector(
        objects={
            'webclient.get_search_schemes': mmw.Webclient.get_search_schemes,
            'webclient.get_version': mmw.Webclient.get_version,
            'webclient.has_alarm_clock': mmw.Webclient.has_alarm_clock,
            'webclient.is_music_box': mmw.Webclient.is_music_box,
        })
    return jsonrpc.JsonRpcWrapper(
        objects={
            'webclient.describe': inspector.describe,
            'webclient.get_search_schemes': webclient.get_search_schemes,
            'webclient.get_version': webclient.get_version,
            'webclient.has_alarm_clock': webclient.has_alarm_clock,
            'webclient.is_music_box': webclient.is_music_box,
        },
        # decoders=[models.model_json_decoder],
        # encoders=[models.ModelJSONEncoder]
    )


class WebSocketHandler(mopidy.http.handlers.WebSocketHandler):

    client = None

    @classmethod
    def broadcast(cls, msg):
        if hasattr(tornado.ioloop.IOLoop, 'current'):
            loop = tornado.ioloop.IOLoop.current()
        else:
            loop = tornado.ioloop.IOLoop.instance()  # Fallback for pre 3.0

        # This can be called from outside the Tornado ioloop, so we need to
        # safely cross the thread boundary by adding a callback to the loop.
        loop.add_callback(functools.partial(_send_broadcast, cls.client, msg))

    def initialize(self, webclient):
        self.jsonrpc = make_jsonrpc_wrapper(webclient)

    def open(self):
        if hasattr(self, 'set_nodelay'):
            # New in Tornado 3.1
            self.set_nodelay(True)
        else:
            self.stream.socket.setsockopt(
                socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        self.client = self
        logger.debug(
            'New WebSocket connection from %s', self.request.remote_ip)

    def on_close(self):
        self.client = None
        logger.debug(
            'Closed WebSocket connection from %s',
            self.request.remote_ip)


class JsonRpcHandler(mopidy.http.handlers.JsonRpcHandler):

    def initialize(self, webclient):
        self.jsonrpc = make_jsonrpc_wrapper(webclient)


class StaticHandler(tornado.web.StaticFileHandler):

    def get(self, path, *args, **kwargs):
        version = self.get_argument('v', None)
        if version:
            logger.debug('Get static resource for %s?v=%s', path, version)
        else:
            logger.debug('Get static resource for %s', path)
        return super(StaticHandler, self).get(path, *args, **kwargs)

    @classmethod
    def get_version(cls, settings, path):
        return mmw.Extension.version


class IndexHandler(tornado.web.RequestHandler):

    def initialize(self, config, path):
        ext_config = config[mmw.Extension.ext_name]
        host, port = ext_config['websocket_host'], ext_config['websocket_port']
        ws_url = ''
        if host or port:
            if not host:
                host = self.request.host.partition(':')[0]
                logger.warning('Musicbox websocket_host not specified, '
                               'using %s', host)
            elif not port:
                port = config['http']['port']
                logger.warning('Musicbox websocket_port not specified, '
                               'using %s', port)
            protocol = 'ws'
            if self.request.protocol == 'https':
                protocol = 'wss'
            ws_url = "%s://%s:%d/mopidy/ws" % (protocol, host, port)

        self.__dict = {
            'websocketUrl': ws_url
        }
        self.__path = path
        self.__title = string.Template('MusicBox on $hostname')

    def get(self, path):
        return self.render(path, title=self.get_title(), **self.__dict)

    def get_title(self):
        hostname, sep, port = self.request.host.rpartition(':')
        if not sep or not port.isdigit():
            hostname, port = self.request.host, '80'
        return self.__title.safe_substitute(hostname=hostname, port=port)

    def get_template_path(self):
        return self.__path
