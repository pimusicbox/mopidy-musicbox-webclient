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


function getCover(nwartist, nwalbum, image, size) {
        $(image).attr('src', '../images/icons/cd_32x32.png');
        lastfm.album.getInfo({artist: nwartist, album: nwalbum}, {success: function(data){
            for (var i = 0; i < data.album.image.length; i++) {
                if ( data.album.image[i]['size'] == size) {
                    $(image).attr('src', data.album.image[i]['#text']);
                }
            }
        }, error: function(code, message){
            console.log('Error #'+code+': '+message);
        }});
}
function getArtistImage(nwartist, image, size) {
        $(image).attr('src', '../images/icons/user_24x32.png');
        lastfm.artist.getInfo({artist: nwartist}, {success: function(data){
            for (var i = 0; i < data.artist.image.length; i++) {
                if ( data.artist.image[i]['size'] == size) {
                    $(image).attr('src', data.artist.image[i]['#text']);
                }
            }
        }, error: function(code, message){
            console.log('Error #'+code+': '+message);
        }});
}