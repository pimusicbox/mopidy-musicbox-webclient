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
    trackslist = new Array();
    var track;
    switchContent('current', uri);
    tracks = getTracksFromUri(playlisturi);
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
        }
    }
    console.log(track);

    mopidy.playback.stop(true);
    for (var i = 0; i < track; i++) {
        mopidy.playback.next();
    }
    mopidy.playback.play();
    //(track);
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
    pos = parseInt(data);
    setPosition(pos);
    console.log('pos:' + pos);
}

/********************************************************
 * process results playstate
 *********************************************************/
function processPlaystate(data) {
    console.log(data);
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
function processGetplaylists(resultArr) {
    /*<p><ul><li>Donec id elit non mi porta</li><li>Gravida at eget metus. Fusce dapibus.</li><li>Tellus ac cursus commodo</li></p>
     <p><a class="btn" href="#">More &raquo;</a></p>
     */
    if ((!resultArr) || (resultArr == '')) {
        return;
    }
    playlists = resultArr;
    tmp = '';
    for (var i = 0; i < playlists.length; i++) {
        var child = '<li><a href="#" onclick="return setPlaylist(this.id);" id="' + playlists[i]["uri"] + '"">' + playlists[i]["name"] + '</a></li>';
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
function processSinglePlaylist(resultArr) {
    //cache
    newplaylisturi = resultArr["uri"];
    playlists[newplaylisturi] = resultArr;
    playlisttotable(playlists[newplaylisturi], PLAYLIST_TABLE, newplaylisturi);
    $('#playlistloader').hide();
}

/********************************************************
 * process results of a returned playlist
 *********************************************************/
function processCurrentPlaylist(resultArr) {
    currentplaylist = resultArr;
    playlisttotable(resultArr, CURRENT_PLAYLIST_TABLE);
    mopidy.playback.getCurrentTrack().then(currentTrackResults, console.error);
}

/********************************************************
 * process results of a search
 *********************************************************/
function processSearchResults(resultArr) {
    $(SEARCH_TRACK_TABLE).empty();
    $(SEARCH_ARTIST_TABLE).empty();
    $(SEARCH_ALBUM_TABLE).empty();
    $("#searchresults").show();

    playlisttotable(resultArr[1].tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
    customTracklists['trackresultscache'] = resultArr[1].tracks;

    var artists = resultArr[1].artists;
    var child = '';

    for (var i = 0; i < artists.length; i++) {
        child += '<tr class="resultrow';
        if (i > 4) {
            child += " hidden";
        }
        child += '"><td><a href="#" onclick="return showartist(this.id, uri)" id="' + artists[i]["uri"] + '">' + artists[i]["name"] + "</a></td></tr>";
    }
    $(SEARCH_ARTIST_TABLE).html(child);

    child = '';
    var albums = resultArr[1].albums;

    for (var i = 0; i < albums.length; i++) {
        child += '<tr class="resultrow';
        if (i > 4) {
            child += " hidden";
        }
        child += '"><td><a href="#" onclick="return showalbum(this.id, uri)" id="' + albums[i]["uri"] + '">' + albums[i]["name"] + "</a></td><td>";
        for (var j = 0; j < albums[i].artists.length; j++) {
            //console.log(j);
            child += '<a href="#" onclick="return showartist(this.id, uri)" id="' + albums[i].artists[j]["uri"] + '">' + albums[i].artists[j]["name"] + "</a>";
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
    customTracklists[resultArr["uri"]] = resultArr;
    playlisttotable(resultArr, ARTIST_TABLE, resultArr["uri"]);
    $('#h_artistname').html(getArtist(resultArr));
    $('#artistsloader').hide();
}

/********************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults(resultArr) {
    customTracklists[resultArr["uri"]] = resultArr;
    playlisttotable(resultArr, ALBUM_TABLE, resultArr["uri"]);
    $('#h_albumname').html(getAlbum(resultArr));
    $('#h_albumartist').html(getArtist(resultArr));
    $('#albumsloader').hide();
}
