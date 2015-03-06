from __future__ import unicode_literals

import os

from mopidy import config, ext

__version__ = '1.0.4'


class MusicBoxExtension(ext.Extension):

    dist_name = 'Mopidy-MusicBox-Webclient'
    ext_name = 'musicbox_webclient'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(MusicBoxExtension, self).get_config_schema()
        schema['musicbox'] = config.Boolean()
        return schema

    def setup(self, registry):
        registry.add('http:app', {'name': self.ext_name, 'factory': self.factory})
    
    def factory(self, config, core):
        from tornado.web import RedirectHandler
        from .web import IndexHandler, StaticHandler
        path = os.path.join(os.path.dirname(__file__), 'static')
        return [
            (r'/', RedirectHandler, {'url': 'index.html'}),
            (r'/(index.html)', IndexHandler, {'config': config, 'path': path}),
            (r'/(.*)', StaticHandler, {'path': path})
        ]
