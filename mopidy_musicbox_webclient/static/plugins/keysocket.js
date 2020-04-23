/**
 * Plugin to support the Key Socket Media Keys chrome plugin. The plugin allows for controlling the music using the media keys.
 * https://github.com/borismus/keysocket
 * https://smus.com/chrome-media-keys-revisited/
 * https://chrome.google.com/webstore/detail/key-socket-media-keys/fphfgdknbpakeedbaenojjdcdoajihik?hl=en
 */

document.addEventListener("MediaPlayPause", function () {
    controls.doPlay();
});

document.addEventListener("MediaPrev", function () {
    controls.doPrevious();
});

document.addEventListener("MediaNext", function () {
    controls.doNext();
});
