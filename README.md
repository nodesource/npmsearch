# npmsearch.com

[![N|Solid](https://cldup.com/dTxpPi9lDf.thumb.png)](https://nodesource.com/products/nsolid)

This is the code that powers [npmsearch.com](http://npmsearch.com), which provides a clean interface to searching pseudo-rated node packages from npm.

## api

To query the npmsearch index, you can use the HTTP api which is effectively a proxy to elasticsearch's [URI Search](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-uri-request.html).

All requests go through http://npmsearch.com/query. Here's an example:

```
curl "http://npmsearch.com/query?q=dom&fields=name"
{"results":[{"name":["select-dom"]},{"name":["dom-manipulations"]},{"name":["zero-dom"]},{"name":["dom-stub"]},{"name":["dom-walk"]},{"name":["dom-value"]},{"name":["karma-chai-dom"]},{"name":["dom-select"]},{"name":["dom-listeners"]},{"name":["has-dom"]}],"total":7265,"from":0}
```

### Available fields

* __author__
* __created__
* __dependencies__
* __description__
* __devDependencies__
* __homepage__
* __keywords__
* __maintainers__
* __modified__
* __name__
* __readme__
* __repository__
* __scripts__
* __times__
* __version__
* __rating__ - computed rating as per [bin/rating.js](bin/rating.js)

# Running your own npmsearch

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

## Authors and Contributors

<table><tbody>
<tr><th align="left">Elijah Insua</th><td><a href="https://github.com/tmpvar">GitHub/tmpvar</a></td><td><a href="http://twitter.com/tmpvar">Twitter/@tmpvar</a></td></tr>
</tbody></table>

Authored by Elijah Insua. Contributions are welcomed from anyone wanting to improve this project!

## License & Copyright

**npmsearch** is Copyright (c) 2016 NodeSource and licensed under the MIT license. All rights not explicitly granted in the MIT license are reserved. See the included [LICENSE.txt](LICENSE.txt) file for more details.
