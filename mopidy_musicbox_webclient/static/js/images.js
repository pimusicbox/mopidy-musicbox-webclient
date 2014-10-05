/**
 * @author Wouter van Wijk
 */

API_KEY= 'b6d34c3af91d62ab0ae00ab1b6fa8733';
API_SECRET = '2c631802c2285d5d5d1502462fe42a2b';

var fmcache;
var lastfm;


$(window).load(function() {
    // create a Cache object
    fmcache = new LastFMCache();
    // create a LastFM object
    lastfm = new LastFM({
        apiKey    : API_KEY,
        apiSecret : API_SECRET,
        cache     : fmcache
    });
});


function getCover(album, images, size) {
        var defUrl = 'images/default_cover.png';
        $(images).attr('src', defUrl);
        if (!album) {
            return;
        }
        var albumname = album.name || '';
        var artistname = '';
        if ( album.artists && (album.artists.length > 0) ) {
            artistname = album.artists[0].name;
        }
//        console.log(album, images);
        if (album.images && (album.images.length > 0) ) {
            $(images).attr('src', album.images[0]);
        } else {
            lastfm.album.getInfo( {artist: artistname, album: albumname},
                { success: function(data){
                    for (var i = 0; i < data.album.image.length; i++) {
                        if ( data.album.image[i]['size'] == size) {
                            $(images).attr('src', data.album.image[i]['#text'] || defUrl);
                        }
                    }
                }
            });

       }
}

function getArtistImage(nwartist, image, size) {
        var defUrl = 'images/user_24x32.png';
        lastfm.artist.getInfo({artist: nwartist}, {success: function(data){
            for (var i = 0; i < data.artist.image.length; i++) {
                if ( data.artist.image[i]['size'] == size) {
                    $(image).attr('src', data.artist.image[i]['#text'] || defUrl);
                }
            }
        }});
}