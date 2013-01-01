/**
 * @author Wouter van Wijk
 *
 * communication with ws server
 *
 */

//play uri, update playlist to player if needed
function playtrack(uri, playlisturi) {
    trackslist = new Array();
    console.log('play uri:' + uri);
    console.log('playlist uri:' + playlisturi);
    var track;
        switchContent('current', uri);
        tracks = getTracksFromUri(playlisturi);
        if (tracks) {
            $(CURRENT_PLAYLIST_TABLE).empty();
            mopidy.tracklist.clear();
            mopidy.tracklist.add(tracks);
          // console.log(tracks);
        } else {
            tracks = currentplaylist;
        }
     for (var i = 0; i < tracks.length; i++) {
         if(tracks[i].uri == uri) {
            track = i + 1;
         }
     }
    // console.log(pl.tracks);
     console.log(track);

    mopidy.playback.stop(true); 
     for (var i = 0; i < track; i++) {
          mopidy.playback.next();
      }
   mopidy.playback.play(); 
   //(track);
   return false;
}

function currentTrackResults (data) {
    //modify results for songinfo
//    var tr = new Object();
//    tr["track"] = data;
    setSongInfo(data);
}

function repeatResults (data) {
    setRepeat(data);
}

function randomResults (data) {
    setShuffle(data);
}

function currentPositionResults (data) {
   pos = parseInt(data);
   setPosition(pos);
   console.log('pos:' + pos);
}

function currentStateResults (data) {
    console.log(data);
   if(data == 'playing') {
       setPlayState(true);  
       resumeTimer(); 
   } else {
       setPlayState(false);   
   }
}

//process results of list of playlists of the user
function handleGetplaylists(resultArr) {
    /*<p><ul><li>Donec id elit non mi porta</li><li>Gravida at eget metus. Fusce dapibus.</li><li>Tellus ac cursus commodo</li></p>
     <p><a class="btn" href="#">More &raquo;</a></p>
     */
    playlists = resultArr;
    tmp = '';
    for (var i = 0; i < playlists.length; i++) {
        var child = '<li><a href="#" onclick="return setPlaylist(this.id);" id="' + playlists[i]["uri"] + '"">' + playlists[i]["name"] + '</a></li>';
        tmp += child;
    };
    $('#playlistslist').empty();
    $('#playlistslist').html(tmp);
    $('#playlistsloader').hide();
    $("#loadingmodal").modal('hide');
}

//process results of a returned playlist
function handlePlaylist(resultArr) {
    //cache
    newplaylisturi = resultArr["uri"];
    playlists[newplaylisturi] = resultArr;
    playlisttotable(playlists[newplaylisturi], PLAYLIST_TABLE, newplaylisturi);
    $('#playlistloader').hide();
}

//process results of a returned playlist
function handleCurrentPlaylist(resultArr) {
    currentplaylist = resultArr;
    playlisttotable(resultArr, CURRENT_PLAYLIST_TABLE);
    //$("#result").html(resultArr);
}

function handleSearchResults(resultArr) {
    $(SEARCH_TRACK_TABLE).empty();
    $(SEARCH_ARTIST_TABLE).empty();
    $(SEARCH_ALBUM_TABLE).empty();
    $("#searchresults").show();

    playlisttotable(resultArr[1].tracks, SEARCH_TRACK_TABLE, 'trackresultscache');
    customTracklists['trackresultscache'] = resultArr[1].tracks;

    var artists = resultArr[1].artists;
    var child = '';

    
    for (var i = 0; i < artists.length; i++) {
       child += '<tr class="resultrow';
       if (i > 4) {
           child += " hidden";
       }
       child += '"><td><a href="#" onclick="return showartist(this.id, uri)" id="' + artists[i]["uri"] + '">' + artists[i]["name"] + "</a></td></tr>";
    }
    $(SEARCH_ARTIST_TABLE).html(child);
    
    child = '';
    var albums = resultArr[1].albums;
    
    for (var i = 0; i < albums.length; i++) {
       child += '<tr class="resultrow';
       if (i > 4) {
           child += " hidden";
       }
       child += '"><td><a href="#" onclick="return showalbum(this.id, uri)" id="' + albums[i]["uri"] + '">' + albums[i]["name"] + "</a></td><td>";
            for (var j = 0; j < albums[i].artists.length; j++) {
                //console.log(j);
                child += '<a href="#" onclick="return showartist(this.id, uri)" id="' + albums[i].artists[j]["uri"] + '">' + albums[i].artists[j]["name"] + "</a>";
            }
       child += '</td></tr>';
    }
    $(SEARCH_ALBUM_TABLE).html(child);

/*    playlisttotable(resultArr[1].albums, SEARCH_ALBUM_TABLE, 'albumresultscache');
    customTracklists['albumresultscache'] = resultArr[1].albums;
    $('#albumresultloader').hide();
    playlisttotable(resultArr[1].artists, SEARCH_ARTIST_TABLE, 'artistresultscache');
    customTracklists['artistresultscache'] = resultArr[1].artists;
*/
    $('#expandsearch').show();

    $('#allresultloader').hide();
}

function handleArtistResults(resultArr) {
//    console.log(resultArr.tracks);
//    console.log(resultArr);
    customTracklists[resultArr["uri"]] = resultArr;
    playlisttotable(resultArr, ARTIST_TABLE, resultArr["uri"]);
    $('#h_artistname').html(getArtist(resultArr));
    $('#artistsloader').hide();
}

function handleAlbumResults(resultArr) {
    //console.log(resultArr.tracks);
    //console.log(resultArr);
    customTracklists[resultArr["uri"]] = resultArr;
    playlisttotable(resultArr, ALBUM_TABLE, resultArr["uri"]);
    $('#h_albumname').html(getAlbum(resultArr));
    //$('#h_albumartist').html('<a href="#" onclick="return showartist(this.id, uri)" id="' + resultArr["uri"] + '">' + getArtist(resultArr) + '</a>');
    $('#h_albumartist').html(getArtist(resultArr));
    $('#albumsloader').hide();
}
