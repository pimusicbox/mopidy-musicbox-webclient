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
    //    $('#playlistsloader').hide();
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
    //    $('#playlistloader').hide();
    showLoading(false);
    scrollToTop();
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
    var html, tableid;
    var artistname = getArtist(resultArr);

    for (var i = 0; i < resultArr.length; i++) {
        newalbum.push(resultArr[i]);
        nexturi = '';
        if (i < resultArr.length - 1) {
            nexturi = resultArr[i + 1].album.uri;
        }
        //  console.log(i);
        if (resultArr[i].album.uri != nexturi) {
            tableid = 'art' + i;
            html = '<a href="#" onclick="return showAlbum(\'' + resultArr[i].album.uri + '\');"><img id="artistcover-' + i + '" class="artistcover" width="40" height="40" />';
            html += '<h4>' + resultArr[i].album.name + '</h4></a>';
            html += '<ul data-role="listview" data-inset="true" data-icon="false" class="" id="' + tableid + '"></ul>';
            tableid = "#" + tableid;
            $(ARTIST_TABLE).append(html);
            albumtrackstotable(newalbum, tableid, resultArr[i].album.uri);
            getCover(artistname, resultArr[i].album.name, '#artistcover-' + i, 'small');
            $(tableid).listview('refresh');
            customTracklists[resultArr[i].album.uri] = newalbum;
            newalbum = [];
        }
    }
    $('#h_artistname, #artistpopupname').html(artistname);
    getArtistImage(artistname, '#artistviewimage, #artistpopupimage', 'extralarge');
    showLoading(false);
}

/********************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults(resultArr) {
    customTracklists[resultArr.uri] = resultArr;
    albumtrackstotable(resultArr, ALBUM_TABLE, resultArr.uri);
    var albumname = getAlbum(resultArr);
    var artistname = getArtist(resultArr);
    $('#h_albumname').html(albumname);
    $('#h_albumartist').html(artistname);
    $('#coverpopupalbumname').html(albumname);
    $('#coverpopupartist').html(artistname);
    getCover(artistname, albumname, '#albumviewcover, #coverpopupimage', 'extralarge');
    showLoading(false);
    //    $('#albumsloader').hide();
}
