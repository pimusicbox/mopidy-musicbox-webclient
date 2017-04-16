from __future__ import absolute_import, division, print_function, unicode_literals

import json

import logging
import os
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


class UploadHandler(tornado.web.RequestHandler):

    def initialize(self, config, path):

        webclient = mmw.Webclient(config)

        self.__path = path

        self.__upload_path = webclient.get_upload_path()
        self.__can_upload = webclient.has_upload_path()
        if self.__can_upload:
            if not self.__upload_path.endswith(os.path.sep):
                self.__upload_path += os.path.sep

    def get(self, path):
        return self.render(path, can_upload=self.can_upload(), upload_path=self.__upload_path, has_messages=False)

    def post(self, path):
        messages = []
        try:
            if self.can_upload():
                subpath = self.get_argument('subpath', '')
                if not subpath.endswith(os.path.sep):
                    subpath += os.path.sep
                if subpath.startswith(os.path.sep):
                    subpath = subpath[1:]

                if not os.path.exists(self.get_upload_path()+subpath):
                    messages.append("subdirectory " + subpath + " not exists, it will be created")
                    os.makedirs(self.get_upload_path()+subpath)
                absolute_path = self.get_upload_path()+subpath

                for key in self.request.files:
                    for file in self.request.files[key]:
                        original_fname = file['filename']

                        output_file = open(absolute_path + original_fname, 'wb')
                        output_file.write(file['body'])
                        logger.info("Uploaded file: " + absolute_path + original_fname)
                        messages.append("file " + original_fname + " was uploaded")
            else:
                messages.append("cannot upload... ;( ")
        except Exception as e:
            logger.error('Error during uploading music', exception=e)
            messages.append('An error has occurred! Please retry.')
        variables_dict = {
            'can_upload': self.can_upload(),
            'upload_path': self.__upload_path,
            'has_messages': True,
            'messages': messages
        }

        return self.render(path, **variables_dict)

    def get_template_path(self):
        return self.__path

    def get_upload_path(self):
        return self.__upload_path

    def can_upload(self):
        return self.__can_upload
