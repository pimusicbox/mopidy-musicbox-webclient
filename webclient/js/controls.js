/********************************************************
 * play an uri from a trackslist or the current playlist
 *********************************************************/
function playTrack(addtobottom) {
    //stop directly, for user feedback
    if (!addtobottom) {
        mopidy.playback.stop(true);
    }
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    showLoading(true);

    //function playtrack(uri, playlisturi) {
    playlisturi = $('#popupTracks').data("list");
    uri = $('#popupTracks').data("track");

    var trackslist = new Array();
    var track, tracksbefore, tracksafter;
    var tracks = getTracksFromUri(playlisturi);
    if (tracks) {
        if (!addtobottom) {
            mopidy.tracklist.clear();
        }
        $(CURRENT_PLAYLIST_TABLE).empty();
    } else {
        tracks = currentplaylist;
        for (var i = 0; i < tracks.length; i++) {
            if (tracks[i].uri == uri) {
                track = i + 1;
                break;
            }
        }
        for (var i = 0; i < track; i++) {
            mopidy.playback.next();
        }
        mopidy.playback.play();
        showLoading(false);
        return false;
    }

    if (addtobottom) {
        mopidy.tracklist.add(tracks);
        showLoading(false);
        return false;
    }

// first add track to be played, then the other tracks
    for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].uri == uri) {
console.log(i);
            mopidy.tracklist.add(tracks.slice(i, i + 1) );
            mopidy.playback.play();
	    //wait 2 seconds before adding the rest to give server the time to start playing
	    setTimeout(function() {
                mopidy.tracklist.add(tracks.slice(0, i), 0);
	        if (i < tracks.length) {
    		    mopidy.tracklist.add(tracks.slice(i + 1) );
    	        }
	    }, (2000));
            break;
        }
    }

    showLoading(false);
    return false;
}

/**********************
 * Buttons
 */

function doShuffle() {
    mopidy.playback.stop(true);
    mopidy.tracklist.shuffle();
    mopidy.playback.play();
}

/* Toggle state of play button */
function setPlayState(nwplay) {
    if (nwplay) {
        $("#playimg").attr('src', 'images/icons/pause_32x32.png');
    } else {
        $("#playimg").attr('src', 'images/icons/play_alt_32x32.png');
    }
    play = nwplay;
}

//play or pause
function doPlay() {
    if (!play) {
        mopidy.playback.play();
    } else {
        mopidy.playback.pause();
    }
    setPlayState(!play);
}

function doPrevious() {
    mopidy.playback.previous();
}

function doNext() {
    mopidy.playback.next();
}

function backbt() {
    history.back();
    return false;
}

/***************
 * Options
 */

function setRepeat(nwrepeat) {
    if (repeat == nwrepeat) {
        return
    }
    if (!nwrepeat) {
        $("#repeatbt").attr('src', 'images/icons/reload_alt_18x21.png');
    } else {
        $("#repeatbt").attr('src', 'images/icons/reload_18x21.png');
    }
    repeat = nwrepeat;
}

function setRandom(nwrandom) {
    if (random == nwrandom) {
        return
    }
    if (!nwrandom) {
        $("#randombt").attr('src', 'images/icons/loop_alt2_24x21.png');
    } else {
        $("#randombt").attr('src', 'images/icons/loop_24x24.png');
    }
    random = nwrandom;
}

function doRandom() {
    if (random == false) {
        mopidy.playback.setRandom(true);
    } else {
        mopidy.playback.setRandom(false);
    }
    setRandom(!random);
}

function doRepeat() {
    if (repeat == false) {
        mopidy.playback.setRepeat(true).then();
    } else {
        mopidy.playback.setRepeat(false).then();
    }
    setRepeat(!repeat);
}

/*********************
 * Track Slider
 * Use a timer to prevent looping of commands
 *********************/

function doSeekPos(value) {
    var val = $("#trackslider").val();
    newposition = Math.round(val);
    clearTimeout(seekTimer);
    if (!initgui) {
        pauseTimer();
        //set timer to not trigger it too much
        posChanging = true;
        seekTimer = setTimeout(triggerPos, 200);
    }
}

function triggerPos() {
    if (mopidy) {
        mopidy.playback.stop();
        mopidy.playback.seek(newposition);
        mopidy.playback.resume();
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
        pauseTimer();
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
        volumeChanging = true;
        clearInterval(volumeTimer);
        volumeTimer = setTimeout(triggerVolume, 2000);
        mopidy.playback.setVolume(parseInt(value));
    }
}

function triggerVolume() {
    volumeChanging = false;
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
 * Track timer
 */

//timer function to update interface
function updateTimer() {
    currentposition += TRACK_TIMER;
    setPosition(currentposition);
    //    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

function resumeTimer() {
    pauseTimer();
    posTimer = setInterval(updateTimer, TRACK_TIMER);
}

function initTimer() {
    pauseTimer();
    // setPosition(0);
    resumeTimer();
}

function pauseTimer() {
    clearInterval(posTimer);
}
