from __future__ import unicode_literals

import re

from setuptools import find_packages, setup


def get_version(filename):
    content = open(filename).read()
    metadata = dict(re.findall("__([a-z]+)__ = '([^']+)'", content))
    return metadata['version']


setup(
    name='Mopidy-MusicBox-Webclient',
    version=get_version('mopidy_musicbox_webclient/__init__.py'),
    url='https://github.com/woutervanwijk/mopidy-musicbox-webclient',
    license='GNU General Public License v3 (GPLv3)',
    author='Wouter van Wijk',
    author_email='woutervanwijk@gmail.com',
    description='Mopidy MusicBox web extension',
    long_description=open('README.rst').read(),
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=[
        'setuptools',
        'Mopidy >= 0.19',
    ],
    entry_points={
        'mopidy.ext': [
            'musicbox = mopidy_musicbox_webclient:MusicBoxExtension',
        ],
    },
    classifiers=[
        'Environment :: No Input/Output (Daemon)',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 2',
        'Topic :: Multimedia :: Sound/Audio :: Players',
    ],
)
