/**
 * @author Wouter van Wijk
 *
 * these functions communication with ws server
 *
 */

/** ******************************************************
 * process results of a (new) currently playing track and any stream title
 *********************************************************/
function processCurrenttrack (data) {
    setSongInfo(data)
    mopidy.playback.getStreamTitle().then(function (title) {
        setStreamTitle(title)
    }, console.error)
}

/** ******************************************************
 * process results of volume
 *********************************************************/
function processVolume (data) {
    controls.setVolume(data)
}

/** ******************************************************
 * process results of mute
 *********************************************************/
function processMute (data) {
    controls.setMute(data)
}

/** ******************************************************
 * process results of a repeat
 *********************************************************/
function processRepeat (data) {
    controls.setRepeat(data)
}

/** ******************************************************
 * process results of random
 *********************************************************/
function processRandom (data) {
    controls.setRandom(data)
}

/** ******************************************************
 * process results of consume
 *********************************************************/
function processConsume (data) {
    controls.setConsume(data)
}

/** ******************************************************
 * process results of single
 *********************************************************/
function processSingle (data) {
    controls.setSingle(data)
}

/** ******************************************************
 * process results of current position
 *********************************************************/
function processCurrentposition (data) {
    controls.setPosition(parseInt(data))
}

/** ******************************************************
 * process results playstate
 *********************************************************/
function processPlaystate (data) {
    if (data === 'playing') {
        controls.setPlayState(true)
    } else {
        controls.setPlayState(false)
    }
}

/** ******************************************************
 * process results of a browse list
 *********************************************************/
function processBrowseDir (resultArr) {
    $(BROWSE_TABLE).empty()
    if (browseStack.length > 0) {
        renderSongLiBackButton(resultArr, BROWSE_TABLE, 'return library.getBrowseDir();')
    }
    if (!resultArr || resultArr.length === 0) {
        showLoading(false)
        return
    }
    uris = []
    var ref, previousRef, nextRef
    var uri = resultArr[0].uri
    var length = 0 || resultArr.length
    customTracklists[BROWSE_TABLE] = []
    var html = ''
    var i

    // Render list of tracks
    for (i = 0, index = 0; i < resultArr.length; i++) {
        if (resultArr[i].type === 'track') {
            previousRef = ref || undefined
            nextRef = i < resultArr.length - 1 ? resultArr[i + 1] : undefined
            ref = resultArr[i]
            // TODO: consolidate usage of various arrays for caching URIs, Refs, and Tracks
            popupData[ref.uri] = ref
            customTracklists[BROWSE_TABLE].push(ref)
            uris.push(ref.uri)

            html += renderSongLi(previousRef, ref, nextRef, BROWSE_TABLE, '', BROWSE_TABLE, index, resultArr.length)

            index++
        } else {
            html += '<li><a href="#" onclick="return library.getBrowseDir(this.id);" id="' + resultArr[i].uri + '">' +
                    '<h1><i class="' + getMediaClass(resultArr[i]) + '"></i> ' + resultArr[i].name + '</h1></a></li>'
        }
    }

    $(BROWSE_TABLE).append(html)
    if (browseStack.length > 0) {
        window.scrollTo(0, browseStack[browseStack.length - 1].scrollPos || 0)  // Restore scroll position
    }

    updatePlayIcons(songdata.track.uri, songdata.tlid, controls.getIconForAction())

    // Look up track details and add album headers
    if (uris.length > 0) {
        mopidy.library.lookup({'uris': uris}).then(function (resultDict) {
            // Break into albums and put in tables
            var requiredImages = {}
            var track, previousTrack, nextTrack, uri
            for (i = 0, index = 0; i < resultArr.length; i++) {
                if (resultArr[i].type === 'track') {
                    previousTrack = track || undefined
                    if (i < resultArr.length - 1 && resultDict[resultArr[i + 1].uri]) {
                        nextTrack = resultDict[resultArr[i + 1].uri][0]
                    } else {
                        nextTrack = undefined
                    }
                    track = resultDict[resultArr[i].uri][0]
                    popupData[track.uri] = track  // Need full track info in popups in order to display albums and artists.
                    if (uris.length === 1 || (previousTrack && !hasSameAlbum(previousTrack, track) && !hasSameAlbum(track, nextTrack))) {
                        renderSongLiAlbumInfo(track, BROWSE_TABLE)
                    }
                    requiredImages[track.uri] = renderSongLiDivider(previousTrack, track, nextTrack, BROWSE_TABLE)[1]
                }
            }
            showLoading(false)
            images.setImages(requiredImages, mopidy, 'small')
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
        var li_html = '<li><a href="#" onclick="return library.showTracklist(this.id);" id="' + resultArr[i].uri + '">'
        if (isSpotifyStarredPlaylist(resultArr[i])) {
            starred = li_html + '&#9733; Spotify Starred Tracks</a></li>' + tmp
        } else if (isFavouritesPlaylist(resultArr[i])) {
            favourites = li_html + '&hearts; Musicbox Favourites</a></li>'
        } else {
            tmp = tmp + li_html + '<i class="' + getMediaClass(resultArr[i]) + '"></i> ' + resultArr[i].name + '</a></li>'
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
    var playlist = resultDict.playlist
    if (!playlist || playlist === '') {
        console.log('Playlist', resultDict.uri, 'is invalid')
        showLoading(false)
        return
    }
    var playlistUri = resultDict.uri
    playlists[playlistUri] = {'uri': playlistUri, 'tracks': []}
    if (playlistUri.startsWith('m3u')) {
        console.log('Playlist', playlistUri, 'requires tracks lookup')
        var trackUris = []
        for (i = 0; i < playlist.tracks.length; i++) {
            trackUris.push(playlist.tracks[i].uri)
        }
        return mopidy.library.lookup({'uris': trackUris}).then(function (tracks) {
            for (i = 0; i < trackUris.length; i++) {
                var track = tracks[trackUris[i]][0] || playlist.tracks[i]  // Fall back to using track Ref if lookup failed.
                playlists[playlistUri].tracks.push(track)
            }
            showLoading(false)
            return playlists[playlistUri].tracks
        })
    } else {
        for (i = 0; i < playlist.tracks.length; i++) {
            var track = playlist.tracks[i]
            playlists[playlistUri].tracks.push(track)
        }
        showLoading(false)
        return playlists[playlistUri].tracks
    }
}

/** ******************************************************
 * process results of the queue, the current playlist
 *********************************************************/
function processCurrentPlaylist (resultArr) {
    currentplaylist = resultArr
    resultsToTables(currentplaylist, CURRENT_PLAYLIST_TABLE)
    mopidy.playback.getCurrentTlTrack().then(processCurrenttrack, console.error)
    updatePlayIcons(songdata.track.uri, songdata.tlid, controls.getIconForAction())
    if (resultArr.length === 0) {
        // Last track in queue was deleted, reset UI.
        resetSong()
    }
}

/** ******************************************************
 * process results of an artist lookup
 *********************************************************/
function processArtistResults (resultArr) {
    if (!resultArr || (resultArr.length === 0)) {
        $('#h_artistname').text('Artist not found...')
        images.setAlbumImage('', '#artistviewimage, #artistpopupimage', mopidy)
        showLoading(false)
        return
    }
    customTracklists[resultArr.uri] = resultArr

    resultsToTables(resultArr, ARTIST_TABLE, resultArr.uri)
    var artistname = getArtist(resultArr)
    $('#h_artistname, #artistpopupname').html(artistname)
    images.setArtistImage(resultArr.uri, resultArr[0].uri, '#artistviewimage, #artistpopupimage', mopidy)
    showLoading(false)
}

/** ******************************************************
 * process results of an album lookup
 *********************************************************/
function processAlbumResults (resultArr) {
    if (!resultArr || (resultArr.length === 0)) {
        $('#h_albumname').text('Album not found...')
        images.setAlbumImage('', '#albumviewcover, #coverpopupimage', mopidy)
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
    images.setAlbumImage(resultArr[0].uri, '#albumviewcover, #coverpopupimage', mopidy)
    showLoading(false)
}
