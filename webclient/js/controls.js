/********************************************************
 * play an uri from a trackslist or the current playlist
 *********************************************************/
function playTrack() {
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');

    //function playtrack(uri, playlisturi) {
    playlisturi = $('#popupTracks').data("list");
    uri = $('#popupTracks').data("track");
    //console.log(uri);
    //console.log(playlisturi);
    var trackslist = new Array();
    var track;
    switchContent('current', uri);
    var tracks = getTracksFromUri(playlisturi);
    if (tracks) {
        mopidy.tracklist.clear();
        mopidy.tracklist.add(tracks);
        $(CURRENT_PLAYLIST_TABLE).empty();
    } else {
        tracks = currentplaylist;
    }
    mopidy.playback.stop(true);

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

    return false;
}

/**********************
 * Buttons
 */

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
    // if position > 2 seconds -> go to begin, else go to previous track
    if (currentposition > 2000) {
        doSeekPos(0);
    } else {
        mopidy.playback.previous();
    }
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
 *********************/

function doSeekPos(value) {
    var val = $("#trackslider").val();
    newposition = Math.round(val);
    pauseTimer();
    clearTimeout(seekTimer);
    if (!initgui) {
        //set timer to not trigger it too much
        seekTimer = setTimeout(triggerPos, 100);
    }
}

function triggerPos() {
    console.log(newposition);
    if (mopidy) {
        mopidy.playback.pause();
        mopidy.playback.seek(newposition);
    }
    if (play) {
        resumeTimer();
    }
}

function setPosition(pos) {
    var oldval = initgui;
    currentposition = pos;
    initgui = true;
    $("#trackslider").val(currentposition).slider('refresh');
    initgui = oldval;
    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

/********************
 * Volume
 */

function setVolume(value) {
    var oldval = initgui;
    initgui = true;
    $("#volumeslider").val(value).slider('refresh');
    initgui = oldval;
}

function doVolume(value) {
    if (!initgui) {
        console.log('volume: ' + value);
        mopidy.playback.setVolume(value);
    }
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