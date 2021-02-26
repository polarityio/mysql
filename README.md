# Polarity PostgreSQL Integration

![image](https://img.shields.io/badge/status-beta-green.svg)

Polarity's PostgreSQL integration allows automated lookups to a PostgreSQL database using a user defined query.  The integration only supports running a single query.  As a result, it is recommended to pick a single entity type using the "Manage Integration Data" option on the integrations page.

This integration uses the excellent [node-postgres](https://github.com/brianc/node-postgres).  While this integration will work out of the box, it primarily intended to provide a well-defined template for constructing your own custom PostgreSQL based integrations.

> Please note that this integration is designed to work with a single database user account.  As a result you should make sure the database connection options (host, port, name, user, and password) are locked (i.e., all users share the same settings)

## PostgreSQL Integration Options


#### Database Host

The hostname or IP of the server running the PostgreSQL database you wish to connect to.  Note that you will likely need to make modifications to your pg_hba.conf file to allow the connection to be made.

#### Database Port

The port your database is running on.  Defaults to 5432.

#### Database Name

The name of the database you are connecting to.

#### User

The user you want the integration to connect to your postgres database as.  We recommend creating a read-only user for this purpose.

#### Password

The database password for the provided user above.

#### Query

The query you want to execute and return data for.

This integration only supports running a single query for any registered entity types.  As a result you will likely want to send only a single entity type to the query using the "Manage Integration Data" option on the integrations page. When constructing your query you can substitute the entity value into the query using the special string `$1`.

For example, if you set the integration to only receive IPv4 addresses then you can set the Query option to the following:

```postgresql
 SELECT * FROM data WHERE ip = $1
```

In the above example `$1` will be replaced with the actual entity value using PostgreSQL's built-in query parameterization to prevent SQL injection.  If the IP address `127.0.0.1` is on your screen then the above query will become:

```postgresql
SELECT * FROM data WHERE ip = '127.0.0.1'
```

You can also automatically set return columns to be treated as tags by naming the column with a string that starts with "tag".  For example:

```postgresql
SELECT hostname as tag1, location as tag2 WHERE ip = $1
```

In the above example, the value of hostname and location will be set as tags in the Polarity Overlay window.  Any other returned columns will be displayed as details in the overlay window details block when clicking on the entity and expanding it.  The default display is a table.

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/