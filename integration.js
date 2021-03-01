'use strict';

const async = require('async');
const mariadb = require('mariadb');
//const { Pool } = require('mariadb');

let _pool;
let poolSignature = '';
let Logger;

function getPool(options) {
    let optionString = options.host + options.user + options.port + options.password + options.database;
    if (poolSignature != optionString) {
        poolSignature = optionString;

        _pool = new mariadb.createPool({
            connectionLimit: 10,
            host: options.host,
            user: options.user,
            port: options.port,
            password: options.password,
            database: options.database
        });
    }
    return _pool;
}

/**
 *
 * @param entities
 * @param options
 * @param cb
 */
function doLookup(entities, options, cb) {
    let lookupResults = [];
    let pool = getPool(options);

    Logger.trace({entities: entities}, 'doLookup');

    async.each(entities, (entityObj, done) => {
        let conn;
        let query = {
            text: options.query,
            values: [entityObj.value]
        };

        Logger.debug({query:query}, 'Query');
        pool.getConnection ()
            .then (conn => {
        conn.query(query, function (error, results) {
            if (error) {
                return done(error);
            }

            Logger.debug({results:results}, 'SQL Results');

            if (results.rows.length === 0) {
                lookupResults.push({
                    entity: entityObj,
                    data: null
                });
            } else {

                lookupResults.push({
                    entity: entityObj,
                    data: {
                        summary: results.rows.reduce((tags, row) => {
                            let keys = Object.keys(row);
                            keys.forEach(key => {
                                if(key.startsWith('tag')){
                                    tags.push(row[key]);
                                }
                            });
                            return tags;
                        }, []),
                        details: results.rows
                    }
                });
            }

            done(null);
        });
    });
    }, (err) => {
        if(err){
            Logger.error({err:err, stack:err.stack}, 'Error Running Query');
            err = {
                detail: 'Error Running Query',
                debug: {
                    stack: err.stack,
                    err:err
                }
            };
        }else{
            Logger.debug({lookupResults: lookupResults}, 'Lookup Results');
        }
        cb(err, lookupResults);
    });
}

function startup(logger) {
    Logger = logger;
}

module.exports = {
    doLookup: doLookup,
    startup: startup
};