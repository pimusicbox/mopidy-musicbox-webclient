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

var playlisttracksScroll
var playlistslistScroll

var STREAMS_PLAYLIST_NAME = '[Radio Streams]'
var STREAMS_PLAYLIST_SCHEME = 'm3u'
var uriSchemes = {}

// array of cached playlists (not only user-playlists, also search, artist, album-playlists)
var playlists = {}  // TODO: Refactor into one shared cache
var currentplaylist
var customTracklists = []  // TODO: Refactor into one shared cache

var browseStack = []

var ua = navigator.userAgent
var isMobileSafari = /Mac/.test(ua) && /Mobile/.test(ua)
var isMobileWebkit = /WebKit/.test(ua) && /Mobile/.test(ua)
var isMobile = /Mobile/.test(ua)
var isWebkit = /WebKit/.test(ua)

// constants
PROGRAM_NAME = 'MusicBox'
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

// the first part of Mopidy extensions which serve radio streams
var radioExtensionsList = ['somafm', 'tunein', 'dirble', 'audioaddict']

var uriClassList = [
    ['spotify', 'fa-spotify'],
    ['spotifytunigo', 'fa-spotify'],
    ['local', 'fa-file-sound-o'],
    ['file', 'fa-folder-o'],
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
    ['local', 'Local files'],
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

function scrollToTop () {
    var divtop = 0
    $('body,html').animate({
        scrollTop: divtop
    }, 250)
}

function scrollToTracklist () {
    var divtop = $('#playlisttracksdiv').offset().top - 120
    $('body,html').animate({
        scrollTop: divtop
    }, 250)
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
    for (var i = 0; i < artists.length && i < max; i++) {
        if (artists[i].name) {
            if (i > 0) {
                result += ', '
            }
            result += artists[i].name
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
    // Leave out unplayable items
    if (track.name.substring(0, 12) === '[unplayable]') {
        return html
    }
    // Streams
    if (track.length === -1) {
        html += '<li class="albumli"><a href="#"><h1><i class="' + getMediaClass(track.uri) + '"></i> ' + track.name + ' [Stream]</h1></a></li>'
        return html
    }

    if (target === CURRENT_PLAYLIST_TABLE && typeof tlid === 'number' && tlid >= 0) {  // Current queue: Show popup menu icon. onClick plays track.
        tlidParameter = '\',\'' + tlid
        onClick = 'return controls.playQueueTrack(' + tlid + ');'
    } else {  // All other tracklist: Show default action icon. onClick performs default action
        onClick = 'return controls.playTracks(\'\', mopidy, \'' + track.uri + '\', \'' + uri + '\');'
    }

    html +=
        '<li class="song albumli" id="' + getjQueryID(target, track.uri) + '" tlid="' + tlid + '">' +
        '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + track.uri + tlidParameter + '\');">' +
        '<i class="fa fa-play-circle-o"></i></a>' +
        '<a href="#" onclick="' + onClick + '"><h1><i class="' + getMediaClass(track.uri) + '"></i> ' + track.name + '</h1>'

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
        html +=
            '<li class="albumdivider"><a href="#" onclick="return library.showAlbum(\'' + track.album.uri + '\');">' +
            '<img id="' + getjQueryID(target + '-cover', track.uri) + '" class="artistcover" width="30" height="30"/>' +
            '<h1><i class="' + getMediaClass(track.uri) + '"></i> ' + track.album.name + '</h1><p>' +
            renderSongLiTrackArtists(track) + '</p></a></li>'
        // Retrieve album covers
        images.setAlbumImage(track.uri, getjQueryID(target + '-cover', track.uri, true), mopidy, 'small')
    } else if (previousTrack && !hasSameAlbum(previousTrack, track)) {
        // Small divider
        html += '<li class="smalldivider"> &nbsp;</li>'
    }
    if (typeof target !== 'undefined' && target.length > 0) {
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

// process updated playlist to gui
function playlisttotable (pl, target, uri) {
    var tmp = ''
    $(target).html('')
    var targetmin = target.substr(1)
    var child = ''
    for (var i = 0; i < pl.length; i++) {
        if (pl[i]) {
            popupData[pl[i].uri] = pl[i]
            child = '<li id="' + targetmin + '-' + pl[i].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + pl[i].uri + '\');">'
            child += '<h1>' + pl[i].name + 'h1>'
            child += '<p>'
            child += '<span style="float: right;">' + timeFromSeconds(pl[i].length / 1000) + '</span>'
            for (var j = 0; j < pl[i].artists.length; j++) {
                if (pl[i].artists[j]) {
                    child += pl[i].artists[j].name
                    child += (j === pl[i].artists.length - 1) ? '' : ' / '
                    // stop after 3
                    if (j > 2) {
                        child += '...'
                        break
                    }
                }
            }
            child += ' / <em>' + pl[i].album.name + '</em></p>'
            child += '</a></li>'
            tmp += child
        }
    }

    $(target).html(tmp)
    $(target).attr('data', uri)
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
            text: 'Loading data from ' + PROGRAM_NAME + '. Please wait...',
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
            text: 'Trying to reach ' + PROGRAM_NAME + '. Please wait...',
            textVisible: true,
            theme: 'a'
        })
    } else {
        $.mobile.loading('hide')
    }
}

// from http://dzone.com/snippets/validate-url-regexp
function validUri (str) {
    var regexp = /^(mms|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(str)
}

function validServiceUri (str) {
    return validUri(str) || isServiceUri(str)
}

function getScheme (uri) {
    return uri.split(':')[0].toLowerCase()
}

function isStreamUri (uri) {
    var a = validUri(uri)
    var b = radioExtensionsList.indexOf(getScheme(uri)) >= 0
    return a || b
}

function getMediaClass (uri) {
    var scheme = getScheme(uri)
    for (var i = 0; i < uriClassList.length; i++) {
        if (scheme === uriClassList[i][0]) {
            return 'fa ' + uriClassList[i][1]
        }
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
