import pathlib

import pkg_resources

from mopidy import config, ext

__version__ = pkg_resources.get_distribution(
    "Mopidy-MusicBox-Webclient"
).version


class Extension(ext.Extension):

    dist_name = "Mopidy-MusicBox-Webclient"
    ext_name = "musicbox_webclient"
    version = __version__

    def get_default_config(self):
        return config.read(pathlib.Path(__file__).parent / "ext.conf")

    def get_config_schema(self):
        schema = super().get_config_schema()
        schema["musicbox"] = config.Boolean(optional=True)
        schema["websocket_host"] = config.Hostname(optional=True)
        schema["websocket_port"] = config.Port(optional=True)
        schema["on_track_click"] = config.String(
            optional=True,
            choices=[
                "PLAY_NOW",
                "PLAY_NEXT",
                "ADD_THIS_BOTTOM",
                "ADD_ALL_BOTTOM",
                "PLAY_ALL",
                "DYNAMIC",
            ],
        )
        return schema

    def setup(self, registry):
        registry.add(
            "http:app", {"name": self.ext_name, "factory": self.factory}
        )

    def factory(self, config, core):
        from tornado.web import RedirectHandler
        from .web import IndexHandler, StaticHandler

        path = pathlib.Path(__file__).parent / "static"
        return [
            (r"/", RedirectHandler, {"url": "index.html"}),
            (r"/(index.html)", IndexHandler, {"config": config, "path": path}),
            (r"/(.*)", StaticHandler, {"path": path}),
        ]
