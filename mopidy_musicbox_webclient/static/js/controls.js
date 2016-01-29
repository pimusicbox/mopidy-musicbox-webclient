/********************************************************
 * play tracks from a browse list
 *********************************************************/
function playBrowsedTracks(action, trackIndex) {
    $('#popupBrowse').popup('close');
    toast('Loading...');

    if (typeof trackIndex === 'undefined') {
        trackIndex = $('#popupBrowse').data("tlid");
    }
    if (action == PLAY_ALL) {
        mopidy.tracklist.clear();
        // Default for radio streams is to just add the selected URI.
        if (isStreamUri(browseTracks[trackIndex].uri)) {
            action = PLAY_NOW;
        }
    }
    var trackUris = [];
    switch (action) {
        case PLAY_NOW:
        case PLAY_NEXT:
        case ADD_THIS_BOTTOM:
            trackUris.push(browseTracks[trackIndex].uri);
            break;
        case PLAY_ALL:
        case ADD_ALL_BOTTOM:
            trackUris = getUris(browseTracks);
            break;
        default:
            break;
    }
    var maybePlay = function(tlTracks) {
        if (action === PLAY_NOW || action === PLAY_ALL) {
            var playIndex = (action === PLAY_ALL) ? trackIndex : 0;
            mopidy.playback.play(tlTracks[playIndex]);
        }
    };
        
    switch (action) {
        case PLAY_NOW:
        case PLAY_NEXT:
            mopidy.tracklist.index().then(function (currentIndex) {
                mopidy.tracklist.add(null, currentIndex + 1, null, trackUris).then(maybePlay);
            });
            break;
        case ADD_THIS_BOTTOM:
        case ADD_ALL_BOTTOM:
        case PLAY_ALL:
            mopidy.tracklist.add(null, null, null, trackUris).then(maybePlay);
            break;
        default:
            break;
    }
    return false;
}


/********************************************************
 * play an uri from a tracklist
 *********************************************************/
function playTrack(action) {
    var hash = document.location.hash.split('?');
    var divid = hash[0].substr(1);

    // Search page default click behaviour adds and plays selected track only.
    if (action == PLAY_NOW && divid == 'search') {
        action = PLAY_NOW_SEARCH;
    }
    
    $('#popupTracks').popup('close');
    $('#controlspopup').popup('close');
    toast('Loading...');

    playlisturi = $('#popupTracks').data("list");
    uri = $('#popupTracks').data("track");

    var trackUris = getTracksFromUri(playlisturi);
    //find track that was selected
    for (var selected = 0; selected < trackUris.length; selected++) {
        if (trackUris[selected] == uri) {
            break;
        }
    }
    switch (action) {
        case ADD_THIS_BOTTOM:
        case PLAY_NEXT:
        case PLAY_NOW_SEARCH:
            trackUris = [trackUris[selected]];
            selected = 0;
    }
    switch (action) {
        case PLAY_NOW:
        case PLAY_NOW_SEARCH:
            mopidy.tracklist.clear().then(
                mopidy.tracklist.add(null, null, null, trackUris).then(
                    function(tlTracks) {
                        mopidy.playback.play(tlTracks[selected])
                    }
                )
            );
            break;
        case PLAY_NEXT:
            mopidy.tracklist.index().then(function(currentIndex) {
                mopidy.tracklist.add(null, currentIndex + 1, null, trackUris);
            });
            break;
        case ADD_THIS_BOTTOM:
        case ADD_ALL_BOTTOM:
            mopidy.tracklist.add(null, null, null, trackUris);
            break;
    }
    return false;
}

/***
 * Plays a Track given by an URI from the given playlist URI.
 * @param track_uri, playlist_uri
 * @returns {boolean}
 */
function playTrackByUri(track_uri, playlist_uri) {
    function findAndPlayTrack(tltracks) {
        if (tltracks.length > 0) {
            // Find track that was selected
            for (var selected = 0; selected < tltracks.length; selected++) {
                if (tltracks[selected].track.uri == track_uri) {
                    mopidy.playback.play(tltracks[selected]);
                    return;
                }
            }
        }
        console.error('Failed to find and play selected track ', track_uri);
        return;
    }

    // Stop directly, for user feedback
    mopidy.tracklist.clear();

    //this is deprecated, remove when popuptracks is removed completly
    $('#popupTracks').popup('close');
    $('#controlspopup').popup('close');
    //end of deprecated

    toast('Loading...');

    mopidy.tracklist.add(null, null, playlist_uri).then(function(tltracks) {
        // Can fail for all sorts of reasons. If so, just add individually. 
        if (tltracks.length == 0) {
            var trackUris = getTracksFromUri(playlist_uri, false);
            mopidy.tracklist.add(null, null, null, trackUris).then(findAndPlayTrack);
        } else {
            findAndPlayTrack(tltracks);
        }
    });
    return false;
}

/********************************************************
 * play an uri from the queue
 *********************************************************/

/***
 * Plays a Track from a Playlist.
 * @param uri
 * @param tlid
 * @returns {boolean}
 */
function playTrackQueueByTlid(uri, tlid) {
    //    console.log('playquuri');
    //stop directly, for user feedback
    mopidy.playback.stop();
    $('#popupQueue').popup('close');
    toast('Loading...');

    tlid = parseInt(tlid);
    mopidy.tracklist.filter({
        'tlid': [tlid]
    }).then(
        function(tltracks) {
            if (tltracks.length > 0) {
                mopidy.playback.play(tltracks[0]);
                return;
            }
            console.log('Failed to play selected track ', tlid);
        }
    );
    return false;
}

/***
 * @deprecated
 * @returns {boolean}
 */
function playTrackQueue() {
    //    console.log('playqu');
    uri = $('#popupQueue').data("track");
    tlid = $('#popupQueue').data("tlid");
    return playTrackQueueByTlid(uri, tlid);
}

/********************************************************
 * remove a track from the queue
 *********************************************************/
function removeTrack() {
    $('#popupQueue').popup('close');
    toast('Deleting...');

    tlid = parseInt($('#popupQueue').data("tlid"));
    console.log(tlid);
    mopidy.tracklist.remove({'tlid':[tlid]});
}

function clearQueue() {
    mopidy.playback.stop();
    resetSong();
    mopidy.tracklist.clear();
    resetSong();
    return false;
}

function saveQueue() {
    mopidy.tracklist.getTracks().then(function(tracks) {
        if (tracks.length > 0) {
            var plname = window.prompt("Playlist name:", "").trim();
            if (plname != null && plname != "") {
                mopidy.playlists.filter({"name": plname}).then(function(existing) {
                    var exists = false;
                    for (var i = 0; i < existing.length; i++) {
                        exists = exists || existing[i].uri.indexOf("m3u:") == 0 || existing[i].uri.indexOf("local:") == 0;
                    }
                    if (!exists || window.confirm("Overwrite existing playlist \"" + plname + "\"?")) {
                        mopidy.playlists.create(plname, "local").then(function(playlist) {
                             playlist.tracks = tracks;
                             mopidy.playlists.save(playlist).then();
                             getPlaylists();
                        });
                    }
                });
            }
        }
    });
    return false;
}


function refreshPlaylists() {
    mopidy.playlists.refresh();
    return false;
}

/**********************
 * Buttons
 */

function doShuffle() {
    mopidy.playback.stop();
    mopidy.tracklist.shuffle();
    mopidy.playback.play();
}

/* Toggle state of play button */
function setPlayState(nwplay) {
    if (nwplay) {
        $("#btplayNowPlaying >i").removeClass('fa-play').addClass('fa-pause');
        $("#btplayNowPlaying").attr('title', 'Pause');
        $("#btplay >i").removeClass('fa-play').addClass('fa-pause');
        $("#btplay").attr('title', 'Pause');
    } else {
        $("#btplayNowPlaying >i").removeClass('fa-pause').addClass('fa-play');
        $("#btplayNowPlaying").attr('title', 'Play');
        $("#btplay >i").removeClass('fa-pause').addClass('fa-play');
        $("#btplay").attr('title', 'Play');
    }
    play = nwplay;
}

//play or pause
function doPlay() {
    toast('Please wait...', 250);
    if (!play) {
        mopidy.playback.play();
    } else {
        if(isStreamUri(songdata.track.uri)) {
            mopidy.playback.stop();
        } else {
        mopidy.playback.pause();
        }
    }
    setPlayState(!play);
}

function doPrevious() {
    toast('Playing previous track...');
    mopidy.playback.previous();
}

function doNext() {
    toast('Playing next track...');
    mopidy.playback.next();
}

function backbt() {
    history.back();
    return false;
}

/***************
 * Options
 ***************/

function setTracklistOption(name, new_value) {
    if (!new_value) {
        $("#"+name+"bt").attr('style', 'color:#2489ce');
    } else {
        $("#"+name+"bt").attr('style', 'color:#66DD33');
    }
    return new_value
}

function setRepeat(nwrepeat) {
    if (repeat != nwrepeat) {
        repeat = setTracklistOption("repeat", nwrepeat);
    }
}

function setRandom(nwrandom) {
    if (random != nwrandom) {
        random = setTracklistOption("random", nwrandom);
    }
}

function setConsume(nwconsume) {
    if (consume != nwconsume) {
        consume = setTracklistOption("consume", nwconsume);
    }
}

function setSingle(nwsingle) {
    if (single != nwsingle) {
        single = setTracklistOption("single", nwsingle);
    }
}

function doRandom() {
    mopidy.tracklist.setRandom(!random).then();
}

function doRepeat() {
    mopidy.tracklist.setRepeat(!repeat).then();
}

function doConsume() {
    mopidy.tracklist.setConsume(!consume).then();
}

function doSingle() {
    mopidy.tracklist.setSingle(!single).then();
}


/*********************
 * Track Slider
 * Use a timer to prevent looping of commands
 *********************/

function timerCallback(position, duration) {
    $("#songelapsed").html(timeFromSeconds(position / 1000));
    if (duration == Infinity)
        duration = 0;
    $("#songlength").html(timeFromSeconds(duration / 1000));
    var oldval = initgui;
    initgui = true;
    $("#trackslider").val(position).slider('refresh');
    initgui = oldval;
}

function doSeek(position) {
    if (!initgui) {
        newposition = Math.round($("#trackslider").val());
        if (mopidy) {
            posChanging = true;
            mopidy.playback.seek(newposition);
            posChanging = false;
        }
        progressTimer.stop().set(newposition);
    }
}

/********************
 * Volume slider
 * Use a timer to prevent looping of commands
 */

function setVolume(value) {
    if ($("#volumeslider").val() != value) {
        $("#volumeslider").val(value).slider('refresh');
    }
}

function doVolume(value) {
    volumeChanging = value;
    clearInterval(volumeTimer);
    volumeTimer = setTimeout(triggerVolume, 500);
}

function triggerVolume() {
    mopidy.playback.setVolume(parseInt(volumeChanging));
    volumeChanging = 0;
}

function setMute(nwmute) {
    if (mute != nwmute) {
        mute = nwmute;
        if (mute) {
            $("#mutebt").attr('class', 'fa fa-volume-off');
        } else {
            $("#mutebt").attr('class', 'fa fa-volume-up');
        }
    }
}

function doMute() {
    mopidy.mixer.setMute(!mute);
}

/*********************************
 * Stream
 *********************************/
function streamPressed(key) {
    if (key == 13) {
        playStreamUri();
        return false;
    }
    return true;
}

function playStreamUri(uri) {
    //value of name is based on the passing of an uri as a parameter or not
    var nwuri = uri || $('#streamuriinput').val().trim();
    var service = $('#selectstreamservice').val();
    if (!uri && service) {
        nwuri = service + ':' + nwuri;
    }
    if (isServiceUri(nwuri) || isStreamUri(nwuri) || validUri(nwuri)) {
        toast('Playing...');
        //stop directly, for user feedback
        mopidy.playback.stop();
        //hide ios/android keyboard
        document.activeElement.blur();
        clearQueue();
        $("input").blur();
        mopidy.tracklist.add(null, null, nwuri);
        mopidy.playback.play();
    } else {
        toast('No valid url!');
    }
    return false;
}

function getCurrentlyPlaying() {
    $('#streamuriinput').val(songdata.track.uri); 
    var name = songdata.track.name;
    if (songdata.track.artists) {
        var artistStr = artistsToString(songdata.track.artists);
        if (artistStr) {
            name = artistStr + ' - ' + name;
        }
    }
    $('#streamnameinput').val(name); 
    return true;
}

function getPlaylistByName(name, scheme, create) {
    var uri_scheme = scheme || '';
    var uri = '';
    return mopidy.playlists.asList().catch(console.error.bind(console)).then(function(plists) {
        for (var i = 0; i < plists.length; i++) {
            if ((plists[i].name === name) && (scheme === '' || getScheme(plists[i].uri) === scheme)) {
                return plists[i];
            }
        }
        if (create) {
            return mopidy.playlists.create(name, scheme).done(function(plist) {
                console.log("Created playlist '%s'", plist.name);
                return plist;
            });
        }
        console.log("Can't find playist '%s", name);
    });
}

function getPlaylistFull(uri) {
    return mopidy.playlists.lookup(uri).then(function(pl) {
            playlists[uri] = pl;
            return pl;
    });
}

function getFavourites() {
    return getPlaylistByName(STREAMS_PLAYLIST_NAME, 
                             STREAMS_PLAYLIST_SCHEME,
                             true).then(function(playlist) {
        return getPlaylistFull(playlist.uri);
    });
}

function addFavourite(uri, name) {
    var uri = uri || $('#streamuriinput').val().trim();
    var name = name || $('#streamnameinput').val().trim();
    mopidy.library.lookup(null, [uri]).then(function(results) {
        var newTracks = results[uri];
        if (newTracks.length == 1) {
            // TODO: Supporting adding an entire playlist?
            if (name) {
                newTracks[0].name = name; // User overrides name.
            }
            getFavourites().then(function(favourites) {
                if (favourites) {
                    if (favourites.tracks) {
                        //Array.prototype.push.apply(favourites.tracks, newTracks)
                        favourites.tracks.push(newTracks[0]);
                    } else {
                        favourites.tracks = [newTracks[0]];
                    }
                    mopidy.playlists.save(favourites).then(function(s) {
                        showFavourites();
                    });
                }
            });
        } else {
            if (newTracks.length == 0) {
                console.log('No tracks to add');
            } else {
                console.log('Too many tracks (%d) to add', tracks.length);
            }
        }
    });
}

function deleteFavourite(index) {
    getFavourites().then(function(favourites) {
        if (favourites && favourites.tracks && index < favourites.tracks.length) {
            var name = favourites.tracks[index].name;
            if (confirm("Are you sure you want to remove '" + name + "'?")) {
                favourites.tracks.splice(index, 1);
                mopidy.playlists.save(favourites).then(function(s) {
                    showFavourites();
                });
            }
        }
    });
}

function showFavourites() {
    $('#streamuristable').empty();
    getFavourites().then(function(favourites) {
        if (favourites && favourites.tracks) {
            tracks = favourites.tracks;
            var tmp = '';
            var child = '';
            for (var i = 0; i < tracks.length; i++) {
                child = '<li><span class="ui-icon ui-icon-delete ui-icon-shadow" style="float:right; margin: .5em; margin-top: .8em;"><a href="#" onclick="return deleteFavourite(\'' + i + '\');">&nbsp;</a></span>' +
                    '<i class="fa fa-rss" style="float: left; padding: .5em; padding-top: 1em;"></i>' +
                    ' <a style="margin-left: 20px" href="#" onclick="return playStreamUri(\'' + tracks[i].uri + '\');">';
                child += '<h1>' + tracks[i].name + '</h1></a></li>';
                tmp += child;
            }
            $('#streamuristable').html(tmp);
        }
    });    
}

function haltSystem() {
    $.post("/settings/shutdown");
    toast('Stopping system...', 10000);
    setTimeout(function() {
        window.history.back();
    }, 10000);
}

function rebootSystem() {
    $.post("/settings/reboot");
    toast('Rebooting...', 10000);
    setTimeout(function() {
        window.history.back();
    }, 10000);
}
