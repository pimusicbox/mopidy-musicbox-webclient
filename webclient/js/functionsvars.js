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
var posTimer;
var seekTimer;
var initgui = true;
var currentpos = 0;
var popupData = {};

var artistshtml = '';
var artiststext = '';
var songname = '';

//array of cached playlists (not only user-playlists, also search, artist, album-playlists)
var playlists = {};
var currentplaylist;
var customPlaylists = [];
var customTracklists = [];

//constants
PROGRAM_NAME = 'Mopidy';
ARTIST_TABLE = '#artiststable';
ALBUM_TABLE = '#albumstable';
PLAYLIST_TABLE = '#playlisttable';
CURRENT_PLAYLIST_TABLE = '#currenttable';
SEARCH_ALL_TABLE = '#allresulttable';
SEARCH_ALBUM_TABLE = '#albumresulttable';
SEARCH_ARTIST_TABLE = '#artistresulttable';
SEARCH_TRACK_TABLE = '#trackresulttable';
TRACK_TIMER = 500;

/*******
 *
 */
function scrollToTracklist() {
    var divtop = $("#playlisttablediv").offset().top - 15;
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

//process updated playlist to gui
function playlisttotable(pl, table, uri) {
    var tmp = '';
    $(table).html('');

    var child = '';
    for (var i = 0; i < pl.length; i++) {
        /*        var child = '<li><a href="#" class="name" id="' + pl[i].uri + '"><h2>' + pl[i].name + "</h2></a>";
         child += '<a href="#" class="time" id="' + pl[i].uri + '"><h2 class="ui-li-aside">' + timeFromSeconds(pl[i].length / 1000) + '</h2></a>';
         //   console.log(i);
         child += '<h4>';
         for (var j = 0; j < pl[i].artists.length; j++) {
         child += '<a href="#" class="artist" id="' + pl[i].artists[j].uri + '">' + pl[i].artists[j].name + "</a>";
         //stop after 3
         if (j > 2) {
         child += '...';
         break;
         }
         }
         //        child += '</a>';
         child += ' / <a href="#" class="album" id="' + pl[i].album.uri + '">' + pl[i].album.name + '</a></h4>';
         child += '</li>';
         //console.log(child);
         tmp += child;
         */
        popupData[pl[i].uri] = pl[i];

        child = '<li id="' + pl[i].uri + '"><a href="#" onclick="return popupTracks(\'' + uri + '\',\'' + pl[i].uri + '\');">';
        child += '<h1>' + pl[i].name + "</h1>";
        child += '<p>';
        child += '<span style="float: right;">' + timeFromSeconds(pl[i].length / 1000) + '</span>';
        // <span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>
        for (var j = 0; j < pl[i].artists.length; j++) {
            child += pl[i].artists[j].name;
            child += (j == pl[i].artists.length - 1) ?  '' : ' / ';
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

    $(table).html(tmp);
    $(table).attr('data', uri);

    //create (for new tables)
//    $(table).listview().trigger("create");
    //refresh
    $(table).listview('refresh');
}

function albumtrackstotable(pl, table, uri) {
    var tmp = '';
    $(table).empty();
    var child = '';
    for (var i = 0; i < pl.length; i++) {
        popupData[pl[i].uri] = pl[i];
        child = '<li><a href="#" onclick="return popupTracks(\'' + uri + '\',\'' + pl[i].uri + '\');">';
        child += '<p style="float:right; display: inline;">' + timeFromSeconds(pl[i].length / 1000) + 
            '</p><h1>' + pl[i].name + '</h1></a></li>';
        tmp += child;
    };
    $(table).html(tmp);
    $(table).attr('data', uri);
    //set click handlers
    /*   $(table + ' .name').click(function() {
    return playtrack(this.id, uri)
    });*/
    //create (for new tables)
    $(table).listview().trigger("create");
    //refresh
    $(table).listview('refresh');
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
