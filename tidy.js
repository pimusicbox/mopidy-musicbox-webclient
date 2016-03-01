var tidy = require('tidy-html5').tidy_html5

var fs = require('fs')

// Traverse directory structure looking for 'html' or 'htm' files.
var getAllHtmlFilesFromFolder = function (dir) {
    var filesystem = require('fs')
    var results = []
    filesystem.readdirSync(dir).forEach(function (file) {
        file = dir + '/' + file
        var stat = filesystem.statSync(file)

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllHtmlFilesFromFolder(file))
        } else {
            var extension = file.substr(file.lastIndexOf('.') + 1).toUpperCase()
            if (extension === 'HTM' || extension === 'HTML') {
                results.push(file)
            }
        }
    })
    return results
}

// Read file contents.
function readFiles (dirname, onFileContent) {
    var filenames = getAllHtmlFilesFromFolder(dirname)
    filenames.forEach(function (filename) {
        fs.readFile(filename, 'utf-8', function (err, content) {
            if (err) {
                throw (err)
            }
            onFileContent(filename, content)
        })
    })
}

var util = require('util')

// Trap stderr output so that we can detect parsing errors.
function hook_stderr (callback) {
    var old_write = process.stderr.write

    process.stderr.write = (function (write) {
        return function (string, encoding, fd) {
            write.apply(process.stdout, arguments)
            callback(string, encoding, fd)
        }
    })(process.stderr.write)

    return function () {
        process.stderr.write = old_write
    }
}

var unhook = hook_stderr(function (string, encoding, fd) {
    if (string.indexOf('Error:') > 0) {
        errors.push(string)
    }
})

var errorsOccurred = false
var errors = []

// Exit with status 1 so that tox can detect errors.
process.on('exit', function () {
    if (errorsOccurred === true) {
        process.exit(1)
    }
})

// Start linter
function processFiles (callback) {
    console.log('Starting HTML linter...')
    readFiles('mopidy_musicbox_webclient/static', function (filename, content) {
        console.log('\n' + filename)
        var result = tidy(content, {'quiet': true})
        if (errors.length > 0) {
            console.error('\nHTML errors detected:\n' + errors.join(''))
            errors = []
            errorsOccurred = true
        }
    })
}

processFiles(function () {
    unhook()
})
