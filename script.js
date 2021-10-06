const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// TODO:
// change data structure
// add color support
// add quick removal of nodes
// fix the horror that is drawing edges
// prevent multiple instances of constructNodes running at once
// general speed improvements

// the canvas is split into n * m sections
// each section holds nodes
// each node holds an x and y position relative to the section containing it


var sections = [
  []
];

var last = performance.now() / 1000;
var fpsThreshold = 0;

var sectionWidth = 100;
var sectionHeight = 100;

var numSectionsX = 6;
var numSectionsY = 6;
var numSections = numSectionsX * numSectionsY;

var wallpaperSettings = {
  numNodes: 200,
  backgroundColor: "#000",
  nodeColor: "#FFF",
  edgeColor: "#FFF",
  fps: 0,
  speed: 1,
  edgeSize: 2.5,
  nodeSize: 3
};

{
  // nodes.forEach(function(a) {
  //   nodes.forEach(function(b) {
  //     a != b && addEdge({
  //       p1: a,
  //       p2: b
  //     })
  //   })
  // })

  // function addEdge(edge) {
  //   let ignoreEdge = false;
  //
  //   edges.forEach(function(e) {
  //     if (e.p1 == edge.p1 && e.p2 == edge.p2) {
  //       ignoreEdge = true;
  //       return;
  //     }
  //
  //     if (e.p1 == edge.p2 && e.p2 == edge.p1) {
  //       ignoreEdge = true;
  //       return;
  //     }
  //   });
  //
  //   if (!ignoreEdge) {
  //     edges.push(edge);
  //   }
  // }

  // // draw edges
  // ctx.strokeStyle = wallpaperSettings.edgeColor;
  // edges.forEach(function(e) {
  //   if (Math.abs(e.p1.x - e.p2.x) > canvas.width / 2 && Math.abs(e.p1.y - e.p2.y) > canvas.height / 2) {
  //     if (e.p1.x < canvas.width / 2 && e.p1.y < canvas.height / 2) {
  //       drawEdge(e.p1.x + canvas.width, e.p1.y + canvas.height, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x - canvas.width, e.p2.y - canvas.height);
  //     } else if (e.p1.x < canvas.width / 2) {
  //       drawEdge(e.p1.x + canvas.width, e.p1.y - canvas.height, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x - canvas.width, e.p2.y + canvas.height);
  //     } else if (e.p1.y < canvas.height / 2) {
  //       drawEdge(e.p1.x - canvas.width, e.p1.y + canvas.height, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x + canvas.width, e.p2.y - canvas.height);
  //     } else {
  //       drawEdge(e.p1.x - canvas.width, e.p1.y - canvas.height, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x + canvas.width, e.p2.y + canvas.height);
  //     }
  //   } else if (Math.abs(e.p1.x - e.p2.x) > canvas.width / 2) {
  //     if (e.p1.x < canvas.width / 2) {
  //       drawEdge(e.p1.x + canvas.width, e.p1.y, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x - canvas.width, e.p2.y);
  //     } else {
  //       drawEdge(e.p1.x - canvas.width, e.p1.y, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x + canvas.width, e.p2.y);
  //     }
  //   } else if (Math.abs(e.p1.y - e.p2.y) > canvas.height / 2) {
  //     if (e.p1.y < canvas.height / 2) {
  //       drawEdge(e.p1.x, e.p1.y + canvas.height, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x, e.p2.y - canvas.height);
  //     } else {
  //       drawEdge(e.p1.x, e.p1.y - canvas.height, e.p2.x, e.p2.y);
  //       drawEdge(e.p1.x, e.p1.y, e.p2.x, e.p2.y + canvas.height);
  //     }
  //   } else {
  //     drawEdge(e.p1.x, e.p1.y, e.p2.x, e.p2.y);
  //   }
  // });
}

function updateNodeSpeed(pSpeed, speed) {
  let m = speed / pSpeed;
  nodes.forEach(function(n) {
    n.vx *= m;
    n.vy *= m;
  })
}

function updateNodeSize(pSize, size) {
  let m = size / pSize;
  nodes.forEach(function(n) {
    n.r *= m;
  })
}

function updateNodeNum(pNum, num) {
  let diff = Math.abs(num - pNum);
  if (diff == 0) {
    return;
  } else if (num > pNum) {
    let i;
    for (i = 0; i < diff; i += 1) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: wallpaperSettings.speed * Math.random() - wallpaperSettings.speed / 2,
        vy: wallpaperSettings.speed * Math.random() - wallpaperSettings.speed / 2,
        r: .9 < Math.random() ? wallpaperSettings.nodeSize + wallpaperSettings.nodeSize * Math.random() : 1 + wallpaperSettings.nodeSize * Math.random()
      });
    }
    nodes.forEach(function(a) {
      nodes.forEach(function(b) {
        a != b && addEdge({
          p1: a,
          p2: b
        })
      })
    })
  } else {
    constructNodes();
  }
}

function constructNodes() {
  sections = [
    []
  ];

  // create nodes
  let i, j, n;
  let numNodes = wallpaperSettings.numNodes;
  for (i = 0; i < numSectionsX; i++) {
    row = [];
    for (j = 0; j < numSectionsY; j++) {
      nodes = [];
      for (n = 0; n < numNodes / numSections; n++) {
        nodes.push({
          x: Math.random() * sectionWidth,
          y: Math.random() * sectionHeight,
          vx: wallpaperSettings.speed * Math.random() - wallpaperSettings.speed / 2,
          vy: wallpaperSettings.speed * Math.random() - wallpaperSettings.speed / 2,
          r: .9 < Math.random() ? wallpaperSettings.nodeSize + wallpaperSettings.nodeSize * Math.random() : 1 + wallpaperSettings.nodeSize * Math.random()
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
  let now = performance.now() / 1000;
  let dt = Math.min(now - last, 1);
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
  nodes.forEach(function(p) {
    p.x += p.vx;
    p.y += p.vy;

    // warp through canvas edges
    if (p.x <= 0 || p.x >= canvas.width) {
      p.x = mod(p.x, canvas.width);
    }

    if (p.y <= 0 || p.y >= canvas.height) {
      p.y = mod(p.y, canvas.height);
    }
  });

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

  if (len > threshold) {
    return;
  }

  ctx.lineWidth = (1.0 - len / threshold) * wallpaperSettings.edgeSize;
  ctx.globalAlpha = 1.0 - len / threshold;
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

  // draw nodes
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = wallpaperSettings.nodeColor;
  let i, j;
  for (i = 0; i < sections.length; i++) {
    rows = sections[i];
    xOffset = sectionWidth * (i - 1);
    for (j = 0; j < rows.length; j++) {
      yOffset = sectionHeight * j - 1;
      rows[j].forEach(function(p) {
        drawNode(p.x + xOffset, p.y + yOffset, p.r);
      });
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
      //updateNodeNum(pNum, wallpaperSettings.numNodes);
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
  sectionWidth = canvas.width / 9;
  sectionHeight = canvas.height / 9;

  window.requestAnimationFrame(step);
}
