/**
 * @author Wouter van Wijk
 */

API_KEY = 'b6d34c3af91d62ab0ae00ab1b6fa8733'
API_SECRET = '2c631802c2285d5d5d1502462fe42a2b'

var coverArt = {
    fmcache: new LastFMCache(),
    lastfm: new LastFM({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        cache: this.fmcache
    }),

    getCover: function (uri, images, size) {
        var defUrl = 'images/default_cover.png'
        $(images).attr('src', defUrl)
        if (!uri) {
            return
        }
        mopidy.library.getImages({'uris': [uri]}).then(function (imageResults) {
            var uri = Object.keys(imageResults)[0]
            if (imageResults[uri].length > 0) {
                $(images).attr('src', imageResults[uri][0].uri)
            } else {
                // Also check deprecated 'album.images' in case backend does not
                // implement mopidy.library.getImages yet...
                coverArt.getCoverFromAlbum(uri, images, size)
            }
        })
    },

    // Note that this approach has been deprecated in Mopidy
    // TODO: Remove when Mopidy no longer supports getting images
    //       with 'album.images'.
    getCoverFromAlbum: function (uri, images, size) {
        var defUrl = 'images/default_cover.png'
        $(images).attr('src', defUrl)
        if (!uri) {
            return
        }
        mopidy.library.lookup({'uris': [uri]}).then(function (resultDict) {
            var uri = Object.keys(resultDict)[0]
            var track = resultDict[uri][0]
            if (track && track.album && track.album.images && track.album.images.length > 0) {
                $(images).attr('src', track.album.images[0])
            } else if (track && (track.album || track.artist)) {
                // Fallback to last.fm
                coverArt.getCoverFromLastFm(track, images, size)
            } else {
                return
            }
        })
    },

    getCoverFromLastFm: function (track, images, size) {
        var defUrl = 'images/default_cover.png'
        $(images).attr('src', defUrl)
        if (!track || !(track.album || track.artists)) {
            return
        }
        var albumname = (track.album && track.album.name) ? track.album.name : ''
        var artistname = ''
        if (track.album && track.album.artists && track.album.artists.length > 0) {
            // First look for the artist in the album
            artistname = track.album.artists[0].name
        } else if (track.artists && (track.artists.length > 0)) {
            // Fallback to using artists for specific track
            artistname = track.artists[0].name
        }

        this.lastfm.album.getInfo({artist: artistname, album: albumname}, {success: function (data) {
            for (var i = 0; i < data.album.image.length; i++) {
                if (data.album.image[i].size === size) {
                    $(images).attr('src', data.album.image[i]['#text'] || defUrl)
                }
            }
        }, error: function (code, message) {
            console.error('Error retrieving album info from last.fm', code, message)
        }})
    },

    getArtistImage: function (artist, images, size) {
        var defUrl = 'images/user_24x32.png'
        $(images).attr('src', defUrl)
        if (!artist || artist.length === 0) {
            return
        }
        this.lastfm.artist.getInfo({artist: artist}, {success: function (data) {
            for (var i = 0; i < data.artist.image.length; i++) {
                if (data.artist.image[i].size === size) {
                    $(images).attr('src', data.artist.image[i]['#text'] || defUrl)
                }
            }
        }, error: function (code, message) {
            console.error('Error retrieving artist info from last.fm', code, message)
        }})
    }
}

$(document).ready(coverArt.init)

// TODO: Remove this once JavaScript codebase has been completely modularized
//       in favour of bundling everything using 'browserify'.
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = coverArt
    }
}
