/**
 * @author Wouter van Wijk
 *
 * these functions communication with ws server
 *
 */

/********************************************************
 * play an uri from a trackslist or the current playlist
 *********************************************************/
function playtrack(uri, playlisturi) {
    var trackslist = new Array();
    var track;
    switchContent('current', uri);
    mopidy.playback.stop(true);
    var tracks = getTracksFromUri(playlisturi);
    if (tracks) {
        $(CURRENT_PLAYLIST_TABLE).empty();
        mopidy.tracklist.clear();
        mopidy.tracklist.add(tracks);
    } else {
        tracks = currentplaylist;
    }

    for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].uri == uri) {
            track = i + 1;
            break;
        }
    }
    console.log(track);
    for (var i = 0; i < track; i++) {
        mopidy.playback.next();
    }
    mopidy.playback.play();

    return false;
}

/********************************************************
 * process results of a (new) currently playing track
 *********************************************************/
function processCurrenttrack(data) {
    setSongInfo(data);
}

/********************************************************
 * process results of a repeat
 *********************************************************/
function processRepeat(data) {
    setRepeat(data);
}

/********************************************************
 * process results of random
 *********************************************************/
function processRandom(data) {
    setRandom(data);
}

/********************************************************
 * process results of current position
 *********************************************************/
function processCurrentposition(data) {
    var pos = parseInt(data);
    setPosition(pos);
   // console.log('pos:' + pos);
}

/********************************************************
 * process results playstate
 *********************************************************/
function processPlaystate(data) {
   // console.log(data);
    if (data == 'playing') {
        setPlayState(true);
        resumeTimer();
    } else {
        setPlayState(false);
    }
}

/********************************************************
 * process results of list of playlists of the user
 *********************************************************/
function processGetPlaylists(resultArr) {
    /*<p><ul><li>Donec id elit non mi porta</li><li>Gravida at eget metus. Fusce dapibus.</li><li>Tellus ac cursus commodo</li></p>
     <p><a class="btn" href="#">More &raquo;</a></p>
     */

    if ((!resultArr) || (resultArr == '')) {
        return;
    }
    var tmp = '';
    for (var i = 0; i < resultArr.length; i++) {
        var child = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '"">' + resultArr[i].name + '</a></li>';
        tmp += child;
    };
    $('#playlistslist').empty();
    $('#playlistslist').html(tmp);
    $('#playlistsloader').hide();
    $("#loadingmodal").modal('hide');
}

/********************************************************
 * process results of a returned playlist
 *********************************************************/
function processGetTracklist(resultArr) {
    //cache result
    var newplaylisturi = resultArr.uri;
    playlists[newplaylisturi] = resultArr;
    playlisttotable(playlists[newplaylisturi].tracks, PLAYLIST_TABLE, newplaylisturi);
    
    $('body,html').scrollTop($("#playlistspane").offset().top - 100);
    $('#playlistloader').hide();
}

/********************************************************
 * process results of a returned playlist
 *********************************************************/
function processCurrentPlaylist(resultArr) {
    currentplaylist = resultArr;
    playlisttotable(resultArr, CURRENT_PLAYLIST_TABLE);
    mopidy.playback.getCurrentTrack().then(processCurrenttrack, console.error);
}

/********************************************************
 * process results of a search
 *********************************************************/
function processSearchResults(resultArr) {
    $(SEARCH_TRACK_TABLE).empty();
    $(SEARCH_ARTIST_TABLE).empty();
    $(SEARCH_ALBUM_TABLE).empty();
    $("#searchresults").show();
    //get the right result
    var results = resultArr[0];
    

    playlisttotable(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
    customTracklists['trackresultscache'] = results.tracks;
    var artists = results.artists;
    var child = '';
    for (var i = 0; i < artists.length; i++) {
        child += '<tr class="resultrow';
        if (i > 4) {
            child += " hidden";
        }
        child += '"><td><a href="#" onclick="return showartist(this.id)" id="' + artists[i].uri + '">' + artists[i].name + "</a></td></tr>";
    }
    $(SEARCH_ARTIST_TABLE).html(child);

    child = '';
    var albums = results.albums;

    for (var i = 0; i < albums.length; i++) {
        child += '<tr class="resultrow';
        if (i > 4) {
            child += " hidden";
        }
        child += '"><td><a href="#" onclick="return showalbum(this.id)" id="' + albums[i].uri + '">' + albums[i].name + "</a></td><td>";
        for (var j = 0; j < albums[i].artists.length; j++) {
            //console.log(j);
            child += '<a href="#" onclick="return showartist(this.id)" id="' + albums[i].artists[j].uri + '">' + albums[i].artists[j].name + "</a>";
        }
        child += '</td></tr>';
    }
    $(SEARCH_ALBUM_TABLE).html(child);

    $('#expandsearch').show();

    $('#allresultloader').hide();
}

/********************************************************
 * process results of an artist lookup
 *********************************************************/
function processArtistResults(resultArr) {
    customTracklists[resultArr.uri] = resultArr;
    $(ARTIST_TABLE).html('');
    
    //break into albums and put in tables
    var newalbum = [];
    var nexturi = '';
    for (var i = 0; i < resultArr.length; i++) {
        newalbum.push(resultArr[i]);
        nexturi = '';
        if (i < resultArr.length - 1) {
            nexturi = resultArr[i + 1].album.uri;
        }
        if (resultArr[i].album.uri != nexturi) {
            var tableid = 'art' + i;
            var html = '<h4>' + resultArr[i].album.name + '</h4>';
            html += '<table class="table table-striped"><tbody id="' + tableid + '"></tbody></table>';

            $(ARTIST_TABLE).append(html);
            albumtrackstotable(newalbum, "#" + tableid, resultArr[i].album.uri);
            customTracklists[resultArr[i].album.uri] = newalbum;
            newalbum = [];
        }
    }
    $('#h_artistname').html(getArtist(resultArr));
    $('#artistsloader').hide();
}


/********************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults(resultArr) {
    customTracklists[resultArr.uri] = resultArr;
    playlisttotable(resultArr, ALBUM_TABLE, resultArr.uri);
    $('#h_albumname').html(getAlbum(resultArr));
    $('#h_albumartist').html(getArtist(resultArr));
    $('#albumsloader').hide();
}
