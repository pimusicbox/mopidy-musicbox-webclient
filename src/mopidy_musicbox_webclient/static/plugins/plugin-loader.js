var enabledPlugins = [
    'keysocket'
];


function scriptLoader(path, callback) {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.async = true;
    script.src = path;
    script.onload = function () {
        if (typeof (callback) == "function") {
            callback();
        }
    };
    try {
        var scriptOne = document.getElementsByTagName('script')[0];
        scriptOne.parentNode.insertBefore(script, scriptOne);
    } catch (e) {
        document.getElementsByTagName("head")[0].appendChild(script);
    }
}

for (var i in enabledPlugins) {
    var plugin = enabledPlugins[i];
    var path = `plugins/${plugin}.js`;
    scriptLoader(path);
}
