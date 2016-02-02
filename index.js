var fs = require('fs');
var jsdom = require('jsdom');
var moment = require('moment');
var glob = require('glob');
var path = require('path');
var debug = false;

glob('source/images/*', function(err, folders) {
  var html = fs.readFileSync('source/index.html', 'utf-8');

  folders.forEach(function(folder) {
    var name = path.basename(folder);
    var files = glob.sync(path.join(folder, '*'))

    jsdom.env(html, [require.resolve('d3')], function (err, window) {
      var d3 = window.d3;
      var svg = d3.select('svg').style({
        'font-size': 8,
        'font-family': 'Open Sans'
      });

      images = files.map(function(file) {
        var basename = path.basename(file, '.jpg');
        var timestamp = moment(basename, 'YYYY-MM-DDTHHmmss');
        var contents = fs.readFileSync(file);
        var buffer = new Buffer(contents).toString('base64');
        return { src: file, contents: buffer, timestamp: timestamp };
      });

      var min = d3.min(images, function(d) { return d.timestamp; });
      var max = d3.max(images, function(d) { return d.timestamp; });
      min = min.clone().hour(9).startOf('hour');
      max = max.clone().hour(21).startOf('hour');

      var grid = [];
      for (var time = min; time.isBefore(max); time.add(15, 'minutes')) {
        var start = time.clone();
        var end = start.clone().add(15, 'minutes');
        var matches = images.filter(function(image) {
          return image.timestamp.isAfter(start) && image.timestamp.isBefore(end);
        });
        var image = null;
        if (matches.length > 0) {
          image = matches.sort(function(a,b) {
            a = a.timestamp.diff(time);
            b = b.timestamp.diff(time);
            return d3.ascending(a,b);
          })[0];
        }

        grid.push({
          time: start,
          image: image
        });
      }

      var y = 0, x = 0;
      grid.forEach(function(d, i) {
        if (i % 16 === 0) {
          y += 64;
          x = 64;
        }
        var group = svg.append('svg:g').attr('transform', 'translate(' + [x, y].join(',') + ')');
        if (d.image) {
          group.append('svg:image').attr('xlink:href', function() {
            if (debug) {
              return path.join(__dirname, d.image.src);
            } else {
              return 'data:image/jpeg;base64,' +  d.image.contents;
            }
          }).attr('width', 64).attr('height', 64).attr('x', 0).attr('y', 0);
        } else {
          group.append('svg:rect').attr({ 'width': 64, 'height': 64 }).style('fill', function() {
            if (grid.slice(0, i).every(function(item) { return item.image === null; })) return '#fff';
            if (grid.slice(i).some(function(item) { return item.image; })) return '#ccc';
            return '#fff';
          }).style('stroke', 'none').style('shape-rendering', 'crispEdges');
        }
        group.append('svg:text').attr({
          'x': 8,
          'y': 8,
          'dy': '1em',
          'fill': i === 0 ? '#7f7f7f' : '#fff'
        }).each(function() {
          var el = d3.select(this);
          el.append('svg:tspan').text(d.time.format('h:mm')).attr('x', 8);
          if (i === 0) {
            el.append('svg:tspan').text('Day 1').attr('x', 8).attr('dy', '1em');
          } else if (d.time.hours() === 0 && d.time.minutes() === 0) {
            var d1 = grid[0].time;
            var day = d.time.clone().add(d1.hours(), 'hours').diff(d1, 'days') + 1;
            el.append('svg:tspan').text('Day ' + day).attr('x', 8).attr('dy', '1em');
          }
        });
        x += 64;
      });

      fs.mkdir('build', function(err) {
        writeImage(name, svg);
        writeManifest(name, grid);
      });
    });
  });
});

function gridImages(grid) {
  return grid.filter(function(slot) {
    return slot.image !== null;
  }).map(function(slot) {
    return slot.image.src;
  });
}

function writeImage(name, svg) {
  var filename = path.join('build', name + '.svg');
  var contents = svg.node().outerHTML.replace(/<image href="/g, '<image xlink:href="');
  fs.writeFile( filename, contents, function(err) {
    if (err) {
      console.warn('Error writing image', filename);
      console.err(err);
    } else {
      console.log('Wrote image to', filename);
    }
  });
}

function writeManifest(name, grid) {
  var filename = path.join('build', name + '.txt');
  console.log(gridImages(grid));
  var contents = gridImages(grid).join("\n");
  fs.writeFile( filename, contents, function(err) {
    if (err) {
      console.warn('Error writing manifest', filename);
      console.err(err);
    } else {
      console.log('Wrote manifest to', filename);
    }
  });
}
