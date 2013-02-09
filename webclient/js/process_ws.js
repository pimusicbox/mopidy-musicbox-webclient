/**
 * @author Wouter van Wijk
 *
 * these functions communication with ws server
 *
 */

/********************************************************
 * process results of a (new) currently playing track
 *********************************************************/
function processCurrenttrack(data) {
    setSongInfo(data);
}

/********************************************************
 * process results of volume
 *********************************************************/
function processVolume(data) {
    setVolume(data);
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
    $('#playlistslist').listview('refresh');
    $('#playlistsloader').hide();
    showLoading(false);
}

/********************************************************
 * process results of a returned playlist
 *********************************************************/
function processGetTracklist(resultArr) {
    //cache result
    var newplaylisturi = resultArr.uri;
    playlists[newplaylisturi] = resultArr;
    playlisttotable(playlists[newplaylisturi].tracks, PLAYLIST_TABLE, newplaylisturi);
    $('#playlistloader').hide();
    scrollToTracklist();
}

/********************************************************
 * process results of the queue, the current playlist
 *********************************************************/
function processCurrentPlaylist(resultArr) {
    currentplaylist = resultArr;
    playlisttotable(resultArr, CURRENT_PLAYLIST_TABLE);
    mopidy.playback.getCurrentTrack().then(processCurrenttrack, console.error);
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
      //  console.log(i);
        if (resultArr[i].album.uri != nexturi) {
            var tableid = 'art' + i;
            var html = '<h4>' + resultArr[i].album.name + '</h4>';
            html += '<ul data-role="listview" data-inset="true" data-icon="false" class="" id="' + tableid + '"></ul>';
            tableid = "#" + tableid;
            $(ARTIST_TABLE).append(html);
            albumtrackstotable(newalbum, tableid, resultArr[i].album.uri);
            $(tableid).listview('refresh');
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
    albumtrackstotable(resultArr, ALBUM_TABLE, resultArr.uri);
    $('#h_albumname').html(getAlbum(resultArr));
    $('#h_albumartist').html(getArtist(resultArr));
    $('#albumsloader').hide();
}
