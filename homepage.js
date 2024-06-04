var width, height, center;
var points = 6;
var smooth = false;
var path = new Path();
var mousePos = view.center / 3;
var pathHeight = mousePos.y;
path.fillColor = "blue";
initializePath();

function initializePath() {
  center = view.center;
  width = view.size.width;
  height = view.size.height / 2;
  path.segments = [];
  path.add(view.bounds.bottomLeft);
  for (var i = 1; i < points; i++) {
    var point = new Point((width / points) * i, center.y);
    path.add(point);
  }
  path.add(view.bounds.bottomRight);
}

function onFrame(event) {
  pathHeight += (center.y - mousePos.y - pathHeight) / 5000;
  for (var i = 1; i < points; i++) {
    var sinSeed = event.count + (i + (i % 90)) * 100;
    var sinHeight = Math.sin(sinSeed / 500) * pathHeight;
    var yPos = Math.sin(sinSeed / 800) * sinHeight + height;
    path.segments[i].point.y = yPos;
  }
  if (smooth) path.smooth({ type: "continuous" });
}

function onMouseMove(event) {
  mousePos = event.point;
}

function onMouseDown(event) {
  smooth = !smooth;
  if (!smooth) {
    // If smooth has been turned off, we need to reset
    // the handles of the path:
    for (var i = 0, l = path.segments.length; i < l; i++) {
      var segment = path.segments[i];
      segment.handleIn = segment.handleOut = null;
    }
  }
}

// Reposition the path whenever the window is resized:
function onResize(event) {
  initializePath();
}
