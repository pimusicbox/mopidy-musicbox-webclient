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

    browseTracks = [];
    for (var i = 0, index = 0; i < resultArr.length; i++) {
        iconClass = getMediaClass(resultArr[i].uri);
        if (resultArr[i].type == 'track') {
            //console.log(resultArr[i]);
            mopidy.library.lookup(resultArr[i].uri).then(function (resultArr) {
                popupData[resultArr[0].uri] = resultArr[0];
                browseTracks.push(resultArr[0]);
            }, console.error);
            child += '<li class="song albumli" id="browselisttracks-' + resultArr[i].uri + '">' +
                     '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\', \'' + resultArr[i].uri + '\', \'' + index + '\');">' +
                     '<i class="fa fa-ellipsis-v"></i></a>' +
                     '<a href="#" class="browsetrack" onclick="return playBrowsedTracks(PLAY_ALL, ' + index + ');" id="' + resultArr[i].uri +
                     '"><h1 class="trackname"><i class="' + iconClass + '"></i> ' + resultArr[i].name + '</h1></a></li>';
            index++
        } else {
            if (browseStack.length > 0) {
                iconClass="fa fa-folder-o";
            }
            child += '<li><a href="#" onclick="return getBrowseDir(this.id);" id="' + resultArr[i].uri +
                     '""><h1 class="trackname"><i class="' + iconClass + '"></i> ' + resultArr[i].name + '</h1></a></li>';
        }
    }

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
    if ((!resultArr) || (resultArr == '')) {
        $('#playlistslist').empty();
        return;
    }
    var tmp = '', favourites = '', starred = '';

    for (var i = 0; i < resultArr.length; i++) {
        var li_html = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '">';
        if(isSpotifyStarredPlaylist(resultArr[i])) {
            starred = li_html + '&#9733; Spotify Starred Tracks</a></li>' + tmp;
        } else if (isFavouritesPlaylist(resultArr[i])) {
            favourites = li_html + '&hearts; Musicbox Favourites</a></li>';
        } else {
            tmp = tmp + li_html + '<i class="' + getMediaClass(resultArr[i].uri) + '"></i> ' + resultArr[i].name + '</a></li>';
        }
    };
    // Prepend the user's Spotify "Starred" playlist and favourites to the results. (like Spotify official client).
    tmp = favourites + starred + tmp;
    $('#playlistslist').html(tmp);
    scrollToTracklist();
    showLoading(false);
}

/********************************************************
 * process results of a returned list of playlist track refs
 *********************************************************/
function processPlaylistItems(resultDict) {
    if (resultDict.items.length == 0) {
        console.log('Playlist', resultDict.uri, 'is empty');
        showLoading(false);
        return;
    }
    var trackUris = []
    for (i = 0; i < resultDict.items.length; i++) {
        trackUris.push(resultDict.items[i].uri);
    }
    return mopidy.library.lookup(null, trackUris).then(function(tracks) {
        // Transform from dict to list and cache result
        var newplaylisturi = resultDict.uri;
        playlists[newplaylisturi] = {'uri':newplaylisturi, 'tracks':[]};
        for (i = 0; i < trackUris.length; i++) {
            playlists[newplaylisturi].tracks.push(tracks[trackUris[i]][0]);
        }
        showLoading(false);
        return playlists[newplaylisturi].tracks;
    });
    return false;
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
    showLoading(false);
}

/********************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults(resultArr) {
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
    getCover(resultArr[0].album, '#albumviewcover, #coverpopupimage', 'extralarge');
    showLoading(false);
}
