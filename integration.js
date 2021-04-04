'use strict';

const async = require('async');
const mariadb = require('mariadb');

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

  Logger.trace({ entities: entities }, 'doLookup');

  async.each(
    entities,
    (entityObj, done) => {
      pool
        .getConnection()
        .then((conn) => {
          conn
            .query(options.query, [entityObj.value])
            .then((rows) => {
              Logger.debug({ rows }, 'SQL Results');

              if (rows.length === 0) {
                lookupResults.push({
                  entity: entityObj,
                  data: null
                });
              } else {
                lookupResults.push({
                  entity: entityObj,
                  data: _processRows(rows)
                });
              }
              done(null);
            })
            .catch((queryError) => {
              done(queryError);
            })
            .finally(() => {
              conn.end();
            });
        })
        .catch((connectionErr) => {
          done(connectionErr);
        });
    },
    (err) => {
      if (err) {
        Logger.error({ err: err, stack: err.stack }, 'Error Running Query');
        err = {
          detail: 'Error Running Query',
          debug: {
            stack: err.stack,
            err: err
          }
        };
      } else {
        Logger.debug({ lookupResults: lookupResults }, 'Lookup Results');
      }
      cb(err, lookupResults);
    }
  );
}

/**
 * For each row returned by the query, we remove any columns that start with "tag" and put
 * those into the summary array.
 * @param rows
 * @returns {*}
 * @private
 */
function _processRows(rows) {
  return rows.reduce(
    (data, row, index) => {
      let keys = Object.keys(row);
      data.details[index] = {};
      keys.forEach((key) => {
        if (key.startsWith('tag')) {
          data.summary.push(row[key]);
        } else {
          data.details[index][key] = row[key];
        }
      });
      return data;
    },
    { details: [], summary: [] }
  );
}

function startup(logger) {
  Logger = logger;
}

module.exports = {
  doLookup: doLookup,
  startup: startup
};
