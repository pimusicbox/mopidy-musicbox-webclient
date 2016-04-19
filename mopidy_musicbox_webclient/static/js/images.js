(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.images = factory()
    }
}(this, function () {
    'use strict'

    var API_KEY = 'b6d34c3af91d62ab0ae00ab1b6fa8733'
    var API_SECRET = '2c631802c2285d5d5d1502462fe42a2b'

    var images = {

        DEFAULT_ALBUM_URL: 'images/default_cover.png',
        DEFAULT_ARTIST_URL: 'images/user_24x32.png',

        lastFM: new LastFM({
            apiKey: API_KEY,
            apiSecret: API_SECRET,
            cache: new LastFMCache()
        }),

        /* Extract artist information from Mopidy track. */
        _getArtistInfo: function (track) {
            var artistName = ''
            var musicBrainzID = ''

            if (track && track.artists && (track.artists.length > 0)) {
                // First look for the artist info in the track
                artistName = track.artists[0].name
                musicBrainzID = track.artists[0].musicbrainz_id
            }

            if ((!artistName || !musicBrainzID) && (track && track.album && track.album.artists && track.album.artists.length > 0)) {
                // Fallback to using artist info contained in the track's album
                artistName = artistName || track.album.artists[0].name
                musicBrainzID = musicBrainzID || track.album.artists[0].musicbrainz_id
            }

            return {mbid: musicBrainzID, name: artistName}
        },

        /* Utility function for retrieving artist informaton for the given track from last.fm */
        _getLastFmArtistInfo: function (track) {
            var artist = images._getArtistInfo(track)
            var artistPromise = $.Deferred()

            if (!(track && (track.musicbrainz_id || (track.name && artist && artist.name)))) {
                // Avoid expensive last.fm call if tag information is missing.
                return artistPromise.reject('none', 'Not enough tag information available for track to make last.fm call.')
            }

            var params = {}
            // Only add arguments to parameter object if values are available for them.
            if (track.musicbrainz_id) {
                params.mbid = track.musicbrainz_id
            }
            if (track.name && artist.name) {
                params.track = track.name
                params.artist = artist.name
            }

            images.lastFM.track.getInfo(params, {success: function (data) {
                artistPromise.resolve(data.track.artist)
            }, error: function (code, message) {
                artistPromise.reject(code, message)
            }})

            return artistPromise
        },

        /* Utility function for retrieving information for the given track from last.fm. */
        _getLastFmAlbumInfo: function (track) {
            var artist = images._getArtistInfo(track)
            var albumPromise = $.Deferred()

            if (!(track && track.album && (track.album.musicbrainz_id || (track.album.name && artist && artist.name)))) {
                // Avoid expensive last.fm call if tag information is missing.
                return albumPromise.reject('none', 'Not enough tag information available for album to make last.fm call.')
            }

            var musicBrainzID = track.album.musicbrainz_id
            var albumName = track.album.name
            var artistName = images._getArtistInfo(track).name

            var params = {}
            // Only add arguments to parameter object if values are available for them.
            if (musicBrainzID) {
                params.mbid = musicBrainzID
            }
            if (artistName && albumName) {
                params.artist = artistName
                params.album = albumName
            }

            images.lastFM.album.getInfo(params, {success: function (data) {
                albumPromise.resolve(data)
            }, error: function (code, message) {
                albumPromise.reject(code, message)
            }})

            return albumPromise
        },

        /**
         * Sets an HTML image element to contain the album cover art of the relevant Mopidy track.
         *
         * Potential sources for the album image will be interrogated in the following order until
         * a suitable image URI is found:
         *      1.) mopidy.library.getImages
         *      2.) mopidy.models.Track.album.images (DEPRECATED)
         *      3.) last.fm using the album MusicBrainz ID
         *      4.) last.fm using the album name and track artist name
         *      5.) last.fm using the album name and album artist name
         *      6.) a default image
         *
         * @param {string} uri - The URI of the Mopidy track to retrieve the album cover image for.
         * @param {string} img_element - The identifier of the HTML image element that will be used
         *                               to render the image.
         * @param {object} mopidy - The Mopidy.js object that should be used to communicate with the
         *                          Mopidy server.
         * @param {string} size - (Optional) The preferred size of the image. This parameter is only
         *                        used in the last.fm lookups if Mopidy does not provide the image
         *                        directly. Can be one of 'small', 'medium', 'large',
         *                        'extralarge' (default), or 'mega'.
         */
        setAlbumImage: function (uri, img_element, mopidy, size) {
            // Set default immediately while we're busy retrieving actual image.
            $(img_element).attr('src', images.DEFAULT_ALBUM_URL)
            if (!uri) {
                return
            }
            size = size || 'extralarge'

            mopidy.library.getImages({'uris': [uri]}).then(function (imageResults) {
                var uri = Object.keys(imageResults)[0]
                if (imageResults[uri].length > 0) {
                    $(img_element).attr('src', imageResults[uri][0].uri)
                } else {
                    // Also check deprecated 'album.images' in case backend does not
                    // implement mopidy.library.getImages yet...
                    images._setDeprecatedAlbumImage(uri, img_element, mopidy, size)
                }
            })
        },

        // Note that this approach has been deprecated in Mopidy
        // TODO: Remove when Mopidy no longer supports retrieving images
        //       from 'album.images'.
        /* Set album image using mopidy.album.images. */
        _setDeprecatedAlbumImage: function (uri, img_element, mopidy, size) {
            if (!uri) {
                $(img_element).attr('src', images.DEFAULT_ALBUM_URL)
                return
            }
            size = size || 'extralarge'

            mopidy.library.lookup({'uris': [uri]}).then(function (resultDict) {
                var uri = Object.keys(resultDict)[0]
                var track = resultDict[uri][0]
                if (track && track.album && track.album.images && track.album.images.length > 0) {
                    $(img_element).attr('src', track.album.images[0])
                } else {
                    // Fallback to last.fm
                    images._setLastFmAlbumImage(track, img_element, size)
                }
            })
        },

        /* Lookup album image on last.fm using the provided Mopidy track. */
        _setLastFmAlbumImage: function (track, img_element, size) {
            if (!track || !(track.album || track.artists)) {
                $(img_element).attr('src', images.DEFAULT_ALBUM_URL)
                return
            }
            size = size || 'extralarge'

            images._getLastFmAlbumInfo(track).then(function (data) {
                for (var i = 0; i < data.album.image.length; i++) {
                    if (data.album.image[i].size === size) {
                        $(img_element).attr('src', data.album.image[i]['#text'] || images.DEFAULT_ALBUM_URL)
                        break
                    }
                }
            }, function (code, message) {
                $(img_element).attr('src', images.DEFAULT_ALBUM_URL)
                console.error('Error getting album info from last.fm (%s: %s)', code, message)
            })
        },

        /**
         * Sets an HTML image element to contain the artist image of the relevant Mopidy track.
         *
         * Potential sources of the artist image will be interrogated in the following order until
         * a suitable image URI is found:
         *      1.) mopidy.library.getImages
         *      2.) last.fm using the artist MusicBrainz ID. If no artist ID is provided, it will be
         *          looked up on last.fm first using the track and album details.
         *      3.) a default image
         *
         * @param {string} artist_uri - The URI of the Mopidy artist to retrieve the image for.
         * @param {string} track_uri - The URI of the Mopidy track that will be used as a fallback
         *                             if the artist URI does not provide any image results.
         * @param {string} img_element - The identifier of the HTML image element that will be used
         *                               to render the image.
         * @param {object} mopidy - The Mopidy.js object that should be used to communicate with the
         *                          Mopidy server.
         * @param {string} size - (Optional) The preferred size of the image. This parameter is only
         *                        used in the last.fm lookups if Mopidy does not provide the image
         *                        directly. Can be one of 'small', 'medium', 'large',
         *                        'extralarge' (default), or 'mega'.
         */
        setArtistImage: function (artist_uri, track_uri, img_element, mopidy, size) {
            // Set default immediately while we're busy retrieving actual image.
            $(img_element).attr('src', images.DEFAULT_ARTIST_URL)
            if (!artist_uri && !track_uri) {
                return
            }
            size = size || 'extralarge'

            if (artist_uri) {
                // Use artist as starting point for retrieving image.
                mopidy.library.getImages({'uris': [artist_uri]}).then(function (imageResults) {
                    var uri = Object.keys(imageResults)[0]
                    if (imageResults[uri].length > 0) {
                        $(img_element).attr('src', imageResults[uri][0].uri)
                    } else {
                        // Fall back to using track as starting point for retrieving image.
                        images._setArtistImageFromTrack(track_uri, img_element, mopidy, size)
                    }
                })
            }
        },

        /* Set artist image using the supplied Mopidy track URI. */
        _setArtistImageFromTrack: function (uri, img_element, mopidy, size) {
            mopidy.library.lookup({'uris': [uri]}).then(function (resultDict) {
                var uri = Object.keys(resultDict)[0]
                var track = resultDict[uri][0]
                var artist = images._getArtistInfo(track)

                if (artist.mbid) {
                    images._setLastFmArtistImage(artist.mbid, img_element, size)
                } else {
                    // Look up unique MusicBrainz ID for artist first using the available track information
                    images._getLastFmArtistInfo(track).then(function (artist) {
                        images._setLastFmArtistImage(artist.mbid, img_element, size)
                    }, function (code, message) {
                        $(img_element).attr('src', images.DEFAULT_ARTIST_URL)
                        console.error('Error retrieving artist info from last.fm. (%s: %s)', code, message)
                    })
                }
            })
        },

        /* Set artist image using the supplied artist MusicBrainz ID. */
        _setLastFmArtistImage: function (mbid, img_element, size) {
            if (!mbid) {
                // Avoid expensive last.fm call if tag information is missing.
                $(img_element).attr('src', images.DEFAULT_ARTIST_URL)
                return
            }
            size = size || 'extralarge'

            images.lastFM.artist.getInfo({mbid: mbid}, {success: function (data) {
                for (var i = 0; i < data.artist.image.length; i++) {
                    if (data.artist.image[i].size === size) {
                        $(img_element).attr('src', data.artist.image[i]['#text'] || images.DEFAULT_ARTIST_URL)
                        break
                    }
                }
            }, error: function (code, message) {
                $(img_element).attr('src', images.DEFAULT_ARTIST_URL)
                console.error('Error retrieving artist info from last.fm. (%s: %s)', code, message)
            }})
        }
    }
    return images
}))
