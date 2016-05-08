(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.library = factory()
    }
}(this, function () {
    'use strict'

    var library = {

    /** *******************************
     * Search
     *********************************/
        searchPressed: function (key) {
            var value = $('#searchinput').val()
            switchContent('search')

            if (key === 13) {
                library.initSearch()
                return false
            }
            return true
        },

        // init search
        initSearch: function () {
            var value = $('#searchinput').val()
            var searchService = $('#selectSearchService').val()
            $.cookie('searchScheme', searchService, { expires: 365 })

            if ((value.length < 100) && (value.length > 0)) {
                showLoading(true)
                // hide ios/android keyboard
                document.activeElement.blur()
                $('input').blur()

                delete customTracklists[URI_SCHEME + ':trackresultscache']
                $('#searchartists').hide()
                $('#searchalbums').hide()
                $('#searchtracks').hide()

                if (searchService !== 'all') {
                    mopidy.library.search({'query': {any: [value]}, 'uris': [searchService + ':']}).then(library.processSearchResults, console.error)
                } else {
                    mopidy.getUriSchemes().then(function (schemes) {
                        var query = {}
                        var uris = []

                        var regexp = $.map(schemes, function (scheme) {
                            return '^' + scheme + ':'
                        }).join('|')

                        var match = value.match(regexp)
                        if (match) {
                            var scheme = match[0]
                            query = {uri: [value]}
                            uris = [scheme]
                        } else {
                            query = {any: [value]}
                        }
                        mopidy.library.search({'query': query, 'uris': uris}).then(library.processSearchResults, console.error)
                    })
                }
            }
        },

    /** ******************************************************
     * process results of a search
     *********************************************************/
        processSearchResults: function (resultArr) {
            $(SEARCH_TRACK_TABLE).empty()
            $(SEARCH_ARTIST_TABLE).empty()
            $(SEARCH_ALBUM_TABLE).empty()

            // Merge results from different backends.
            // TODO  should of coures have multiple tables
            var results = {'tracks': [], 'artists': [], 'albums': []}
            var i, j
            var emptyResult = true

            for (i = 0; i < resultArr.length; i++) {
                if (resultArr[i].tracks) {
                    for (j = 0; j < resultArr[i].tracks.length; j++) {
                        results.tracks.push(resultArr[i].tracks[j])
                        emptyResult = false
                    }
                }
                if (resultArr[i].artists) {
                    for (j = 0; j < resultArr[i].artists.length; j++) {
                        results.artists.push(resultArr[i].artists[j])
                        emptyResult = false
                    }
                }
                if (resultArr[i].albums) {
                    for (j = 0; j < resultArr[i].albums.length; j++) {
                        results.albums.push(resultArr[i].albums[j])
                        emptyResult = false
                    }
                }
            }

            customTracklists[URI_SCHEME + ':trackresultscache'] = results.tracks

            if (emptyResult) {
                $('#searchtracks').show()
                $(SEARCH_TRACK_TABLE).append(
                    '<li class="song albumli"><a href="#"><h1><i></i>No tracks found...</h1></a></li>'
                )
                toast('No results')
                showLoading(false)
                return false
            }

            if (results.artists.length > 0) {
                $('#searchartists').show()
            }

            if (results.albums.length > 0) {
                $('#searchalbums').show()
            }

            if (results.tracks.length > 0) {
                $('#searchtracks').show()
            }

            // Returns a string where {x} in template is replaced by tokens[x].
            function theme (template, tokens) {
                return template.replace(/{[^}]+}/g, function (match) {
                    return tokens[match.slice(1, -1)]
                })
            }

            // 'Show more' pattern
            var showMorePattern = '<li onclick="$(this).hide().siblings().show(); return false;"><a>Show {count} more</a></li>'

            // Artist results
            var child = ''
            var pattern = '<li><a href="#" onclick="return library.showArtist(this.id)" id={id}><i class="{class}"></i> <strong>{name}</strong></a></li>'
            var tokens

            for (i = 0; i < results.artists.length; i++) {
                tokens = {
                    'id': results.artists[i].uri,
                    'name': results.artists[i].name,
                    'class': getMediaClass(results.artists[i].uri)
                }

                // Add 'Show all' item after a certain number of hits.
                if (i === 4 && results.artists.length > 5) {
                    child += theme(showMorePattern, {'count': results.artists.length - i})
                    pattern = pattern.replace('<li>', '<li class="overflow">')
                }

                child += theme(pattern, tokens)
            }

            // Inject list items, refresh listview and hide superfluous items.
            $(SEARCH_ARTIST_TABLE).html(child).listview('refresh').find('.overflow').hide()

            // Album results
            child = ''
            pattern = '<li><a href="#" onclick="return library.showAlbum(this.id)" id="{albumId}">'
            pattern += '<h5 data-role="heading"><i class="{class}"></i> {albumName}</h5>'
            pattern += '<p data-role="desc">{artistName}</p>'
            pattern += '</a></li>'

            for (i = 0; i < results.albums.length; i++) {
                tokens = {
                    'albumId': results.albums[i].uri,
                    'albumName': results.albums[i].name,
                    'artistName': '',
                    'albumYear': results.albums[i].date,
                    'class': getMediaClass(results.albums[i].uri)
                }
                if (results.albums[i].artists) {
                    for (j = 0; j < results.albums[i].artists.length; j++) {
                        if (results.albums[i].artists[j].name) {
                            tokens.artistName += results.albums[i].artists[j].name + ' '
                        }
                    }
                }
                if (tokens.albumYear) {
                    tokens.artistName += '(' + tokens.albumYear + ')'
                }
                // Add 'Show all' item after a certain number of hits.
                if (i === 4 && results.albums.length > 5) {
                    child += theme(showMorePattern, {'count': results.albums.length - i})
                    pattern = pattern.replace('<li>', '<li class="overflow">')
                }

                child += theme(pattern, tokens)
            }
            // Inject list items, refresh listview and hide superfluous items.
            $(SEARCH_ALBUM_TABLE).html(child).listview('refresh').find('.overflow').hide()

            // Track results
            resultsToTables(results.tracks, SEARCH_TRACK_TABLE, URI_SCHEME + ':trackresultscache')

            showLoading(false)
        },

    /** *******************************
     * Playlists & Browse
     *********************************/
        getPlaylists: function () {
            //  get playlists without tracks
            mopidy.playlists.asList().then(processGetPlaylists, console.error)
        },

        getBrowseDir: function (rootdir) {
            //  get directory to browse
            showLoading(true)
            if (!rootdir) {
                browseStack.pop()
                rootdir = browseStack[browseStack.length - 1]
            } else {
                browseStack.push(rootdir)
            }
            if (!rootdir) {
                rootdir = null
            }
            mopidy.library.browse({'uri': rootdir}).then(processBrowseDir, console.error)
        },

        getCurrentPlaylist: function () {
            mopidy.tracklist.getTlTracks().then(processCurrentPlaylist, console.error)
        },

    /** ******************************************************
     * Show tracks of playlist
     ********************************************************/
        togglePlaylists: function () {
            if ($(window).width() <= 960) {
                $('#playlisttracksdiv').toggle();
                // Hide other div
                ($('#playlisttracksdiv').is(':visible')) ? $('#playlistslistdiv').hide() : $('#playlistslistdiv').show()
            } else {
                $('#playlisttracksdiv').show()
                $('#playlistslistdiv').show()
            }
            return true
        },

    /** **********
     * Lookups
     ************/
        showTracklist: function (uri) {
            showLoading(true)
            $(PLAYLIST_TABLE).empty()
            library.togglePlaylists()
            var tracks = getPlaylistTracks(uri).then(function (tracks) {
                resultsToTables(tracks, PLAYLIST_TABLE, uri, 'return library.togglePlaylists();', true)
                showLoading(false)
            })
            updatePlayIcons(uri, '', controls.getIconForAction())
            $('#playlistslist li a').each(function () {
                $(this).removeClass('playlistactive')
                if (this.id === uri) {
                    $(this).addClass('playlistactive')
                }
            })
            return false
        },

        showArtist: function (nwuri) {
            $('#popupQueue').popup('close')
            $('#popupTracks').popup('close')
            $('#controlsmodal').popup('close')
            $(ARTIST_TABLE).empty()

        // TODO cache
            $('#h_artistname').html('')
            showLoading(true)
            mopidy.library.lookup({'uris': [nwuri]}).then(function (resultDict) {
                var resultArr = resultDict[nwuri]
                resultArr.uri = nwuri
                processArtistResults(resultArr)
            }, console.error)
            switchContent('artists', nwuri)
            scrollToTop()
            return false
        },

        showAlbum: function (uri) {
            $('#popupQueue').popup('close')
            $('#popupTracks').popup('close')
            $('#controlsmodal').popup('close')
            $(ALBUM_TABLE).empty()
            // fill from cache
            var pl = getTracksFromUri(uri, true)
            if (pl.length > 0) {
                albumTracksToTable(pl, ALBUM_TABLE, uri)
                var albumname = getAlbum(pl)
                var artistname = getArtist(pl)
                $('#h_albumname').html(albumname)
                $('#h_albumartist').html(artistname)
                $('#coverpopupalbumname').html(albumname)
                $('#coverpopupartist').html(artistname)
                showLoading(false)
                mopidy.library.lookup({'uris': [uri]}).then(function (resultDict) {
                    var resultArr = resultDict[uri]
                    resultArr.uri = uri
                    processAlbumResults(resultArr)
                }, console.error)
            } else {
                showLoading(true)
                $('#h_albumname').html('')
                $('#h_albumartist').html('')
                mopidy.library.lookup({'uris': [uri]}).then(function (resultDict) {
                    var resultArr = resultDict[uri]
                    resultArr.uri = uri
                    processAlbumResults(resultArr)
                }, console.error)
            }
            // show page
            switchContent('albums', uri)
            scrollToTop()
            return false
        },

        getSearchSchemes: function (searchBlacklist, mopidy) {
            var backendName
            var searchScheme = $.cookie('searchScheme')
            if (searchScheme) {
                searchScheme = searchScheme.replace(/"/g, '')
            } else {
                searchScheme = 'all'
            }
            $('#selectSearchService').empty()
            $('#selectSearchService').append(new Option('All services', 'all'))
            mopidy.getUriSchemes().then(function (schemesArray) {
                schemesArray = schemesArray.filter(function (el) {
                    return searchBlacklist.indexOf(el) < 0
                })
                for (var i = 0; i < schemesArray.length; i++) {
                    backendName = getMediaHuman(schemesArray[i])
                    if (!backendName) {
                        // No mapping defined, revert to just showing the scheme with first letter capitalized.
                        backendName = schemesArray[i].charAt(0).toUpperCase() + schemesArray[i].slice(1)
                    }
                    $('#selectSearchService').append(new Option(backendName, schemesArray[i]))
                }
                $('#selectSearchService').val(searchScheme)
                $('#selectSearchService').selectmenu('refresh', true)
            }, console.error)
        }
    }
    return library
}))
