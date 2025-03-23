// Modified global variables to allow for different point counts
var width, height, center;
var smooth = true;
var mousePos = view.center;
var targetHeight = view.center.y / 3;
var mouseFactor = 0.3;
var maxHeightFactor = 0.4;
var isDragging = false;
var dragPoints = [];
var hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 30,
};

// Ripple management
var ripples = [];

function createDragPoint(x, y, waveIndex) {
  return {
    x: x,
    y: y,
    strength: 20,
    life: 1,
    waveIndex: waveIndex,
  };
}

var dragStartTime = 0;
var dragStartPos = null;
var dragThreshold = 10; // pixels of movement to consider it a drag
var clickThreshold = 200; // milliseconds to consider it a click

function createRipple(x, y, waveIndex) {
  return {
    x: x,
    y: y,
    radius: 0,
    maxRadius: width * 0.4,
    speed: 15,
    strength: 150, // Increased for more visible effect
    waveIndex: waveIndex,
    life: 1,
  };
}

// Create wave objects using a constructor function
function createWave(
  color,
  amplitudeScale,
  speedScale,
  mouseEffect,
  rippleStrength,
  hoverEffect,
  dragEffect,
  heightOffset,
  xOffset,
  wavePoints,
  frequency,
  amplitude
) {
  var wave = {
    color: color,
    amplitudeScale: amplitudeScale,
    speedScale: speedScale,
    mouseEffect: mouseEffect,
    rippleStrength: rippleStrength,
    hoverEffect: hoverEffect,
    dragEffect: dragEffect,
    heightOffset: heightOffset,
    xOffset: xOffset,
    points: wavePoints, // Individual point count for each wave
    frequency: frequency, // How many cycles the wave completes
    amplitude: amplitude, // Base amplitude modifier
    path: new Path(),
    pathHeight: view.center.y / 3,
    targetHeight: view.center.y / 3,
    phase: Math.random() * 100,
    noiseOffset: Math.random() * 1000,
    isDragging: false,
  };
  wave.path.fillColor = color;
  wave.path.onClick = function (event) {
    ripples.push(
      createRipple(event.point.x, event.point.y, waves.indexOf(wave))
    );
  };
  return wave;
}

// Function to calculate responsive offsets
function calculateResponsiveOffsets() {
  var windowWidth = view.size.width;
  return {
    back: {
      x: -(windowWidth * 0.5), // Approx -689px on 1530px width
      y: -50,
    },
    middle: {
      x: -(windowWidth * 0.33), // Approx -501px on 1530px width
      y: 40,
    },
    front: {
      x: -(windowWidth * 0.22), // Approx -332px on 1530px width
      y: 100,
    },
  };
}

// Create waves with responsive offsets
function initializeWaves() {
  var offsets = calculateResponsiveOffsets();

  return [
    // Back wave - tallest, shifted left, longer wavelength
    createWave(
      "#FFA500", // Solid color
      0.5, // amplitudeScale
      0.8, // speedScale
      0.25, // mouseEffect
      5.2, // rippleStrength
      { horizontal: 0.8, vertical: 0.3 }, // hoverEffect
      0.3, // dragEffect
      offsets.back.y, // heightOffset
      offsets.back.x, // xOffset
      5, // points
      8, // frequency
      0.5 // amplitude
    ),

    // Middle wave
    createWave(
      "#BB00B4",
      0.5,
      1,
      0.3,
      10,
      { horizontal: 0.3, vertical: 0.6 },
      0.2,
      offsets.middle.y,
      offsets.middle.x,
      4,
      5,
      1
    ),

    // Front wave
    createWave(
      "#D0483D",
      0.4,
      0.6,
      0.15,
      10,
      { horizontal: 0.5, vertical: 0.4 },
      0.15,
      offsets.front.y,
      offsets.front.x,
      4,
      7,
      1
    ),
  ];
}

// Replace the original waves array with a function call
var waves = initializeWaves();

// Modify onResize to update offsets
function onResize(event) {
  var offsets = calculateResponsiveOffsets();

  // Update each wave's offsets
  waves[0].xOffset = offsets.back.x;
  waves[1].xOffset = offsets.middle.x;
  waves[2].xOffset = offsets.front.x;

  initializePath();
}
// Modified initialization to include offsets
function initializePath() {
  center = view.center;
  width = view.size.width;
  height = view.size.height / 2;

  for (var j = 0; j < waves.length; j++) {
    var wave = waves[j];
    wave.path.segments = [];
    wave.path.add(
      new Point(view.bounds.left + wave.xOffset, view.bounds.bottom)
    );

    for (var i = 1; i < wave.points; i++) {
      var point = new Point(
        (width / wave.points) * i + wave.xOffset,
        center.y + wave.heightOffset
      );
      wave.path.add(point);
    }

    wave.path.add(
      new Point(view.bounds.right + wave.xOffset, view.bounds.bottom)
    );
  }

  waves[0].path.sendToBack();
  waves[2].path.bringToFront();
}

function calculateDragEffect(x, y, dragPoint, wave) {
  var distance = Math.abs(x - dragPoint.x);
  var dragEffect = 0;

  if (distance < 150) {
    var normalizedDistance = distance / 150;
    dragEffect =
      (1 - normalizedDistance * normalizedDistance) *
      dragPoint.strength *
      dragPoint.life *
      wave.dragEffect;
  }

  return dragEffect;
}

function calculateRippleEffect(x, y, ripple, wave) {
  var distance = Math.sqrt(
    Math.pow(x - ripple.x, 2) + Math.pow(y - ripple.y, 2)
  );
  var rippleEffect = 0;

  if (distance < ripple.radius + 100 && distance > ripple.radius - 100) {
    var normalizedDistance = Math.abs(distance - ripple.radius) / 100;
    rippleEffect =
      Math.cos(normalizedDistance * Math.PI) *
      ripple.strength *
      ripple.life *
      wave.rippleStrength;

    // Add some vertical displacement for more dramatic effect
    rippleEffect *= 1 - Math.abs(normalizedDistance);
  }

  return rippleEffect;
}

function onFrame(event) {
  // Update ripples
  for (var i = ripples.length - 1; i >= 0; i--) {
    var ripple = ripples[i];
    ripple.radius += ripple.speed;
    ripple.life *= 0.97; // Slower fade out
    ripple.strength *= 0.97;

    if (ripple.life < 0.01) {
      ripples.splice(i, 1);
    }
  }

  // Update drag points
  for (var i = dragPoints.length - 1; i >= 0; i--) {
    var dragPoint = dragPoints[i];
    dragPoint.life *= 0.95; // Faster fade out for drag

    if (dragPoint.life < 0.01) {
      dragPoints.splice(i, 1);
    }
  }

  var mouseXFactor = (mousePos.x - center.x) / width;
  var mouseYFactor = Math.max(
    -maxHeightFactor,
    Math.min(maxHeightFactor, (mousePos.y - center.y) / height)
  );

  for (var j = 0; j < waves.length; j++) {
    var wave = waves[j];

    wave.targetHeight =
      (center.y / 3) * (1 + mouseYFactor * 2 * wave.mouseEffect);
    wave.pathHeight += (wave.targetHeight - wave.pathHeight) * 0.2;

    for (var i = 1; i < wave.points; i++) {
      var xPos = (width / wave.points) * i + wave.xOffset;
      var yPos = height + wave.heightOffset;

      // Modified wave pattern calculation
      var sinSeed =
        event.count * wave.speedScale + i * (100 * wave.frequency) + wave.phase;
      var waveHeight =
        Math.sin(sinSeed / 250) *
        wave.pathHeight *
        wave.amplitudeScale *
        wave.amplitude;

      // Secondary wave for more complexity
      var secondaryHeight =
        Math.sin(sinSeed / 400 + wave.phase) *
        wave.pathHeight *
        0.3 *
        wave.amplitude;

      var distanceFromMouse = Math.abs(mousePos.x - xPos) / (width * 0.5);
      var mouseInfluence = Math.max(0, 1 - distanceFromMouse) * mouseFactor;

      var horizontalOffset =
        mouseXFactor * mouseInfluence * 50 * wave.hoverEffect.horizontal;
      var verticalOffset = mouseInfluence * 30 * wave.hoverEffect.vertical;

      var noiseValue =
        Math.sin(event.count * 0.02 + wave.noiseOffset + i * 0.3) *
        5 *
        wave.amplitude;

      var totalDragEffect = 0;
      if (wave.isDragging) {
        for (var d = 0; d < dragPoints.length; d++) {
          if (dragPoints[d].waveIndex === j) {
            totalDragEffect += calculateDragEffect(
              xPos,
              yPos,
              dragPoints[d],
              wave
            );
          }
        }
      }

      yPos +=
        waveHeight +
        secondaryHeight +
        verticalOffset +
        noiseValue -
        totalDragEffect * 0.5;

      wave.path.segments[i].point.x = xPos + horizontalOffset;
      wave.path.segments[i].point.y = yPos;
    }

    if (smooth) {
      wave.path.smooth({ type: "continuous" });
    }
  }
}
function onMouseMove(event) {
  mousePos = {
    x: mousePos.x + (event.point.x - mousePos.x) * 0.2,
    y: mousePos.y + (event.point.y - mousePos.y) * 0.2,
  };

  if (dragStartPos) {
    // Calculate distance moved
    var dragDistance = event.point.subtract(dragStartPos).length;

    // If we've moved past threshold, it's definitely a drag
    if (dragDistance > dragThreshold) {
      isDragging = true;
      // Find which wave is being dragged
      var hitResult = project.hitTest(event.point, hitOptions);
      if (hitResult) {
        for (var i = 0; i < waves.length; i++) {
          if (hitResult.item === waves[i].path) {
            waves[i].isDragging = true;
            dragPoints.push(createDragPoint(event.point.x, event.point.y, i));
          }
        }
      }
    }
  }
}

function onMouseDown(event) {
  dragStartTime = Date.now();
  dragStartPos = event.point;

  // Check which wave is being clicked
  var hitResult = project.hitTest(event.point, hitOptions);
  if (hitResult) {
    for (var i = 0; i < waves.length; i++) {
      waves[i].isDragging = hitResult.item === waves[i].path;
    }
  }
}

function onMouseUp(event) {
  var dragDuration = Date.now() - dragStartTime;
  var dragDistance = dragStartPos
    ? event.point.subtract(dragStartPos).length
    : 0;

  // If it was a short interaction with minimal movement, treat it as a click
  if (dragDuration < clickThreshold && dragDistance < dragThreshold) {
    var hitResult = project.hitTest(dragStartPos, hitOptions);
    if (hitResult) {
      for (var i = 0; i < waves.length; i++) {
        if (hitResult.item === waves[i].path) {
          // Create a more prominent ripple effect
          ripples.push(createRipple(dragStartPos.x, dragStartPos.y, i));
        }
      }
    }
  }

  // Reset all states
  isDragging = false;
  dragStartPos = null;
  dragStartTime = 0;
  waves.forEach(function (wave) {
    wave.isDragging = false;
  });
}
function onResize(event) {
  initializePath();
}

// Initialize all paths
initializePath();
