# Book bundle

### What is a book bundle?

It's a collection of related books.

```json
{
    "name": "light reading",
    "books": [{
        "id": "pg132",
        "title": "The Art of War"
    }, {
        "id": "pg2680",
        "title": "Meditations",
    }, {
        "id": "pg6456",
        "title": "Public Opinion"
    }]
}
```



The nconf module manages configuration settings through a customizable
hierarchy of config files, environment variables, and command-line arguments.
The order in which you load a source of configuration determines its precedence.
Earlier values stick, meaning that later values will not overwrite them.
Here again is the first line of the server.js file that handles setting up nconf:

```js
nconf.argv().env('__')
```

This first line means that nconf should load argument variables first, then
environment variables. The double underscore string passed to env() means
that two underscores should be used to denote object hierarchy when reading
from environment variables. This is because many shell programs do not
allow colon characters in variable names.


In the config.json file, recall that we set es.host
to localhost. nconf uses the colon character by default to flatten the object hierarchy,
so to get the value of this configuration parameter, we would call
nconf.get('elasticsearch:host') in Node.


I’ve set it up so that nconf gives us the option to override elasticsearch:host either
as an argument variable or as an environment variable since these are loaded
first. To override elasticsearch:host as a command-line argument, we would invoke server.js
from the command line like this:

```sh
$ node server.js --elasticsearch:host=some.other.host
```

On the other hand, to override elasticsearch:host with an environment variable, we would
invoke server.js like so:

```sh
$ elasticsearch__host=some.other.host node server.js
```


Finally, in the last line of the nconf setup stanza, we tell nconf to load the file
defined in the conf path.

```js
nconf.file(nconf.get('conf'));
```

Any values in that file will take effect only if they haven’t been set already in
the command-line arguments or environment variables.
