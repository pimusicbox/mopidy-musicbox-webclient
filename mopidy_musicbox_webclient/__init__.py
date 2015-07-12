from __future__ import unicode_literals

import os

from mopidy import config, ext

__version__ = '2.0.0'


class MusicBoxExtension(ext.Extension):

    dist_name = 'Mopidy-MusicBox-Webclient'
    ext_name = 'musicbox_webclient'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(MusicBoxExtension, self).get_config_schema()
        schema['musicbox'] = config.Boolean(optional=True)
        schema['websocket_host'] = config.Hostname(optional=True)
        schema['websocket_port'] = config.Port(optional=True)
        schema['default_random'] = config.Boolean(optional=True)
        schema['default_repeat'] = config.Boolean(optional=True)
        schema['default_consume'] = config.Boolean(optional=True)
        schema['default_single'] = config.Boolean(optional=True)
        return schema

    def setup(self, registry):
        registry.add(
            'http:app', {'name': self.ext_name, 'factory': self.factory})

    def factory(self, config, core):
        from tornado.web import RedirectHandler
        from .web import IndexHandler, StaticHandler
        path = os.path.join(os.path.dirname(__file__), 'static')

        if type(config[MusicBoxExtension.ext_name]['default_random']) is bool:
            core.tracklist.random = config[MusicBoxExtension.ext_name]['default_random']
        if type(config[MusicBoxExtension.ext_name]['default_repeat']) is bool:
            core.tracklist.repeat = config[MusicBoxExtension.ext_name]['default_repeat']
        if type(config[MusicBoxExtension.ext_name]['default_consume']) is bool:
            core.tracklist.consume = config[MusicBoxExtension.ext_name]['default_consume']
        if type(config[MusicBoxExtension.ext_name]['default_single']) is bool:
            core.tracklist.single = config[MusicBoxExtension.ext_name]['default_single']

        return [
            (r'/', RedirectHandler, {'url': 'index.html'}),
            (r'/(index.html)', IndexHandler, {'config': config, 'path': path}),
            (r'/(.*)', StaticHandler, {'path': path})
        ]
