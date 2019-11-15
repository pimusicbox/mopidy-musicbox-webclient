(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.controls = factory()
    }
}(this, function () {
    'use strict'

    var controls = {

        /**
        * 'onClick' handler for tracks that are rendered in a list.
        *
        * Adds tracks to current tracklist and starts playback if necessary.
        *
        * @param {string} action - The action to perform. Valid actions are:
        *                              PLAY_NOW: add the track at the current queue position and
        *                                        start playback immediately.
        *                              PLAY_NEXT: insert track after the reference track, if 'index'
        *                                         is provided, or after the current track otherwise.
        *                              ADD_THIS_BOTTOM: add track to bottom of tracklist.
        *                              ADD_ALL_BOTTOM: add all tracks in in the list to bottom of
        *                                              tracklist.
        *                              PLAY_ALL: clear tracklist and start playback of the track
        *                                        with URI provided in 'trackUri'.
        * @param {object} mopidy - The Mopidy.js object that should be used to communicate with the
        *                          Mopidy server.
        * @param {string} trackUri - (Optional) The URI of the specific track that the action should
        *                            be performed on. If no URI is provided then the 'data' attribute
        *                            of the popup DIV is assumed to contain the track URI.
        * @param {string} playlistUri - (Optional) The URI of the playlist containing the tracks
        *                               to be played. If no URI is provided then the 'list' attribute
        *                               of the popup DIV is assumed to contain the playlist URI.
        * @param {string} index - (Optional) The tracklist index of the reference track that the
        *                         action should be performed on. Defaults to the index of the currently
        *                         playing track.
        */

        playTracks: function (action, mopidy, trackUri, playlistUri, index) {
            toast('Updating queue...')

            trackUri = trackUri || $('#popupTracks').data('track') || $('#popupQueue').data('track')
            if (typeof trackUri === 'undefined') {
                throw new Error('No track URI provided for playback.')
            }
            playlistUri = playlistUri || $('#popupTracks').data('list') || $('#popupQueue').data('list')
            if (typeof playlistUri === 'undefined') {
                throw new Error('No playlist URI provided for playback.')
            }

            action = controls.getAction(action)

            if (action === PLAY_ALL) {
                mopidy.tracklist.clear()
            }

            var trackUris = controls._getTrackURIsForAction(action, trackUri, playlistUri)
            // Add the tracks and start playback if necessary.
            switch (action) {
                case PLAY_NOW:
                case PLAY_NEXT:
                    mopidy.tracklist.index().then(function (currentIndex) {
                        if (currentIndex === null && action === PLAY_NEXT) {
                            // Tracklist is empty, start playing new tracks immediately.
                            action = PLAY_NOW
                        }
                        controls._addTrackAtIndex(action, mopidy, trackUris, currentIndex)
                    })
                    break
                case INSERT_AT_INDEX:
                    controls._addTrackAtIndex(action, mopidy, trackUris, index)
                    break
                case ADD_THIS_BOTTOM:
                case ADD_ALL_BOTTOM:
                case PLAY_ALL:
                    mopidy.tracklist.add({uris: trackUris}).then(function (tlTracks) {
                        if (action === PLAY_ALL) {  // Start playback of selected track immediately.
                            mopidy.tracklist.filter({criteria: {uri: [trackUri]}}).then(function (tlTracks) {
                                mopidy.playback.stop().then(function () {
                                    mopidy.playback.play({tlid: tlTracks[0].tlid})
                                })
                            })
                        }
                    })
                    break
                default:
                    throw new Error('Unexpected tracklist action identifier: ' + action)
            }

            if (action !== INSERT_AT_INDEX) {  // TODO: Add support for 'INSERT_AT_INDEX' to allow user to insert tracks in any playlist.
                if (window[$(document.body).data('on-track-click')] === DYNAMIC) {
                    // Save last 'action' - will become default for future 'onClick' events
                    var previousAction = $.cookie('onTrackClick')
                    if (typeof previousAction === 'undefined' || action !== previousAction) {
                        $.cookie('onTrackClick', action, { expires: 365 })
                        updatePlayIcons('', '', controls.getIconForAction(action))
                    }
                }
            }

            $('#popupTracks').popup('close')
            $('#popupQueue').popup('close')
        },

        /* Getter function for 'action' variable. Also checks config settings and cookies if required. */
        getAction: function (action) {
            if (typeof action === 'undefined' || action.length === 0) {  // Action parameter not provided, use defaults
                action = window[$(document.body).data('on-track-click')]
            }
            if (action === DYNAMIC) {  // Re-use last action stored in cookie.
                action = $.cookie('onTrackClick')
                if (typeof action === 'undefined') {
                    action = PLAY_ALL  // Backwards-compatible default value.
                }
            }
            return action
        },

        /* Retrieves the Font Awesome character for the given action. */
        getIconForAction: function (action) {
            action = controls.getAction(action)

            switch (parseInt(action)) {
                case PLAY_ALL:
                    return 'fa fa-play-circle'
                case PLAY_NOW:
                    return 'fa fa-play-circle-o'
                case INSERT_AT_INDEX:
                    return 'fa fa-long-arrow-left'
                case PLAY_NEXT:
                    return 'fa fa-level-down'
                case ADD_THIS_BOTTOM:
                    return 'fa fa-plus-square-o'
                case ADD_ALL_BOTTOM:
                    return 'fa fa-plus-square'
                default:
                    throw new Error('Unkown tracklist action identifier: ' + action)
            }
        },

        /* Retrieves the relevant track URIs for the given action. */
        _getTrackURIsForAction: function (action, trackUri, playlistUri) {
            var trackUris = []
            // Fill 'trackUris', by determining which tracks should be added.
            switch (parseInt(action)) {
                case PLAY_NOW:
                case PLAY_NEXT:
                case INSERT_AT_INDEX:
                case ADD_THIS_BOTTOM:
                    // Process single track
                    trackUris.push(trackUri)
                    break
                case PLAY_ALL:
                case ADD_ALL_BOTTOM:
                    // Process all tracks in playlist
                    trackUris = getTracksFromUri(playlistUri, false)
                    break
                default:
                    throw new Error('Unexpected tracklist action identifier: ' + action)
            }
            return trackUris
        },

        _addTrackAtIndex: function (action, mopidy, trackUris, index) {
            if (typeof index === 'undefined' || index === '') {
                throw new Error('No index provided for insertion.')
            }

            var pos = index
            if (pos === null) {
                pos = 0
            } else {
                pos += 1
            }

            mopidy.tracklist.add({at_position: pos, uris: trackUris}).then(function (tlTracks) {
                if (action === PLAY_NOW) {  // Start playback immediately.
                    mopidy.playback.stop().then(function () {
                        mopidy.playback.play({tlid: tlTracks[0].tlid})
                    })
                }
            })
        },

        /** ******************************************************
         * play an uri from the queue
         *********************************************************/

        /** *
         * Plays a Track from a Playlist.
         * @param tlid
         * @returns {boolean}
         */
        playQueueTrack: function (tlid) {
            // Stop directly, for user feedback
            mopidy.playback.stop()
            toast('Loading...')

            tlid = tlid || $('#popupQueue').data('tlid')
            mopidy.playback.play({'tlid': parseInt(tlid)})
            $('#popupQueue').popup('close')
        },

        /** *********************************
         *  remove a track from the queue  *
         ***********************************/
        removeTrack: function (tlid, mopidy) {
            toast('Deleting...')

            tlid = tlid || $('#popupQueue').data('tlid')
            mopidy.tracklist.remove({criteria: {'tlid': [parseInt(tlid)]}})
            $('#popupQueue').popup('close')
        },

        clearQueue: function () {
            mopidy.tracklist.clear()
            return false
        },

        checkDefaultButtonClick: function (key, parentElement) {
            // Click the default button on parentElement when the user presses the enter key.
            if (key === 13) {
                $(parentElement).find('button' + '[data-default-btn="true"]').click()
            }
            return true
        },

        showAddTrackPopup: function (tlid) {
            $('#addTrackInput').val('')
            $('#select-add').empty()
            tlid = tlid || $('#popupQueue').data('tlid')
            if (typeof tlid !== 'undefined' && tlid !== '') {
                // Store the tlid of the track after which we want to perform the insert
                $('#popupAddTrack').data('tlid', $('#popupQueue').data('tlid'))
                $('#popupAddTrack').one('popupafterclose', function (event, ui) {
                    // Ensure that popup attributes are reset when the popup is closed.
                    $(this).removeData('tlid')
                })
                var trackName = popupData[$('#popupQueue').data('track')].name
                $('#select-add').append('<option value="6" selected="selected">Add Track Below \'' + trackName + '\'</option>')
            }
            if (typeof songdata.track.uri !== 'undefined' && songdata.track.uri !== '') {
                $('#getPlayingBtn').button('enable')
            } else {
                $('#getPlayingBtn').button('disable')
            }

            $('#select-add').append('<option value="1">Play Added Track Next</option>') // PLAY_NEXT
            $('#select-add').append('<option value="2">Add Track to Bottom of Queue</option>') // ADD_THIS_BOTTOM
            $('#select-add').trigger('change')

            $('#popupQueue').popup('close')
            $('#popupAddTrack').popup('open')
        },

        addTrack: function (trackUri, mopidy) {
            var selection = parseInt($('#select-add').val())

            if (selection === ADD_THIS_BOTTOM) {
                controls.addTrackToBottom(trackUri, mopidy)
            } else if (selection === PLAY_NEXT) {
                controls.insertTrack(trackUri, mopidy)
            } else if (selection === INSERT_AT_INDEX) {
                var tlid = $('#popupAddTrack').data('tlid')
                controls.insertTrack(trackUri, mopidy, tlid)
            } else {
                throw new Error('Unkown tracklist action selection option: ' + selection)
            }
        },

        insertTrack: function (trackUri, mopidy, tlid) {
            if (typeof trackUri === 'undefined' || trackUri === '') {
                throw new Error('No track URI provided to insert.')
            }

            if (typeof tlid !== 'undefined' && tlid !== '') {
                mopidy.tracklist.index({tlid: parseInt(tlid)}).then(function (index) {
                    controls.playTracks(INSERT_AT_INDEX, mopidy, trackUri, CURRENT_PLAYLIST_TABLE, index)
                })
            } else {
                // No tlid provided, insert after current track.
                controls.playTracks(PLAY_NEXT, mopidy, trackUri, CURRENT_PLAYLIST_TABLE)
            }
            $('#popupAddTrack').popup('close')
            return false
        },

        addTrackToBottom: function (trackUri, mopidy) {
            if (typeof trackUri === 'undefined' || trackUri === '') {
                throw new Error('No track URI provided to add.')
            }

            controls.playTracks(ADD_THIS_BOTTOM, mopidy, trackUri, CURRENT_PLAYLIST_TABLE)
            $('#popupAddTrack').popup('close')
            return false
        },

        showSavePopup: function () {
            mopidy.tracklist.getTracks().then(function (tracks) {
                if (tracks.length > 0) {
                    $('#saveinput').val('')
                    $('#popupSave').popup('open')
                }
            })
        },

        saveQueue: function () {
            mopidy.tracklist.getTracks().then(function (tracks) {
                var playlistName = $('#saveinput').val().trim()
                if (playlistName !== null && playlistName !== '') {
                    controls.getPlaylistByName(playlistName, 'm3u', false).then(function (exists) {
                        if (exists) {
                            $('#popupSave').popup('close')
                            $('#popupOverwrite').popup('open')
                            $('#overwriteConfirmBtn').click(function () {
                                controls.initSave(playlistName, tracks)
                            })
                        } else {
                            controls.initSave(playlistName, tracks)
                        }
                    })
                }
            })
            return false
        },

        initSave: function (playlistName, tracks) {
            $('#popupOverwrite').popup('close')
            $('#popupSave').popup('close')
            $('#saveinput').val('')
            toast('Saving...')
            mopidy.playlists.create({'name': playlistName, 'uri_scheme': 'm3u'}).then(function (playlist) {
                playlist.tracks = tracks
                mopidy.playlists.save({'playlist': playlist}).then()
            })
        },

        showInfoPopup: function (uri, popupId, mopidy) {
            showLoading(true)
            var trackUri = uri || $(popupId).data('track')
            if (popupId && popupId.length > 0) {
                $(popupId).popup('close')
            }
            $('#popupShowInfo tbody').empty()

            mopidy.library.lookup({'uris': [trackUri]}).then(function (resultDict) {
                var uri = Object.keys(resultDict)[0]
                var track = resultDict[uri][0]
                var html = ''
                var rowTemplate = '<tr><td class="label">{label}:</td><td id="{label}-cell">{text}</td></tr>'
                var row = {'label': '', 'text': ''}

                row.label = 'Name'
                if (track.name) {
                    row.text = track.name
                } else {
                    row.text = '(Not available)'
                }
                html += stringFromTemplate(rowTemplate, row)

                row.label = 'Album'
                if (track.album && track.album.name) {
                    row.text = track.album.name
                } else {
                    row.text = '(Not available)'
                }
                html += stringFromTemplate(rowTemplate, row)

                var artists = artistsToString(track.artists)
                // Fallback to album artists.
                if (artists.length === 0 && track.album && track.album.artists) {
                    artists = artistsToString(track.album.artists)
                }

                if (artists.length > 0) {
                    row.label = 'Artist'
                    if (track.artists && track.artists.length > 1 || track.album && track.album.artists && track.album.artists.length > 1) {
                        row.label += 's'
                    }
                    row.text = artists
                    html += stringFromTemplate(rowTemplate, row)
                }

                var composers = artistsToString(track.composers)
                if (composers.length > 0) {
                    row.label = 'Composer'
                    if (track.composers.length > 1) {
                        row.label += 's'
                    }
                    row.text = composers
                    html += stringFromTemplate(rowTemplate, row)
                }

                var performers = artistsToString(track.performers)
                if (performers.length > 0) {
                    row.label = 'Performer'
                    if (track.performers.length > 1) {
                        row.label += 's'
                    }
                    row.text = performers
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.genre) {
                    row = {'label': 'Genre', 'text': track.genre}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.track_no) {
                    row = {'label': 'Track #', 'text': track.track_no}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.disc_no) {
                    row = {'label': 'Disc #', 'text': track.disc_no}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.date) {
                    row = {'label': 'Date', 'text': new Date(track.date).toLocaleString()}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.length) {
                    row = {'label': 'Length', 'text': timeFromSeconds(track.length / 1000)}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.bitrate) {
                    row = {'label': 'Bitrate', 'text': track.bitrate}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.comment) {
                    row = {'label': 'Comment', 'text': track.comment}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.musicbrainz_id) {
                    row = {'label': 'MusicBrainz ID', 'text': track.musicbrainz_id}
                    html += stringFromTemplate(rowTemplate, row)
                }

                if (track.last_modified) {
                    row = {'label': 'Modified', 'text': track.last_modified}
                    html += stringFromTemplate(rowTemplate, row)
                }

                rowTemplate = '<tr><td class="label label-center">{label}:</td><td><input type="text" id="uri-input" value="{text}"></input></td></tr>'
                row = {'label': 'URI', 'text': uri}
                html += stringFromTemplate(rowTemplate, row)

                $('#popupShowInfo tbody').append(html)

                showLoading(false)
                $('#popupShowInfo').popup('open')
                if (!isMobile) {
                    // Set focus and select URI text on desktop systems (don't want the keyboard to pop up automatically on mobile devices)
                    $('#popupShowInfo #uri-input').focus()
                    $('#popupShowInfo #uri-input').select()
                }
            }, console.error)
            return false
        },

        refreshPlaylists: function () {
            mopidy.playlists.refresh().then(function () {
                playlists = {}
                $('#playlisttracksdiv').hide()
                $('#playlistslistdiv').show()
            })
            return false
        },

        refreshLibrary: function () {
            var uri = $('#refreshLibraryBtn').data('url')
            mopidy.library.refresh({'uri': uri}).then(function () {
                library.getBrowseDir(uri)
            })
            return false
        },

        /** ***********
         *  Buttons  *
         *************/

        doShuffle: function () {
            mopidy.playback.stop()
            mopidy.tracklist.shuffle()
            mopidy.playback.play()
        },

        /* Toggle state of play button */
        setPlayState: function (nwplay) {
            if (nwplay) {
                $('#btplayNowPlaying >i').removeClass('fa-play').addClass('fa-pause')
                $('#btplayNowPlaying').attr('title', 'Pause')
                $('#btplay >i').removeClass('fa-play').addClass('fa-pause')
                $('#btplay').attr('title', 'Pause')
                mopidy.playback.getTimePosition().then(processCurrentposition, console.error)
                syncedProgressTimer.start()
            } else {
                $('#btplayNowPlaying >i').removeClass('fa-pause').addClass('fa-play')
                $('#btplayNowPlaying').attr('title', 'Play')
                $('#btplay >i').removeClass('fa-pause').addClass('fa-play')
                $('#btplay').attr('title', 'Play')
                syncedProgressTimer.stop()
            }
            play = nwplay
        },

        // play or pause
        doPlay: function () {
            toast('Please wait...', 250)
            if (!play) {
                mopidy.playback.play()
            } else {
                if (isStreamUri(songdata.track.uri)) {
                    mopidy.playback.stop()
                } else {
                    mopidy.playback.pause()
                }
            }
            controls.setPlayState(!play)
        },

        doPrevious: function () {
            toast('Playing previous track...')
            mopidy.playback.previous()
        },

        doNext: function () {
            toast('Playing next track...')
            mopidy.playback.next()
        },

        backbt: function () {
            history.back()
            return false
        },

        /** ***********
         *  Options  *
         *************/
        setTracklistOption: function (name, new_value) {
            if (!new_value) {
                $('#' + name + 'bt').attr('style', 'color:#2489ce')
            } else {
                $('#' + name + 'bt').attr('style', 'color:#66DD33')
            }
            return new_value
        },

        setRepeat: function (nwrepeat) {
            if (repeat !== nwrepeat) {
                repeat = controls.setTracklistOption('repeat', nwrepeat)
            }
        },

        setRandom: function (nwrandom) {
            if (random !== nwrandom) {
                random = controls.setTracklistOption('random', nwrandom)
            }
        },

        setConsume: function (nwconsume) {
            if (consume !== nwconsume) {
                consume = controls.setTracklistOption('consume', nwconsume)
            }
        },

        setSingle: function (nwsingle) {
            if (single !== nwsingle) {
                single = controls.setTracklistOption('single', nwsingle)
            }
        },

        doRandom: function () {
            mopidy.tracklist.setRandom({'value': !random}).then()
        },

        doRepeat: function () {
            mopidy.tracklist.setRepeat({'value': !repeat}).then()
        },

        doConsume: function () {
            mopidy.tracklist.setConsume({'value': !consume}).then()
        },

        doSingle: function () {
            mopidy.tracklist.setSingle({'value': !single}).then()
        },

        /** *********************************************
         * Track Slider                                *
         * Use a timer to prevent looping of commands  *
         ***********************************************/
        doSeekPos: function (value) {
            if (!positionChanging) {
                positionChanging = value
                mopidy.playback.seek({'time_position': Math.round(value)}).then(function () {
                    positionChanging = null
                })
            }
        },

        setPosition: function (pos) {
            if (!positionChanging && $('#trackslider').val() !== pos) {
                syncedProgressTimer.set(pos)
            }
        },

        /** *********************************************
         * Volume slider                               *
         * Use a timer to prevent looping of commands  *
         ***********************************************/

        setVolume: function (value) {
            if (!volumeChanging && !volumeSliding && $('#volumeslider').val() !== value) {
                $('#volumeslider').off('change')
                $('#volumeslider').val(value).slider('refresh')
                $('#volumeslider').on('change', function () { controls.doVolume($(this).val()) })
            }
        },

        doVolume: function (value) {
            if (!volumeChanging) {
                volumeChanging = value
                mopidy.mixer.setVolume({'volume': parseInt(volumeChanging)}).then(function () {
                    volumeChanging = null
                })
            }
        },

        setMute: function (nwmute) {
            if (mute !== nwmute) {
                mute = nwmute
                if (mute) {
                    $('#mutebt').attr('class', 'fa fa-volume-off')
                } else {
                    $('#mutebt').attr('class', 'fa fa-volume-up')
                }
            }
        },

        doMute: function () {
            mopidy.mixer.setMute({'mute': !mute})
        },

        /** **********
         *  Stream  *
         ************/
        streamPressed: function (key) {
            if (key === 13) {
                controls.playStreamUri()
                return false
            }
            return true
        },

        playStreamUri: function (uri) {
            // value of name is based on the passing of an uri as a parameter or not
            var nwuri = uri || $('#streamuriinput').val().trim()
            var service = $('#selectstreamservice').val()
            if (!uri && service) {
                nwuri = service + ':' + nwuri
            }
            if (isServiceUri(nwuri) || isStreamUri(nwuri) || validUri(nwuri)) {
                toast('Playing...')
                // stop directly, for user feedback
                mopidy.playback.stop()
                // hide ios/android keyboard
                document.activeElement.blur()
                controls.clearQueue()
                $('input').blur()
                mopidy.tracklist.add({'uris': [nwuri]})
                mopidy.playback.play()
            } else {
                toast('No valid url!')
            }
            return false
        },

        getCurrentlyPlaying: function (uriInput, nameInput) {
            $('#' + uriInput).val(songdata.track.uri)
            var name = songdata.track.name
            if (songdata.track.artists) {
                var artistStr = artistsToString(songdata.track.artists)
                if (artistStr) {
                    name = artistStr + ' - ' + name
                }
            }
            $('#' + nameInput).val(name)
            return true
        },

        getUriSchemes: function () {
            uriSchemes = {}
            return mopidy.getUriSchemes().then(function (schemes) {
                for (var i = 0; i < schemes.length; i++) {
                    uriSchemes[schemes[i].toLowerCase()] = true
                }
            })
        },

        getPlaylistByName: function (name, scheme, create) {
            var uri_scheme = scheme || ''
            var uri = ''
            if (uri_scheme && !uriSchemes[uri_scheme]) {
                return Mopidy.when(false)
            }
            return mopidy.playlists.asList().catch(console.error.bind(console)).then(function (plists) {
                for (var i = 0; i < plists.length; i++) {
                    if ((plists[i].name === name) && (uri_scheme === '' || getScheme(plists[i].uri) === uri_scheme)) {
                        return plists[i]
                    }
                }
                if (create) {
                    return mopidy.playlists.create({'name': name, 'uri_scheme': uri_scheme}).done(function (plist) {
                        console.log("Created playlist '%s'", plist.name)
                        return plist
                    })
                }
                console.log("Can't find playist '%s", name)
                return Mopidy.when(false)
            })
        },

        getPlaylistFull: function (uri) {
            return mopidy.playlists.lookup({'uri': uri}).then(function (pl) {
                playlists[uri] = pl
                return pl
            })
        },

        getFavourites: function () {
            return controls.getPlaylistByName(
                STREAMS_PLAYLIST_NAME,
                STREAMS_PLAYLIST_SCHEME,
                true
            ).then(function (playlist) {
                if (playlist) {
                    return controls.getPlaylistFull(playlist.uri)
                }
                return Mopidy.when(false)
            })
        },

        addToFavourites: function (newTracks) {
            controls.getFavourites().catch(console.error.bind(console)).then(function (favourites) {
                if (favourites) {
                    if (favourites.tracks) {
                        Array.prototype.push.apply(favourites.tracks, newTracks)
                    } else {
                        favourites.tracks = newTracks
                    }
                    mopidy.playlists.save({'playlist': favourites}).then(function (s) {
                        controls.showFavourites()
                    })
                }
            })
        },

        addFavourite: function (uri, name) {
            uri = uri || $('#streamuriinput').val().trim()
            name = name || $('#streamnameinput').val().trim()
            mopidy.library.lookup({'uris': [uri]}).then(function (results) {
                var newTracks = results[uri]
                if (newTracks.length === 1) {
                    // TODO: Supporting adding an entire playlist?
                    if (name) {
                        newTracks[0].name = name // User overrides name.
                    }
                    controls.addToFavourites(newTracks)
                } else {
                    if (newTracks.length === 0) {
                        console.log('No tracks to add')
                    } else {
                        console.log('Too many tracks (%d) to add', tracks.length)
                    }
                }
            })
        },

        showDeleteStreamPopup: function (index) {
            controls.getFavourites().then(function (favourites) {
                if (favourites && favourites.tracks && index < favourites.tracks.length) {
                    var name = favourites.tracks[index].name
                    $('.popupStreamName').html(favourites.tracks[index].name)
                    $('#popupConfirmDelete').data('index', index)
                    $('#popupConfirmDelete').popup('open')
                }
            })
        },

        deleteFavourite: function (index) {
            index = index || $('#popupConfirmDelete').data('index')
            controls.getFavourites().then(function (favourites) {
                if (favourites && favourites.tracks && index < favourites.tracks.length) {
                    favourites.tracks.splice(index, 1)
                    mopidy.playlists.save({'playlist': favourites}).then(function (s) {
                        controls.showFavourites()
                    })
                    $('#popupConfirmDelete').popup('close')
                }
            })
        },

        showFavourites: function () {
            $('#streamuristable').empty()
            controls.getFavourites().then(function (favourites) {
                if (!favourites) {
                    return
                }
                var tmp = ''

                $.cookie.json = true
                if ($.cookie('streamUris')) {
                    tmp = '<button class="btn" style="padding: 5px; width: 100%" type="button" onclick="return controls.upgradeStreamUrisToFavourites();">Convert StreamUris</button>'
                }
                if (favourites.tracks) {
                    var child = ''
                    for (var i = 0; i < favourites.tracks.length; i++) {
                        child =
                            '<li><span class="ui-icon ui-icon-delete ui-icon-shadow" style="float:right; margin: .5em; margin-top: .8em;">' +
                            '<a href="#" onclick="return controls.showDeleteStreamPopup(' + i + ');">&nbsp;</a></span>' +
                            '<i class="fa fa-rss" style="float: left; padding: .5em; padding-top: 1em;"></i>' +
                            ' <a style="margin-left: 20px" href="#" onclick="return controls.playStreamUri(\'' + favourites.tracks[i].uri + '\');">'
                        child += '<h1>' + favourites.tracks[i].name + '</h1></a></li>'
                        tmp += child
                    }
                } else {
                    tmp = '<span style="display:table; margin:0 auto;">Your saved favourite streams/tracks will be shown here</span>'
                }
                $('#streamuristable').html(tmp)
            })
        },

        // TODO: Remove this upgrade path in next major release.
        upgradeStreamUrisToFavourites: function () {
            toast('Converting streamUris...')
            $.cookie.json = true
            var streamUris = $.cookie('streamUris') // Read the cookie.
            if (streamUris) {
                var uris = [] // Prepare a list of uris to lookup.
                for (var key in streamUris) {
                    var rs = streamUris[key]
                    if (rs) {
                        uris.push(rs[1])
                    }
                }
                mopidy.library.lookup({'uris': uris}).then(function (results) {
                    var tracks = [] // Prepare a list of tracks to add.
                    for (var key in streamUris) {
                        var rs = streamUris[key]
                        if (rs) {
                            var track = results[rs[1]][0]
                            if (track) {
                                track.name = rs[0] || track.name // Use custom name if provided.
                                tracks.push(track)
                            } else {
                                console.log('Skipping unplayable streamUri ' + rs[1])
                            }
                        }
                    }
                    controls.addToFavourites(tracks)
                    $.cookie('streamUris', null) // Delete the cookie now we're done.
                    console.log(tracks.length + ' streamUris added to favourites')
                })
            } else {
                console.log('No streamUris cookie found')
            }
        },

        haltSystem: function () {
            $.post('/settings/shutdown')
            toast('Stopping system...', 10000)
            setTimeout(function () {
                window.history.back()
            }, 10000)
        },

        rebootSystem: function () {
            $.post('/settings/reboot')
            toast('Rebooting...', 10000)
            setTimeout(function () {
                window.history.back()
            }, 10000)
        }
    }
    return controls
}))
