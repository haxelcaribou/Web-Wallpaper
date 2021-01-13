const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// TODO:
// fix the horror that is drawing edges
// prevent multiple instances of constructNodes running at once
// general speed improvements

var nodes = [];
var edges = [];

var last = performance.now() / 1000;
var fpsThreshold = 0;

var threshold = 100;

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


function constructNodes() {
  // create nodes
  var i;
  var numNodes = wallpaperSettings.numNodes;
  for (i = 0; i < numNodes; i += 1) {
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

}

function addEdge(edge) {
  let ignoreEdge = false;

  edges.forEach(function(e) {
    if (e.p1 == edge.p1 && e.p2 == edge.p2) {
      ignoreEdge = true;
      return;
    }

    if (e.p1 == edge.p2 && e.p2 == edge.p1) {
      ignoreEdge = true;
      return;
    }
  });

  if (!ignoreEdge) {
    edges.push(edge);
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

  // draw edges
  ctx.strokeStyle = wallpaperSettings.edgeColor;
  edges.forEach(function(e) {
    if (Math.abs(e.p1.x - e.p2.x) > canvas.width / 2 && Math.abs(e.p1.y - e.p2.y) > canvas.height / 2) {
      if (e.p1.x < canvas.width / 2 && e.p1.y < canvas.height / 2) {
        drawEdge(e.p1.x + canvas.width, e.p1.y + canvas.height, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x - canvas.width, e.p2.y - canvas.height);
      } else if (e.p1.x < canvas.width / 2) {
        drawEdge(e.p1.x + canvas.width, e.p1.y - canvas.height, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x - canvas.width, e.p2.y + canvas.height);
      } else if (e.p1.y < canvas.height / 2) {
        drawEdge(e.p1.x - canvas.width, e.p1.y + canvas.height, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x + canvas.width, e.p2.y - canvas.height);
      } else {
        drawEdge(e.p1.x - canvas.width, e.p1.y - canvas.height, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x + canvas.width, e.p2.y + canvas.height);
      }
    } else if (Math.abs(e.p1.x - e.p2.x) > canvas.width / 2) {
      if (e.p1.x < canvas.width / 2) {
        drawEdge(e.p1.x + canvas.width, e.p1.y, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x - canvas.width, e.p2.y);
      } else {
        drawEdge(e.p1.x - canvas.width, e.p1.y, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x + canvas.width, e.p2.y);
      }
    } else if (Math.abs(e.p1.y - e.p2.y) > canvas.height / 2) {
      if (e.p1.y < canvas.height / 2) {
        drawEdge(e.p1.x, e.p1.y + canvas.height, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x, e.p2.y - canvas.height);
      } else {
        drawEdge(e.p1.x, e.p1.y - canvas.height, e.p2.x, e.p2.y);
        drawEdge(e.p1.x, e.p1.y, e.p2.x, e.p2.y + canvas.height);
      }
    } else {
      drawEdge(e.p1.x, e.p1.y, e.p2.x, e.p2.y);
    }
  });

  // draw nodes
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = wallpaperSettings.nodeColor;
  nodes.forEach(function(p) {
    if (p.x < p.r) {
      drawNode(p.x + canvas.width, p.y, p.r);
    } else if (p.x + p.r > canvas.width) {
      drawNode(p.x - canvas.width, p.y, p.r);
    }
    if (p.y < p.r) {
      drawNode(p.x, p.y + canvas.height, p.r);
    } else if (p.y + p.r > canvas.height) {
      drawNode(p.x, p.y - canvas.height, p.r);
    }
    drawNode(p.x, p.y, p.r);
  });
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
      wallpaperSettings.numNodes = properties.numnodes.value;
      nodes = [];
      edges = [];
      constructNodes();
    }
    if (properties.speed) {
      wallpaperSettings.speed = properties.speed.value;
    }
    if (properties.edgesize) {
      wallpaperSettings.edgeSize = properties.edgesize.value;
    }
    if (properties.nodesize) {
      wallpaperSettings.nodeSize = properties.nodesize.value;
    }
  },
};

window.onload = function() {
  canvas.width = document.body.clientWidth;
  canvas.height = canvas.clientHeight;
  threshold = canvas.width / 8;

  window.requestAnimationFrame(step);
}
