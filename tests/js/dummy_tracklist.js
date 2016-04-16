(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.DummyTracklist = factory()
    }
}(this, function () {
    'use strict'

    /* A dummy tracklist with partial support for mocking mopidy.core.TracklistController.
     *
     * Returns resolved promises to simulate functionality of Mopidy.js.
     */
    function DummyTracklist () {
        if (!(this instanceof DummyTracklist)) {
            return new DummyTracklist()
        }
        this._tlTracks = []
        this._nextTlid = 1
        return this
    }

    /* Add tracks to the tracklist. params.uris should contain an array of strings for the URIs to be added. */
    DummyTracklist.prototype.add = function (params) {
        if (!params || !params.uris) {
            throw new Error('No tracks provided to add.')
        }
        if (params.tracks || params.uri) {
            throw new Error('DummyTracklist.add does not support deprecated "tracks" and "uri" parameters.')
        }

        // Add tracks to end of tracklist if no position is provided
        params.at_position = params.at_position || this._tlTracks.length
        var tlTrack
        var tlTracks = []
        for (var i = 0; i < params.uris.length; i++) {
            tlTrack = {
                tlid: this._nextTlid++,
                track: {
                    uri: params.uris[i]
                }
            }
            tlTracks.push(tlTrack)
            this._tlTracks.splice(params.at_position + i, 0, tlTrack)
        }

        return $.when(tlTracks)
    }

    /* Clears the tracklist */
    DummyTracklist.prototype.clear = function () {
        this._tlTracks = []
    }

    /**
     * Retuns a list containing tlTracks that contain the provided
     * criteria.uri or has ID criteria.tlid.
     *
     */
    DummyTracklist.prototype.filter = function (criteria) {
        if (!criteria || (!criteria.uri && !criteria.tlid)) {
            throw new Error('No URI or tracklist ID provided to filter on.')
        }

        var matches = []
        if (criteria.uri) {  // Look for matching URIs
            for (var i = 0; i < criteria.uri.length; i++) {
                for (var j = 0; j < this._tlTracks.length; j++) {
                    if (this._tlTracks[j].track.uri === criteria.uri[i]) {
                        matches.push(this._tlTracks[j])
                    }
                }
            }
        }
        if (criteria.tlid) {  // Look for matching tracklist IDs
            for (i = 0; i < criteria.tlid.length; i++) {
                for (j = 0; j < this._tlTracks.length; j++) {
                    if (this._tlTracks[j].tlid === criteria.tlid[i]) {
                        matches.push(this._tlTracks[j])
                    }
                }
            }
        }
        return $.when(matches)
    }

    /* Retuns index of the currently 'playing' track. */
    DummyTracklist.prototype.index = function (params) {
        if (!params) {
            if (this._tlTracks.length > 1) {
                // Always just assume that the second track is playing
                return $.when(1)
            } else {
                return $.when(0)
            }
        }
        for (var i = 0; i < this._tlTracks.length; i++) {
            if (this._tlTracks[i].tlid === params.tlid || (params.tl_track && params.tl_track.tlid === this._tlTracks[i].tlid)) {
                return $.when(i)
            }
        }
        return $.when(0)
    }

    return DummyTracklist
}))
