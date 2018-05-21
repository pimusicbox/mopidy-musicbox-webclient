/* gui interactions here
* set- functions only set/update the gui elements
* do- functions interact with the server
* show- functions do both
*/
/** ******************
 * Song Info Sreen  *
 ********************/
function resetSong () {
    controls.setPlayState(false)
    controls.setPosition(0)
    var data = {}
    data.tlid = -1
    data.track = {}
    data.track.name = ''
    data.track.artists = ''
    data.track.length = 0
    data.track.uri = ''
    setSongInfo(data)
}

function resizeMb () {
    if ($(window).width() < 880) {
        $('#panel').panel('close')
    } else {
        $('#panel').panel('open')
    }

    $('#infoname').html(songdata.track.name)
    $('#infoartist').html(artiststext)

    if ($(window).width() > 960) {
        $('#playlisttracksdiv').show()
        $('#playlistslistdiv').show()
    }
}

function setSongTitle (track, refresh_ui) {
    songdata.track.name = track.name
    $('#modalname').html('<a href="#" onclick="return controls.showInfoPopup(\'' + track.uri + '\', \'\', mopidy);">' + track.name + '</span></a>')
    if (refresh_ui) {
        resizeMb()
    }
}

function setSongInfo (data) {
    if (!data) { return }
    if (data.tlid === songdata.tlid) { return }
    if (!data.track.name || data.track.name === '') {
        var name = data.track.uri.split('/')
        data.track.name = decodeURI(name[name.length - 1])
    }

    updatePlayIcons(data.track.uri, data.tlid, controls.getIconForAction())
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

    setSongTitle(data.track, false)
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
            artistshtml += '<a href="#" onclick="return library.showArtist(\'' + data.track.artists[j].uri + '\', mopidy);">' + data.track.artists[j].name + '</a>'
            artiststext += data.track.artists[j].name
            if (j !== data.track.artists.length - 1) {
                artistshtml += ', '
                artiststext += ', '
            }
        }
        arttmp = artistshtml
    }
    if (data.track.album && data.track.album.name) {
        $('#modalalbum').html('<a href="#" onclick="return library.showAlbum(\'' + data.track.album.uri + '\', mopidy);">' + data.track.album.name + '</a>')
    } else {
        $('#modalalbum').html('')
    }
    images.setAlbumImage(data.track.uri, '#infocover, #albumCoverImg', mopidy)
    if (data.track.uri) {
        // Add 'Show Info' icon to album image
        $('#modalinfo').append(
            '<a href="#" class="infoBtn" onclick="return controls.showInfoPopup(\'' + data.track.uri + '\', \'undefined\', mopidy);">' +
            '<i class="fa fa-info-circle"></i></a>')
    }

    $('#modalartist').html(arttmp)

    $('#trackslider').attr('min', 0)
    $('#trackslider').attr('max', songlength)
    syncedProgressTimer.reset().set(0, songlength)
    if (play) {
        syncedProgressTimer.start()
    }

    resizeMb()
}

/** ****************
 * display popups *
 ******************/
function popupTracks (e, listuri, trackuri, tlid) {
    if (!e) {
        e = window.event
    }
    $('.popupTrackName').html(popupData[trackuri].name)
    if (popupData[trackuri].album && popupData[trackuri].album.name && popupData[trackuri].album.uri) {
        $('.popupAlbumName').html(popupData[trackuri].album.name)
        $('.popupAlbumLi').show()
    } else {
        $('.popupAlbumLi').hide()
    }
    var child = ''

    $('.popupArtistsLi').hide()
    $('.popupArtistsDiv').hide()
    if (popupData[trackuri].artists) {
        if (popupData[trackuri].artists.length === 1 && popupData[trackuri].artists[0].uri) {
            child = '<a href="#" onclick="library.showArtist(\'' + popupData[trackuri].artists[0].uri + '\', mopidy);">Show Artist</a>'
            $('.popupArtistName').html(popupData[trackuri].artists[0].name)
            $('.popupArtistHref').attr('onclick', 'library.showArtist(\'' + popupData[trackuri].artists[0].uri + '\', mopidy);')
            $('.popupArtistsDiv').hide()
            $('.popupArtistsLi').show()
        } else {
            var isValidArtistURI = false
            for (var j = 0; j < popupData[trackuri].artists.length; j++) {
                if (popupData[trackuri].artists[j].uri) {
                    isValidArtistURI = true
                    child += '<li><a href="#" onclick="library.showArtist(\'' + popupData[trackuri].artists[j].uri + '\', mopidy);"><span class="popupArtistName">' + popupData[trackuri].artists[j].name + '</span></a></li>'
                }
            }
            if (isValidArtistURI) {
                $('.popupArtistsLv').html(child).show()
                $('.popupArtistsDiv').show()
                //  this makes the viewport of the window resize somehow
                $('.popupArtistsLv').listview('refresh')
            }
        }
    }

    var hash = document.location.hash.split('?')
    var divid = hash[0].substr(1)
    var popupName = ''
    if (divid === 'current') {
        popupName = '#popupQueue'
    } else {
        popupName = '#popupTracks'
    }

    // Set playlist, trackUri, and tlid of clicked item.
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

    $(popupName).one('popupafterclose', function (event, ui) {
        // Ensure that popup attributes are reset when the popup is closed.
        $(this).removeData('list').removeData('track').removeData('tlid')
    })

    return false
}

function showAlbumPopup (popupId) {
    uri = $(popupId).data('track')
    library.showAlbum(popupData[uri].album.uri, mopidy)
}

/** ********************
 * initialize sockets *
 **********************/

function initSocketevents () {
    mopidy.on('state:online', function () {
        showOffline(false)
        library.getCurrentPlaylist()
        updateStatusOfAll()
        library.getPlaylists()
        controls.getUriSchemes().then(function () {
            controls.showFavourites()
        })
        library.getBrowseDir()
        library.getSearchSchemes(searchBlacklist, mopidy)
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
        controls.setPlayState(true)
    })

    mopidy.on('event:trackPlaybackResumed', function (data) {
        setSongInfo(data.tl_track)
        controls.setPlayState(true)
    })

    mopidy.on('event:playlistsLoaded', function (data) {
        showLoading(true)
        library.getPlaylists()
    })

    mopidy.on('event:playlistChanged', function (data) {
        $('#playlisttracksdiv').hide()
        $('#playlistslistdiv').show()
        delete playlists[data.playlist.uri]
        library.getPlaylists()
    })

    mopidy.on('event:playlistDeleted', function (data) {
        $('#playlisttracksdiv').hide()
        $('#playlistslistdiv').show()
        delete playlists[data.uri]
        library.getPlaylists()
    })

    mopidy.on('event:volumeChanged', function (data) {
        controls.setVolume(data.volume)
    })

    mopidy.on('event:muteChanged', function (data) {
        controls.setMute(data.mute)
    })

    mopidy.on('event:playbackStateChanged', function (data) {
        switch (data.new_state) {
            case 'paused':
            case 'stopped':
                controls.setPlayState(false)
                break
            case 'playing':
                controls.setPlayState(true)
                break
        }
    })

    mopidy.on('event:tracklistChanged', function (data) {
        library.getCurrentPlaylist()
        mopidy.tracklist.getTracks().then(function (tracks) {
            if (tracks.length === 0) {
                // Last track in queue was deleted, reset UI.
                resetSong()
            }
        })
    })

    mopidy.on('event:seeked', function (data) {
        controls.setPosition(parseInt(data.time_position))
        if (play) {
            syncedProgressTimer.start()
        }
    })

    mopidy.on('event:streamTitleChanged', function (data) {
        // Update all track info.
        mopidy.playback.getCurrentTlTrack().then(processCurrenttrack, console.error)
    })
}

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
    headline = $('.mainNav').find('a[href$=' + site + ']').text()
    if (headline === '') {
        headline = site.charAt(0).toUpperCase() + site.slice(1)
    }
    $('#contentHeadline').html('<a href="#home" onclick="switchContent(\'home\'); return false;">' + headline + '</a>')
    return headline
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
    var uri = hash[1]

    headline = setHeadline(divid)
    updateDocumentTitle(headline)

    if ($(window).width() < 880) {
        $('#panel').panel('close')
    }

    $('.mainNav a').removeClass($.mobile.activeBtnClass)
    // i don't know why some li elements have those classes, but they do, so we need to remove them
    $('.mainNav li').removeClass($.mobile.activeBtnClass)
    $('#nav' + divid + ' a').addClass($.mobile.activeBtnClass)  // Update navigation pane

    $('.pane').hide()  // Hide all pages
    $('#' + divid + 'pane').show()  // Switch to active pane

    if (divid === 'browse' && browseStack.length > 0) {
        window.scrollTo(0, browseStack[browseStack.length - 1].scrollPos || 0)  // Restore scroll position - browsing library.
    } else if (typeof pageScrollPos[divid] !== 'undefined') {  // Restore scroll position - pages
        window.scrollTo(0, pageScrollPos[divid])
    }

    switch (divid) {
        case 'nowPlaying':  // Show 'now playing' footer
            $('#normalFooter').hide()
            $('#nowPlayingFooter').show()
            break
        case 'search':
            $('#searchinput').focus()
            break
        case 'artists':
            if (uri !== '') {
                if (mopidy) {
                    library.showArtist(uri, mopidy)
                } else {
                    showOffline(true)  // Page refreshed - wait for mopidy object to be initialized.
                }
            }
            break
        case 'albums':
            if (uri !== '') {
                if (mopidy) {
                    library.showAlbum(uri, mopidy)
                } else {
                    showOffline(true)  // Page refreshed - wait for mopidy object to be initialized.
                }
            }
            break
        default:  // Default footer
            $('#normalFooter').show()
            $('#nowPlayingFooter').hide()
    }
    return false
}

/** *********************
 * initialize software *
 ***********************/
$(document).ready(function (event) {
    showOffline(true)
    // check for websockets
    if (!window.WebSocket) {
        switchContent('playlists')
        $('#playlistspane').html('<h2>Old Browser</h2><p>Sorry. Your browser isn\'t modern enough for this webapp. Modern versions of Chrome, Firefox, Safari all will do. Maybe Opera and Internet Explorer 10 also work, but it\'s not tested.</p>')
        exit
    }

    // workaround for a bug in jQuery Mobile, without that the panel doesn't close on mobile devices...
    $('.ui-panel-dismiss').on('tap', function () { $('#panel').panel('close') })
    // end of workaround

    window.onhashchange = locationHashChanged
    if (location.hash.length < 2) {
        switchContent('home')
    }
    $(window).hashchange()

    // Remember scroll position for each page and browsed folder
    $(window).scrollEnd(function () {
        var divid = document.location.hash.split('?')[0].substr(1)
        if (divid === 'browse' && browseStack.length > 0) {
            browseStack[browseStack.length - 1].scrollPos = window.pageYOffset
        } else {
            pageScrollPos[divid] = window.pageYOffset
        }
    }, 250)

    initgui = false

    // only show backbutton if in UIWebview
    if (window.navigator.standalone) {
        $('#btback').show()
    } else {
        $('#btback').hide()
    }

    // navigation temporary, rewrite this!
    $('#songinfo').click(function () {
        return switchContent('nowPlaying')
    })
    $('#albumCoverImg').click(function () {
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

    // Remove MusicBox only content (e.g. settings, system pages)
    if (!$(document.body).data('is-musicbox')) {
        $('#navSettings').hide()
        $('#navshutdown').hide()
        $('#homesettings').hide()
        $('#homeshutdown').hide()
    }

    // Remove Alarm Clock icons if it is not present
    if (!$(document.body).data('has-alarmclock')) {
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
                    controls.doPlay()
                    event.preventDefault()
                    break
                case '>':
                    controls.doNext()
                    event.preventDefault()
                    break
                case '<':
                    controls.doPrevious()
                    event.preventDefault()
                    break
            }
            return true
        }
    })

    $.event.special.swipe.horizontalDistanceThreshold = 125 // (default: 30px)  Swipe horizontal displacement must be more than this.
    $.event.special.swipe.verticalDistanceThreshold = 50 // (default: 75px)  Swipe vertical displacement must be less than this.
    $.event.special.swipe.durationThreshold = 500

    // swipe songinfo and panel
    $('#normalFooter, #nowPlayingFooter').on('swiperight', controls.doPrevious)
    $('#normalFooter, #nowPlayingFooter').on('swipeleft', controls.doNext)
    $('#nowPlayingpane, .ui-body-c, #header, #panel, .pane').on('swiperight', function (event) {
        if (!$(event.target).is('#normalFooter') && !$(event.target).is('#nowPlayingFooter')) {
            $('#panel').panel('open')
            event.stopImmediatePropagation()
        }
    })
    $('#nowPlayingpane, .ui-body-c, #header, #panel, .pane').on('swipeleft', function (event) {
        if (!$(event.target).is('#normalFooter') && !$(event.target).is('#nowPlayingFooter')) {
            $('#panel').panel('close')
            event.stopImmediatePropagation()
        }
    })

    $('#trackslider').on('slidestart', function () {
        syncedProgressTimer.stop()
        $('#trackslider').on('change', function () { syncedProgressTimer.updatePosition($(this).val()) })
    })

    $('#trackslider').on('slidestop', function () {
        $('#trackslider').off('change')
        syncedProgressTimer.updatePosition($(this).val())
        controls.doSeekPos($(this).val())
    })

    $('#volumeslider').on('slidestart', function () { volumeSliding = true })
    $('#volumeslider').on('slidestop', function () { volumeSliding = false })
    $('#volumeslider').on('change', function () { controls.doVolume($(this).val()) })

    $(window).resize(resizeMb).resize()

    // Connect to server
    var websocketUrl = $(document.body).data('websocket-url')
    var connectOptions = {callingConvention: 'by-position-or-by-name'}
    if (websocketUrl) {
        connectOptions['webSocketUrl'] = websocketUrl
    }

    mopidy = new Mopidy(connectOptions)
    // initialize events
    initSocketevents()
    syncedProgressTimer = new SyncedProgressTimer(8, mopidy)
    resetSong()
})

function updatePlayIcons (uri, tlid, popupMenuIcon) {
    // Update styles of listviews
    if (arguments.length < 3) {
        throw new Error('Missing parameters for "updatePlayIcons" function call.')
    }
    var listviews = [PLAYLIST_TABLE, SEARCH_TRACK_TABLE, ARTIST_TABLE, ALBUM_TABLE, BROWSE_TABLE]
    var target = CURRENT_PLAYLIST_TABLE.substr(1)
    if (uri && typeof tlid === 'number' && tlid >= 0) {
        $(CURRENT_PLAYLIST_TABLE).children('li.song.albumli').each(function () {
            var eachTlid = $(this).attr('tlid')
            if (typeof eachTlid !== 'undefined') {
                eachTlid = parseInt(eachTlid)
            }
            if (this.id === getjQueryID(target, uri) && eachTlid === tlid) {
                if (!$(this).hasClass('currenttrack')) {
                    $(this).addClass('currenttrack')
                }
            } else if ($(this).hasClass('currenttrack')) {
                $(this).removeClass('currenttrack')
            }
        })
    }

    var popupElement

    for (var i = 0; i < listviews.length; i++) {
        target = listviews[i].substr(1)
        $(listviews[i]).children('li.song.albumli').each(function () {
            if (uri) {
                if (this.id === getjQueryID(target, uri)) {
                    $(this).addClass('currenttrack2')
                } else {
                    $(this).removeClass('currenttrack2')
                }
            }
            if (popupMenuIcon) {
                popupElement = $(this).children('a.moreBtn').children('i').first()
                if (!popupElement.hasClass(popupMenuIcon)) {
                    popupElement.removeClass()
                    popupElement.addClass(popupMenuIcon)
                }
            }
        })
    }
}

function updateDocumentTitle (headline) {
    headline = headline || $('#contentHeadline').text()
    document.title = headline + ' | ' + $(document.body).data('title')
}
