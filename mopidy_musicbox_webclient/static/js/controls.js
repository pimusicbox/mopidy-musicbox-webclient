/********************************************************
 * play tracks from a browse list
 *********************************************************/
function playBrowsedTracks(addtoqueue, trackIndex) {
    $('#popupBrowse').popup('close');
    toast('Loading...');

    if (typeof trackIndex === 'undefined') {
        trackIndex = $('#popupBrowse').data("tlid");
    }
    var trackUri = browseTracks[trackIndex].uri;

    // For radio streams we just add the selected URI.
    // TODO: Why?
    //if (isStreamUri(trackUri)) {
        //mopidy.tracklist.add(null, null, trackUri);
        //return false;
    //}

    switch (addtoqueue) {
        case PLAY_NOW:
        case PLAY_NEXT:
            mopidy.tracklist.index(songdata).then(function(currentIndex) {
                mopidy.tracklist.add(null, currentIndex + 1, trackUri).then(function(tlTracks) {
                    if (addtoqueue == PLAY_NOW) {
                        mopidy.playback.play(tlTracks[0]);
                    }
                });
            });
            break;
        case ADD_THIS_BOTTOM:
            mopidy.tracklist.add(null, null, trackUri);
            break;
        case ADD_ALL_BOTTOM:
            mopidy.tracklist.add(browseTracks);
            break;
        case PLAY_ALL:
            mopidy.tracklist.clear();
            // TODO: Use uris parameter in v1.0 API (faster?).
            mopidy.tracklist.add(browseTracks).then(function(tlTracks) {
                mopidy.playback.play(tlTracks[trackIndex]);
            });
            break;
        default:
            break;
    }
    return false;
}


/********************************************************
 * play an uri from a tracklist
 *********************************************************/
function playTrack(addtoqueue) {
    var hash = document.location.hash.split('?');
    var divid = hash[0].substr(1);

    if (!addtoqueue) {
        addtoqueue = PLAY_NOW;
    }

    //    console.log(addtoqueue, divid);

    //stop directly, for user feedback. If searchresults, also clear queue
    if (!addtoqueue || ((addtoqueue == PLAY_NOW) && (divid == 'search'))) {
        mopidy.tracklist.clear();
    }
    $('#popupTracks').popup('close');
    $('#controlspopup').popup('close');
    toast('Loading...');

    playlisturi = $('#popupTracks').data("list");

    uri = $('#popupTracks').data("track");

    var trackslist = new Array();
    var track, tracksbefore, tracksafter;
    var tracks = getTracksFromUri(playlisturi);

    //find track that was selected
    for (var selected = 0; selected < tracks.length; selected++) {
        if (tracks[selected].uri == uri) {
            break;
        }
    }

    //switch popup options
    switch (addtoqueue) {
        case PLAY_NOW:
            if (divid == 'search') {
                mopidy.tracklist.add(tracks.slice(selected, selected + 1));
                mopidy.playback.play();
                return false;
            }
        case ADD_THIS_BOTTOM:
            mopidy.tracklist.add(tracks.slice(selected, selected + 1));
            return false;
        case PLAY_NEXT:
            mopidy.tracklist.index(songdata).then(function(currentIndex) {
                mopidy.tracklist.add(tracks.slice(selected, selected + 1), currentIndex + 1);
            });
            return false;
        case ADD_ALL_BOTTOM:
            mopidy.tracklist.add(tracks);
            return false;
    }
    // PLAY_NOW, play the selected track
    //    mopidy.tracklist.add(null, null, uri); //tracks);
    mopidy.tracklist.add(tracks);

    if (!addtoqueue) {
        mopidy.playback.stop();
        for (var i = 0; i <= selected; i++) {
            mopidy.playback.next();
        }
        mopidy.playback.play();
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
//        console.log('fa', tltracks, track_uri);
        if (tltracks == []) { return;}
        // Find track that was selected
        for (var selected = 0; selected < tltracks.length; selected++) {
            if (tltracks[selected].track.uri == track_uri) {
                mopidy.playback.play(tltracks[selected]);
                return;
            }
        }
        console.log('Failed to play selected track ', track_uri);
    }

    // Stop directly, for user feedback
    mopidy.playback.stop();
    mopidy.tracklist.clear();

    //this is deprecated, remove when popuptracks is removed completly
    $('#popupTracks').popup('close');
    $('#controlspopup').popup('close');
    //end of deprecated

    toast('Loading...');

    var func;
    func = mopidy.tracklist.add(null, null, playlist_uri);
    func.then(
        function(tltracks) {
            //check if tltracks is filled, some backends (gmusic, m3u) do not support adding by uri, it seems
            if (tltracks.length == 0) {
                var tracks = getTracksFromUri(playlist_uri);
                mopidy.tracklist.add(tracks).then(findAndPlayTrack);
            }
            findAndPlayTrack(tltracks);
        }
    ).then(getCurrentPlaylist()); // Updates some state
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
        $("#playimg").attr('src', 'images/icons/pause_32x32.png');
        $("#playimg").attr('title', 'Pause');
        $("#btplayNowPlaying >i").removeClass('fa-play').addClass('fa-pause');
        $("#btplayNowPlaying").attr('title', 'Pause');
    } else {
        $("#playimg").attr('src', 'images/icons/play_alt_32x32.png');
        $("#playimg").attr('title', 'Play');
        $("#btplayNowPlaying >i").removeClass('fa-pause').addClass('fa-play');
        $("#btplayNowPlaying").attr('title', 'Play');
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

function doSeekPos(value) {
    var val = $("#trackslider").val();
    newposition = Math.round(val);
    if (!initgui) {
        pausePosTimer();
        //set timer to not trigger it too much
        clearTimeout(seekTimer);
        $("#songelapsed").html(timeFromSeconds(val / 1000));
        seekTimer = setTimeout(triggerPos, 500);
    }
}

function triggerPos() {
    if (mopidy) {
        posChanging = true;
        //        mopidy.playback.pause();
        //    console.log(newposition);
        mopidy.playback.seek(newposition);
        //        mopidy.playback.resume();
        resumePosTimer();
        posChanging = false;
    }
}

function setPosition(pos) {
    if (posChanging) {
        return;
    }
    var oldval = initgui;
    if (pos > songlength) {
        pos = songlength;
        pausePosTimer();
    }
    currentposition = pos;
    initgui = true;
    $("#trackslider").val(currentposition).slider('refresh');
    initgui = oldval;
    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

/********************
 * Volume slider
 * Use a timer to prevent looping of commands
 */

function setVolume(value) {
    var oldval = initgui;
    initgui = true;
    $("#volumeslider").val(value).slider('refresh');
    initgui = oldval;
}

function doVolume(value) {
    if (!initgui) {
        volumeChanging = value;
        clearInterval(volumeTimer);
        volumeTimer = setTimeout(triggerVolume, 500);
    }
}

function triggerVolume() {
    mopidy.playback.setVolume(parseInt(volumeChanging));
    volumeChanging = 0;
}

function doMute() {
    //only emit the event, not the status
    if (muteVolume == -1) {
        $("#mutebt").attr('src', 'images/icons/volume_mute_24x18.png');
        muteVolume = currentVolume;
        mopidy.playback.setVolume(0).then();
    } else {
        $("#mutebt").attr('src', 'images/icons/volume_24x18.png');
        mopidy.playback.setVolume(muteVolume).then();
        muteVolume = -1;
    }

}

/*******
 * Track position timer
 */

//timer function to update interface
function updatePosTimer() {
    currentposition += TRACK_TIMER;
    setPosition(currentposition);
    //    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

function resumePosTimer() {
    pausePosTimer();
    if (songlength > 0) {
        posTimer = setInterval(updatePosTimer, TRACK_TIMER);
    }
}

function initPosTimer() {
    pausePosTimer();
    // setPosition(0);
    resumePosTimer();
}

function pausePosTimer() {
    clearInterval(posTimer);
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
    return mopidy.playlists.filter({"name": name}).then(function(plists) {
        for (var i = 0; i < plists.length; i++) {
            if (!scheme || getScheme(plists[i].uri) == scheme) {
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

function getFavourites() {
    return getPlaylistByName(STREAMS_PLAYLIST_NAME, 
                             STREAMS_PLAYLIST_SCHEME,
                             true).then(function(playlist) {
        return playlist;
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
