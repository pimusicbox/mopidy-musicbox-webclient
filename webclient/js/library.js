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
    $("#searchresults").show();
    //get the right result
    var results = resultArr[1];
    var tracks = (results.tracks) ? results.tracks : '';
    customTracklists['trackresultscache'] = tracks;
    var artists = (results.artists) ? results.artists : '';
    var albums = (results.albums) ? results.albums : '';
    var child = '';
    for (var i = 0; i < artists.length; i++) {
        child += '<li class="resultrow';
        if (i > 4) {
            child += " hidden";
        }
        child += '"><a href="#" onclick="return showArtist(this.id)" id="' + artists[i].uri + '">' + artists[i].name + "</a></li>";
    }
    $(SEARCH_ARTIST_TABLE).html(child);
    $(SEARCH_ARTIST_TABLE).listview('refresh');

    child = '';

    for (var i = 0; i < albums.length; i++) {
        child += '<li class="resultrow';
        if (i > 4) {
            child += " hidden";
        }
        child += '"><a href="#" onclick="return showAlbum(this.id)" id="' + albums[i].uri + '">';
        child += "<h1>" + albums[i].name + "</h1><p>";
        for (var j = 0; j < albums[i].artists.length; j++) {
            child += albums[i].artists[j].name + " ";
        }
        child += '</p></a></li>';
    }
    $(SEARCH_ALBUM_TABLE).html(child);
    $(SEARCH_ALBUM_TABLE).listview('refresh');

    $('#expandsearch').show();
    playlisttotable(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
            showLoading(false);
//    $('#allresultloader').hide();
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

function showTracklist(uri) {
    /********************************************************
     * Show tracks of playlist
     ********************************************************/
    $(PLAYLIST_TABLE).empty();
    $('#playlisttablediv').show();
//    $('#playlistloader').show();
    showLoading(true);

    var pl = getPlaylistFromUri(uri);
    //    console.log (pl);
    //load from cache
    if (pl) {
        playlisttotable(pl.tracks, PLAYLIST_TABLE, uri);
    }
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
    var pl = getTracksFromUri(nwuri);
    $('#h_artistname').html('');
    showLoading(true);
//    $('#artistsloader').show();
    mopidy.library.lookup(nwuri).then(processArtistResults, console.error);
    switchContent('artists', nwuri);
    return false;
}

function showAlbum(uri) {
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    $(ALBUM_TABLE).empty();
    //fill from cache
    var pl = getTracksFromUri(uri);
    if (pl) {
        albumtrackstotable(pl, ALBUM_TABLE, uri)
        $('#h_albumname').html(getAlbum(pl));
        $('#h_albumartist').html(getArtist(pl));
        mopidy.library.lookup(uri).then(processAlbumResults, console.error);
    } else {
        $('#h_albumname').html('');
        $('#h_albumartist').html('');
        showLoading(true);
//        $('#albumsloader').show();
        mopidy.library.lookup(uri).then(processAlbumResults, console.error);
    }
    //show
    switchContent('albums', uri);
    return false;
}

