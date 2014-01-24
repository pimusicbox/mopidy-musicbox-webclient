/********************************************************
 * play tracks from a browse list
 *********************************************************/
function playBrowsedTracks(addtoqueue, trackid) {
    //stop directly, for user feedback
    if (!addtoqueue) {
        mopidy.playback.stop(true);
        mopidy.tracklist.clear();
    }
    toast('Loading...');

// first add track to be played, then the other tracks
    mopidy.tracklist.add(trackid);
//    mopidy.tracklist.add({ 'uri':trackid });
    
    console.log(trackid);
    return false;

    //wait 1.5 second before adding the rest to give server the time to start playing
    setTimeout(function() {
	mopidy.tracklist.add(tracks.slice(0, selected), 0);
	if (selected < tracks.length) {
	    mopidy.tracklist.add(tracks.slice(selected + 1) );
	}
    }, 1500);
     

//    mopidy.playback.changeTrack(tracks[selected]);

    for (var i = 0; i <= selected; i++) {
        mopidy.playback.next();
    }

    mopidy.playback.play(); //tracks[selected]);
    //console.log(selected);
    return false;

}


/********************************************************
 * play an uri from a tracklist
 *********************************************************/
function playTrack(addtoqueue) {
    //stop directly, for user feedback
    if (!addtoqueue) {
        mopidy.playback.stop(true);
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

//find track that is playing
    for (var playing = 0; playing < currentplaylist.length; playing++) {
        if (currentplaylist[playing].uri == songdata.uri) {
            break;
        }
    }

//switch popup options
    switch (addtoqueue) {
        case ADD_THIS_BOTTOM:
            mopidy.tracklist.add(tracks.slice(selected, selected + 1));
            return false;
        case PLAY_NEXT:
            mopidy.tracklist.add(tracks.slice(selected, selected + 1), playing + 1);
            return false;
        case ADD_ALL_BOTTOM:
            mopidy.tracklist.add(tracks);
            return false;
    }

//normal    mopidy.tracklist.add(tracks);

//test    mopidy.tracklist.add(null, 0, playlisturi);

// first add track to be played, then the other tracks
    mopidy.tracklist.add(tracks.slice(selected, selected + 1) );
    //wait 1.5 second before adding the rest to give server the time to start playing
    setTimeout(function() {
	mopidy.tracklist.add(tracks.slice(0, selected), 0);
	if (selected < tracks.length) {
	    mopidy.tracklist.add(tracks.slice(selected + 1) );
	}
    }, 1500);
     
//    mopidy.playback.changeTrack(tracks[selected]);

    for (var i = 0; i <= selected; i++) {
        mopidy.playback.next();
    }

    mopidy.playback.play(); //tracks[selected]);
    //console.log(selected);
    return false;
}

/***
 * Plays a Track given by an URI
 * @param uri
 * @returns {boolean}
 */
function playTrackByUri(uri, playlisturi){
    //console.log('playuri');
    //stop directly, for user feedback
    mopidy.playback.stop(true);
    mopidy.tracklist.clear();

    //this is deprecated, remove when popuptracks is removed completly
    $('#popupTracks').popup('close');
    $('#controlspopup').popup('close');
    //end of deprecated

    toast('Loading...');

    var trackslist = new Array();
    var track, tracksbefore, tracksafter;
    var tracks = getTracksFromUri(playlisturi);

//find track that was selected
    for (var selected = 0; selected < tracks.length; selected++) {
        if (tracks[selected].uri == uri) {
            break;
        }
    }

//find track that is playing
    for (var playing = 0; playing < currentplaylist.length; playing++) {
        if (currentplaylist[playing].uri == songdata.uri) {
            break;
        }
    }

    mopidy.tracklist.add(tracks);

    for (var i = 0; i <= selected; i++) {
        mopidy.playback.next();
    }

    mopidy.playback.play(); //tracks[selected]);
//    console.log(selected);
    return false;
}

/********************************************************
 * play an uri from the queue
 *********************************************************/

/***
 * Plays a Track from a Playlist.
 * @param uri
 * @param playlisturi
 * @returns {boolean}
 */
function playTrackQueueByUri(uri, playlisturi){
    //console.log('playqu');
    //stop directly, for user feedback
//console.log('qu');
    mopidy.playback.stop(true);
    $('#popupQueue').popup('close');
    toast('Loading...');

    var track;
    for (var i = 0; i < currentplaylist.length; i++) {
        if (currentplaylist[i].uri == uri) {
            track = i + 1;
            break;
        }
    }
    for (var i = 0; i < track; i++) {
        mopidy.playback.next();
    }

    mopidy.playback.play(); //currentplaylist[track]);
    //console.log(track, currentplaylist[track]);
    return false;
}

/***
 * @deprecated
 * @returns {boolean}
 */
function playTrackQueue() {
    playlisturi = $('#popupQueue').data("list");
    uri = $('#popupQueue').data("track");
    return playTrackByUri(uri, playlisturi);
}

/********************************************************
 * remove a track from the queue
 *********************************************************/
function removeTrack() {
    $('#popupQueue').popup('close');
    toast('Deleting...');

    uri = $('#popupQueue').data("track");
    console.log(uri);

    for (var i = 0; i < currentplaylist.length; i++) {
        if (currentplaylist[i].uri == uri) {
            break;
        }
    }
    var track = {};
    track.uri = currentplaylist[i].uri;
    mopidy.tracklist.remove(track);
    console.log(currentplaylist[i].uri);
}

function clearQueue() {
    mopidy.tracklist.clear();
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
        $("#btplayNowPlaying >i").removeClass('fa-play').addClass('fa-pause');
    } else {
        $("#playimg").attr('src', 'images/icons/play_alt_32x32.png');
        $("#btplayNowPlaying >i").removeClass('fa-pause').addClass('fa-play');
    }
    play = nwplay;
}

//play or pause
function doPlay() {
    toast('Please wait...', 250);
    if (!play) {
        mopidy.playback.play();
    } else {
        mopidy.playback.pause();
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
	//check for mopidy 0.16.x or higher
	if (mopidy.tracklist.setRandom) { 
		mopidy.tracklist.setRandom(true).then();
	} else {
            mopidy.playback.setRandom(true).then();
        }
    } else {
	//check for mopidy 0.16.x or higher
	if (mopidy.tracklist.setRandom) { 
		mopidy.tracklist.setRandom(false).then();
	} else {
            mopidy.playback.setRandom(false).then();
        }
    }
    setRandom(!random);
}

function doRepeat() {
    if (repeat == false) {
	//check for mopidy 0.16.x or higher
	if (mopidy.tracklist.setRepeat) { 
            mopidy.tracklist.setRepeat(true).then();
        } else {
    	    mopidy.playback.setRepeat(true).then();
    	}
    } else {
	//check for mopidy 0.16.x or higher
	if (mopidy.tracklist.setRepeat) { 
            mopidy.tracklist.setRepeat(false).then();
        } else {
    	    mopidy.playback.setRepeat(false).then();
    	}
    }
    setRepeat(!repeat);
}


/*
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
    if(nwrandom){
        $("#flip-random").val('On');
    }else{
        $("#flip-random").val('Off');
    }
    console.log('function setRandom called: '+nwrandom);
}

function doRandom() {
    console.log('obsolete function doRandom called');
}
*/
//$("#flip-random").change(function () {
//    if ($(this).val() == "on") {
//        mopidy.tracklist.setRandom(true).then();
//    } else if ($(this).val() == "off") {
//        mopidy.tracklist.setRandom(false).then();
//    }
//});
//
//$("#flip-repeat").change(function () {
//    if ($(this).val() == "on") {
//        mopidy.tracklist.setRepeat(true).then();
//    } else if ($(this).val() == "off") {
//        mopidy.tracklist.setRepeat(false).then();
//    }
//});


/*********************
 * Track Slider
 * Use a timer to prevent looping of commands
 *********************/

function doSeekPos(value) {
    var val = $("#trackslider").val();
    newposition = Math.round(val);
    if (!initgui) {
        pauseTimer();
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
//	console.log(newposition);
        mopidy.playback.seek(newposition);
//        mopidy.playback.resume();
        resumeTimer();
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
    if (songlength > 0) {
        posTimer = setInterval(updateTimer, TRACK_TIMER);
    }
}

function initTimer() {
    pauseTimer();
    // setPosition(0);
    resumeTimer();
}

function pauseTimer() {
    clearInterval(posTimer);
}

/*********************************
 * Radio
 *********************************/
function radioPressed(key) {
    if (key == 13) {
        addRadioUri();
        return false;
    }
    return true;
}

function addRadioUri(name, uri) {
    //value of name is based on the passing of an uri as a parameter or not
    var name = '';
    if (!uri) {
        name = $('#radionameinput').val();
    } else {
        $('#radionameinput').val('');
    }
    uri = uri || $('#radiouriinput').val();
    if (validUri(uri)) {
        toast('Selecting radiostation...');
        //stop directly, for user feedback
        mopidy.playback.stop(true);
        //hide ios/android keyboard
        document.activeElement.blur();
        $("input").blur();
        clearQueue();
        mopidy.tracklist.add(null, 0, uri);
        mopidy.playback.play();
        var tmpname = name || '';
        var i = 0;
        //add station to list and check for doubles and add no more than 25
        for (var key in radioStations) {
            rs = radioStations[key];
            if (i > 25) {
                delete radioStations[key];
                continue;
            }
            i++;
            if (rs && rs[1] == uri) {
                tmpname = name || radioStations[key][0];
                delete radioStations[key];
            }
        }
        ;
        $('#radionameinput').val(tmpname);
        $('#radiouriinput').val(uri);
        radioStations.unshift([tmpname, uri]);
        saveRadioStations();
        updateRadioStations();
    } else {
        toast('No valid url!');
    }
    return false;
}

function updateRadioStations() {
    var tmp = '';
    $('#radiostationstable').empty();
    var child = '';
    for (var key in radioStations) {
        var rs = radioStations[key];
        if (rs) {
            name = rs[0] || rs[1];
            child = '<li><a href="#" onclick="return addRadioUri(\'' + rs[0] + '\', \'' + rs[1] + '\');">';
            child += '<h1>' + name + '</h1></a></li>';
            tmp += child;
        }
    }
    ;
    $('#radiostationstable').html(tmp);
}

function initRadio() {
    $.cookie.json = true;
    tmpRS = $.cookie('radioStations');
    radioStations = tmpRS || radioStations;
    updateRadioStations();
}

function saveRadioStations() {
    $.cookie.json = true;
    $.cookie('radioStations', radioStations);
}

function haltSystem() {
    $.post("/haltSystem");
    toast('Stopping system...', 10000);
    setTimeout(function(){window.history.back();}, 10000);
}

function rebootSystem() {
    $.post("/rebootSystem");
    toast('Rebooting...', 10000);
    setTimeout(function(){window.history.back();}, 10000);
}
