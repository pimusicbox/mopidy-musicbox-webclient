from __future__ import unicode_literals

import logging

import tornado.web

from . import MusicBoxExtension

logger = logging.getLogger(__name__)


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
        return MusicBoxExtension.version


class IndexHandler(tornado.web.RequestHandler):

    def initialize(self, config, path):
        ext_config = config[MusicBoxExtension.ext_name]
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
            ws_url = "ws://%s:%d/mopidy/ws" % (host, port)

        self.__dict = {
            'version': MusicBoxExtension.version,
            'musicbox': int(ext_config['musicbox'] or False),
            'websocket_url': ws_url,
            'alarmclock': int('alarmclock' in config and
                              'enabled' in config['alarmclock'] and
                              config['alarmclock']['enabled'])
        }
        self.__path = path

    def get(self, path):
        return self.render('index.html', **self.__dict)

    def get_template_path(self):
        return self.__path
