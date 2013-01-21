/* gui interactions here
 * set- functions only set/update the gui elements
 * do- functions interact with the server
 * show- functions do both
 */
var mopidy;

function showartist(nwuri) {
    $(ARTIST_TABLE).empty();
    //fill from cache
    var pl = getTracksFromUri(nwuri);
    if (pl) {
        playlisttotable(pl, ARTIST_TABLE, nwuri)
        $('#h_artistname').html(getArtist(pl));
        mopidy.library.lookup(nwuri).then(processArtistResults, console.error);
    } else {
        $('#h_artistname').html('');
        $('#artistsloader').show();
        mopidy.library.lookup(nwuri).then(processArtistResults, console.error);
    }
    //show
    switchContent('artists', nwuri);
    return false;
}

function showalbum(uri) {
    $(ALBUM_TABLE).empty();
    //fill from cache
    var pl = getTracksFromUri(uri);
    if (pl) {
        playlisttotable(pl, ALBUM_TABLE, uri)
        $('#h_albumname').html(getAlbum(pl));
        $('#h_albumartist').html(getArtist(pl));
        mopidy.library.lookup(uri).then(processAlbumResults, console.error);
    } else {
        $('#h_albumname').html('');
        $('#h_albumartist').html('');
        $('#albumsloader').show();
        mopidy.library.lookup(uri).then(processAlbumResults, console.error);
    }
    //show
    switchContent('albums', uri);
    return false;
}

function resetSong() {
    pauseTimer();
    setPlayState(false);
    setPosition(0);
    var data = new Object;
    data.name = '';
    data.artists = '';
    data.length = 0;
    data.uri = '';
    setSongInfo(data);
}

function expandSonginfo() {

}

function resizeSonginfo() {
    $("#infoname").html(songname);

    $("#infoartist").html(artistshtml);

    if ((artiststext.length > 90) || (songname.length > 60)) {
        $("#infoartist").html(artiststext);
        //bug in truncate?
        var spanwidth = $("#infoartist").width() - 1;
        $("#infoname").truncate({
            width : spanwidth,
            token : '&hellip;',
            center : true,
            multiline : false
        });
        $("#infoartist").truncate({
            width : spanwidth,
            token : '&hellip;',
            center : true,
            multiline : false
        });
    }
}

function setSongInfo(data) {
    //console.log(data);

    artistshtml = '';
    artiststext = '';
    songname = data.name;

    for (var j = 0; j < data.artists.length; j++) {
        artistshtml += '<a href="#" onclick="return showartist(\'' + data.artists[j].uri + '\');">' + data.artists[j].name + '</a>';
        artiststext += data.artists[j].name;
        if (j != data.artists.length - 1) {
            artistshtml += ', ';
            artiststext += ', ';
        }
    }

    $("#trackslider").attr("max", data.length);
    $("#songlength").html(timeFromSeconds(data.length / 1000));

    resizeSonginfo();

    $('#currenttable tr .name').each(function() {
        //console.log(this.className);
        this.className = "name";
        if (this.id == data.uri) {
            this.className += ' currenttrack';
            //             this.parentNode.parentNode.style.marginLeft="20px";
        }
    });
}

/* Toggle state of play button */
function setPlayState(nwplay) {
    if (nwplay) {
        $("#playbt").attr('src', 'img/icons/pause_32x32.png');
    } else {
        $("#playbt").attr('src', 'img/icons/play_alt_32x32.png');
    }
    play = nwplay;
}

//play or pause
function doPlayPause() {
    if (!play) {
        mopidy.playback.play().then();
    } else {
        mopidy.playback.pause().then();
    }
    setPlayState(!play);
}

/* Initialise search */
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
        $('#artistresultloader').show();
        $('#allresultloader').show();
        $('#albumresultloader').show();
    
        $('#artistresulttable').empty();
        $('#albumresulttable').empty();
        $('#trackresulttable').empty();
    
        delete customTracklists['allresultscache'];
        delete customTracklists['artistresultscache'];
        delete customTracklists['albumresultscache'];
        delete customTracklists['trackresultscache'];
        $("#searchresults").hide();
        mopidy.library.search({
            any : value
        }).then(processSearchResults, console.error);
    }
}

function doMute() {
    //only emit the event, not the status

    if (muteVolume == -1) {
        $("#mutebt").attr('src', 'img/icons/volume_mute_24x18.png');
        muteVolume = currentVolume;
        mopidy.playback.setVolume(0);
    } else {
        $("#mutebt").attr('src', 'img/icons/volume_24x18.png');
        mopidy.playback.setVolume(muteVolume);
        muteVolume = -1;
    }

}

function setRepeat(nwrepeat) {
    if (repeat == nwrepeat) {
        return
    }
    if (!nwrepeat) {
        $("#repeatbt").attr('src', 'img/icons/reload_alt_18x21.png');
    } else {
        $("#repeatbt").attr('src', 'img/icons/reload_18x21.png');
    }
    repeat = nwrepeat;
}

function setRandom(nwrandom) {
    if (random == nwrandom) {
        return
    }
    if (!nwrandom) {
        $("#randombt").attr('src', 'img/icons/loop_alt2_24x21.png');
    } else {
        $("#randombt").attr('src', 'img/icons/loop_24x24.png');
    }
    random = nwrandom;
}

function doPrevious() {
    // if position > one second -> go to begin, else go to previous track
    if (currentposition > 5000) {
        doSeekPos(0);
    } else {
        mopidy.playback.previous();
    }
}

function doNext() {
    mopidy.playback.next();
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

function doVolume(value) {
    if (!initgui) {
        mopidy.playback.setVolume(value);
    }
}

function doSeekPos(value) {
    var val = Math.round(value);
    if (!initgui) {
        //set timer to not trigger it too much
        clearTimeout(seekTimer);
        seekTimer = setTimeout(triggerPos, 250);
        //setPlayState(true);
    }
}

function triggerPos() {
    if (mopidy) {
        mopidy.playback.seek(val);
    }
    if (play) {
        resumeTimer();
    }
}

function getPlaylists() {
/********************************************************
 *  get playlists without tracks
 ********************************************************/
    mopidy.playlists.getPlaylists(false).then(processGetPlaylists, console.error);
}

function showTracklist(uri) {
/********************************************************
 * Show tracks of playlist
 ********************************************************/
    $(PLAYLIST_TABLE).empty();
    $('#playlisttablediv').show();
    $('#playlistloader').show();

    var pl = getPlaylistFromUri(uri);
//    console.log (pl);
    //load from cache
    if (pl) {
        playlisttotable(pl.tracks, PLAYLIST_TABLE, uri);
    }

    //scroll to tracklist
    var divtop = $("#playlisttablediv").offset().top - 80;
    $('body,html').animate({scrollTop: divtop}, 250);

    //lookup recent tracklist
    mopidy.playlists.lookup(uri).then(processGetTracklist, console.error);
    return false;
}

function getCurrentPlaylist() {
    mopidy.tracklist.getTracks().then(processCurrentPlaylist, console.error);
}

function setPosition(pos) {
    var oldval = initgui;
    currentposition = pos;
    initgui = true;
    $("#trackslider").attr("value", currentposition);
    initgui = oldval;
    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

//update everything as if reloaded
function updateStatusOfAll() {
    mopidy.playback.getCurrentTrack().then(processCurrenttrack, console.error);
    mopidy.playback.getTimePosition().then(processCurrentposition, console.error);
    mopidy.playback.getState().then(processPlaystate, console.error);

    mopidy.playback.getRepeat().then(processRepeat, console.error);
    mopidy.playback.getRandom().then(processRandom, console.error);
    
    //TODO check offline?
}

function initSocketevents() {
    mopidy.on("state:online", function() {
        $("#offlinemodal").modal('hide');
        $("#loadingmodal").modal('show');
        getCurrentPlaylist();
        updateStatusOfAll();
        getPlaylists();
        $("#loadingmodal").modal('show');
        $(window).hashchange();
    });

    mopidy.on("state:offline", function() {
        resetSong();
        $("#offlinemodal").modal('show');
    });

    mopidy.on("event:trackPlaybackStarted", function(data) {
        mopidy.playback.getTimePosition().then(processCurrentposition, console.error);
        setPlayState(true);
        setSongInfo(data.tl_track.track);
        initTimer();
    });

    mopidy.on("event:trackPlaybackPaused", function(data) {
        setSongInfo(data.tl_track.track);
        pauseTimer();
        setPlayState(false);
    });

    mopidy.on("event:playlistsLoaded", function(data) {
        $("#loadingmodal").modal('show');
        getPlaylists();
    });

    mopidy.on("event:playbackStateChanged", function(data) {
        switch (data["new_state"]) {
            case "stopped":
                resetSong();
                break;
            case "playing":
                mopidy.playback.getTimePosition().then(processCurrentposition, console.error);
                resumeTimer();
                setPlayState(true);
                break;
        }
    });

    mopidy.on("event:tracklistChanged", function(data) {
        getCurrentPlaylist();
    });

    mopidy.on("event:seeked", function(data) {
        setPosition(parseInt(data["time_position"]));
    });
}

function setVolume(value) {
    $("#volumeslider").attr("value", value);
}

function switchContent(divid, uri) {
    var hash = divid;
    if (uri) {
        hash += "/" + uri;
    }
    location.hash = hash;
}

//timer function to update interface
function updateTimer() {
    currentposition += 100;
    setPosition(currentposition);
    //    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

function resumeTimer() {
    pauseTimer();
    posTimer = setInterval(updateTimer, 100);
}

function initTimer() {
    pauseTimer();
    setPosition(0);
    resumeTimer();
}

function pauseTimer() {
    clearInterval(posTimer);
}


$(document).ready(function() {

    // Connect to server
    mopidy = new Mopidy();
    // Log all events
    //mopidy.on(function () { console.log(arguments); });
    //initialize events
    initSocketevents();

    $('.content').hide();
    $('.sidebar-nav a').bind('click', function(e) {
        var divid = $(e.target).attr('href').substr(1);
        var uri = $(divid + "table").attr('data');

        switchContent(divid, uri);
    });

    resetSong();
    //TODO
    //setVolume(50);

    //history
    // Bind an event to window.onhashchange that, when the hash changes, gets the
    // hash and adds the class "selected" to any matching nav link.
    $(window).hashchange(function() {
        var hash = location.hash.split("/");

        //remove #
        var divid = hash[0].substr(1);
        var uri = hash[1];
//        console.log(divid + ': ' + uri);
        switch(divid) {
            case 'current':
                break;
            case 'playlists':
                break;
            case 'search':
                $("div.searchpane input").focus();
                if (customTracklists['allresultscache'] == '') {
                    initSearch($('#searchinput').val());
                }
                break;
            case 'artists':
                if (uri != '') {
                    showartist(uri);
                }
                break;
            case 'albums':
                if (uri != '') {
                    showalbum(uri);
                }
                break;
        }

        // Set the page title based on the hash.
        //document.title = PROGRAM_NAME;

        $('.content').hide();
        $('.nav li').removeClass('active');
        $('#li' + divid).addClass('active');

        $('#' + divid).removeClass('active');
        $('#' + divid).addClass('active');

        $('#' + divid + 'pane').show();
        return false;
    });
    if (location.hash.length < 2) {
        switchContent("playlists");
    }
    
    // disable closing of modal boxes
    $('#offlinemodal').modal({
        backdrop: 'static',
        keyboard: false
    })
    $('#loadingmodal').modal({
        backdrop: 'static',
        keyboard: false
    })
    

    //  $("#songinfo").resize(resizeSonginfo());
    initgui = false;
    //update gui every x seconds from mopdidy
    //  setInterval(updateStatusOfAll, 5000);
});

function backbt() {
    history.back();
}

function toggleSearch() {
    $("#albumresulttable tr").removeClass('hidden');
    $("#artistresulttable tr").removeClass('hidden');
}
