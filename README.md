# npmsearch.com

[![Join the chat at https://gitter.im/solids/npmsearch](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/solids/npmsearch?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is the code that powers [npmsearch.com](http://npmsearch.com), which provides a clean interface to searching pseudo-rated node packages from npm.

The rest of this document describes how you would get your own npmsearch up and running.

## Setup Elasticsearch

See the [elasticsearch docs](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/setup.html) for setting up a node

```bash

# create an index

curl -XPUT http://localhost:9200/my-index-name

# setup the package field mappings

cat mappings.json | curl -v -XPOST http://localhost:9200/my-index-name/package/_mapping -H "Content-type: application/json" -d @-

# setup an alias to 'registry'

curl -XPOST 'http://localhost:9201/_aliases' -d '
{
  "actions" : [
    { "add" : { "index" : "my-index-name", "alias" : "registry" } }
  ]
}'

```

## pipe the npm registry into elasticsearch

```
npm2es --couch="https://skimdb.npmjs.com/registry" --es="http://localhost:9200/registry"

```

## run the server

```
node bin/server.js --es="http://localhost:9200/registry"
```

## compute ratings

```
node bin/rating.js --es="http://localhost:9200/registry"
```

# License

[MIT](LICENSE.txt)
