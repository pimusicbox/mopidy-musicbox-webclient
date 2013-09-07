/*********************************
 * Search
 *********************************/
function searchPressed(key) {
    var value = $('#searchinput').val();
    switchContent('search');

    if (key == 13) {
        initSearch();
        return false;
    }
    return true;
}

//init search
function initSearch() {
    var value = $('#searchinput').val();

    if ((value.length < 100) && (value.length > 0)) {
        showLoading(true);
        //hide ios/android keyboard 
        document.activeElement.blur();
        $("input").blur();

        $('#artistresulttable').empty();
        $('#albumresulttable').empty();
        $('#trackresulttable').empty();
        delete customTracklists['allresultscache'];
        delete customTracklists['artistresultscache'];
        delete customTracklists['albumresultscache'];
        delete customTracklists['trackresultscache'];
        $("#searchresults").hide();

        mopidy.library.search({
            any : value
        }).then(processSearchResults, console.error);
    }
}

/********************************************************
 * process results of a search
 *********************************************************/
function processSearchResults(resultArr) {
    $(SEARCH_TRACK_TABLE).empty();
    $(SEARCH_ARTIST_TABLE).empty();
    $(SEARCH_ALBUM_TABLE).empty();
    //get the right result
    //depends on versioon of mopidy: 0 = 0.14+ 1 =  0.13-
    //    var results = resultArr[0];
    //add complete array
    //results = tracks from spotify
    var results = resultArr[0];
    //add tracks from local search
    if (resultArr[1].tracks) {
	results.tracks = resultArr[1].tracks.concat(results.tracks);
    }
    if (resultArr[1].artists) {
	results.artists = resultArr[1].artists.concat(results.artists);
    }
    if (resultArr[1].albums) {
	results.albums = resultArr[1].albums.concat(results.albums);
    }

    var tracks = (results.tracks) ? results.tracks : '';
    customTracklists['trackresultscache'] = tracks;
    var artists = (results.artists) ? results.artists : '';
    var albums = (results.albums) ? results.albums : '';
    if ((tracks == '') && (artists == '') && (albums == '')) {
        toast('No results', 1500, true);
        return false;
    }
    $("#searchresults").show();
    var child = '';
    for (var i = 0; i < artists.length; i++) {
        child += '<li class="resultrow';
        if (i > 9) {
            break;
            //child += " hidden";
        }
	if (artists[i]) {
    	    child += '"><a href="#" onclick="return showArtist(this.id)" id="' + artists[i].uri + '">' + artists[i].name + "</a></li>";
	}
    }
    $(SEARCH_ARTIST_TABLE).html(child);
//    $(SEARCH_ARTIST_TABLE).listview('refresh');
    child = '';
//    console.log(albums.length);
    for (var i = 0; i < albums.length; i++) {
        child += '<li class="resultrow';
        if (i > 9) {
            break;
            //child += " hidden";
        }
	if(albums[i]) {
            child += '"><a href="#" onclick="return showAlbum(this.id)" id="' + albums[i].uri + '">';
	    child += "<h1>" + albums[i].name + "</h1><p>";
    	    for (var j = 0; j < albums[i].artists.length; j++) {
    		if (albums[i].artists[j]) {
		    child += albums[i].artists[j].name + " ";
    	        }
	    }
    	    child += '</p></a></li>';
	}
    }
    $(SEARCH_ALBUM_TABLE).html(child);
//    $(SEARCH_ALBUM_TABLE).listview('refresh');

    $('#expandsearch').show();

//    console.log(results.tracks);
    playlisttotable(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
    setSongInfo();
    showLoading(false);
}

function toggleSearch() {
    $("#albumresulttable tr").removeClass('hidden');
    $("#artistresulttable tr").removeClass('hidden');
}

/*********************************
 * Playlists
 *********************************/

function getPlaylists() {
    //  get playlists without tracks
    mopidy.playlists.getPlaylists(false).then(processGetPlaylists, console.error);
}

function getCurrentPlaylist() {
    mopidy.tracklist.getTracks().then(processCurrentPlaylist, console.error);
}

/********************************************************
 * Show tracks of playlist
 ********************************************************/
function showTracklist(uri) {
    $(PLAYLIST_TABLE).empty();
    $('#playlisttracksdiv').show();

    var pl = getPlaylistFromUri(uri);
    //load from cache
    if (pl) {
        resultsToTables(pl.tracks, PLAYLIST_TABLE, uri);
    } else {
        showLoading(true);
    }

    $('#playlistslist li a').each(function() {
        $(this).removeClass("playlistactive");
        if (this.id == uri) {
            $(this).addClass('playlistactive');
        }
    });
    scrollToTracklist();
    //lookup recent tracklist
    mopidy.playlists.lookup(uri).then(processGetTracklist, console.error);
    return false;
}

/******
 * Lookups
 */

function showArtist(nwuri) {
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    $(ARTIST_TABLE).empty();
    //fill from cache
//    var pl = getTracksFromUri(nwuri);
//TODO cache
    $('#h_artistname').html('');
    showLoading(true);
    mopidy.library.lookup(nwuri).then(processArtistResults, console.error);
    switchContent('artists', nwuri);
    scrollToTop();
    setSongInfo();
    return false;
}

function showAlbum(uri) {
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    $(ALBUM_TABLE).empty();
    //fill from cache
    var pl = getTracksFromUri(uri);
    if (pl) {
        albumTracksToTable(pl, ALBUM_TABLE, uri);
        var albumname = getAlbum(pl);
        var artistname = getArtist(pl);
        $('#h_albumname').html(albumname);
        $('#h_albumartist').html(artistname);
        $('#coverpopupalbumname').html(albumname);
        $('#coverpopupartist').html(artistname);
        showLoading(false);
        getCover(artistname, albumname, '#albumviewcover, #coverpopupimage', 'extralarge');
        mopidy.library.lookup(uri).then(processAlbumResults, console.error);
    } else {
        showLoading(true);
        $('#h_albumname').html('');
        $('#h_albumartist').html('');
        mopidy.library.lookup(uri).then(processAlbumResults, console.error);
    }
    //show page
    switchContent('albums', uri);
    scrollToTop();
    setSongInfo();
    return false;
}

