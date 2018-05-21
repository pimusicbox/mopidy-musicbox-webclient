/**
 * @author Wouter van Wijk
 *
 * all kinds functions and vars
 */

var mopidy
var syncedProgressTimer

// values for controls
var play = false
var random
var repeat
var consume
var single
var mute
var volumeChanging
var volumeSliding = false

var positionChanging

var initgui = true
var popupData = {}  // TODO: Refactor into one shared cache
var songlength = 0

var artistshtml = ''
var artiststext = ''
var songname = ''
var songdata = {'track': {}, 'tlid': -1}

var pageScrollPos = {}

var STREAMS_PLAYLIST_NAME = '[Radio Streams]'
var STREAMS_PLAYLIST_SCHEME = 'm3u'
var uriSchemes = {}

// array of cached playlists (not only user-playlists, also search, artist, album-playlists)
var playlists = {}  // TODO: Refactor into one shared cache
var currentplaylist
var customTracklists = []  // TODO: Refactor into one shared cache

var browseStack = []

var ua = navigator.userAgent || navigator.vendor || window.opera
var isMobileSafari = /Mac/.test(ua) && /Mobile/.test(ua)
var isMobile = isMobileAll()

// constants
PROGRAM_NAME = $(document.body).data('program-name')
HOSTNAME = $(document.body).data('hostname')
ARTIST_TABLE = '#artiststable'
ALBUM_TABLE = '#albumstable'
BROWSE_TABLE = '#browsetable'
PLAYLIST_TABLE = '#playlisttracks'
CURRENT_PLAYLIST_TABLE = '#currenttable'
SEARCH_ALL_TABLE = '#allresulttable'
SEARCH_ALBUM_TABLE = '#albumresulttable'
SEARCH_ARTIST_TABLE = '#artistresulttable'
SEARCH_TRACK_TABLE = '#trackresulttable'

URI_SCHEME = 'mbw'

PLAY_NOW = 0
PLAY_NEXT = 1
ADD_THIS_BOTTOM = 2
ADD_ALL_BOTTOM = 3
PLAY_ALL = 4
DYNAMIC = 5
INSERT_AT_INDEX = 6

// the first part of Mopidy extensions which serve radio streams
var radioExtensionsList = ['somafm', 'tunein', 'dirble', 'audioaddict']

var uriClassList = [
    ['spotify', 'fa-spotify'],
    ['spotifytunigo', 'fa-spotify'],
    ['spotifyweb', 'fa-spotify'],
    ['local', 'fa-file-sound-o'],
    ['file', 'fa-file-sound-o'],
    ['m3u', 'fa-file-sound-o'],
    ['podcast', 'fa-rss-square'],
    ['podcast+file', 'fa-rss-square'],
    ['podcast+itunes', 'fa-apple'],
    ['dirble', 'fa-microphone'],
    ['tunein', 'fa-headphones'],
    ['soundcloud', 'fa-soundcloud'],
    ['sc', 'fa-soundcloud'],
    ['gmusic', 'fa-google'],
    ['internetarchive', 'fa-university'],
    ['somafm', 'fa-flask'],
    ['youtube', 'fa-youtube'],
    ['yt', 'fa-youtube'],
    ['audioaddict', 'fa-bullhorn'],
    ['subsonic', 'fa-folder-open']
]

// TODO: It should be possible to retrieve a user-friendly name for a given Mopidy scheme dynamically by
//       calling mopidy.library.browse() on the root dir:
//       1. each backend contained in the result will have a 'name' attribute that can be shown as-is in the UI.
//       2. the URI prefix of the backend result should === mopidy.getUriSchemes(), which can be used for the mapping.
//       3. only backends that cannot be 'browsed' (e.g. youtube) should have a static mapping defined here.
var uriHumanList = [
    ['spotify', 'Spotify'],
    ['spotifytunigo', 'Spotify browse'],
    ['spotifyweb', 'Spotify browse'],
    ['local', 'Local media'],
    ['m3u', 'Local playlists'],
    ['podcast', 'Podcasts'],
    ['podcast+itunes', 'iTunes Store: Podcasts'],
    ['dirble', 'Dirble'],
    ['tunein', 'TuneIn'],
    ['soundcloud', 'SoundCloud'],
    ['gmusic', 'Google Music'],
    ['internetarchive', 'Internet Archive'],
    ['somafm', 'Soma FM'],
    ['youtube', 'YouTube'],
    ['audioaddict', 'AudioAddict'],
    ['subsonic', 'Subsonic']
]

// List of Mopidy URI schemes that should not be searched directly.
// Also blacklists 'yt' in favour of using the other 'youtube' supported scheme.
var searchBlacklist = [
    'file',
    'http',
    'https',
    'mms',
    'rtmp',
    'rtmps',
    'rtsp',
    'yt'
]

// List of known audio file extensions
// TODO: consider querying GStreamer for supported audio formats - see:https://discuss.mopidy.com/t/supported-codecs-file-formats/473
var audioExt = [
    'aa', 'aax',  // Audible.com
    'aac',  // Advanced Audio Coding format
    'aiff',  // Apple
    'au',  // Sun Microsystems
    'flac',  // Free Lossless Audio Codec
    'gsm',
    'iklax',
    'ivs',
    'm4a',
    'm4b',
    'm4p',
    'mp3',
    'mpc',  // Musepack
    'ogg', 'oga', 'mogg',  // Ogg-Vorbis
    'opus',  // Internet Engineering Task Force (IETF)
    'ra', 'rm',  // RealAudio
    'raw',
    'tta',  // True Audio
    'vox',
    'wav',
    'wma',  // Microsoft
    'wv',
    'webm'  // HTML5 video
]

function scrollToTop () {
    $('body,html').animate({
        scrollTop: 0
    }, 250)
}

function scrollToTracklist () {
    var divtop = $('#playlisttracksdiv').offset().top - 120
    $('body,html').animate({
        scrollTop: divtop
    }, 250)
}

function isMobileAll () {
    // Checks for known mobile and tablet devices - see http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
    var regexpMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i
    var regexpTablet = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i
    var uaString = ua.substr(0, 4)
    return isMobileSafari || regexpMobile.test(uaString) || regexpTablet.test(uaString)
}

// A hack to find the name of the first artist of a playlist. this is not yet returned by mopidy
// does not work wel with multiple artists of course
function getArtist (pl) {
    for (var i = 0; i < pl.length; i++) {
        for (var j = 0; j < pl[i].artists.length; j++) {
            if (pl[i].artists[j].name !== '') {
                return pl[i].artists[j].name
            }
        }
    }
}

// A hack to find the first album of a playlist. this is not yet returned by mopidy
function getAlbum (pl) {
    for (var i = 0; i < pl.length; i++) {
        if (pl[i].album.name !== '') {
            return pl[i].album.name
        }
    }
}

function artistsToString (artists, max) {
    var result = ''
    max = max || 3
    if (artists && artists.length > 0) {
        for (var i = 0; i < artists.length && i < max; i++) {
            if (artists[i].name) {
                if (i > 0) {
                    result += ', '
                }
                result += artists[i].name
            }
        }
    }
    return result
}

/** ******************************************************
 * break up results and put them in album tables
 *********************************************************/
function albumTracksToTable (pl, target, uri) {
    var track, previousTrack, nextTrack
    var html = ''
    $(target).empty()
    $(target).attr('data', uri)
    for (var i = 0; i < pl.length; i++) {
        previousTrack = track || undefined
        nextTrack = i < pl.length - 1 ? pl[i + 1] : undefined
        track = pl[i]
        popupData[track.uri] = track
        html += renderSongLi(previousTrack, track, nextTrack, uri, '', target, i, pl.length)
    }
    $(target).append(html)
    updatePlayIcons(songdata.track.uri, songdata.tlid, controls.getIconForAction())
}

function renderSongLi (previousTrack, track, nextTrack, uri, tlid, target, currentIndex, listLength) {
    var name
    var tlidParameter = ''
    var onClick = ''
    var html = ''
    track.name = validateTrackName(track, currentIndex)
    // Streams
    if (track.length === -1) {
        html += '<li class="albumli"><a href="#"><h1><i class="' + getMediaClass(track) + '"></i> ' + track.name + ' [Stream]</h1></a></li>'
        return html
    }

    if (target === CURRENT_PLAYLIST_TABLE && typeof tlid === 'number' && tlid >= 0) {  // Current queue: Show popup menu icon. onClick plays track.
        tlidParameter = '\',\'' + tlid
        onClick = 'return controls.playQueueTrack(' + tlid + ');'
    } else {  // All other tracklist: Show default action icon. onClick performs default action
        onClick = 'return controls.playTracks(\'\', mopidy, \'' + track.uri + '\', \'' + uri + '\');'
    }

    html += '<li class="song albumli" id="' + getjQueryID(target, track.uri) + '" tlid="' + tlid + '">'
    if (isPlayable(track)) {
        // Show popup icon for audio files or 'tracks' of other scheme types
        html += '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + track.uri + tlidParameter + '\');">' +
        '<i class="fa fa-play-circle-o"></i></a>'
    }
    html += '<a href="#" onclick="' + onClick + '"><h1><i class="' + getMediaClass(track) + '"></i> ' + track.name + '</h1>'

    if (listLength === 1 || (!hasSameAlbum(previousTrack, track) && !hasSameAlbum(track, nextTrack))) {
        html += renderSongLiAlbumInfo(track)
    }
    html += '</a></li>'
    return html
}

/* Tracklist renderer for track artist and album name. */
function renderSongLiAlbumInfo (track, target) {
    var html = renderSongLiTrackArtists(track)
    if (track.album && track.album.name) {
        html += ' - <em>' + track.album.name + '</em></p>'
    }
    if (typeof target !== 'undefined' && target.length > 0) {
        target = getjQueryID(target, track.uri, true)
        $(target).children('a').eq(1).append(html)
    }
    return html
}

/* Tracklist renderer for track artist information. */
function renderSongLiTrackArtists (track) {
    var html = ''
    if (track.artists) {
        for (var i = 0; i < track.artists.length; i++) {
            html += track.artists[i].name
            html += (i === track.artists.length - 1) ? '' : ' / '
            // Stop after 3
            if (i > 2) {
                html += '...'
                break
            }
        }
    }
    return html
}

/* Tracklist renderer to insert dividers between albums. */
function renderSongLiDivider (previousTrack, track, nextTrack, target) {
    var html = ''
    // Render differently if part of an album.
    if (!hasSameAlbum(previousTrack, track) && hasSameAlbum(track, nextTrack)) {
        // Large divider with album cover.
        showAlbum = ''
        if (typeof track.album.uri !== 'undefined') {
            showAlbum = 'onclick="return library.showAlbum(\'' + track.album.uri + '\', mopidy);"'
        }
        html +=
            '<li class="albumdivider"><a href="#" ' + showAlbum + '>' +
            '<img id="' + getjQueryID(target + '-cover', track.uri) + '" class="artistcover" width="30" height="30"/>' +
            '<h1>' + track.album.name + '</h1><p>' +
            renderSongLiTrackArtists(track) + '</p></a></li>'
        // Retrieve album covers
        images.setAlbumImage(track.uri, getjQueryID(target + '-cover', track.uri, true), mopidy, 'small')
    } else if (previousTrack && !hasSameAlbum(previousTrack, track)) {
        // Small divider
        html += '<li class="smalldivider"> &nbsp;</li>'
    }
    if (html.length > 0 && typeof target !== 'undefined' && target.length > 0) {
        target = getjQueryID(target, track.uri, true)
        $(target).before(html)
    }
    return html
}

function renderSongLiBackButton (results, target, onClick, optional) {
    if (onClick && onClick.length > 0) {
        if (!results || results.length === 0) {
            $(target).empty()
            $(target).append(
                '<li class="song albumli"><a href="#" onclick="' + onClick + '"><h1><i></i>No tracks found...</h1></a></li>'
            )
        }
        var opt = ''
        if (optional) {
            opt = ' backnav-optional'
        }
        $(target).prepend(
            '<li class="backnav' + opt + '"><a href="#" onclick="' + onClick + '"><h1><i class="fa fa-arrow-circle-left"></i> Back</h1></a></li>'
        )
    }
}

function hasSameAlbum (track1, track2) {
    // 'true' if album for each track exists and has the same name
    var name1 = track1 ? (track1.album ? track1.album.name : undefined) : undefined
    var name2 = track2 ? (track2.album ? track2.album.name : undefined) : undefined
    return name1 && name2 && (name1 === name2)
}

function validateTrackName (track, trackNumber) {
    // Create name if there is none
    var name = ''
    if (!track.name || track.name === '') {
        name = track.uri.split('/')
        name = decodeURI(name[name.length - 1]) || 'Track ' + String(trackNumber)
    } else {
        name = track.name
    }
    return name
}

function resultsToTables (results, target, uri, onClickBack, backIsOptional) {
    $(target).empty()
    renderSongLiBackButton(results, target, onClickBack, backIsOptional)
    if (!results || results.length === 0) {
        return
    }
    $(target).attr('data', uri)

    var track, previousTrack, nextTrack, tlid
    var html = ''

    // Break into albums and put in tables
    for (i = 0; i < results.length; i++) {
        previousTrack = track || undefined
        nextTrack = i < results.length - 1 ? results[i + 1] : undefined
        track = results[i]
        if (track) {
            if ('tlid' in track) {
                // Get track information from TlTrack instance
                tlid = track.tlid
                track = track.track
                nextTrack = nextTrack ? nextTrack.track : undefined
            }
            popupData[track.uri] = track
            html += renderSongLiDivider(previousTrack, track, nextTrack, target)
            html += renderSongLi(previousTrack, track, nextTrack, uri, tlid, target, i, results.length)
        }
    }
    $(target).append(html)
    updatePlayIcons(songdata.track.uri, songdata.tlid, controls.getIconForAction())
}

function getPlaylistTracks (uri) {
    if (playlists[uri] && playlists[uri].tracks) {
        return Mopidy.when(playlists[uri].tracks)
    } else {
        showLoading(true)
        return mopidy.playlists.getItems({'uri': uri}).then(function (refs) {
            return processPlaylistItems({'uri': uri, 'items': refs})
        }, console.error)
    }
}

function getUris (tracks) {
    var results = []
    for (var i = 0; i < tracks.length; i++) {
        results.push(tracks[i].uri)
    }
    return results
}

function getTracksFromUri (uri, full_track_data) {
    var returnTracksOrUris = function (tracks) {
        return full_track_data ? tracks : getUris(tracks)
    }
    if (customTracklists[uri]) {
        return returnTracksOrUris(customTracklists[uri])
    } else if (playlists[uri] && playlists[uri].tracks) {
        return returnTracksOrUris(playlists[uri].tracks)
    }
    return []
}

// convert time to human readable format
function timeFromSeconds (length) {
    var d = Number(length)
    var h = Math.floor(d / 3600)
    var m = Math.floor(d % 3600 / 60)
    var s = Math.floor(d % 3600 % 60)
    return ((h > 0 ? h + ':' : '') + (m > 0 ? (h > 0 && m < 10 ? '0' : '') + m + ':' : '0:') + (s < 10 ? '0' : '') + s)
}

/** ***** Toast ***/
function toast (message, delay, textOnly) {
    textOnl = textOnly || false
    message = message || 'Loading...'
    delay = delay || 1000
    $.mobile.loading('show', {
        text: message,
        textVisible: true,
        theme: 'a',
        textonly: textOnl
    })
    if (delay > 0) {
        setTimeout(function () {
            $.mobile.loading('hide')
        }, delay)
    }
}

/** ****************
 * Modal dialogs  *
 ******************/
function showLoading (on) {
    if (on) {
        $('body').css('cursor', 'progress')
        $.mobile.loading('show', {
            text: 'Loading data from ' + PROGRAM_NAME + ' on ' + HOSTNAME + '. Please wait...',
            textVisible: true,
            theme: 'a'
        })
    } else {
        $('body').css('cursor', 'default')
        $.mobile.loading('hide')
    }
}

function showOffline (on) {
    if (on) {
        $.mobile.loading('show', {
            text: 'Trying to reach ' + PROGRAM_NAME + ' on ' + HOSTNAME + '. Please wait...',
            textVisible: true,
            theme: 'a'
        })
    } else {
        $.mobile.loading('hide')
    }
}

// from http://dzone.com/snippets/validate-url-regexp
function validUri (uri) {
    var regexp = /^(http|https|mms|rtmp|rtmps|rtsp):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(uri)
}

function validServiceUri (str) {
    return validUri(str) || isServiceUri(str)
}

function getScheme (uri) {
    return uri.split(':')[0].toLowerCase()
}

function isPlayable (track) {
    if (typeof track.type === 'undefined' || track.type === 'track') {
        if (track.uri && getScheme(track.uri) === 'file') {
            var ext = track.uri.split('.').pop().toLowerCase()
            if ($.inArray(ext, audioExt) === -1) {
                // Files must have the correct extension
                return false
            }
        }
        return true
    }
    return false
}

function isStreamUri (uri) {
    return validUri(uri) || radioExtensionsList.indexOf(getScheme(uri)) >= 0
}

function getMediaClass (track) {
    var defaultIcon = 'fa-file-sound-o'
    var type = track.type
    if (typeof type === 'undefined' || type === 'track') {
        if (!isPlayable(track)) {
            return 'fa fa-file-o'  // Unplayable file
        } else if (isStreamUri(track.uri)) {
            return 'fa fa-rss'  // Stream
        }
    } else if (type === 'directory') {
        return 'fa fa-folder-o'
    } else if (type === 'album') {
        // return 'fa fa-bullseye'  // Album
        defaultIcon = 'fa-folder-o'
    } else if (type === 'artist') {
        // return 'fa fa-user-circle-o'  // Artist
        defaultIcon = 'fa-folder-o'
    } else if (type === 'playlist') {
        // return 'fa fa-star'  // Playlist
    }
    if (track.uri) {
        var scheme = getScheme(track.uri)
        for (var i = 0; i < uriClassList.length; i++) {
            if (scheme === uriClassList[i][0]) {
                return 'fa ' + uriClassList[i][1]
            }
        }
        return 'fa ' + defaultIcon
    }
    return ''
}

function getMediaHuman (uri) {
    var scheme = getScheme(uri)
    for (var i = 0; i < uriHumanList.length; i++) {
        if (scheme.toLowerCase() === uriHumanList[i][0].toLowerCase()) {
            return uriHumanList[i][1]
        }
    }
    return ''
}

function isServiceUri (uri) {
    var scheme = getScheme(uri)
    var i = 0
    for (i = 0; i < uriClassList.length; i++) {
        if (scheme === uriClassList[i][0]) {
            return true
        }
    }
    for (i = 0; i < radioExtensionsList.length; i++) {
        if (scheme === radioExtensionsList[i]) {
            return true
        }
    }
    return false
}

function isFavouritesPlaylist (playlist) {
    return (playlist.name === STREAMS_PLAYLIST_NAME &&
            getScheme(playlist.uri) === STREAMS_PLAYLIST_SCHEME)
}

function isSpotifyStarredPlaylist (playlist) {
    var starredRegex = /spotify:user:.*:starred/g
    return (starredRegex.test(playlist.uri) && playlist.name === 'Starred')
}

// Returns a string where {x} in template is replaced by tokens[x].
function stringFromTemplate (template, tokens) {
    return template.replace(/{[^}]+}/g, function (match) {
        return tokens[match.slice(1, -1)]
    })
}

/**
 * Converts a URI to a jQuery-safe identifier. jQuery identifiers need to be
 * unique per page and cannot contain special characters.
 *
 * @param {string} identifier - Identifier string to prefix to the URI. Can
 * be used to ensure that the generated ID will be unique for the page that
 * it will be included on. Also accepts jQuery identifiers starting with '#'.
 *
 * @param {string} uri - URI to encode, usually the URI of a Mopidy track.
 *
 * @param {boolean} includePrefix - Will prefix the generated identifier
 * with the '#' character if set to 'true', ready to be passed to $() or
 * jQuery().
 *
 * @return {string} - a string in the format '[#]identifier-encodedURI' that
 * is safe to use as a jQuery identifier.
 */
function getjQueryID (identifier, uri, includePrefix) {
    if (identifier.charAt(0) === '#' && !includePrefix) {
        identifier = identifier.substr(1)
    } else if (identifier.charAt(0) !== '#' && includePrefix) {
        identifier = '#' + identifier
    }
    return identifier + '-' + fixedEncodeURIComponent(uri).replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '')  // eslint-disable-line no-useless-escape
}

// Strict URI encoding as per https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function fixedEncodeURIComponent (str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16)
    })
}
