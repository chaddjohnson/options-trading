// Data source: http://www.fxdd.com/us/en/forex-resources/forex-trading-tools/metatrader-1-minute-data/

var fs = require('fs');
var es = require('event-stream');
var Q = require('q');

module.exports.parse = function(filePath) {
    var deferred = Q.defer();
    var stream;

    var transactionData = [];
    var formattedData = [];

    if (!filePath) {
        throw 'No filePath provided to dataParser.'
    }

    stream = fs.createReadStream(filePath)
        .pipe(es.split())
        .pipe(es.mapSync(function(line) {
            // Pause the read stream.
            stream.pause();

            (function() {
                // Ignore blank lines.
                if (!line) {
                    stream.resume();
                    return;
                }

                transactionData = line.split(',');
                formattedData.push({
                    groups: {
                        testing: JSON.parse(transactionData[0].replace(/;/g, ',')),
                        validation: JSON.parse(transactionData[1].replace(/;/g, ','))
                    },
                    timestamp: new Date(transactionData[2] + ' ' + transactionData[3] + ':00').getTime(),
                    open: parseFloat(transactionData[4]),
                    high: parseFloat(transactionData[5]),
                    low: parseFloat(transactionData[6]),
                    close: parseFloat(transactionData[7])
                });

                // Resume the read stream.
                stream.resume();
            })();
        }));

    stream.on('close', function() {
        deferred.resolve(formattedData);
    });

    return deferred.promise;
};
