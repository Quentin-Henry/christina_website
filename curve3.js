var width, height, center;
var points = 6;
var smooth = true;
var path = new Path();
var mousePos = view.center / 3;
var pathHeight = mousePos.y;
path.fillColor = "#FFA500";
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
    var sinHeight = Math.sin(sinSeed / 190) * pathHeight;
    var yPos = Math.sin(sinSeed / 800) * sinHeight + height;
    path.segments[i].point.y = yPos;
  }
  if (smooth) path.smooth({ type: "continuous" });
}

function onMouseMove(event) {
  mousePos = event.point;
}

function onResize(event) {
  initializePath();
}
