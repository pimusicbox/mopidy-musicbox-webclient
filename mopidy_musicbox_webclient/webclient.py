from __future__ import absolute_import, division, print_function, unicode_literals

import logging

logger = logging.getLogger(__name__)


class Webclient(object):

    def __init__(self, extension, config, core):
        self.extension = extension
        self.core = core
        self.config = config

    @property
    def ext_config(self):
        return self.config.get(self.extension.ext_name, {})

    def get_version(self):
        return self.extension.version

    def get_search_schemes(self):
        uri_schemes = self.core.get_uri_schemes()
        search_blacklist = self.ext_config.get('search_blacklist', [])
        search_schemes = sorted(list(set(uri_schemes.get()) - set(search_blacklist)))
        search_schemes.insert(0, 'all')
        return search_schemes

    def has_alarm_clock(self):
        return self.ext_config.get('alarmclock', {}).get('enabled', False)

    def is_music_box(self):
        return self.ext_config.get('musicbox', False)
