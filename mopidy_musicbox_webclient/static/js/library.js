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
    var searchService = $('#selectSearchService').val();

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

        if (searchService != 'all') {
            mopidy.library.search({any:[value]}, [searchService + ':']).then(processSearchResults, console.error);
        } else {
            mopidy.getUriSchemes().then(function (schemes) {
                var query = {},
                    uris = [];

                var regexp = $.map(schemes, function (scheme) {
                    return '^' + scheme + ':';
                }).join('|');

                var match = value.match(regexp);
                if (match) {
                    var scheme = match[0];
                    query = {uri: [value]};
                    uris = [scheme];
                } else {
                    query = {any: [value]};
                }
                mopidy.library.search(query, uris).then(processSearchResults, console.error);
            });
        }
    }
}

/********************************************************
 * process results of a search
 *********************************************************/

//# speed clone http://jsperf.com/cloning-an-object/2
function clone(obj) {
    var target = {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            target[i] = obj[i];
        }
    }
    return target;
}

function processSearchResults(resultArr) {
    $(SEARCH_TRACK_TABLE).empty();
    $(SEARCH_ARTIST_TABLE).empty();
    $(SEARCH_ALBUM_TABLE).empty();

    // Merge results from different backends.
    // TODO  should of coures have multiple tables
    var results = {'tracks': [], 'artists': [], 'albums': []};
    var j, emptyResult = true;

/*    for (var i = 0; i < resultArr.length; ++i) {
        for (var prop in results) {
            if (resultArr[i][prop] && resultArr[i][prop].length) {
                results[prop] = results[prop].concat(resultArr[i][prop]);
                emptyResult = false;
            }
        }
    }
*/
    for (var i = 0; i < resultArr.length; i++) {
        if (resultArr[i].tracks) {
            for (j = 0; j < resultArr[i].tracks.length; j++) {
                results.tracks.push(resultArr[i].tracks[j]);
                emptyResult = false;
            }
        }
        if (resultArr[i].artists) {
            for (j = 0; j < resultArr[i].artists.length; j++) {
                results.artists.push(resultArr[i].artists[j]);
                emptyResult = false;
            }
        }
        if (resultArr[i].albums) {
            for (j = 0; j < resultArr[i].albums.length; j++) {
                results.albums.push(resultArr[i].albums[j]);
                emptyResult = false;
            }
        }
    }

//    console.log(resultArr, results);



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
    pattern += '<p data-role="desc">{artistName}</p>';
    pattern += '</a></li>';

    for (var i = 0; i < results.albums.length; i++) {
        tokens = {
            'albumId': results.albums[i].uri,
            'albumName': results.albums[i].name,
            'artistName': '',
            'albumYear': results.albums[i].date,
            'class': getMediaClass(results.albums[i].uri)
        };
        if (results.albums[i].artists) {
            for (var j = 0; j < results.albums[i].artists.length; j++) {
                if (results.albums[i].artists[j].name) {
                    tokens.artistName += results.albums[i].artists[j].name + ' ';
                }
            }
        }
        if (tokens.albumYear) {
            tokens.artistName += '(' + tokens.albumYear + ')';
        }
        // Add 'Show all' item after a certain number of hits.
        if (i == 4 && results.albums.length > 5) {
            child += theme(showMorePattern, {'count': results.albums.length - i});
            pattern = pattern.replace('<li>', '<li class="overflow">');
        }

        child += theme(pattern, tokens);
    }
    // Inject list items, refresh listview and hide superfluous items.
    $(SEARCH_ALBUM_TABLE).html(child).listview('refresh').find('.overflow').hide();

    $('#expandsearch').show();

    // Track results
//    playlisttotable(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
    resultsToTables(results.tracks, SEARCH_TRACK_TABLE, 'trackresultscache');

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
    mopidy.tracklist.getTlTracks().then(processCurrentPlaylist, console.error);
}

/********************************************************
 * Show tracks of playlist
 ********************************************************/
function togglePlaylists() {
    if ($(window).width() <= 960) {
        $('#playlisttracksdiv').toggle();
        //Hide other div
        ($('#playlisttracksdiv').is(":visible")) ? $('#playlistslistdiv').hide() : $('#playlistslistdiv').show();
    } else {
        $('#playlisttracksdiv').show();
        $('#playlistslistdiv').show();
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
    updatePlayIcons(uri);
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
    $('#popupQueue').popup('close');
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    $(ARTIST_TABLE).empty();
    //fill from cache
//    var pl = getTracksFromUri(nwuri);
//TODO cache
    $('#h_artistname').html('');
    showLoading(true);
    mopidy.library.lookup(nwuri).then(function(resultArr) {
        resultArr.uri = nwuri;
        processArtistResults(resultArr);
    }, console.error);
    switchContent('artists', nwuri);
    scrollToTop();
    return false;
}

function showAlbum(uri) {
    $('#popupQueue').popup('close');
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    $(ALBUM_TABLE).empty();
    //fill from cache
    var pl = getTracksFromUri(uri);
    if (pl.length>0) {
        albumTracksToTable(pl, ALBUM_TABLE, uri);
        var albumname = getAlbum(pl);
        var artistname = getArtist(pl);
        $('#h_albumname').html(albumname);
        $('#h_albumartist').html(artistname);
        $('#coverpopupalbumname').html(albumname);
        $('#coverpopupartist').html(artistname);
        showLoading(false);
        mopidy.library.lookup(uri).then(function(resultArr) {
            resultArr.uri = uri;
            processAlbumResults(resultArr);
        }, console.error);
//        getCover(pl, '#albumviewcover, #coverpopupimage', 'extralarge');
    } else {
        showLoading(true);
        $('#h_albumname').html('');
        $('#h_albumartist').html('');
        mopidy.library.lookup(uri).then(function(resultArr) {
            resultArr.uri = uri;
            processAlbumResults(resultArr);
        }, console.error);
    }
    //show page
    switchContent('albums', uri);
    scrollToTop();
    return false;
}

function getSearchSchemes() {
    mopidy.getUriSchemes().then(
        function(schemesArray) {
            var humanIndex;
            $("#selectSearchService").children().remove().end();
            $("#selectSearchService").append(new Option('All services', 'all'));
            for (var i = 0; i < schemesArray.length; i++) {
                for (var j = 0; j < uriHumanList.length; j++) {
                    if (uriHumanList[j][0] == schemesArray[i].toLowerCase() ) {
                        $("#selectSearchService").append(new Option(uriHumanList[j][1], schemesArray[i]));
                    }
                }
            }
            $("#selectSearchService").selectmenu( "refresh", true );
        }, console.error
    );
}
