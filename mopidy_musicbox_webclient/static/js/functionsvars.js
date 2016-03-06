/**
 * @author Wouter van Wijk
 *
 * all kinds functions and vars
 */

var mopidy

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
var popupData = {}
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
var playlists = {}
var currentplaylist
var customTracklists = []

var browseStack = []
var browseTracks = []

var ua = navigator.userAgent
var isMobileSafari = /Mac/.test(ua) && /Mobile/.test(ua)
var isMobileWebkit = /WebKit/.test(ua) && /Mobile/.test(ua)
var isMobile = /Mobile/.test(ua)
var isWebkit = /WebKit/.test(ua)

// constants
PROGRAM_NAME = 'MusicBox'
ARTIST_TABLE = '#artiststable'
ALBUM_TABLE = '#albumstable'
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
PLAY_NOW_SEARCH = 5

MAX_TABLEROWS = 50

// the first part of Mopidy extensions which serve radio streams
var radioExtensionsList = ['somafm', 'tunein', 'dirble', 'audioaddict']

var uriClassList = [
    ['spotify', 'fa-spotify'],
    ['spotifytunigo', 'fa-spotify'],
    ['local', 'fa-file-sound-o'],
    ['m3u', 'fa-file-sound-o'],
    ['podcast', 'fa-rss-square'],
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

var uriHumanList = [
    ['spotify', 'Spotify'],
    ['spotifytunigo', 'Spotify Browse'],
    ['local', 'Local Files'],
    ['m3u', 'Local Playlists'],
    ['podcast', 'Podcasts'],
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
    var tmp = '<ul class="songsOfAlbum table" >'
    var liId = ''
    var targetmin = target.substr(1)
    $(target).empty()
    for (var i = 0; i < pl.length; i++) {
        popupData[pl[i].uri] = pl[i]
        liID = targetmin + '-' + pl[i].uri
        tmp += renderSongLi(pl[i], liID, uri)
    }
    tmp += '</ul>'
    $(target).html(tmp)
    $(target).attr('data', uri)
}

function renderSongLi (song, liID, uri, tlid, renderAlbumInfo) {
    var name, iconClass
    var tlidString = ''
    var tlidParameter = ''
    var onClick = ''
    // Determine if the song line item will be rendered as part of an album.
    if (!song.album || !song.album.name) {
        iconClass = getMediaClass(song.uri)
    } else {
        iconClass = 'trackname'
    }
    // Play by tlid if available.
    if (tlid) {
        tlidString = '" tlid="' + tlid
        tlidParameter = '\',\'' + tlid
        onClick = 'return playTrackQueueByTlid(\'' + song.uri + '\',\'' + tlid + '\');'
    } else {
        onClick = 'return playTrackByUri(\'' + song.uri + '\',\'' + uri + '\');'
    }
    songLi = '<li class="song albumli" id="' + liID + tlidString + '">' +
             '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + song.uri + tlidParameter + '\');">' +
             '<i class="fa fa-ellipsis-v"></i></a>' +
             '<a href="#" onclick="' + onClick + '">' +
             '<h1><i class="' + iconClass + '"></i>' + song.name + '</h1>'
    if (renderAlbumInfo) {
        songLi += '</p>'
        songLi += renderSongLiTrackArtists(song)
        if (song.album && song.album.name) {
            songLi += ' - '
            songLi += '<em>' + song.album.name + '</em></p>'
        }
    }
    songLi += '</a></li>'
    return songLi
}

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

function isNewAlbumSection (track, previousTrack) {
    // 'true' if album name is either not defined or has changed from the previous track.
    return !track.album || !track.album.name || !previousTrack || !previousTrack.album || !previousTrack.album.name ||
           track.album.name !== previousTrack.album.name
}

function isMultiTrackAlbum (track, nextTrack) {
    // 'true' if there are more tracks of the same album after this one.
    return nextTrack.album && nextTrack.album.name && track.album && track.album.name && track.album.name === nextTrack.album.name
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

function resultsToTables (results, target, uri) {
    if (!results) {
        return
    }
    $(target).html('')
    $(target).attr('data', uri)

    var track, previousTrack, nextTrack, tlid
    var albumTrackSeen = 0
    var renderAlbumInfo = true
    var liID = ''
    // Keep a list of track URIs for retrieving of covers
    var coversList = []

    var html = ''
    var tableid, artistname, name, iconClass
    var targetmin = target.substr(1)
    var length = 0 || results.length

    // Break into albums and put in tables
    for (i = 0; i < length; i++) {
        previousTrack = track
        track = results[i]
        tlid = ''
        if (i < length - 1) {
            nextTrack = results[i + 1]
        }
        if ('tlid' in results[i]) {
            // Get track information from TlTrack instance
            track = results[i].track
            tlid = results[i].tlid
            if (i < length - 1) {
                nextTrack = results[i + 1].track
            }
        }
        track.name = validateTrackName(track, i)
        // Leave out unplayable items
        if (track.name.substring(0, 12) === '[unplayable]') {
            continue
        }
        // Streams
        if (track.length === -1) {
            html += '<li class="albumli"><a href="#"><h1><i class="' + getMediaClass(track.uri) + '"></i> ' + track.name + ' [Stream]</h1></a></li>'
            continue
        }

        if (isNewAlbumSection(track, previousTrack)) {
            // Starting to render a new album in the list.
            tableid = 'art' + i
            // Render differently if part of an album
            if (i < length - 1 && isMultiTrackAlbum(track, nextTrack)) {
                // Large divider with album cover
                renderAlbumInfo = false
                html += '<li class="albumdivider">'
                html += '<a href="#" onclick="return showAlbum(\'' + track.album.uri + '\');">' +
                '<img id="' + targetmin + '-cover-' + i + '" class="artistcover" width="30" height="30" />' +
                '<h1><i class="' + getMediaClass(track.uri) + '"></i> ' + track.album.name + '</h1><p>'
                html += renderSongLiTrackArtists(track)
                html += '</p></a></li>'
                coversList.push([track.uri, i])
            } else {
                renderAlbumInfo = true
                if (i > 0) {
                    // Small divider
                    html += '<li class="smalldivider"> &nbsp;</li>'
                }
            }
            albumTrackSeen = 0
        }
        popupData[track.uri] = track
        liID = targetmin + '-' + track.uri
        html += renderSongLi(track, liID, uri, tlid, renderAlbumInfo)
        albumTrackSeen += 1
    }
    tableid = '#' + tableid
    $(target).html(html)
    // Retrieve album covers
    for (i = 0; i < coversList.length; i++) {
        getCover(coversList[i][0], target + '-cover-' + coversList[i][1], 'small')
    }
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
        return (full_track_data || false) ? tracks : getUris(tracks)
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
        if (scheme === uriHumanList[i][0]) {
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
