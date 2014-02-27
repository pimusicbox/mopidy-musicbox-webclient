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
    if (!volumeChanging) {
        setVolume(data);
    }
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
}

/********************************************************
 * process results playstate
 *********************************************************/
function processPlaystate(data) {
    if (data == 'playing') {
        setPlayState(true);
        resumeTimer();
    } else {
        setPlayState(false);
    }
}

/********************************************************
 * process results of a browse list
 *********************************************************/
function processBrowseDir(resultArr) {
    /*<p><ul><li>Donec id elit non mi porta</li><li>Gravida at eget metus. Fusce dapibus.</li><li>Tellus ac cursus commodo</li></p>
     <p><a class="btn" href="#">More &raquo;</a></p>
     */

    if ((!resultArr) || (resultArr == '')) {
        return;
    }
//    console.log(resultArr);

    if (resultArr.length == 0) {
	return;
    }

    $('#browselist').empty();

    var child = "", rooturi = "", uri = resultArr[0].uri;

    //check root uri
    //find last : or / (spltting the result)
    //do it twice, since.
    var colonindex = uri.lastIndexOf(':');
    var slashindex = uri.lastIndexOf('/');

    var lastindex = (colonindex > slashindex) ? colonindex : slashindex;
    rooturi = uri.slice(0, lastindex);
    if (resultArr[0].type == 'track' ) {
        rooturi = rooturi.replace(":track:", ":directory:");
    }

//    console.log(uri, lastindex, rooturi);

    colonindex = rooturi.lastIndexOf(':');
    slashindex = rooturi.lastIndexOf('/');

    lastindex = (colonindex > slashindex) ? colonindex : slashindex;
    rooturi = rooturi.slice(0, lastindex);
    
//    console.log(rooturi);

    child += '<li><a href="#" onclick="return getBrowseDir();"><h1 class="trackname">..</h1></a></li>';

/*    if (rooturi.indexOf(':') == -1 ) {
	rooturi = '';
	child += '<li><a href="#" onclick="return getBrowseDir();"><h1 class="trackname">..</h1></a></li>';
    } else {
	child += '<li><a href="#" onclick="return getBrowseDir(this.id);" id="' + rooturi + '"><h1 class="trackname">..</h1></a></li>';
    }
*/
//    console.log('new:' + rooturi);

    for (var i = 0; i < resultArr.length; i++) {
	if(resultArr[i].type == 'track' ) {
//	    console.log(resultArr[i]);
            child += '<li><a href="#" class="browsetrack" onclick="return playBrowsedTracks(0, this.id);" id="' + resultArr[i].uri + '""><h1 class="trackname">' + resultArr[i].name + '</h1></a></li>';
	} else {
            child += '<li><a href="#" onclick="return getBrowseDir(this.id);" id="' + resultArr[i].uri + '""><h1 class="trackname">' + resultArr[i].name + '</h1></a></li>';
	}
    };
//    console.log(child);

    $('#browselist').html(child);

    showLoading(false);
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
    var child, tmp = '',
        starredRegex = /spotify:user:.*:starred/g,
        starred;

    for (var i = 0; i < resultArr.length; i++) {
        // Check if this is Spotify's "Starred" playlist
        if(starredRegex.test(resultArr[i].uri)) {
    	    starred = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '"">&#9733; Spotify Starred Tracks</a></li>';
	} else {
        child = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '"">' + resultArr[i].name + '</a></li>';
        tmp += child;
    }
    };

    // Move Spotify "Starred" playlist to top as this is the way Spotify does it
    if(starred)
        tmp = starred + tmp;

    $('#playlistslist').empty();
    $('#playlistslist').html(tmp);
    scrollToTracklist();
    showLoading(false);
}

/********************************************************
 * process results of a returned playlist
 *********************************************************/
function processGetTracklist(resultArr) {
    //cache result
    var newplaylisturi = resultArr.uri;
    playlists[newplaylisturi] = resultArr;
    resultsToTables(playlists[newplaylisturi].tracks, PLAYLIST_TABLE, newplaylisturi);
    setSongInfo();
    showLoading(false);
    scrollToTracklist();
    if (isMobileWebkit) {
        playlisttracksScroll.refresh();
    }
}

/********************************************************
 * process results of the queue, the current playlist
 *********************************************************/
function processCurrentPlaylist(resultArr) {
    currentplaylist = resultArr;
//    console.log(resultArr);
    resultsToTables(resultArr, CURRENT_PLAYLIST_TABLE);
    mopidy.playback.getCurrentTrack().then(processCurrenttrack, console.error);
}

/********************************************************
 * process results of an artist lookup
 *********************************************************/
function processArtistResults(resultArr) {
    customTracklists[resultArr.uri] = resultArr;

    resultsToTables(resultArr, ARTIST_TABLE, resultArr.uri);
    var artistname = getArtist(resultArr);
    $('#h_artistname, #artistpopupname').html(artistname);
    getArtistImage(artistname, '#artistviewimage, #artistpopupimage', 'extralarge');
    setSongInfo();
    showLoading(false);
}

/********************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults(resultArr) {
    customTracklists[resultArr.uri] = resultArr;
    albumTracksToTable(resultArr, ALBUM_TABLE, resultArr.uri);
    var albumname = getAlbum(resultArr);
    var artistname = getArtist(resultArr);
    $('#h_albumname').html(albumname);
    $('#h_albumartist').html(artistname);
    $('#coverpopupalbumname').html(albumname);
    $('#coverpopupartist').html(artistname);
    getCover(artistname, albumname, '#albumviewcover, #coverpopupimage', 'extralarge');
    setSongInfo();
    showLoading(false);
}
