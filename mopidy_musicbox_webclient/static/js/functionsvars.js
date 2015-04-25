/**
 * @author Wouter van Wijk
 *
 * all kinds functions and vars
 */

var baseurl = '/mopidy';
var host = window.location.hostname;
var port = window.location.port;
var wsurl = host + ':' + port + baseurl
var intv;
var socket;
var mopidy;

//values for controls
var play = false;
var random;
var repeat;
var consume;
var single;
var currentVolume = -1;
var muteVolume = -1;
var volumeChanging = false;
var posChanging = false;

var posTimer;
var volumeTimer;
var seekTimer;
var initgui = true;
var currentpos = 0;
var popupData = {};
var songlength = 0;

var artistshtml = '';
var artiststext = '';
var songname = '';
var songdata = {'track':{}, 'tlid':-1};
var newposition = 0;

var playlisttracksScroll;
var playlistslistScroll;

//array of cached playlists (not only user-playlists, also search, artist, album-playlists)
var playlists = {};
var currentplaylist;
var customPlaylists = [];
var customTracklists = [];

var browseStack = [];
var browseTracks = [];

var ua = navigator.userAgent,
    isMobileSafari = /Mac/.test(ua) && /Mobile/.test(ua),
    isMobileWebkit = /WebKit/.test(ua) && /Mobile/.test(ua),
    isMobile = /Mobile/.test(ua),
    isWebkit = /WebKit/.test(ua);

//constants
PROGRAM_NAME = 'MusicBox';
//PROGRAM_NAME = 'Mopidy';
ARTIST_TABLE = '#artiststable';
ALBUM_TABLE = '#albumstable';
PLAYLIST_TABLE = '#playlisttracks';
CURRENT_PLAYLIST_TABLE = '#currenttable';
SEARCH_ALL_TABLE = '#allresulttable';
SEARCH_ALBUM_TABLE = '#albumresulttable';
SEARCH_ARTIST_TABLE = '#artistresulttable';
SEARCH_TRACK_TABLE = '#trackresulttable';

PLAY_NOW = 0;
PLAY_NEXT = 1;
ADD_THIS_BOTTOM = 2;
ADD_ALL_BOTTOM = 3;
PLAY_ALL = 4;

MAX_TABLEROWS = 50;

//update track slider timer, milliseconds
TRACK_TIMER = 1000;

//check status timer, every 5 or 10 sec
STATUS_TIMER = 10000;

// the first part of Mopidy extensions which serve radio streams
var radioExtensionsList = ['somafm', 'tunein', 'dirble', 'audioaddict'];

var uriClassList = [
    ['spotify', 'fa-spotify'],
    ['spotifytunigo', 'fa-spotify'],
    ['local', 'fa-file-sound-o'],
    ['podcast', 'fa-rss-square'],
    ['dirble', 'fa-microphone'],
    ['tunein', 'fa-headphones'],
    ['gs', 'fa-music'],
    ['soundcloud', 'fa-soundcloud'],
    ['sc', 'fa-soundcloud'],
    ['gmusic', 'fa-google'],
    ['internetarchive', 'fa-university'],
    ['somafm', 'fa-flask'],
    ['youtube', 'fa-youtube'],
    ['yt', 'fa-youtube'],
    ['audioaddict', 'fa-bullhorn'],
    ['subsonic', 'fa-folder-open']
];

var uriHumanList = [
    ['spotify', 'Spotify'],
    ['spotifytunigo', 'Spotify Browse'],
    ['local', 'Local Files'],
    ['grooveshark', 'Grooveshark'],
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
];

function scrollToTop() {
    var divtop = 0;
    $('body,html').animate({
        scrollTop: divtop
    }, 250);
}

function scrollToTracklist() {
    /*    if (isMobileWebkit) {
        playlistslistScroll.refresh();
    }
*/
    var divtop = $("#playlisttracksdiv").offset().top - 50;
    $('body,html').animate({
        scrollTop: divtop
    }, 250);
}

//A hack to find the name of the first artist of a playlist. this is not yet returned by mopidy
//does not work wel with multiple artists of course
function getArtist(pl) {
    for (var i = 0; i < pl.length; i++) {
        for (var j = 0; j < pl[i].artists.length; j++) {
            if (pl[i].artists[j].name != '') {
                return pl[i].artists[j].name;
            }
        }
    };
}

//A hack to find the first album of a playlist. this is not yet returned by mopidy
function getAlbum(pl) {
    for (var i = 0; i < pl.length; i++) {
        if (pl[i].album.name != '') {
            return pl[i].album.name;
        }
    };
}

/********************************************************
 * break up results and put them in album tables
 *********************************************************/
function albumTracksToTable(pl, target, uri) {
    var tmp = '<ul class="songsOfAlbum table" >';
    var liId = '';
    var targetmin = target.substr(1);
    $(target).empty();
    for (var i = 0; i < pl.length; i++) {
        popupData[pl[i].uri] = pl[i];
        liID = targetmin + '-' + pl[i].uri;
        tmp += renderSongLi(pl[i], liID, uri);
    };
    tmp += '</ul>';
    $(target).html(tmp);
    $(target).attr('data', uri);
}

function renderSongLi(song, liID, uri) {
    var name;
    if (!song.name || song.name == '') {
        name = uri.split('/');
        name = decodeURI(name[name.length - 1]);
    } else {
        name = song.name;
    }
    //    var iconClass = getMediaClass(liID.split('-')[1]);
    songLi = '<li class="song albumli" id="' + liID + '">' +
             '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + song.uri + '\');">' +
             '<i class="fa fa-ellipsis-v"></i></a>' +
             '<a href="#" onclick="return playTrackByUri(\'' + song.uri + '\',\'' + uri + '\');">' +
             // '<h1 class="trackname"><i class="' + iconClass + '"></i> ' + name + '</h1>' +
             '<h1 class="trackname">' + name + '</h1></a>' +
             '</li>';
    return songLi;
}

function renderQueueSongLi(song, liID, uri, tlid) {
    var name;
    if (!song.name || song.name == '') {
        name = uri.split('/');
        name = decodeURI(name[name.length - 1]);
    } else {
        name = song.name;
    }
    //    var iconClass = getMediaClass(liID.split('-')[1]);
    songLi = '<li class="song albumli" id="' + liID + '" tlid="' + tlid + '">' +
             '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + song.uri + '\',\'' + tlid + '\');">' +
             '<i class="fa fa-ellipsis-v"></i></a>' +
             '<a href="#" onclick="return playTrackQueueByTlid(\'' + song.uri + '\',\'' + tlid + '\');">' +
             // '<h1 class="trackname"><i class="' + iconClass + '"></i> ' + name + '</h1>' +
             '<h1 class="trackname">' + name + '</h1></a>' +
             '</li>';
    return songLi;
}

function resultsToTables(results, target, uri) {
    if (!results) {
        return
    }
    var tlids = [];
    if (target == CURRENT_PLAYLIST_TABLE) {
        for (i = 0; i < results.length; i++) {
            tlids[i] = results[i].tlid;
            results[i] = results[i].track;
        }
    }

    var newalbum = [];
    var newtlids = [];
    //keep a list of albums for retreiving of covers
    var coversList = [];
    var nextname = '';
    var count = 0;
    $(target).html('');

    //break into albums and put in tables
    var html = '';
    var tableid, j, artistname, alburi, name, iconClass;
    var targetmin = target.substr(1);
    $(target).attr('data', uri);
    var length = 0 || results.length;
    for (i = 0; i < length; i++) {
        //create album if none extists
        if (!results[i].album) {
            results[i].album = {};
        }
        //create album uri if there is none
        if (!results[i].album.uri) {
            results[i].album.uri = 'x';
        }
        if (!results[i].album.name) {
            results[i].album.name = '';
        }
        //create name if there is no one
        if (!results[i].name || results[i].name == '') {
            name = results[i].uri.split('/');
            results[i].name = decodeURI(name[name.length - 1]) || 'Track ' + String(i);
        }

        //leave out unplayable items
        if (results[i].name.substring(0, 12) == '[unplayable]') continue;

        newalbum.push(results[i]);
        newtlids.push(tlids[i]);
        nextname = '';
        if ((i < length - 1) && results[i + 1].album && results[i + 1].album.name) {
            nextname = results[i + 1].album.name;
        }
        if (results[i].length == -1) {
            html += '<li class="albumli"><a href="#"><h1><i class="' + iconClass + '"></i> ' + results[i].name + ' [Stream]</h1></a></li>';
            newalbum = [];
            newtlids = [];
            nextname = '';
        } else {
            if ((results[i].album.name != nextname) || (nextname == '')) {
                tableid = 'art' + i;
                //render differently if only one track in the album
                if (newalbum.length == 1) {
                    if (i != 0) {
                        html += '<li class="smalldivider"> &nbsp;</li>';
                    }
                    iconClass = getMediaClass(newalbum[0].uri);
                    var liID = targetmin + '-' + newalbum[0].uri;
                    if (target == CURRENT_PLAYLIST_TABLE) {
                        html += '<li class="song albumli" id="' + liID + '" tlid="' + newtlids[0] + '">' +
                                '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + newalbum[0].uri + '\',\'' + newtlids[0] + '\');">' +
                                '<i class="fa fa-ellipsis-v"></i></a>' +
                                '<a href="#" onclick="return playTrackQueueByTlid(\'' + newalbum[0].uri + '\',\'' + newtlids[0] + '\');">' +
                                '<h1><i class="' + iconClass + '"></i> ' + newalbum[0].name + "</h1><p>";
                    } else {
                        html += '<li class="song albumli" id="' + liID + '">' +
                                '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\',\'' + newalbum[0].uri + '\');">' +
                                '<i class="fa fa-ellipsis-v"></i></a>' +
                                '<a href="#" onclick="return playTrackByUri(\'' + newalbum[0].uri + '\',\'' + uri + '\');">' +
                                '<h1><i class="' + iconClass + '"></i> ' + newalbum[0].name + "</h1><p>";
                    }

                    /*                 '<span style="float: right;">' + timeFromSeconds(newalbum[0].length / 1000) + '</span>'; */
                    if (newalbum[0].artists) {
                        for (j = 0; j < newalbum[0].artists.length; j++) {
                            html += newalbum[0].artists[j].name;
                            html += (j == newalbum[0].artists.length - 1) ? '' : ' / ';
                            //stop after 3
                            if (j > 2) {
                                html += '...';
                                break;
                            }
                        }
                    }
                    if (newalbum[0].album.name != '') {
                        html += ' / ';
                    }
                    html += '<em>' + newalbum[0].album.name + '</em></p>';
                    html += '</a></li>';

                    popupData[newalbum[0].uri] = newalbum[0];
                    newalbum = [];
                    newtlids = [];
                } else { //newalbum length
                    if (results[i].album.uri && results[i].album.name) {
                        //                    iconClass = getMediaClass(results[i].album.uri);
                        iconClass = getMediaClass(newalbum[0].uri);
                        html += '<li class="albumdivider">';
                        html += '<a href="#" onclick="return showAlbum(\'' + results[i].album.uri + '\');"><img id="' +
                            targetmin + '-cover-' + i + '" class="artistcover" width="30" height="30" /><h1><i class="' + iconClass + '"></i> ' + results[i].album.name + '</h1><p>';
                    }
                    if (results[i].album.artists) {
                        for (j = 0; j < results[i].album.artists.length; j++) {
                            html += results[i].album.artists[j].name;
                            html += (j == results[i].album.artists.length - 1) ? '' : ' / ';
                            //stop after 3
                            if (j > 2) {
                                child += '...';
                                break;
                            }
                        }
                    }
                    html += '</p></a></li>';
                    for (j = 0; j < newalbum.length; j++) {
                        popupData[newalbum[j].uri] = newalbum[j];
                        //                    html += '<li class="albumli" id="' + targetmin + '-' + newalbum[j].uri + '"><a href="#" onclick="return ' + popupMenu + '(event, \'' + uri + '\',\'' + newalbum[j].uri + '\');">';

                        //hERE!
                        var liID = targetmin + '-' + newalbum[j].uri;
                        if (target == CURRENT_PLAYLIST_TABLE) {
                            html += renderQueueSongLi(newalbum[j], liID, uri, newtlids[j]);
                        } else {
                            html += renderSongLi(newalbum[j], liID, uri);
                        }

                        //html += '<li class="albumli" id="' + targetmin + '-' + newalbum[j].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + newalbum[j].uri + '\');">';
                        //html += '<p class="pright">' + timeFromSeconds(newalbum[j].length / 1000) + '</p><h1>' + newalbum[j].name + '</h1></a></li>';
                    }
                    newalbum = [];
                    newtlids = [];
                    if (results[i].album) {
                        coversList.push([results[i].album, i]);
                    }
                } //newalbum length
                if (results[i].album) {
                    coversList.push([results[i].album, i]);
                }
            } //albums name
        }
    }
    tableid = "#" + tableid;
    $(target).html(html);
    $(target).attr('data', uri);
    //retreive albumcovers
    for (i = 0; i < coversList.length; i++) {
        //        console.log(coversList[i]);
        getCover(coversList[i][0], target + '-cover-' + coversList[i][1], 'small');
    }
}

//process updated playlist to gui
function playlisttotable(pl, target, uri) {
    var tmp = '';
    $(target).html('');
    var targetmin = target.substr(1);
    var child = '';
    for (var i = 0; i < pl.length; i++) {
        if (pl[i]) {
            popupData[pl[i].uri] = pl[i];
            child = '<li id="' + targetmin + '-' + pl[i].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + pl[i].uri + '\');">';
            child += '<h1>' + pl[i].name + "</h1>";
            child += '<p>';
            child += '<span style="float: right;">' + timeFromSeconds(pl[i].length / 1000) + '</span>';
            // <span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>
            for (var j = 0; j < pl[i].artists.length; j++) {
                if (pl[i].artists[j]) {
                    child += pl[i].artists[j].name;
                    child += (j == pl[i].artists.length - 1) ? '' : ' / ';
                    //stop after 3
                    if (j > 2) {
                        child += '...';
                        break;
                    }
                }
            }
            child += ' / <em>' + pl[i].album.name + '</em></p>';
            child += '</a></li>';
            tmp += child;
        }
    };

    $(target).html(tmp);
    $(target).attr('data', uri);
}

function getPlaylistFromUri(uri) {
    if (playlists[uri]) {
        return playlists[uri];
    }
    if (customPlaylists[uri]) {
        return customPlaylists[uri];
    }
}

function getTracksFromUri(uri) {
    var pl = getPlaylistFromUri(uri);
    if (pl) {
        return pl.tracks;
    } else if (customTracklists[uri]) {
        return customTracklists[uri];
    }
    return [];
}

//convert time to human readable format
function timeFromSeconds(length) {
    var d = Number(length);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}


/******* Toast ***/
function toast(message, delay, textOnly) {
    textOnl = textOnly || false;
    message = message || "Loading...";
    delay = delay || 1000;
    $.mobile.loading('show', {
        text: message,
        textVisible: true,
        theme: 'a',
        textonly: textOnl
    });
    if (delay > 0) {
        setTimeout(function() {
            $.mobile.loading('hide');
        }, delay);
    }
}

/*****************
 * Modal dialogs
 *****************/
function showLoading(on) {
    if (on) {
        $("body").css("cursor", "progress");
        $.mobile.loading('show', {
            text: 'Loading data from ' + PROGRAM_NAME + '. Please wait...',
            textVisible: true,
            theme: 'a'
        });
    } else {
        $("body").css("cursor", "default");
        $.mobile.loading('hide');
    }
}

function showOffline(on) {
    if (on) {
        $.mobile.loading('show', {
            text: 'Trying to reach ' + PROGRAM_NAME + '. Please wait...',
            textVisible: true,
            theme: 'a'
        });
    } else {
        $.mobile.loading('hide');
    }
}


// from http://dzone.com/snippets/validate-url-regexp
function validUri(str) {
    var regexp = /^(mms|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    //    return regexp.test(str) || isServiceUri(str);
    return regexp.test(str);
}

function validServiceUri(str) {
    return validUri(str) || isServiceUri(str);
}

function isStreamUri(uri) {
    var uriSplit = uri.split(":");
    var a = validUri(uri);
    var b = radioExtensionsList.indexOf(uriSplit[0].toLowerCase()) >= 0;
    return a || b;
}

function getMediaClass(uri) {
    var uriSplit = uri.split(":")[0].toLowerCase();
    for (var i = 0; i < uriClassList.length; i++) {
        if (uriSplit == uriClassList[i][0]) {
            return "fa " + uriClassList[i][1];
        }
    }
    return '';
}

function getMediaHuman(uri) {
    var uriSplit = uri.split(":")[0].toLowerCase();
    for (var i = 0; i < uriHumanList.length; i++) {
        if (uriSplit == uriHumanList[i][0]) {
            return uriHumanList[i][1];
        }
    }
    return '';
}

function isServiceUri(uri) {
    var uriSplit = uri.split(":")[0].toLowerCase();
    var retVal = false;

    for (var i = 0; i < uriClassList.length; i++) {
        if (uriSplit == uriClassList[i][0]) {
            retVal = true;
        }
    }

    for (var i = 0; i < radioExtensionsList.length; i++) {
        if (uriSplit == radioExtensionsList[i]) {
            retVal = true;
        }
    }
    return retVal;
}
