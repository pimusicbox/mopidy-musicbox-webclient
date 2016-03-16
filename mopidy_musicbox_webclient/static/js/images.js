/**
 * @author Wouter van Wijk
 */

API_KEY = 'b6d34c3af91d62ab0ae00ab1b6fa8733'
API_SECRET = '2c631802c2285d5d5d1502462fe42a2b'

var fmcache
var lastfm

$(window).load(function () {
    // create a Cache object
    fmcache = new LastFMCache()
    // create a LastFM object
    lastfm = new LastFM({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        cache: fmcache
    })
})

function getCover (uri, images, size) {
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
            getCoverFromAlbum(uri, images, size)
        }
    })
}

// Note that this approach has been deprecated in Mopidy
// TODO: Remove when Mopidy no longer supports getting images
//       with 'album.images'.
function getCoverFromAlbum (uri, images, size) {
    mopidy.library.lookup({'uris': [uri]}).then(function (resultDict) {
        var uri = Object.keys(resultDict)[0]
        var track = resultDict[uri][0]
        if (track.album && track.album.images && (track.album.images.length > 0)) {
            $(images).attr('src', track.album.images[0])
        } else {
            // Fallback to last.fm
            getCoverFromLastFm(track, images, size)
        }
    })
}

function getCoverFromLastFm (track, images, size) {
    var defUrl = 'images/default_cover.png'
    if (!(track.album || track.artist)) {
        return
    }
    var albumname = track.album.name || ''
    var artistname = ''
    if (track.album.artists && (track.album.artists.length > 0)) {
        // First look for the artist in the album
        artistname = track.album.artists[0].name
    } else if (track.artists && (track.artists.length > 0)) {
        // Fallback to using artists for specific track
        artistname = track.artists[0].name
    }

    lastfm.album.getInfo({artist: artistname, album: albumname},
        { success: function (data) {
            for (var i = 0; i < data.album.image.length; i++) {
                if (data.album.image[i].size === size) {
                    $(images).attr('src', data.album.image[i]['#text'] || defUrl)
                }
            }
        }
    }, $(images).attr('src', defUrl))
}

function getArtistImage (nwartist, image, size) {
    var defUrl = 'images/user_24x32.png'
    lastfm.artist.getInfo({artist: nwartist}, {success: function (data) {
        for (var i = 0; i < data.artist.image.length; i++) {
            if (data.artist.image[i].size === size) {
                $(image).attr('src', data.artist.image[i]['#text'] || defUrl)
            }
        }
    }}, $(images).attr('src', defUrl))
}
