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
//var mopidy;

//values for controls
var play = false;
var shuffle;
var repeat;
var currentVolume = -1;
var muteVolume = -1;
var posTimer;
var seekTimer;
var initgui = true;
var currentpos = 0;

var artistshtml = '';
var artiststext = '';
var songname = '';

//array of cached playlists (not only user-playlists, also search, artist, album-playlists)
var playlists = '';
var currentplaylist;
var customPlaylists = new Array();
var customTracklists = new Array();

//constants
ARTIST_TABLE = '#artiststable';
ALBUM_TABLE = '#albumstable';
PLAYLIST_TABLE = '#playlisttable';
CURRENT_PLAYLIST_TABLE = '#currenttable';
SEARCH_ALL_TABLE = '#allresulttable';
SEARCH_ALBUM_TABLE = '#albumresulttable';
SEARCH_ARTIST_TABLE = '#artistresulttable';
SEARCH_TRACK_TABLE = '#trackresulttable';

WEB_SOCKET_SWF_LOCATION = "/static/WebSocketMain.swf";
WEB_SOCKET_DEBUG = true;

//process updated playlist to gui
function getArtist(pl) {
        for (var i = 0; i < pl.length; i++) {
            var child = '<tr class="resultrow"><td><a href="#" class="name" id="' + pl[i]["uri"] + '">' + pl[i]["name"] + "</a></td><td>";
            for (var j = 0; j < pl[i]["artists"].length; j++) {
                if (pl[i]["artists"][j]["name"] != '') {
                        return pl[i]["artists"][j]["name"];
                }
            }
        };
}

//process updated playlist to gui
function getAlbum(pl) {
        for (var i = 0; i < pl.length; i++) {
            if(pl[i]["album"]["name"] != '') {
               return pl[i]["album"]["name"];
            }
        };
}


//process updated playlist to gui
function playlisttotable(pl, table, uri) {
    /*  <tr>
     <td>Title</td>
     <td>Artist</td>
     <td>Album</td>
     <td>Length</td>
     </tr>
     */
    tmp = '';
    $(table).empty();

//   console.log(pl.length);
   //console.log(pl);
        for (var i = 0; i < pl.length; i++) {
         //   console.log(pl[i]);
            var child = '<tr class="resultrow"><td><a href="#" class="name" id="' + pl[i]["uri"] + '">' + pl[i]["name"] + "</a></td><td>";
            for (var j = 0; j < pl[i]["artists"].length; j++) {
                //console.log(j);
                child += '<a href="#" class="artist" id="' + pl[i]["artists"][j]["uri"] + '">' + pl[i]["artists"][j]["name"] + "</a>";
            }
            child += '</td><td><a href="#" class="album" id="' + pl[i]["album"]["uri"] + '">' + pl[i]["album"]["name"] + '</a></td><td><a href="#" class="time" id="' + pl[i]["uri"] + '">' + timeFromSeconds(pl[i]["length"] / 1000) + '</a></td></tr>';
            tmp += child;
        };
    $(table).html(tmp);
    $(table).attr('data', uri);
    //set click handlers
    $(table + ' .name').click(function() {
        return playtrack(this.id, uri)
    });
    $(table + ' .album').click(function() {
        return showalbum(this.id, uri)
    });
    $(table + ' .artist').click(function() {
        return showartist(this.id, uri)
    });
}



function getPlaylistFromUri(uri) {
     for (var i = 0; i < playlists.length; i++) {
         if(playlists[i]["uri"] == uri) {
             return playlists[i];
         }
     }

         if(customPlaylists[uri]) {
             return customPlaylists[uri];
         }
}

function getTracksFromUri(uri) {
     pl = getPlaylistFromUri(uri);
     if(pl) {
         return pl.tracks;
     } else if (customTracklists[uri]) {
         return customTracklists[uri];
     }
}

//convert time to human readable format
function timeFromSeconds(length) {
    d = Number(length);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}
