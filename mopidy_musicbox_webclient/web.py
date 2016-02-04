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
            protocol = 'ws'
            if self.request.protocol == 'https':
                protocol = 'wss'
            ws_url = "%s://%s:%d/mopidy/ws" % (protocol, host, port)

        self.__dict = {
            'version': MusicBoxExtension.version,
            'musicbox': ext_config.get('musicbox', False),
            'useWebsocketUrl': ws_url != '',
            'websocket_url': ws_url,
            'alarmclock': config.get('alarmclock', {}).get('enabled', False),
        }
        self.__path = path

    def get(self, path):
        return self.render('index.html', **self.__dict)

    def get_template_path(self):
        return self.__path
