'use strict';

const async = require('async');
const mariadb = require('mariadb');

let _pool;
let poolSignature = '';
let Logger;

/**
 * Override console output in case enableLeakDetection option is turned on as that will attempt to log using
 * console.log.  We want to capture that output and send it to our integration log file.
 *
 * @type {{debug: console.debug, log: console.log, error: console.error, info: console.info}}
 */
console = {
  log: function(){
    Logger.info(...arguments);
  },
  info: function(){
    Logger.info(...arguments);
  },
  error: function(){
    Logger.error(...arguments);
  },
  debug: function(){
    Logger.debug(...arguments);
  }
}

function startup(logger) {
  Logger = logger;
}

async function getPool(options) {
  let optionString = options.host + options.user + options.port + options.password + options.database + options.enableLeakDetection + options.connectionLimit;
  if (poolSignature != optionString) {
    poolSignature = optionString;

    if(_pool){
      await _pool.end()
    }

    _pool = new mariadb.createPool({
      connectionLimit: options.connectionLimit,
      host: options.host,
      user: options.user,
      port: options.port,
      password: options.password,
      database: options.database,
      allowPublicKeyRetrieval: options.allowPublicKeyRetrieval,
      leakDetectionTimeout: options.enableLeakDetection ? 10000 : 0
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
async function doLookup(entities, options, cb) {
  let lookupResults = [];
  let pool = await getPool(options);

  Logger.trace({ entities: entities }, 'doLookup');
  logPoolStats(pool, options);

  async.each(
    entities,
    async (entityObj) => {
      let conn;
      try {
        conn = await pool.getConnection();
        const parameterCount = _getParameterCount(options.query);
        const parameters = _getParameters(parameterCount, entityObj.value);
        const rows = await conn.query(options.query, parameters);

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
      } finally {
        if (conn) {
          conn.release();
        }
      }
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

function logPoolStats(pool, options) {
  if(options.enableLeakDetection){
    Logger.info(
        {
          taskQueue: pool.taskQueueSize(),
          idleConnections: pool.idleConnections(),
          totalConnections: pool.totalConnections(),
          activeConnections: pool.activeConnections(),
          closed: pool.closed,
          connectionInCreation: pool.connectionInCreation,
          connectionLimit: options.connectionLimit
        },
        'Leak Detection Pool Stats'
    );
  }
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
