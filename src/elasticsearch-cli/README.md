# elasticsearch-cli

```sh
$ bin.js


Usage: bin [options] <command> [...]

Options:
  -V, --version          output the version number
  -o, --host <hostname>  hostname [localhost] (default: "localhost")
  -p, --port <number>    port number [9200] (default: "9200")
  -j, --json             format output as JSON
  -i, --index <name>     which index to use
  -t, --type <type>      default type for bulk operations
  -f, --filter <filter>  source filter for query results
  -h, --help             output usage information

Commands:
  get [path]             generate the URL for the options and path (default is /)
  create-index           Create an index in Elasticsearch
  list-indices|li        Get a list of indices in the cluster
  bulk <file>            Read and perform bulk options from the specified file
  query|q [queries...]   Perform an Elasticsearch query
  delete-index           Delete a index in Elasticsearch


```