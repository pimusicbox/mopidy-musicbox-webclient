from __future__ import unicode_literals

import os

from mopidy import config, ext


__version__ = '1.0.0'


class MusicBoxExtension(ext.Extension):

    dist_name = 'Mopidy-MusicBox-Webclient'
    ext_name = 'musicbox'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(MusicBoxExtension, self).get_config_schema()
        return schema

    def setup(self, registry):
        registry.add('http:static', {
            'name': self.ext_name,
            'path': os.path.join(os.path.dirname(__file__), 'static'),
        })
