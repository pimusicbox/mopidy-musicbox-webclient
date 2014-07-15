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

        delete customTracklists['allresultscache'];
        delete customTracklists['artistresultscache'];
        delete customTracklists['albumresultscache'];
        delete customTracklists['trackresultscache'];
        $("#searchresults").hide();

        var query = {},
            uris = [];

        if (value.match(/^spotify:/)) {
            query = {uri: [value]};
            uris = ["spotify:"];
        } else {
            query = {any: [value]};
        }

        mopidy.library.search(query, uris).then(processSearchResults, console.error);
        // console.log('search sent', value);
    }
}

/********************************************************
 * process results of a search
 *********************************************************/
function processSearchResults(resultArr) {
//    console.log('srch', resultArr);
    $(SEARCH_TRACK_TABLE).empty();
    $(SEARCH_ARTIST_TABLE).empty();
    $(SEARCH_ALBUM_TABLE).empty();

    // Merge results from different backends.
    // TODO  should of coures have multiple tables
    var results = {'tracks': [], 'artists': [], 'albums': []};
    var emptyResult = true;


    for (var i = 0; i < resultArr.length; ++i) {
        for (var prop in results) {
            if (resultArr[i][prop] && resultArr[i][prop].length) {
                results[prop] = results[prop].concat(resultArr[i][prop]);
                emptyResult = false;
            }
        }
    }

    customTracklists['trackresultscache'] = results.tracks;

    if (emptyResult) {
        toast('No results');
        showLoading(false);
        return false;
    }

    $("#searchresults").show();

    // Returns a string where {x} in template is replaced by tokens[x].
    function theme(template, tokens) {
        return template.replace(/{[^}]+}/g, function(match) {
            return tokens[match.slice(1,-1)];
        });
    }

    // 'Show more' pattern
    var showMorePattern = '<li onclick="$(this).hide().siblings().show(); return false;"><a>Show {count} more</a></li>';

    // Artist results
    var child = '';
    var pattern = '<li><a href="#" onclick="return showArtist(this.id)" id={id}><i class="{class}"></i> <strong>{name}</strong></a></li>';
    var tokens;

    for (var i = 0; i < results.artists.length; i++) {
        tokens = {
            'id': results.artists[i].uri,
            'name': results.artists[i].name,
            'class': getMediaClass(results.artists[i].uri)
        };

        // Add 'Show all' item after a certain number of hits.
        if (i == 4 && results.artists.length > 5) {
            child += theme(showMorePattern, {'count': results.artists.length - i});
            pattern = pattern.replace('<li>', '<li class="overflow">');
        }

        child += theme(pattern, tokens);
    }

    // Inject list items, refresh listview and hide superfluous items.
    $(SEARCH_ARTIST_TABLE).html(child).listview('refresh').find('.overflow').hide();

    // Album results
    child = '';
    pattern = '<li><a href="#" onclick="return showAlbum(this.id)" id="{albumId}">';
    pattern += '<h5 data-role="heading"><i class="{class}"></i> {albumName}</h5>';
    pattern += '<p data-role="desc">{artistName} ({albumYear})</p>';
    pattern += '</a></li>';

    for (var i = 0; i < results.albums.length; i++) {
        tokens = {
            'albumId': results.albums[i].uri,
            'albumName': results.albums[i].name,
            'artistName': '',
            'albumYear': results.albums[i].date,
            'class': getMediaClass(results.albums[i].uri)
        };

        //console.log(i, results.albums[i].artists.length);
        if (results.albums[i].artists) {
            for (var j = 0; j < results.albums[i].artists.length; j++) {
                tokens.artistName += results.albums[i].artists[j].name + ' ';
            }
        }
        // Add 'Show all' item after a certain number of hits.
        if (i == 4 && results.albums.length > 5) {
            child += theme(showMorePattern, {'count': results.albums.length - i});
            pattern = pattern.replace('<li>', '<li class="overflow">');
        }

        child += theme(pattern, tokens);
    }
    // Inject list items, refresh listview and hide superfluous items.
//    console.log(child, results.albums.length);
    $(SEARCH_ALBUM_TABLE).html(child).listview('refresh').find('.overflow').hide();

    $('#expandsearch').show();

    // Track results
//    playlisttotable(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
    resultsToTables(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');

    setSongInfo();
    showLoading(false);
}

function toggleSearch() {
    $("#albumresulttable tr").removeClass('hidden');
    $("#artistresulttable tr").removeClass('hidden');
}

/*********************************
 * Playlists & Browse
 *********************************/

function getPlaylists() {
    //  get playlists without tracks
    mopidy.playlists.getPlaylists(false).then(processGetPlaylists, console.error);
}

function getBrowseDir(rootdir) {
    //  get directory to browse
    showLoading(true);
    if (!rootdir) {
	browseStack.pop();
	rootdir = browseStack[browseStack.length - 1];
    } else {
	browseStack.push(rootdir);
    }
    mopidy.library.browse(rootdir).then(processBrowseDir, console.error);
}

function getCurrentPlaylist() {
    mopidy.tracklist.getTracks().then(processCurrentPlaylist, console.error);
}

/********************************************************
 * Show tracks of playlist
 ********************************************************/
function togglePlaylists() {
    if ($(window).width() <= 960) {
        $('#playlisttracksdiv').toggle();
        $('#playlistslistdiv').toggle();
    }
    return true;
}

function showTracklist(uri) {
    $(PLAYLIST_TABLE).empty();
    togglePlaylists();
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
//    scrollToTracklist();
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
