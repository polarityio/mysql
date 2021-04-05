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
          const parameterCount = _getParameterCount(options.query);
          const parameters = _getParameters(parameterCount, entityObj.value);
          conn
            .query(options.query, parameters)
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

/**
 * returns the number of unquoted question marks in the query
 * @param query
 * @private
 */
function _getParameterCount(query) {
  let currentChar = '';
  let previousChar = '';
  let parameterCount = 0;

  for (let i = 0; i < query.length; i++) {
    currentChar = query.charAt(i);
    if (currentChar === '?' && previousChar !== "'") {
      parameterCount++;
    }
    previousChar = currentChar;
  }

  return parameterCount;
}

function _getParameters(parameterCount, entityValue) {
  let parameters = [];
  for (let i = 0; i < parameterCount; i++) {
    parameters.push(entityValue);
  }
  return parameters;
}

function startup(logger) {
  Logger = logger;
}

function validateOptions(userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.host.value !== 'string' ||
    (typeof userOptions.host.value === 'string' && userOptions.host.value.length === 0)
  ) {
    errors.push({
      key: 'host',
      message: 'You must provide a valid host'
    });
  }

  if (
    typeof userOptions.database.value !== 'string' ||
    (typeof userOptions.database.value === 'string' && userOptions.database.value.length === 0)
  ) {
    errors.push({
      key: 'database',
      message: 'You must provide a valid database'
    });
  }

  if (
    typeof userOptions.user.value !== 'string' ||
    (typeof userOptions.user.value === 'string' && userOptions.user.value.length === 0)
  ) {
    errors.push({
      key: 'user',
      message: 'You must provide a valid user'
    });
  }

  if (
    typeof userOptions.password.value !== 'string' ||
    (typeof userOptions.password.value === 'string' && userOptions.password.value.length === 0)
  ) {
    errors.push({
      key: 'password',
      message: 'You must provide a valid password'
    });
  }

  if (
    typeof userOptions.query.value !== 'string' ||
    (typeof userOptions.query.value === 'string' && userOptions.query.value.length === 0)
  ) {
    errors.push({
      key: 'query',
      message: 'You must provide a valid query'
    });
  }

  if (userOptions.port.value.length === 0) {
    errors.push({
      key: 'port',
      message: 'You must provide a valid port'
    });
  }

  cb(null, errors);
}

module.exports = {
  doLookup,
  startup,
  validateOptions
};
