# npmsearch.com

This is the code that powers [npmsearch.com](http://npmsearch.com), which provides a clean interface to searching pseudo-rated node packages from npm.

The rest of this document describes how you would get your own npmsearch up and running.

## Setup Elasticsearch

See the [elasticsearch docs](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/setup.html) for setting up a node

```bash

# create a registry index
curl -XPUT http://localhost:9200/registry

# setup the package field mappings
curl -XPUT http://localhost:9200/registry/package/_mapping -d'
{
  "package" : {
    "properties" : {
      "name" : {
        type: "multi_field",
          fields : {
            name : { type : "string", index : "analyzed" },
            untouched : { type : "string", index : "not_analyzed" }
          }
        }
      }
    }
  }
}
'

curl -XPUT http://localhost:9200/registry/package/_mapping -d'
{
  "package" : {
    "properties" : {
      rating : {
        type: "multi_field",
        fields : {
          rating : { type: "double", index : "analyzed" },
          untouched: {type: "double", index: "not_analyzed" } 
        }
      }
    }
  }
}
'

```

## pipe the npm registry into elasticsearch

```

npm2es --couch="http://isaacs.iriscouch.com/registry" --es="http://localhost:9200/registry"

```

## run the server

```

node bin/server.js --es="http://localhost:9200/registry"

```

## compute ratings

```

node bin/rating.js --es="http://localhost:9200/registry"

```