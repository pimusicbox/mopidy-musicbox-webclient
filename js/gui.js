/* gui interactions here
 * set- functions only set/update the gui elements
 * do- functions interact with the server
 * show- functions do both
 */
var mopidy;

function showartist(nwuri) {
    $(ARTIST_TABLE).empty();
    //fill from cache
    pl = getTracksFromUri(nwuri);
    console.log(pl);
    if (pl) {
        playlisttotable(pl, ARTIST_TABLE, nwuri)
        $('#h_artistname').html(getArtist(pl));
        mopidy.library.lookup(nwuri).then(handleArtistResults,console.error);
    } else {
        $('#h_artistname').html('');
        $('#artistsloader').show();
        mopidy.library.lookup(nwuri).then(handleArtistResults,console.error);
    }        
    //show
    switchContent('artists', nwuri);
    return false;
}

function showalbum(uri) {
    $(ALBUM_TABLE).empty();
    //fill from cache
    pl = getTracksFromUri(uri);
    console.log(pl);
    if (pl) {
        playlisttotable(pl, ALBUM_TABLE, uri)
        $('#h_albumname').html(getAlbum(pl));
        $('#h_albumartist').html(getArtist(pl));
        mopidy.library.lookup(uri).then(handleAlbumResults,console.error);
    } else {
        $('#h_albumname').html('');
        $('#h_albumartist').html('');
        $('#albumsloader').show();
        mopidy.library.lookup(uri).then(handleAlbumResults,console.error);
    }        
    //show
    switchContent('albums', uri);
    return false;
}

function resetSong() {
    pauseTimer();
    setPlayState(false);
    setPosition(0);
    data = new Object;
    data["name"] = '';
    data["artists"] = '';
    data["length"] = 0;
    data["uri"] = '';
    setSongInfo(data);
}

function expandSonginfo() {
    
}

function resizeSonginfo () {
    $("#infoname").html(songname);

    $("#infoartist").html(artistshtml);

    if( (artiststext.length > 68) || ( data["name"].length > 90)) {
        $("#infoartist").html(artiststext);
        //bug in truncate?
        var spanwidth = $("#infoartist").width() - 1;
        $("#infoname").truncate({    width: spanwidth,    token: '&hellip;',    center: true,    multiline: false});
        $("#infoartist").truncate({    width: spanwidth,    token: '&hellip;',    center: true,    multiline: false});
    }
}

function setSongInfo(data) {
    console.log(data);

    artistshtml = '';
    artiststext = '';
    songname = data["name"];

    for (var j = 0; j < data["artists"].length; j++) {
        artistshtml += '<a href="#" onclick="return showartist(\'' + data["artists"][j].uri + '\');">' + data["artists"][j].name + '</a>';
        artiststext += data["artists"][j].name;
        if (j != data["artists"].length - 1) {
            artistshtml += ', ';
            artiststext += ', ';
        }
    }
    
    $("#trackslider").attr("max", data["length"]);
    $("#songlength").html(timeFromSeconds(data["length"] / 1000));

    resizeSonginfo();
    
    $('#currenttable tr .name').each(  
        function() {
          //console.log(this.className);
          this.className = "name";
          if(this.id == data["uri"]) {
             this.className += ' currenttrack';
//             this.parentNode.parentNode.style.marginLeft="20px";
          }
        } );
}

function setPlayState(nwplay) {
    if (nwplay) {
        $("#playbt").attr('src', 'img/icons/pause_18x24.png');
    } else {
        $("#playbt").attr('src', 'img/icons/play_alt_32x32.png');
    }
    play = nwplay;
}

//play or pause
function doPlayPause() {
    if (!play) {
        mopidy.playback.play().then(console.log);
    } else {
        mopidy.playback.pause().then(console.log);
    }
    setPlayState(!play);
}

function setPlaylist(uri) {
     $(PLAYLIST_TABLE).empty();
     $('#playlisttablediv').show();
//     $('#playlistloader').show();
    
     pl = getPlaylistFromUri(uri);
     
     //console.log(pl);
     playlisttotable(pl["tracks"], PLAYLIST_TABLE, uri);
     $('body,html').scrollTop($("#playlistspane").offset().top - 100);
     return false;
}

function searchPressed(key) {
    value = $('#searchinput').val();
//    console.log(value);
//    console.log(key);
    switchContent('search');

    if (key == 13) {
        $('#artistresultloader').show();
        $('#allresultloader').show();
        $('#albumresultloader').show();

        $('#artistresulttable').empty();
        $('#albumresulttable').empty();
        $('#trackresulttable').empty();

        initSearch(value);
        return false;
    }
    return true;
}

//init search
function initSearch(value) {
    if ((value.length < 100) && (value.length > 0)) {
        delete customTracklists['allresultscache'];
        delete customTracklists['artistresultscache'];
        delete customTracklists['albumresultscache'];
        delete customTracklists['trackresultscache'];
        $("#searchresults").hide();
        mopidy.library.search({any: value}).then(handleSearchResults, console.error);
    }
}

function initAlbumSearch(value) {
    if (customTracklists['albumresultscache']) { return; }
    value = $('#searchinput').val();
    mopidy.library.search({album: value}).then(handleAlbumSearchResults, console.error);
    return false;
}

function initTrackSearch(value) {
    if (customTracklists['trackresultscache']) { return; }
    value = $('#searchinput').val();
    mopidy.library.search({track: value}).then(handleTrackSearchResults, console.error);
    return false;
}

function initArtistSearch(value) {
    if (customTracklists['artistresultscache']) { return; }
    value = $('#searchinput').val();
    mopidy.library.search({artist: value}).then(handleArtistSearchResults, console.error);
    return false;
}

function doMute() {
    //only emit the event, not the status
   
    if (muteVolume == -1) {
        $("#mutebt").attr('src', 'img/icons/volume_mute_24x18.png');
        muteVolume = currentVolume;
        mopidy.playback.setVolume(0).then(console.log, console.log);
    } else {
        $("#mutebt").attr('src', 'img/icons/volume_24x18.png');
        mopidy.playback.setVolume(muteVolume).then(console.log, console.log);
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

function setShuffle(nwshuffle) {
    if (shuffle == nwshuffle) {
        return
    }
    if (!nwshuffle) {
        $("#shufflebt").attr('src', 'img/icons/loop_alt2_24x21.png');
    } else {
        $("#shufflebt").attr('src', 'img/icons/loop_24x24.png');
    }
    shuffle = nwshuffle;
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

function doShuffle() {
    if (shuffle == false) {
        mopidy.playback.setRandom(true);
    } else {
        mopidy.playback.setRandom(false);
    }
    setShuffle(!shuffle);
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
    console.log(value);
    if (!initgui) {
         mopidy.playback.setVolume(value);
    }   
}

function doSeekPos(value) {
    val = Math.round(value);
    if (!initgui) {
        //set timer to not trigger it too much
        clearTimeout(seekTimer);
        seekTimer = setTimeout(triggerPos, 250);
        //setPlayState(true);
    }
}

function triggerPos() {
        if (mopidy) {mopidy.playback.seek(val);}
        if(play) { resumeTimer();}
}

function getPlaylists() {
    mopidy.playlists.getPlaylists().then(handleGetplaylists, console.error);
}

function getCurrentPlaylist() {
    mopidy.tracklist.getTracks().then(handleCurrentPlaylist, console.error);
}

function setPosition(pos) {
    oldval = initgui;
    currentposition = pos;
    initgui = true;
    $("#trackslider").attr("value", currentposition);
    initgui = oldval;
    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));     
}

//update everything as if reloaded
function updateStatusOfAll() {
    mopidy.playback.getCurrentTrack().then(currentTrackResults, console.error);  
    mopidy.playback.getTimePosition().then(currentPositionResults, console.error);  
    mopidy.playback.getState().then(currentStateResults, console.error);  

    mopidy.playback.getRepeat().then(repeatResults, console.error);  
    mopidy.playback.getRandom().then(randomResults, console.error);  
}

function initSocketevents() {
    mopidy.on("state:online", function () {
        getCurrentPlaylist();
        updateStatusOfAll();
        getPlaylists();
        $(window).hashchange();
    });

    mopidy.on("state:offline", function () {
        resetSong();
    });

    mopidy.on("event:trackPlaybackStarted", function (data) {
        setSongInfo(data.tl_track.track);
        mopidy.playback.getTimePosition().then(currentPositionResults, console.error);
        setPlayState(true);  
        initTimer();
    });

    mopidy.on("event:trackPlaybackPaused", function (data) {
        setSongInfo(data.tl_track.track);
        pauseTimer();
        setPlayState(false);
    });

    mopidy.on("event:playlistsLoaded", function (data) {
        getPlaylists();
    });

    mopidy.on("event:playbackStateChanged", function (data) {
        switch (data["new_state"]){
            case "stopped": 
                resetSong();
                break;
            case "playing": 
                mopidy.playback.getTimePosition().then(currentPositionResults, console.error);
                resumeTimer();
                setPlayState(true);
                break;
        }
    });

    mopidy.on("event:tracklistChanged", function (data) {
        getCurrentPlaylist();
    });

/*    mopidy.on("event:trackPlaybackStopped", function (data) {
        pauseTimer();
        setPlayState(false);
    });

    mopidy.on("event:trackPlaybackEnded", function (data) {
        pauseTimer();
        setPlayState(false);
    });

    mopidy.on("event:trackPlaybackResumed", function (data) {
        mopidy.playback.getTimePosition().then(currentPositionResults, console.error);
        resumeTimer();
        setPlayState(true);
    });
*/
    mopidy.on("event:seeked", function (data) {
        setPosition(parseInt(data["time_position"]));
    });
}

function setVolume(value) {
    $("#volumeslider").attr("value", value);
}


function switchContent(divid, uri) {
    //TODO
    //    History.pushState({viewpane:divid, state:uri}, divid, "?" + divid + "/" + uri);
    hash = divid;
    console.log("switchc hash:" + hash);
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

function resumeTimer () {
    pauseTimer();
    posTimer = setInterval(updateTimer, 100);
}

function initTimer () {
    pauseTimer();
    setPosition(0);
    resumeTimer();
}

function pauseTimer () {
   clearInterval(posTimer);
}


$(document).ready(function() {

    mopidy = new Mopidy();  // Connect to server
    mopidy.on(console.log);     // Log all events
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
        $(window).hashchange( function(){
            var hash = location.hash.split("/");
            
            //remove #
            divid = hash[0].substr(1);
            uri = hash[1];

            switch(divid) {
                case 'current':
                    break;
                case 'playlists':
                    break;
                case 'search':
                    if (customTracklists['allresultscache'] == '') { initSearch( $('#searchinput').val() ); }
                    break;
                case 'artists':
                    if(uri != '') { showartist(uri);}
                    break;
                case 'albums':
                    if(uri != '') { showalbum(uri);}
                    break;
            }

            // Set the page title based on the hash.
            document.title = divid;

            
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
