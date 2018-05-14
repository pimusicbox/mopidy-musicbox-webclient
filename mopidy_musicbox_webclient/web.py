from __future__ import absolute_import, division, print_function, unicode_literals

import json
import logging
import socket
import string
import urlparse

import tornado.web

import mopidy_musicbox_webclient.webclient as mmw

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
        return mmw.Extension.version


class IndexHandler(tornado.web.RequestHandler):

    def initialize(self, config, path):

        webclient = mmw.Webclient(config)

        if webclient.is_music_box():
            program_name = 'MusicBox'
        else:
            program_name = 'Mopidy'

        url = urlparse.urlparse('%s://%s' % (self.request.protocol, self.request.host))
        port = url.port or 80

        self.__dict = {
            'isMusicBox': json.dumps(webclient.is_music_box()),
            'websocketUrl': webclient.get_websocket_url(self.request),
            'hasAlarmClock': json.dumps(webclient.has_alarm_clock()),
            'onTrackClick': webclient.get_default_click_action(),
            'programName': program_name,
            'hostname': url.hostname,
            'serverIP': socket.gethostbyname(url.hostname),
            'serverPort': port

        }
        self.__path = path
        self.__title = string.Template('{} on $hostname'.format(program_name))

    def get(self, path):
        return self.render(path, title=self.get_title(), **self.__dict)

    def get_title(self):
        url = urlparse.urlparse('%s://%s' % (self.request.protocol, self.request.host))
        return self.__title.safe_substitute(hostname=url.hostname)

    def get_template_path(self):
        return self.__path
