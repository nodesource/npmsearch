var request = require('request'),
    argv = require('optimist').argv,
    net = require('net'),
    split = require('split'),
    async = require('async'),
    qs = require('querystring'),
    url = require('url');

const ES = argv.es || process.env.ES

if (!ES) {
  return console.log('USAGE: node rating3.js --es="http://host:port/npmsearch" [--interval=30]');
}

var releaseTime = 0;
// Phase 1: Collect metrics
// collect: releaseFrequency, stars, tests, and linkage
var metrics;
var globalMetrics;
var linkage;

var MIN_RELEASE_TIME = 1000*60*60;
var totalProjects = 0, recomputePageLimit = 100;
function recompute() {
  linkage = {};
  metrics = {};

  globalMetrics = {
    dependents  : {
      max: 0,
      sum: 0,
      weight: 5,
      contributing: 0
    },
    users  : {
      max: 0,
      sum: 0,
      weight: 1,
      contributing: 0
    },
    releaseFrequency  : {
      min: Infinity,
      max: 0,
      sum: 0,
      weight: 1,
      contributing: 0
    },
    tests  : {
      sum: 0,
      weight: 2,
      contributing: 0
    },
    readme : {
      sum: 0,
      weight: 1,
      contributing: 0
    }
  };

  request.get({
    url: ES + '/_search?size=100&scroll=5m&search_type=scan',
    json: { query : { match_all : {} } },
  }, function(e, r, o) {
    if (e || !o) {
      throw new Error('could not connect to elasticsearch');
    }
    var end = false;
    async.whilst(function() {
      return !end;
    }, function(fn) {
      var parsed = url.parse(ES)
      var scrollBase = url.format({
        host: parsed.host,
        protocol: parsed.protocol
      });

      request.get({
        url: url.resolve(scrollBase, '/_search/scroll?scroll=5m'),
        body: o._scroll_id,
        json: true
      }, function(e, r, o) {
        if (o.hits.hits.length) {
          o.hits.hits.forEach(function(p) {
            process.stdout.write('.');
            collect(p._source);
          });
        } else {
          end = true;
        }
        fn(e);
      })
    }, dependence)
  });

  totalProjects = 0;
  console.log('Begin rating compute', new Date());

}

recompute();

function collect(project) {


  if (!project || project.error) {
    console.log('FAIL', project && project.name || "UNKNOWN PROJECT");
    return;
  }

  totalProjects++;

  // Dependence
  if (project.dependencies) {
    project.dependencies.forEach(function(dep) {
      if (!linkage[dep]) {
        linkage[dep] = []
      }
      linkage[dep].push(project.name);
    });
  }

  if (project.devDependencies) {
    project.devDependencies.forEach(function(dep) {
      if (!linkage[dep]) {
        linkage[dep] = []
      }
      linkage[dep].push(project.name);
    });
  }

  // Metrics
  metrics[project.name] = {};

  // Metrics: users
  if (project.users) {
    var count = Object.keys(project.users).length;
    metrics[project.name].users = count;

    var usersMetric = globalMetrics.users;
    count > 0 && usersMetric.contributing++;

    if (usersMetric.max < count) {
      usersMetric.max = count;
    }

    usersMetric.sum += count;
  } else {
    metrics[project.name].users = 0;
  }

  // Metrics: releaseFrequency
  if (project.times) {

    var times = project.times;
    var created = +(new Date(project.created));
    var last = +(new Date(project.modified));
    var distance = last - created;
    delete times.created;
    delete times.modified;

    // TODO: does this relate to anything?
    // TODO: consider the age of the last release

    var totalReleases = Object.keys(times).length;
    if (totalReleases > 1 && distance > MIN_RELEASE_TIME) {
      var average = distance/totalReleases;

      if (totalReleases <= 2) {
        average = distance;
      }

      metrics[project.name].releaseFrequency = average;
      globalMetrics.releaseFrequency.sum += average;

      if (globalMetrics.releaseFrequency.min > average) {
        globalMetrics.releaseFrequency.min = average;
      } else if (globalMetrics.releaseFrequency.max < average) {
        globalMetrics.releaseFrequency.max = average;
      }

      globalMetrics.releaseFrequency.contributing++;
    }
  }

  // Metrics: tests
  // TODO: actually determine if tests are runnable
  // TODO: actually determine if tests are passing
  // TODO: actually determine test coverage?
  if (project.scripts && project.scripts.test) {
    if (project.scripts.test.join) {
      project.scripts.test = project.scripts.test.join(',');
    }
    metrics[project.name].tests = project.scripts.test.toLowerCase().indexOf('error') === -1;
    if (metrics[project.name].tests) {
      globalMetrics.tests.sum++;
    }
    globalMetrics.tests.contributing++;
  }

  // Metrics: Readme
  if (project.readme) {
    if (!project.readme || 
        project.readme === "ERROR: No README.md file found!" ||
        project.readme.length < 300)
    {
      metrics[project.name].readme = false;
    } else {
      metrics[project.name].readme = true;
      globalMetrics.readme.sum++;
      globalMetrics.readme.contributing++;
    }
  }
}

// Phase 2: dependence
// collect: dependents
function dependence() {
  console.log('collected', totalProjects, 'projects');
  Object.keys(linkage).forEach(function(projectName) {
    var dependents = linkage[projectName].length;
    if (! metrics[projectName]) {
      return;
    }
    metrics[projectName].dependents = dependents;

    if (dependents) {
      globalMetrics.dependents.sum += dependents;

      if (globalMetrics.dependents.max < dependents) {
        globalMetrics.dependents.max = dependents;
     }

     globalMetrics.dependents.contributing++;
    }
  });

  stats();
}

// Phase 3: statistical analysis
function stats() {
  var statsArray = [];

  Object.keys(metrics).forEach(function(projectName) {
    var obj = {
      id : projectName
    };

    var userMean = globalMetrics.users.sum/globalMetrics.users.contributing,
        depMean  = globalMetrics.dependents.sum/globalMetrics.dependents.contributing,
        relMean  = globalMetrics.releaseFrequency.sum/globalMetrics.releaseFrequency.contributing,

        projectUsers  = metrics[projectName].users || 0,
        projectDep    = metrics[projectName].dependents || 0,
        projectTests  = metrics[projectName].tests || 0,
        projectReadme = metrics[projectName].readme || 0,
        projectRel    = metrics[projectName].releaseFrequency || 0,

        glblUsers = globalMetrics.users,
        glblDep   = globalMetrics.dependents,
        glblRel   = globalMetrics.releaseFrequency,

        projectWeight = 0,
        userWeight = 0,
        depWeight = 0,
        testWeight = 0,
        readmeWeight = 0,
        relWeight = 0;

        userCeiling = userMean*2;
        depCeiling = depMean*2;

    // users
    if (projectUsers <= userMean) {
      userWeight = (projectUsers/(userMean/50))/100*glblUsers.weight;
    } else if (projectUsers > userMean) {
      userWeight = (((projectUsers-userMean)/((userCeiling-userMean)/50))/100+.5)*glblUsers.weight;
    }

    // dependents
    if (projectDep <= depMean) {
      depWeight = (projectDep/(depMean/50))/100*glblDep.weight;
    } else if (projectDep > depMean) {
      depWeight = (((projectDep-depMean)/((depCeiling-depMean)/50))/100+.5)*glblDep.weight;
    }

    // release frequency
    if (projectRel <= relMean && projectRel > 0) {
      relWeight = (((relMean-projectRel)/((relMean-glblRel.min)/50))+50)/100*glblRel.weight;
    } else if (projectRel > relMean) {
      relWeight = (50-((projectRel-relMean)/((glblRel.max-relMean)/50)))/100*glblRel.weight;
    } else {
      relWeight = 0;
    }

    // relate release frequency to dependents
    if (projectDep > depCeiling) {
      relWeight = glblRel.weight;
    }

    // tests
    if (projectTests) {
      testWeight = globalMetrics.tests.weight;
    } else {
      testWeight = 0;
    }

    // readme
    if (projectReadme) {
      readmeWeight = globalMetrics.readme.weight;
    } else {
      readmeWeight = 0;
    }

    // clamp values at max weight
    userWeight = clampWeight(userWeight, 'users');
    depWeight  = clampWeight(depWeight, 'dependents');
    relWeight  = clampWeight(relWeight, 'releaseFrequency');

    // assimilate weights
    projectWeight = userWeight + depWeight + testWeight + relWeight + readmeWeight;
    // clamp overall weight
    if (projectWeight > 10) {
      projectWeight = 10;
    } else if (projectWeight < 0) {
      projectWeight = 0;
    }

    obj.rating = projectWeight;
    statsArray.push(obj);
  });

  store(statsArray);
}

// Phase 4: store in es
function store(array) {
  console.log(globalMetrics);
  // TODO: use the bulk update api
  async.eachSeries(array, function(update, fn) {
    request.post({
      url: ES + "/package/" + update.id + '/_update',
      json : {
        doc : {
          rating : update.rating
        }
      }
    }, function(e, r, o) {
      fn(e);
    })

  }, function(e) {
    console.log('done!');
    setTimeout(recompute, (argv.interval || 30)*1000*60);
  });
}

// clamps weights at there max value
function clampWeight (weight, metric) {
  if (weight > globalMetrics[metric].weight) {
    weight = globalMetrics[metric].weight;
  }

  return weight;
}
