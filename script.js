const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// TODO:
// lines across screen border
// makes nodes gracefully slide off edge
// automatic grid sizing
//
// add color support
// prevent multiple instances of constructNodes running at once
// general speed improvements


var sections = [];

var last = performance.now() / 1000;
var fpsThreshold = 0;

var sectionWidth = 100;
var sectionHeight = 100;

var maxDist = 200;

var columns = 6;
var rows = 6;
var numSections = columns * rows;

var wallpaperSettings = {
  numNodes: 96,
  backgroundColor: "#000",
  nodeColor: "#FFF",
  edgeColor: "#FFF",
  nodeSize: 3,
  edgeSize: 2.5,
  fps: 0,
  speed: 3
};


function updateNodeSpeed(pSpeed, speed) {
  let m = speed / pSpeed;
  for (let row of sections) {
    for (let nodes of row) {
      for (let node of nodes) {
        node.vx *= m;
        node.vy *= m;
      }
    }
  }

}

function updateNodeSize(pSize, size) {
  let m = size / pSize;
  for (let row of sections) {
    for (let nodes of row) {
      for (let node of nodes) {
        node.r *= m;
      }
    }
  }
}

function constructNodes() {
  sections = [];

  // create nodes
  var i, j, n;
  for (i = 0; i < rows; i++) {
    let row = [];
    for (j = 0; j < columns; j++) {
      let nodes = [];
      for (n = 0; n < wallpaperSettings.numNodes / numSections; n++) {
        nodes.push({
          x: Math.random() * sectionWidth,
          y: Math.random() * sectionHeight,
          vx: wallpaperSettings.speed * Math.random() - wallpaperSettings.speed / 2,
          vy: wallpaperSettings.speed * Math.random() - wallpaperSettings.speed / 2,
          r: 0.9 < Math.random() ? wallpaperSettings.nodeSize + wallpaperSettings.nodeSize * Math.random() : 1 + wallpaperSettings.nodeSize * Math.random()
        });
      }
      row.push(nodes);
    }
    sections.push(row);
  }
}

function step() {
  window.requestAnimationFrame(step);

  // Figure out how much time has passed since the last animation
  var now = performance.now() / 1000;
  var dt = Math.min(now - last, 1);
  last = now;

  // Abort updating the animation if we have reached the desired FPS
  if (wallpaperSettings.fps > 0) {
    fpsThreshold += dt;
    if (fpsThreshold < 1.0 / wallpaperSettings.fps) {
      return;
    }
    fpsThreshold -= 1.0 / wallpaperSettings.fps;
  }

  // move nodes
  var i, j, n;
  for (i = 0; i < sections.length; i++) {
    let row = sections[i];
    for (j = 0; j < row.length; j++) {
      let nodes = row[j];
      for (n = 0; n < nodes.length; n++) {
        let node = nodes[n];

        node.x += node.vx;
        node.y += node.vy;

        // warp through section edges
        if (node.x < 0) {
          node.x = mod(node.x, sectionWidth);
          row[mod(j - 1, columns)].push(node);
          nodes.splice(n, 1);
          continue;
        } else if (node.x >= sectionWidth) {
          node.x = mod(node.x, sectionWidth);
          row[mod(j + 1, columns)].push(node);
          nodes.splice(n, 1);
          continue;
        }

        if (node.y < 0) {
          node.y = mod(node.y, sectionHeight);
          sections[mod(i - 1, rows)][j].push(node);
          nodes.splice(n, 1);
          continue;
        } else if (node.y >= sectionHeight) {
          node.y = mod(node.y, sectionHeight);
          sections[mod(i + 1, rows)][j].push(node);
          nodes.splice(n, 1);
          continue;
        }
      }
    }
  }


  render();
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function mod(a, b) {
  return (a % b + b) % b;
}

function drawEdge(x1, y1, x2, y2) {
  const len = dist(x1, y1, x2, y2);

  if (len > maxDist) {
    return;
  }

  ctx.lineWidth = (1.0 - len / maxDist) * wallpaperSettings.edgeSize;
  ctx.globalAlpha = 1.0 - len / maxDist;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawNode(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function render() {
  ctx.fillStyle = wallpaperSettings.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // // draw grid
  // ctx.strokeStyle = wallpaperSettings.edgeColor;
  // ctx.lineWidth = 3.0;
  // ctx.globalAlpha = 1.0;
  // var i, j;
  // for (i = 0; i < sections.length; i++) {
  //   let row = sections[i];
  //   let yOffset = sectionHeight * i;
  //   for (j = 0; j < row.length; j++) {
  //     let nodes = row[j]
  //     let xOffset = sectionWidth * j;
  //     ctx.beginPath();
  //     ctx.moveTo(xOffset, yOffset);
  //     ctx.lineTo(xOffset + sectionWidth, yOffset);
  //     ctx.moveTo(xOffset, yOffset);
  //     ctx.lineTo(xOffset, yOffset + sectionWidth);
  //     ctx.stroke();
  //   }
  // }


  // draw edges
  ctx.strokeStyle = wallpaperSettings.edgeColor;
  var i, j;
  for (i = 0; i < sections.length; i++) {
    let row = sections[i];
    let yOffset1 = sectionHeight * i;
    for (j = 0; j < row.length; j++) {
      let nodes = row[j];
      let xOffset1 = sectionWidth * j;

      let adj = [
        [i, j],
        [i, j + 1],
        [i, j - 1],
        [i + 1, j],
        [i + 1, j + 1],
        [i + 1, j - 1],
        [i - 1, j],
        [i - 1, j + 1],
        [i - 1, j - 1]
      ];

      for (let a of adj) {
        a[0] = mod(a[0], rows);
        a[1] = mod(a[1], columns);
        let yOffset2 = sectionHeight * a[0];
        let xOffset2 = sectionWidth * a[1];
        for (let n1 of nodes) {
          for (let n2 of sections[a[0]][a[1]]) {
            drawEdge(n1.x + xOffset1, n1.y + yOffset1, n2.x + xOffset2, n2.y + yOffset2);
          }
        }
      }

      /**
      let adj = [
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ]
      for (let a of adj) {
        a[0] = mod(a[0], rows);
        a[1] = mod(a[1], columns);
      }

      for (let a of adj) {
        let yOffset2 = sectionWidth * a[0];
        let xOffset2 = sectionHeight * a[1];
        for (let n1 of nodes) {
          for (let n2 of sections[a[0]][a[1]]) {
            drawEdge(n1.x + xOffset1, n1.y + yOffset1, n2.x + xOffset2, n2.y + yOffset2);
          }
        }
      }
      for (let n1 of nodes) {
        for (let n2 of nodes) {
          if (n1.x <= n2.x && n1.y <= n2.y) {
            drawEdge(n1.x + xOffset1, n1.y + yOffset1, n2.x + xOffset1, n2.y + yOffset1);
          }
        }
      }
      **/



    }
  }

  // draw nodes
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = wallpaperSettings.nodeColor;
  var i, j, n;
  for (i = 0; i < sections.length; i++) {
    let row = sections[i];
    let yOffset = sectionHeight * i;
    for (j = 0; j < row.length; j++) {
      let xOffset = sectionWidth * j;
      let nodes = row[j];
      for (let node of nodes) {
        drawNode(node.x + xOffset, node.y + yOffset, node.r);
      }
    }
  }

}

window.wallpaperPropertyListener = {
  applyGeneralProperties: function(properties) {
    if (properties.fps) {
      wallpaperSettings.fps = properties.fps;
    }
  },
  applyUserProperties: function(properties) {
    if (properties.backgroundcolor) {
      let backgroundColorValue = properties.backgroundcolor.value.split(" ");
      backgroundColor = backgroundColorValue.map(function(c) {
        return Math.ceil(c * 255);
      });
      let backgroundColorAsCSS = "rgb(" + backgroundColor + ")";
      wallpaperSettings.backgroundColor = backgroundColorAsCSS;
    }
    if (properties.nodecolor) {
      let nodeColorValue = properties.nodecolor.value.split(" ");
      nodeColor = nodeColorValue.map(function(c) {
        return Math.ceil(c * 255);
      });
      let nodeColorAsCSS = "rgb(" + nodeColor + ")";
      wallpaperSettings.nodeColor = nodeColorAsCSS;
    }
    if (properties.edgecolor) {
      let edgeColorValue = properties.edgecolor.value.split(" ");
      edgeColor = edgeColorValue.map(function(c) {
        return Math.ceil(c * 255);
      });
      let edgeColorAsCSS = "rgb(" + edgeColor + ")";
      wallpaperSettings.edgeColor = edgeColorAsCSS;
    }
    if (properties.numnodes) {
      let pNum = wallpaperSettings.numNodes;
      wallpaperSettings.numNodes = properties.numnodes.value;
      constructNodes();
    }
    if (properties.speed) {
      let pSpeed = wallpaperSettings.speed;
      wallpaperSettings.speed = properties.speed.value;
      updateNodeSpeed(pSpeed, wallpaperSettings.speed);
    }
    if (properties.edgesize) {
      wallpaperSettings.edgeSize = properties.edgesize.value;
    }
    if (properties.nodesize) {
      let pNodeSize = wallpaperSettings.nodeSize
      wallpaperSettings.nodeSize = properties.nodesize.value;
      updateNodeSize(pNodeSize, wallpaperSettings.nodeSize);
    }
  },
}

window.onload = function() {
  canvas.width = document.body.clientWidth;
  canvas.height = canvas.clientHeight;
  sectionWidth = canvas.width / columns;
  sectionHeight = canvas.height / rows;
  maxDist = Math.min(canvas.width, canvas.height) / 3;

  constructNodes();
  window.requestAnimationFrame(step);
}
