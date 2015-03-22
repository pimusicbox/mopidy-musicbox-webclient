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
 * process results of consume
 *********************************************************/
function processConsume(data) {
    setConsume(data);
}

/********************************************************
 * process results of single
 *********************************************************/
function processSingle(data) {
    setSingle(data);
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
        resumePosTimer();
    } else {
        setPlayState(false);
    }
}

/********************************************************
 * process results of a browse list
 *********************************************************/
function processBrowseDir(resultArr) {
    var backHtml = '<li style="background-color:#ccc"><a href="#" onclick="return getBrowseDir();"><h1 class="trackname"><i class="fa fa-arrow-circle-left"></i> Back</h1></a></li>'
    if ( (!resultArr) || (resultArr == '') || (resultArr.length == 0) ) {
        $('#browsepath').html('No tracks found...');
        $('#browselist').html(backHtml);
        showLoading(false);
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
    colonindex = rooturi.lastIndexOf(':');
    slashindex = rooturi.lastIndexOf('/');

    lastindex = (colonindex > slashindex) ? colonindex : slashindex;
    rooturi = rooturi.slice(0, lastindex);

    if (browseStack.length > 0) {
	child += backHtml;
    }

    for (var i = 0; i < resultArr.length; i++) {
        iconClass = getMediaClass(resultArr[i].uri);
	if(resultArr[i].type == 'track' ) {
//	    console.log(resultArr[i]);
        mopidy.library.lookup(resultArr[i].uri).then(function (resultArr) {
            popupData[resultArr[0].uri] = resultArr[0];
        }, console.error);
        child += '<li class="song albumli" id="browselisttracks-' + resultArr[i].uri + '">' +
		'<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\', \'' + resultArr[i].uri + '\');">' +
		'<i class="fa fa-ellipsis-v"></i></a>' +
		'<a href="#" class="browsetrack" onclick="return playBrowsedTracks(PLAY_ALL, this.id);" id="' + resultArr[i].uri +
                '"><h1 class="trackname"><i class="' + iconClass + '"></i> ' + resultArr[i].name + '</h1></a></li>';
	} else {
            if (browseStack.length > 0) {
                iconClass="fa fa-folder-o";
            }
            child += '<li><a href="#" onclick="return getBrowseDir(this.id);" id="' + resultArr[i].uri +
                '""><h1 class="trackname"><i class="' + iconClass + '"></i> ' + resultArr[i].name + '</h1></a></li>';
	}
    };

    $('#browselist').html(child);
    if (browseStack.length > 0 ) {
/*        child = '';
        for (var i = 0; i < browseStack.length; i++) {
            child += browseStack[i] + ' / ';
        }

        child = getMediaHuman(browseStack[0]);
        iconClass = getMediaClass(browseStack[0]);
*/
        child = getMediaHuman(resultArr[0].uri);
        iconClass = getMediaClass(resultArr[0].uri);
        $('#browsepath').html('<i class="' + iconClass + '"></i> ' + child);
    } else {
        $('#browsepath').html('');
    }

    updatePlayIcons(songdata.track.uri, songdata.tlid);

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
        iconClass, starred;


    for (var i = 0; i < resultArr.length; i++) {
        iconClass = getMediaClass(resultArr[i].uri);

        // Check if this is Spotify's "Starred" playlist
        if(starredRegex.test(resultArr[i].uri)) {
    	    starred = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '"">&#9733; Spotify Starred Tracks</a></li>';
	} else {
        child = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '"><i class="' + iconClass + '"></i> ' + resultArr[i].name + '</a></li>';
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
//console.log(resultArr);
    playlists[newplaylisturi] = resultArr;
    // setSongInfo();
    resultsToTables(playlists[newplaylisturi].tracks, PLAYLIST_TABLE, newplaylisturi);
    showLoading(false);
}

/********************************************************
 * process results of the queue, the current playlist
 *********************************************************/
function processCurrentPlaylist(resultArr) {
    currentplaylist = resultArr;
    resultsToTables(currentplaylist, CURRENT_PLAYLIST_TABLE);
    mopidy.playback.getCurrentTlTrack().then(processCurrenttrack, console.error);
    updatePlayIcons(songdata.track.uri, songdata.tlid);
}

/********************************************************
 * process results of an artist lookup
 *********************************************************/
function processArtistResults(resultArr) {
    if (!resultArr || (resultArr.length == 0)) {
        $('#h_artistname').text('Artist not found...');
        getCover('', '#artistviewimage, #artistpopupimage', 'extralarge');
        showLoading(false);
        return;
    }
    customTracklists[resultArr.uri] = resultArr;

    resultsToTables(resultArr, ARTIST_TABLE, resultArr.uri);
    var artistname = getArtist(resultArr);
    $('#h_artistname, #artistpopupname').html(artistname);
    getArtistImage(artistname, '#artistviewimage, #artistpopupimage', 'extralarge');
    // setSongInfo();
    showLoading(false);
}

/********************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults(resultArr) {
//    console.log(resultArr);
    if (!resultArr || (resultArr.length == 0)) {
        $('#h_albumname').text('Album not found...');
        getCover('', '#albumviewcover, #coverpopupimage', 'extralarge');
        showLoading(false);
        return;
    }
    customTracklists[resultArr.uri] = resultArr;
    albumTracksToTable(resultArr, ALBUM_TABLE, resultArr.uri);
    var albumname = getAlbum(resultArr);
    var artistname = getArtist(resultArr);
    $('#h_albumname').html(albumname);
    $('#h_albumartist').html(artistname);
    $('#coverpopupalbumname').html(albumname);
    $('#coverpopupartist').html(artistname);
    // setSongInfo();
    getCover(resultArr[0].album, '#albumviewcover, #coverpopupimage', 'extralarge');
    showLoading(false);
}
