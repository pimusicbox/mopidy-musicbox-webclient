from __future__ import unicode_literals

import os

from mopidy import config, ext

from mopidy_musicbox_webclient.web import JsonRpcHandler, WebSocketHandler
from mopidy_musicbox_webclient.webclient import Webclient

__version__ = '2.2.0'


class Extension(ext.Extension):

    dist_name = 'Mopidy-MusicBox-Webclient'
    ext_name = 'musicbox_webclient'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(Extension, self).get_config_schema()
        schema['musicbox'] = config.Boolean(optional=True)
        schema['websocket_host'] = config.Hostname(optional=True)
        schema['websocket_port'] = config.Port(optional=True)
        schema['search_blacklist'] = config.List(optional=True)
        return schema

    def setup(self, registry):
        registry.add(
            'http:app', {'name': self.ext_name, 'factory': self.factory})

    def factory(self, config, core):
        from tornado.web import RedirectHandler
        from .web import IndexHandler, StaticHandler
        path = os.path.join(os.path.dirname(__file__), 'static')
        webclient = Webclient(self, config, core)
        return [
            (r'/ws/?', WebSocketHandler, {'webclient': webclient, }),
            (r'/rpc', JsonRpcHandler, {'webclient': webclient, }),
            (r'/', RedirectHandler, {'url': 'index.html'}),
            (r'/(.*\.html)', IndexHandler, {'config': config, 'path': path}),
            (r'/(.*)', StaticHandler, {'path': path}),
        ]
