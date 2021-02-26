module.exports = {
    /**
     * Name of the integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @required
     */
    name: 'MySQL',
    /**
     * The acronym that appears in the notification window when information from this integration
     * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
     * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
     * here will be carried forward into the notification window.
     *
     * @type String
     * @required
     */
    acronym: 'MSQL',
    /**
     * Description for this integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @optional
     */
    description: 'SQL Lookup for MySql and MariaDB databases',
    entityTypes: ['*'],
    /**
     * An array of style files (css or less) that will be included for your integration. Any styles specified in
     * the below files can be used in your custom template.
     *
     * @type Array
     * @optional
     */
    styles: ['./styles/mysql.less'],
    /**
     * Provide custom component logic and template for rendering the integration details block.  If you do not
     * provide a custom template and/or component then the integration will display data as a table of key value
     * pairs.
     *
     * @type Object
     * @optional
     */
    block: {
      component: {
        file: './components/mysql-block.js'
      },
      template: {
        file: './templates/mysql-block.hbs'
      }
    },
    summary: {
      component: {
        file: './components/mysql-summary.js'
      },
      template: {
        file: './templates/mysql-summary.hbs'
      }
    },
    request: {
      cert: '',
      key: '',
      passphrase: '',
      ca: '',
      proxy: '',
      rejectUnauthorized: true
    },
    logging: {
      level: 'info' //trace, debug, info, warn, error, fatal
    },
    /**
     * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
     * as an array of option objects.
     *
     * @type Array
     * @optional
     */
    options: [
      {
        key: 'host',
        name: 'Database Host',
        description: 'The hostname of the server hosting your MySQL Server instance',
        default: '',
        type: 'text',
        userCanEdit: false,
        adminOnly: true
      },
      {
        key: 'port',
        name: 'Database Port',
        description: 'The port your database instance is listening on',
        default: 3306,
        type: 'number',
        userCanEdit: false,
        adminOnly: true
      },
      {
        key: 'database',
        name: 'Database Name',
        description: 'The name of the database you are connecting to',
        default: '',
        type: 'text',
        userCanEdit: false,
        adminOnly: true
      },
      {
        key: 'user',
        name: 'User',
        description: 'The database user you are connecting as',
        default: '',
        type: 'text',
        userCanEdit: false,
        adminOnly: true
      },
      {
        key: 'password',
        name: 'Users Password',
        description: 'The password of the user you are authenticating as',
        default: '',
        type: 'password',
        userCanEdit: true,
        adminOnly: false
      },
      {
        key: 'query',
        name: 'Query',
        description:
          'The query you want to execute and return data for.  Replace the entity with "$1".  (e.g., SELECT * FROM data WHERE ip = $1).  Columns that appear as tags should be prefixed with "tag" (e.f., SELECT id as tag1, severity as tag2 FROM data WHERE ip = $1)',
        default: '',
        type: 'text',
        userCanEdit: true,
        adminOnly: false
      }
    ]
  };