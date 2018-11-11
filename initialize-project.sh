#!/usr/bin/env bash


pushd .
cd data
echo "Downloading Free ebooks - Project Gutenberg..."
curl -O http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2
echo "Decompressing ebooks..."
tar -xvjf rdf-files.tar.bz2
popd

echo "Initializing parser, transforming books to Line Delimited JSON file. This task may take a few minutes..."

folderData="$(pwd)/data/cache/epub"

node src/elasticsearch-parser/rdf-to-bulk.js $folderData > data/bulk_pg.ldj

bulkFileData="$(pwd)/data/bulk_pg.ldj"

bulkResultFile="$(pwd)/data/bulk_result.json"

echo "Bulk data dump to Elasticsearch. This task may take a few minutes..."

./src/elasticsearch-cli/bin.js bulk $bulkFileData -i books -t book > $bulkResultFile

echo "********Done**********"

echo "You can recover some records with this instruction: ./src/elasticsearch-cli/bin.js get '_search' | jq '.' | head -n 50"