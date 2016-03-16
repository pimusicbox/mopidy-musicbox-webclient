/**
 * @author Wouter van Wijk
 *
 * these functions communication with ws server
 *
 */

/** ******************************************************
 * process results of a (new) currently playing track
 *********************************************************/
function processCurrenttrack (data) {
    setSongInfo(data)
}

/** ******************************************************
 * process results of volume
 *********************************************************/
function processVolume (data) {
    setVolume(data)
}

/** ******************************************************
 * process results of mute
 *********************************************************/
function processMute (data) {
    setMute(data)
}

/** ******************************************************
 * process results of a repeat
 *********************************************************/
function processRepeat (data) {
    setRepeat(data)
}

/** ******************************************************
 * process results of random
 *********************************************************/
function processRandom (data) {
    setRandom(data)
}

/** ******************************************************
 * process results of consume
 *********************************************************/
function processConsume (data) {
    setConsume(data)
}

/** ******************************************************
 * process results of single
 *********************************************************/
function processSingle (data) {
    setSingle(data)
}

/** ******************************************************
 * process results of current position
 *********************************************************/
function processCurrentposition (data) {
    setPosition(parseInt(data))
}

/** ******************************************************
 * process results playstate
 *********************************************************/
function processPlaystate (data) {
    if (data === 'playing') {
        setPlayState(true)
    } else {
        setPlayState(false)
    }
}

/** ******************************************************
 * process results of a browse list
 *********************************************************/
function processBrowseDir (resultArr) {
    $(BROWSE_TABLE).empty()
    if (browseStack.length > 0) {
        renderSongLiBackButton(resultArr, BROWSE_TABLE, 'return getBrowseDir();')
    }
    if (!resultArr || resultArr.length === 0) {
        showLoading(false)
        return
    }
    browseTracks = []
    uris = []
    var ref, track, previousTrack, nextTrack
    var uri = resultArr[0].uri
    var length = 0 || resultArr.length

    for (var i = 0, index = 0; i < resultArr.length; i++) {
        if (resultArr[i].type === 'track') {
            ref = resultArr[i]
            popupData[ref.uri] = ref
            browseTracks.push(ref)
            uris.push(ref.uri)

            $(BROWSE_TABLE).append(
                '<li class="song albumli" id="' + getjQueryID(BROWSE_TABLE, ref.uri) + '">' +
                '<a href="#" class="moreBtn" onclick="return popupTracks(event, \'' + uri + '\', \'' + ref.uri + '\', \'' + index + '\');">' +
                '<i class="fa fa-ellipsis-v"></i></a>' +
                '<a href="#" class="browsetrack" onclick="return playBrowsedTracks(PLAY_ALL, ' + index + ');">' +
                '<h1><i></i> ' + ref.name + '</h1></a></li>'
            )
            index++
        } else {
            var iconClass = ''
            if (browseStack.length > 0) {
                iconClass = 'fa fa-folder-o'
            } else {
                iconClass = getMediaClass(resultArr[i].uri)
            }
            $(BROWSE_TABLE).append(
                '<li><a href="#" onclick="return getBrowseDir(this.id);" id="' + resultArr[i].uri + '">' +
                '<h1><i class="' + iconClass + '"></i> ' + resultArr[i].name + '</h1></a></li>'
            )
        }
    }

    updatePlayIcons(songdata.track.uri, songdata.tlid)

    if (uris.length > 0) {
        mopidy.library.lookup({'uris': uris}).then(function (resultDict) {
            // Break into albums and put in tables
            var track, previousTrack, nextTrack, uri
            $.each(resultArr, function (i, ref) {
                if (ref.type === 'track') {
                    previousTrack = track || undefined
                    if (i < resultArr.length - 1 && resultDict[resultArr[i + 1].uri]) {
                        nextTrack = resultDict[resultArr[i + 1].uri][0]
                    } else {
                        nextTrack = undefined
                    }
                    track = resultDict[ref.uri][0]
                    if (uris.length === 1 || (previousTrack && !hasSameAlbum(previousTrack, track) && !hasSameAlbum(track, nextTrack))) {
                        renderSongLiAlbumInfo(track, BROWSE_TABLE)
                    }
                    if (!hasSameAlbum(previousTrack, track)) {
                        // Starting to render a new album in the list.
                        renderSongLiDivider(track, nextTrack, i, BROWSE_TABLE)
                    }
                }
            })
            showLoading(false)
        }, console.error)
    } else {
        showLoading(false)
    }
}

/** ******************************************************
 * process results of list of playlists of the user
 *********************************************************/
function processGetPlaylists (resultArr) {
    if ((!resultArr) || (resultArr === '')) {
        $('#playlistslist').empty()
        return
    }
    var tmp = ''
    var favourites = ''
    var starred = ''

    for (var i = 0; i < resultArr.length; i++) {
        var li_html = '<li><a href="#" onclick="return showTracklist(this.id);" id="' + resultArr[i].uri + '">'
        if (isSpotifyStarredPlaylist(resultArr[i])) {
            starred = li_html + '&#9733; Spotify Starred Tracks</a></li>' + tmp
        } else if (isFavouritesPlaylist(resultArr[i])) {
            favourites = li_html + '&hearts; Musicbox Favourites</a></li>'
        } else {
            tmp = tmp + li_html + '<i class="' + getMediaClass(resultArr[i].uri) + '"></i> ' + resultArr[i].name + '</a></li>'
        }
    }
    // Prepend the user's Spotify "Starred" playlist and favourites to the results. (like Spotify official client).
    tmp = favourites + starred + tmp
    $('#playlistslist').html(tmp)
    scrollToTracklist()
    showLoading(false)
}

/** ******************************************************
 * process results of a returned list of playlist track refs
 *********************************************************/
function processPlaylistItems (resultDict) {
    if (resultDict.items.length === 0) {
        console.log('Playlist', resultDict.uri, 'is empty')
        showLoading(false)
        return
    }
    var trackUris = []
    for (i = 0; i < resultDict.items.length; i++) {
        trackUris.push(resultDict.items[i].uri)
    }
    return mopidy.library.lookup({'uris': trackUris}).then(function (tracks) {
        // Transform from dict to list and cache result
        var newplaylisturi = resultDict.uri
        playlists[newplaylisturi] = {'uri': newplaylisturi, 'tracks': []}
        for (i = 0; i < trackUris.length; i++) {
            playlists[newplaylisturi].tracks.push(tracks[trackUris[i]][0])
        }
        showLoading(false)
        return playlists[newplaylisturi].tracks
    })
}

/** ******************************************************
 * process results of the queue, the current playlist
 *********************************************************/
function processCurrentPlaylist (resultArr) {
    currentplaylist = resultArr
    resultsToTables(currentplaylist, CURRENT_PLAYLIST_TABLE)
    mopidy.playback.getCurrentTlTrack().then(processCurrenttrack, console.error)
    updatePlayIcons(songdata.track.uri, songdata.tlid)
}

/** ******************************************************
 * process results of an artist lookup
 *********************************************************/
function processArtistResults (resultArr) {
    if (!resultArr || (resultArr.length === 0)) {
        $('#h_artistname').text('Artist not found...')
        getCover('', '#artistviewimage, #artistpopupimage', 'extralarge')
        showLoading(false)
        return
    }
    customTracklists[resultArr.uri] = resultArr

    resultsToTables(resultArr, ARTIST_TABLE, resultArr.uri)
    var artistname = getArtist(resultArr)
    $('#h_artistname, #artistpopupname').html(artistname)
    getArtistImage(artistname, '#artistviewimage, #artistpopupimage', 'extralarge')
    showLoading(false)
}

/** ******************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults (resultArr) {
    if (!resultArr || (resultArr.length === 0)) {
        $('#h_albumname').text('Album not found...')
        getCover('', '#albumviewcover, #coverpopupimage', 'extralarge')
        showLoading(false)
        return
    }
    customTracklists[resultArr.uri] = resultArr

    albumTracksToTable(resultArr, ALBUM_TABLE, resultArr.uri)
    var albumname = getAlbum(resultArr)
    var artistname = getArtist(resultArr)
    $('#h_albumname').html(albumname)
    $('#h_albumartist').html(artistname)
    $('#coverpopupalbumname').html(albumname)
    $('#coverpopupartist').html(artistname)
    getCover(resultArr[0].uri, '#albumviewcover, #coverpopupimage', 'extralarge')
    showLoading(false)
}
