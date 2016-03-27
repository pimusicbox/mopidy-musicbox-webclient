from __future__ import absolute_import, division, print_function, unicode_literals

import logging

from mopidy_musicbox_webclient import Extension

logger = logging.getLogger(__name__)


class Webclient(object):

    def __init__(self, config, core):
        self.config = config
        self.core = core

    @property
    def ext_config(self):
        return self.config.get(Extension.ext_name, {})

    def get_version(self):
        return Extension.version

    def get_search_schemes(self):
        uri_schemes = self.core.get_uri_schemes()
        search_blacklist = self.ext_config.get('search_blacklist', [])
        search_schemes = sorted(list(set(uri_schemes.get()) - set(search_blacklist)))
        search_schemes.insert(0, 'all')
        return search_schemes

    def get_websocket_url(self, request):
        host, port = self.ext_config['websocket_host'], self.ext_config['websocket_port']
        ws_url = ''
        if host or port:
            if not host:
                host = request.host.partition(':')[0]
                logger.warning('Musicbox websocket_host not specified, '
                               'using %s', host)
            elif not port:
                port = self.config['http']['port']
                logger.warning('Musicbox websocket_port not specified, '
                               'using %s', port)
            protocol = 'ws'
            if request.protocol == 'https':
                protocol = 'wss'
            ws_url = "%s://%s:%d/mopidy/ws" % (protocol, host, port)

        return ws_url

    def has_alarm_clock(self):
        return self.ext_config.get('alarmclock', {}).get('enabled', False)

    def is_music_box(self):
        return self.ext_config.get('musicbox', False)
