from __future__ import absolute_import, division, print_function, unicode_literals

import json

import logging
import string

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

    def initialize(self, config, core, path):

        webclient = mmw.Webclient(config, core)

        self.__dict = {
            'isMusicBox': json.dumps(webclient.is_music_box()),
            'websocketUrl': webclient.get_websocket_url(self.request),
            'hasAlarmClock': json.dumps(webclient.has_alarm_clock()),
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


class ScriptHandler(tornado.web.RequestHandler):

    def initialize(self, config, core, path):

        webclient = mmw.Webclient(config, core)

        self.__dict = {
            'searchSchemes': json.dumps(webclient.get_search_schemes())
        }
        self.__path = path

    def get(self, path):
        return self.render(path, **self.__dict)

    def get_template_path(self):
        return self.__path
