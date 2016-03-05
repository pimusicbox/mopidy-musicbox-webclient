/* gui interactions here
* set- functions only set/update the gui elements
* do- functions interact with the server
* show- functions do both
*/
/** ******************
 * Song Info Sreen  *
 ********************/
function resetSong () {
    setPlayState(false)
    setPosition(0)
    var data = {}
    data.tlid = -1
    data.track = {}
    data.track.name = ''
    data.track.artists = ''
    data.track.length = 0
    data.track.uri = ' '
    setSongInfo(data)
}

function resizeMb () {
    $('#infoname').html(songdata.track.name)
    $('#infoartist').html(artiststext)

    if ($(window).width() <= 960) {
//        $('#playlisttracksdiv').hide();
//        $('#playlistslistdiv').show();
    } else {
        $('#playlisttracksdiv').show()
        $('#playlistslistdiv').show()
    }
//    //set height of playlist scrollers
/*    if ($(window).width() > 960) {
        $('#playlisttracksdiv').show();
        $('#playlistslistdiv').show();
        $('.scroll').removeClass('height').removeClass('width');
        $('#playlistspane').removeClass('height').removeClass('width');
    } else {
        if ( $('#playlisttracksdiv').is(':visible') == $('#playlistslistdiv').is(':visible')) {
            $('#playlisttracksdiv').hide();
            $('#playlistslistdiv').show();
            $('.scroll').addClass('height', '99%').addClass('width', '99%');
            $('#playlistspane').addClass('height', '99%').addClass('width', '99%');
        }
    }

    if ($('#playlisttracksdiv').is(':visible') && !$('#playlisttracksback').is(':visible') ) {
        $('.scroll').height($(window).height() - 96);
        //jqm added something which it shouldnt (at least in this case) I guess
        //        $('#playlistspane').removeClass('height').height($(window).height() - 110);
        $('.scroll').removeClass('height').removeClass('width');
        $('#playlistspane').removeClass('height').removeClass('width');
        $('#playlisttracksdiv').show();
        $('#playlistslistdiv').show();
    } else {
        $('.scroll').addClass('height', '99%').addClass('width', '99%');
        $('#playlistspane').addClass('height', '99%').addClass('width', '99%');
        $('#playlisttracksdiv').show();
        $('#playlistslistdiv').show();
    }

    if (isMobileWebkit && ($(window).width() > 480)) {
        playlistslistScroll.refresh();
        playlisttracksScroll.refresh();
    }
*/
}

function setSongTitle (title, refresh_ui) {
    songdata.track.name = title
    $('#modalname').html(title)
    if (refresh_ui) {
        resizeMb()
    }
}

function setSongInfo (data) {
//    console.log(data, songdata);
    if (!data) { return }
    if (data.tlid === songdata.tlid) { return }
    if (!data.track.name || data.track.name === '') {
        var name = data.track.uri.split('/')
        data.track.name = decodeURI(name[name.length - 1])
    }

    updatePlayIcons(data.track.uri, data.tlid)
    artistshtml = ''
    artiststext = ''

    if (validUri(data.track.name)) {
        for (var key in streamUris) {
            rs = streamUris[key]
            if (rs && rs[1] === data.track.name) {
                data.track.name = (rs[0] || rs[1])
            }
        }
    }

    songdata = data

    setSongTitle(data.track.name, false)
    songlength = Infinity

    if (!data.track.length || data.track.length === 0) {
        $('#trackslider').next().find('.ui-slider-handle').hide()
        $('#trackslider').slider('disable')
        // $('#streamnameinput').val(data.track.name);
        // $('#streamuriinput').val(data.track.uri);
    } else {
        songlength = data.track.length
        $('#trackslider').slider('enable')
        $('#trackslider').next().find('.ui-slider-handle').show()
    }

    var arttmp = ''

    if (data.track.artists) {
        for (var j = 0; j < data.track.artists.length; j++) {
            artistshtml += '<a href="#" onclick="return showArtist(\'' + data.track.artists[j].uri + '\');">' + data.track.artists[j].name + '</a>'
            artiststext += data.track.artists[j].name
            if (j !== data.track.artists.length - 1) {
                artistshtml += ', '
                artiststext += ', '
            }
        }
        arttmp = artistshtml
    }
    if (data.track.album && data.track.album.name) {
        $('#modalalbum').html('<a href="#" onclick="return showAlbum(\'' + data.track.album.uri + '\');">' + data.track.album.name + '</a>')
        getCover(data.track.uri, '#infocover, #controlspopupimage', 'extralarge')
    } else {
        $('#modalalbum').html('')
        $('#infocover').attr('src', 'images/default_cover.png')
        $('#controlspopupimage').attr('src', 'images/default_cover.png')
    }

    $('#modalartist').html(arttmp)

    $('#trackslider').attr('min', 0)
    $('#trackslider').attr('max', songlength)
    resetProgressTimer()
    progressTimer.set(0, songlength)
    if (play) {
        startProgressTimer()
    }

    resizeMb()
}

/** ****************
 * display popups *
 ******************/
function closePopups () {
    $('#popupTracks').popup('close')
    $('#artistpopup').popup('close')
    $('#coverpopup').popup('close')
    $('#popupQueue').popup('close')
    $('#controlspopup').popup('close')
}

function popupTracks (e, listuri, trackuri, tlid) {
    if (!e) {
        e = window.event
    }
    $('.popupTrackName').html(popupData[trackuri].name)
    $('.popupAlbumName').html(popupData[trackuri].album.name)
    var child = ''

    if (popupData[trackuri].artists) {
        if (popupData[trackuri].artists.length === 1) {
            child = '<a href="#" onclick="showArtist(\'' + popupData[trackuri].artists[0].uri + '\');">Show Artist</a>'
            $('.popupArtistName').html(popupData[trackuri].artists[0].name)
            $('.popupArtistHref').attr('onclick', 'showArtist("' + popupData[trackuri].artists[0].uri + '");')
            $('.popupArtistsDiv').hide()
            $('.popupArtistsLi').show()
        } else {
            for (var j = 0; j < popupData[trackuri].artists.length; j++) {
                child += '<li><a href="#" onclick="showArtist(\'' + popupData[trackuri].artists[j].uri + '\');"><span class="popupArtistName">' + popupData[trackuri].artists[j].name + '</span></a></li>'
            }
            $('.popupArtistsLi').hide()
            $('.popupArtistsLv').html(child).show()
            $('.popupArtistsDiv').show()
            //  this makes the viewport of the window resize somehow
            $('.popupArtistsLv').listview('refresh')
        }
    } else {
        $('.popupArtistsDiv').hide()
        $('.popupArtistsLi').hide()
    }

    var hash = document.location.hash.split('?')
    var divid = hash[0].substr(1)
    var popupName = ''
    if (divid === 'current') {
        $('.addqueue').hide()
        popupName = '#popupQueue'
    } else if (divid === 'browse') {
        $('.addqueue').show()
        popupName = '#popupBrowse'
    } else {
        $('.addqueue').show()
        popupName = '#popupTracks'
    }

    if (typeof tlid !== 'undefined' && tlid !== '') {
        $(popupName).data('list', listuri).data('track', trackuri).data('tlid', tlid).popup('open', {
            x: e.pageX,
            y: e.pageY
        })
    } else {
        $(popupName).data('list', listuri).data('track', trackuri).popup('open', {
            x: e.pageX,
            y: e.pageY
        })
    }

    return false
}

function showAlbumPopup (popupId) {
    uri = $(popupId).data('track')
    showAlbum(popupData[uri].album.uri)
}

/** ********************
 * initialize sockets *
 **********************/

function initSocketevents () {
    mopidy.on('state:online', function () {
        showOffline(false)
        getCurrentPlaylist()
        updateStatusOfAll()
        getPlaylists()
        getUriSchemes().then(function () {
            showFavourites()
        })
        getBrowseDir()
        getSearchSchemes()
        showLoading(false)
        $(window).hashchange()
    })

    mopidy.on('state:offline', function () {
        resetSong()
        showOffline(true)
    })

    mopidy.on('event:optionsChanged', updateOptions)

    mopidy.on('event:trackPlaybackStarted', function (data) {
        setSongInfo(data.tl_track)
        setPlayState(true)
    })

    mopidy.on('event:playlistsLoaded', function (data) {
        showLoading(true)
        getPlaylists()
    })

    mopidy.on('event:playlistChanged', function (data) {
        $('#playlisttracksdiv').hide()
        $('#playlistslistdiv').show()
        delete playlists[data.playlist.uri]
        getPlaylists()
    })

    mopidy.on('event:playlistDeleted', function (data) {
        $('#playlisttracksdiv').hide()
        $('#playlistslistdiv').show()
        delete playlists[data.uri]
        getPlaylists()
    })

    mopidy.on('event:volumeChanged', function (data) {
        setVolume(data.volume)
    })

    mopidy.on('event:muteChanged', function (data) {
        setMute(data.mute)
    })

    mopidy.on('event:playbackStateChanged', function (data) {
        switch (data.new_state) {
            case 'paused':
            case 'stopped':
                setPlayState(false)
                break
            case 'playing':
                setPlayState(true)
                break
        }
    })

    mopidy.on('event:tracklistChanged', function (data) {
        getCurrentPlaylist()
    })

    mopidy.on('event:seeked', function (data) {
        setPosition(parseInt(data.time_position))
        if (play) {
            startProgressTimer()
        }
    })

    mopidy.on('event:streamTitleChanged', function (data) {
        setSongTitle(data.title, true)
    })
}

$(document).bind('pageinit', function () {
    resizeMb()
})

/** ************
 * gui stuff  *
 **************/

function toggleFullscreen () {
    if (isMobileSafari) { alert('To get this app in Full Screen, you have to add it to your home-screen using the Share button.'); exit() }
    if (!isFullscreen()) {  // current working methods
        var docElm = document.documentElement
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen()
        } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen()
        } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen()
        } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen()
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen()
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen()
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen()
        }
    }
}

function isFullscreen () {
    return (document.fullscreenElement ||    // alternative standard method
        document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) // current working methods
}

function switchContent (divid, uri) {
    var hash = divid
    if (uri) {
        hash += '?' + uri
    }
    location.hash = '#' + hash
}

function setHeadline (site) {
    site = site.trim()
    str = $('.mainNav').find('a[href$=' + site + ']').text()
    if (str === '') {
        str = site.charAt(0).toUpperCase() + site.slice(1)
    }
    $('#contentHeadline').html('<a href="#home" onclick="switchContent(\'home\'); return false;">' + str + '</a>')
}

// update tracklist options.
function updateOptions () {
    mopidy.tracklist.getRepeat().then(processRepeat, console.error)
    mopidy.tracklist.getRandom().then(processRandom, console.error)
    mopidy.tracklist.getConsume().then(processConsume, console.error)
    mopidy.tracklist.getSingle().then(processSingle, console.error)
}

// update everything as if reloaded
function updateStatusOfAll () {
    mopidy.playback.getCurrentTlTrack().then(processCurrenttrack, console.error)
    mopidy.playback.getTimePosition().then(processCurrentposition, console.error)
    mopidy.playback.getState().then(processPlaystate, console.error)

    updateOptions()

    mopidy.playback.getVolume().then(processVolume, console.error)
    mopidy.mixer.getMute().then(processMute, console.error)
}

function locationHashChanged () {
    var hash = document.location.hash.split('?')
    // remove #
    var divid = hash[0].substr(1)
    setHeadline(divid)

    var uri = hash[1]
    $('.mainNav a').removeClass('ui-state-active ui-state-persist ui-btn-active')
    // i don't know why some li elements have those classes, but they do, so we need to remove them
    $('.mainNav li').removeClass('ui-state-active ui-state-persist ui-btn-active')
    if ($(window).width() < 560) {
        $('#panel').panel('close')
    }
    $('.pane').hide()

    $('#' + divid + 'pane').show()

    switch (divid) {
        case 'home':
            $('#navhome a').addClass('ui-state-active ui-state-persist ui-btn-active')
            break
        case 'nowPlaying':
            $('#navnowPlaying a').addClass('ui-state-active ui-state-persist ui-btn-active')
            break
        case 'current':
            $('#navcurrent a').addClass('ui-state-active ui-state-persist ui-btn-active')
            getCurrentPlaylist()
            break
        case 'playlists':
            $('#navplaylists a').addClass('ui-state-active ui-state-persist ui-btn-active')
            break
        case 'browse':
            $('#navbrowse a').addClass('ui-state-active ui-state-persist ui-btn-active')
            break
        case 'search':
            $('#navsearch a').addClass($.mobile.activeBtnClass)
            $('#searchinput').focus()
            if (customTracklists['mbw:allresultscache'] === '') {
                initSearch($('#searchinput').val())
            }
            break
        case 'stream':
            $('#navstream a').addClass('ui-state-active ui-state-persist ui-btn-active')
            break
        case 'artists':
            if (uri !== '') {
                showArtist(uri)
            }
            break
        case 'albums':
            if (uri !== '') {
                showAlbum(uri)
            }
            break
    }

    // switch the footer
    switch (divid) {
        case 'nowPlaying':
            $('#normalFooter').hide()
            $('#nowPlayingFooter').show()
            break
        default:
            $('#normalFooter').show()
            $('#nowPlayingFooter').hide()
    }
    // Set the page title based on the hash.
    document.title = PROGRAM_NAME
    return false
}

/** *********************
 * initialize software *
 ***********************/
$(document).ready(function (event) {
    // check for websockets
    if (!window.WebSocket) {
        switchContent('playlists')
        $('#playlistspane').html('<h2>Old Browser</h2><p>Sorry. Your browser isn\'t modern enough for this webapp. Modern versions of Chrome, Firefox, Safari all will do. Maybe Opera and Internet Explorer 10 also work, but it\'s not tested.</p>')
        exit
    }

    // workaround for a bug in jQuery Mobile, without that the panel doesn't close on mobile devices...
    $('.ui-panel-dismiss').on('tap', function () { $('#panel').panel('close') })
    // end of workaround

    $(window).hashchange()

    // Connect to server
    if (websocketUrl) {
        try {
            mopidy = new Mopidy({
                webSocketUrl: websocketUrl,
                callingConvention: 'by-position-or-by-name'
            })
        } catch (e) {
            showOffline(true)
        }
    } else {
        try {
            mopidy = new Mopidy({callingConvention: 'by-position-or-by-name'})
        } catch (e) {
            showOffline(true)
        }
    }

    // initialize events
    initSocketevents()

    progressTimer = new ProgressTimer({
        callback: timerCallback
    })

    resetSong()

    if (location.hash.length < 2) {
        switchContent('home')
    }

    initgui = false
    window.onhashchange = locationHashChanged

    // only show backbutton if in UIWebview
    if (window.navigator.standalone) {
        $('#btback').show()
    } else {
        $('#btback').hide()
    }

    $(window).resize(function () {
        resizeMb()
    })

    // navigation temporary, rewrite this!
    $('#songinfo').click(function () {
        return switchContent('nowPlaying')
    })
    $('#controlspopupimage').click(function () {
        return switchContent('current')
    })
    $('#navToggleFullscreen').click(function () {
        toggleFullscreen()
    })

    // event handlers for full screen mode
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange, MSFullscreenChange', function (e) {
        if (isFullscreen()) {
            document.getElementById('toggletxt').innerHTML = 'Exit Fullscreen'
        } else {
            document.getElementById('toggletxt').innerHTML = 'Fullscreen'
        }
    })

    // remove buttons only for MusicBox
    if (!isMusicBox) {
        $('#navSettings').hide()
        $('#navshutdown').hide()
        $('#homesettings').hide()
        $('#homeshutdown').hide()
    }

    // remove Alarm Clock if it is not present
    if (!hasAlarmClock) {
        $('#navAlarmClock').hide()
        $('#homeAlarmClock').hide()
        $('#homeAlarmClock').nextAll().find('.ui-block-a, .ui-block-b').toggleClass('ui-block-a').toggleClass('ui-block-b')
    }

    // navigation stuff

    $(document).keypress(function (event) {
	// console.log('kp:    '+event);
        if (event.target.tagName !== 'INPUT') {
            var unicode = event.keyCode ? event.keyCode : event.charCode
            var actualkey = String.fromCharCode(unicode)
            switch (actualkey) {
                case ' ':
                    doPlay()
                    event.preventDefault()
                    break
                case '>':
                    doNext()
                    event.preventDefault()
                    break
                case '<':
                    doPrevious()
                    event.preventDefault()
                    break
            }
            return true
        }
    })

    if ($(window).width() < 980) {
        $('#panel').panel('close')
    } else {
        $('#panel').panel('open')
    }

    $.event.special.swipe.horizontalDistanceThreshold = 125 // (default: 30px)  Swipe horizontal displacement must be more than this.
    $.event.special.swipe.verticalDistanceThreshold = 50 // (default: 75px)  Swipe vertical displacement must be less than this.
    $.event.special.swipe.durationThreshold = 500

    // swipe songinfo and panel
    $('#normalFooter, #nowPlayingFooter').on('swiperight', doPrevious)
    $('#normalFooter, #nowPlayingFooter').on('swipeleft', doNext)
    $('#nowPlayingpane, .ui-body-c, #header, #panel, .pane').on('swiperight', function () {
        if (!$(event.target).is('#normalFooter') && !$(event.target).is('#nowPlayingFooter')) {
            $('#panel').panel('open')
            event.stopImmediatePropagation()
        }
    })
    $('#nowPlayingpane, .ui-body-c, #header, #panel, .pane').on('swipeleft', function () {
        if (!$(event.target).is('#normalFooter') && !$(event.target).is('#nowPlayingFooter')) {
            $('#panel').panel('close')
            event.stopImmediatePropagation()
        }
    })

    $('#trackslider').on('slidestart', function () {
        progressTimer.stop()
        $('#trackslider').on('change', function () { updatePosition($(this).val()) })
    })

    $('#trackslider').on('slidestop', function () {
        $('#trackslider').off('change')
        doSeekPos($(this).val())
    })

    $('#volumeslider').on('slidestart', function () { volumeSliding = true })
    $('#volumeslider').on('slidestop', function () { volumeSliding = false })
    $('#volumeslider').on('change', function () { doVolume($(this).val()) })
})

function updatePlayIcons (uri, tlid) {
    // update styles of listviews
    $('#currenttable li').each(function () {
        var eachTlid = $(this).attr('tlid')
        if (typeof eachTlid !== 'undefined') {
            eachTlid = parseInt(eachTlid)
        }
        if (this.id === 'currenttable-' + uri && eachTlid === tlid) {
            $(this).addClass('currenttrack')
        } else {
            $(this).removeClass('currenttrack')
        }
    })

    $('#playlisttracks li').each(function () {
        if (this.id === 'playlisttracks-' + uri) {
            $(this).addClass('currenttrack2')
        } else {
            $(this).removeClass('currenttrack2')
        }
    })

    $('#trackresulttable li').each(function () {
        if (this.id === 'trackresulttable-' + uri) {
            $(this).addClass('currenttrack2')
        } else {
            $(this).removeClass('currenttrack2')
        }
    })

    $('#artiststable li').each(function () {
        if (this.id === 'artiststable-' + uri) {
            $(this).addClass('currenttrack2')
        } else {
            $(this).removeClass('currenttrack2')
        }
    })

    $('#albumstable li').each(function () {
        if (this.id === 'albumstable-' + uri) {
            $(this).addClass('currenttrack2')
        } else {
            $(this).removeClass('currenttrack2')
        }
    })
    $('#browselist li').each(function () {
        if (this.id === 'browselisttracks-' + uri) {
            $(this).addClass('currenttrack2')
        } else {
            $(this).removeClass('currenttrack2')
        }
    })
}
