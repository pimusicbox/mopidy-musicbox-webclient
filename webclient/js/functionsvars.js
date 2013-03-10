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
var songdata = '';
var newposition = 0;

var playlisttracksScroll;
var playlistslistScroll;

//array of cached playlists (not only user-playlists, also search, artist, album-playlists)
var playlists = {};
var currentplaylist;
var customPlaylists = [];
var customTracklists = [];

var ua = navigator.userAgent,
  isMobileWebkit = /WebKit/.test(ua) && /Mobile/.test(ua);

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

MAX_TABLEROWS = 50;

//update track slider timer, milliseconds
TRACK_TIMER = 1000;

//check status timer, every 5 or 10 sec
STATUS_TIMER = 10000;

/*******
 *
 */
function scrollToTop() {
    var divtop = 0;
    $('body,html').animate({
        scrollTop : divtop
    }, 250);
}

function scrollToTracklist() {
    var divtop = $("#playlisttracksdiv").offset().top - 50;
    $('body,html').animate({
        scrollTop : divtop
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
    var tmp = '';
    var targetmin = target.substr(1);
    $(target).empty();
    var child = '';
    for (var i = 0; i < pl.length; i++) {
        popupData[pl[i].uri] = pl[i];
        child = '<li id="' + targetmin + '-' + pl[i].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + pl[i].uri + '\');">';
        child += '<p style="float:right; display: inline;">' + timeFromSeconds(pl[i].length / 1000) + '</p><h1>' + pl[i].name + '</h1></a></li>';
        tmp += child;
    };
    $(target).html(tmp);
    $(target).attr('data', uri);
    //set click handlers
    /*   $(table + ' .name').click(function() {
    return playtrack(this.id, uri)
    });*/
    //create (for new tables)
//    $(target).listview().trigger("create");
    //refresh
 //   $(target).listview('refresh');
}

function resultsToTables(results, target, uri) {
    var newalbum = [];
    var nexturi = '';
    var count = 0;
    //check if there are too many different albums in the list
    /*    for (var i = 1; i < results.length; i++) {
     if (results[i].album.uri != results[i - 1].album.uri)
     count++;
     }
     console.log(count);
     //don't do the fancy rendering if there are more than X albums in the list
     if (count > 8) {
     playlisttotable(results, target, uri);
     return;
     }
     */
    newalbum = [];
    $(target).html('');

    //break into albums and put in tables
    var html = '';
    var tableid, j, artistname, alburi;
    var targetmin = target.substr(1);
    $(target).attr('data', uri);

    for ( i = 0; i < results.length; i++) {
        newalbum.push(results[i]);
        nexturi = '';
        if (i < results.length - 1) {
            nexturi = results[i + 1].album.uri;
        }
        if (results[i].album.uri != nexturi) {
            tableid = 'art' + i;
            //render differently if only one track in the album
            if ( newalbum.length == 1 ) {
//                html += '<li data-role="list-divider" data-theme="d" class="smalldivider"></li>';
                if (i != 0) { html += '<li class="smalldivider"> &nbsp;</li>'; }
                html += '<li id="' + targetmin + '-' + newalbum[0].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + newalbum[0].uri + '\');">';
                html += '<h1>' + newalbum[0].name + "</h1>";
                html += '<p>';
                html += '<span style="float: right;">' + timeFromSeconds(newalbum[0].length / 1000) + '</span>';
                for ( j = 0; j < newalbum[0].artists.length; j++) {
                    html += newalbum[0].artists[j].name;
                    html += (j == newalbum[0].artists.length - 1) ? '' : ' / ';
                    //stop after 3
                    if (j > 2) {
                        html += '...';
                        break;
                    }
                }
                html += ' / <em>' + newalbum[0].album.name + '</em></p>';
                html += '</a></li>';
                popupData[newalbum[0].uri] = newalbum[0];
                newalbum = [];

            } else {
                html += '<li class="albumdivider">';
//                html += '<a href="#coverpopup" onclick="return coverPopup();" data-position-to="window" data-rel="popup"><img id="' + targetmin + '-cover-' + i + '" class="artistcover" width="30" height="30" /></a>';
                html += '<a href="#" onclick="return showAlbum(\'' + results[i].album.uri + '\');"><img id="' + targetmin + '-cover-' + i + '" class="artistcover" width="30" height="30" /><h1>' + results[i].album.name + '</h1><p>';
                for ( j = 0; j < results[i].album.artists.length; j++) {
                    html += results[i].album.artists[j].name;
                    html += (j == results[i].album.artists.length - 1) ? '' : ' / ';
                    //stop after 3
                    if (j > 2) {
                        child += '...';
                        break;
                    }
                }
                html += '</p></a></li>';
                //            html += '<ul data-role="listview" data-inset="true" data-icon="false" class="" id="' + tableid + '"></ul>';
                for ( j = 0; j < newalbum.length; j++) {
                    popupData[newalbum[j].uri] = newalbum[j];
                    html += '<li class="albumli" id="' + targetmin + '-' + newalbum[j].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + newalbum[j].uri + '\');">';
                    html += '<p class="pright">' + timeFromSeconds(newalbum[j].length / 1000) + '</p><h1>' + newalbum[j].name + '</h1></a></li>';
                };
                artistname = results[i].artists[0].name;
                getCover(artistname, results[i].album.name, target + '-cover-' + i, 'small');
                //            customTracklists[results[i].album.uri] = newalbum;
                newalbum = [];
            }
        }
    }
    tableid = "#" + tableid;
    $(target).html(html);

    $(target).attr('data', uri);
//    $(target).listview('refresh');
}

//process updated playlist to gui
function playlisttotable(pl, target, uri) {
    var tmp = '';
    $(target).html('');
    var targetmin = target.substr(1);
    var child = '';
    for (var i = 0; i < pl.length; i++) {
        popupData[pl[i].uri] = pl[i];

        child = '<li id="' + targetmin + '-' + pl[i].uri + '"><a href="#" onclick="return popupTracks(event, \'' + uri + '\',\'' + pl[i].uri + '\');">';
        child += '<h1>' + pl[i].name + "</h1>";
        child += '<p>';
        child += '<span style="float: right;">' + timeFromSeconds(pl[i].length / 1000) + '</span>';
        // <span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>
        for (var j = 0; j < pl[i].artists.length; j++) {
            child += pl[i].artists[j].name;
            child += (j == pl[i].artists.length - 1) ? '' : ' / ';
            //stop after 3
            if (j > 2) {
                child += '...';
                break;
            }
        }
        child += ' / <em>' + pl[i].album.name + '</em></p>';

        //        child += '<p>' + pl[i].album.name + '</p>';
        child += '</a></li>';
        tmp += child;
    };

    $(target).html(tmp);
    $(target).attr('data', uri);

    //refresh
//    $(target).listview('refresh');
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
}

//convert time to human readable format
function timeFromSeconds(length) {
    var d = Number(length);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}
