import * as THREE from 'three';
import { Disc, Throw,huckit } from "./HuckIt.js";
import { createFrisbee,createUltimateField,createGroundPlane } from './ObjectCreation.js';


 // Scene setup
 const scene = new THREE.Scene();
 const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.4, 1000);
 const renderer = new THREE.WebGLRenderer({antialias: true, // Hints browser to prefer discrete GPU (if available)
  precision: 'mediump',    // Lower precision for shaders to reduce GPU load (default is 'highp')
});
 renderer.setSize(window.innerWidth, window.innerHeight);
 document.body.appendChild(renderer.domElement);
 camera.rotation.y += Math.PI/16


// //  Log framerate
// let fpsDisplay = document.createElement('div');
// fpsDisplay.style.position = 'fixed';
// fpsDisplay.style.top = '5px';
// fpsDisplay.style.left = '5px';
// fpsDisplay.style.color = '#0f0';
// fpsDisplay.style.fontSize = '14px';
// fpsDisplay.style.fontFamily = 'monospace';
// fpsDisplay.style.background = 'rgba(0,0,0,0.6)';
// fpsDisplay.style.padding = '2px 6px';
// fpsDisplay.style.zIndex = 1000;
// document.body.appendChild(fpsDisplay);

// let lastFpsUpdate = performance.now();
// let frameCount = 0;
let data = {}
// document.body.appendChild(fpsDisplay);

// STANDARD THROW SETTINGS
let speed = 29.04;
let spin = 40;
let noseAngle = 0;
let throwAngle = 0;
let launchAngle = 5;
let rollAngle = 25;
let spinDir = 1;
let view = "thrower";
let draw = 'yes';
let keepDraw = 'no';

document.getElementById("speed").value = speed;
document.getElementById("spin").value = spin;
document.getElementById("nose_angle").value = noseAngle;
document.getElementById("throw_angle").value = throwAngle;
document.getElementById("launch_angle").value = launchAngle;
document.getElementById("roll_angle").value = rollAngle;
document.getElementById("spin_dir").value = spinDir;
document.getElementById("view").value = view;
document.getElementById("draw").value = draw;
document.getElementById("keep_draw").value = keepDraw;

document.getElementById("speed").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
});

document.getElementById("spin").addEventListener("input", e => {
  spin = parseFloat(e.target.value);
});

document.getElementById("nose_angle").addEventListener("input", e => {
  noseAngle = parseFloat(e.target.value);
});

document.getElementById("throw_angle").addEventListener("input", e => {
  throwAngle = parseFloat(e.target.value);
});

document.getElementById("launch_angle").addEventListener("input", e => {
  launchAngle = parseFloat(e.target.value);
});

document.getElementById("roll_angle").addEventListener("input", e => {
  rollAngle = parseFloat(e.target.value);
});

document.getElementById("spin_dir").addEventListener("input", e => {
  spinDir = parseInt(e.target.value);
});

document.getElementById("view").addEventListener("change", e => {
  view = e.target.value;
});

document.getElementById("draw").addEventListener("change", e => {
  draw = e.target.value;
});

document.getElementById("keep_draw").addEventListener("change", e => {
  keepDraw = e.target.value;
});

// CALLBACKS
document.body.addEventListener('change',() => {
  ThrowFrisbee()
})


// CLICK CONTROLS
let isMouseHeld = false;
let power = 0.1;
let arrowRotation = 0;

const feedbackEl = document.getElementById("click-feedback");
const labelEl = document.getElementById('feedback-label');
const arrowLabel = document.getElementById('arrow-label');

document.addEventListener('wheel', (event) => {
  if (!isMouseHeld) return; // Only rotate arrow when holding mouse (optional)
  
  // event.deltaY is positive for scroll down, negative for scroll up
  arrowRotation += event.deltaY * 0.02; // adjust sensitivity here
  arrowRotation = Math.max(Math.min(arrowRotation, 90), -90); // clamp between -90° and 90°

  arrowLabel.textContent = `${arrowRotation.toFixed(0)}°`;

});

function increaseValue() {
  if (isMouseHeld) {
    power += 0.008; 
    // Do not increment after 1 
    if (power >= 1) { 
    power =1 
    }
    updateVisualFeedback(power);
    requestAnimationFrame(increaseValue);
  }
}
function updateVisualFeedback(value) {
  feedbackEl.style.opacity = 0.75;
  const size = 50 + value * 125; // base size + scaled value
  feedbackEl.style.width = `${size}px`;
  feedbackEl.style.height = `${size}px`;
    // Update label text as percentage, capped at 100%
  const percent = power*100;
  if (Math.round(percent)==100){
      labelEl.textContent = `HUCK!`;
  } else {
    labelEl.textContent = `${Math.round(percent)}%`;
  }
}

document.addEventListener('mousedown', (e) => {
  if (document.getElementById('view').value !== 'thrower') return;
  const tag = e.target.tagName.toLowerCase();
  if (['input', 'select', 'button', 'textarea', 'label'].includes(tag)) return; 

  const maxX = window.innerWidth;
  const maxY = window.innerHeight;

  const deltaX = (e.clientX/maxX -1/2)*90;
  const deltaY = -(e.clientY/maxY -1/2)*30  ;
  throwAngle  = deltaX;
  launchAngle = deltaY;

  feedbackEl.style.left = `${e.clientX}px`;
  feedbackEl.style.top = `${e.clientY}px`;
  isMouseHeld = true;
  requestAnimationFrame(increaseValue);
});


document.addEventListener('mouseup', (e) => {
  if (document.getElementById('view').value !== 'thrower') return;
  const tag = e.target.tagName.toLowerCase();
  if (['input', 'select', 'button', 'textarea', 'label'].includes(tag)) return; // Ignore UI

  document.getElementById("speed").value = power*50
  document.getElementById("spin").value  = power*750/(2*Math.PI)
  document.getElementById("roll_angle").value = arrowRotation
  isMouseHeld = false;
  power = 0.1; // 🔄 Reset value on mouse release
  feedbackEl.style.opacity = 0;
  feedbackEl.style.width = `50px`;
  feedbackEl.style.height = `50px`;
  arrowRotation = 0
  arrowLabel.textContent = `${arrowRotation.toFixed(0)}°`;
  labelEl.textContent = '';
  console.log("Value reset to:", power);
  
  // Change to the right values
  document.getElementById("launch_angle").value = launchAngle
  document.getElementById("throw_angle").value = throwAngle

  ThrowFrisbee()

});

// VISUALISATION OF THE THROW
function CreateLine(points) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const colors = [];
  const colorStart = new THREE.Color(246/255,1,151/255);
  const colorMiddle = new THREE.Color('yellow');
  const colorEnd = new THREE.Color('red');

  const midIndex = Math.floor((points.length - 1) / 2);

  for (let i = 0; i < points.length; i++) {
    let t, color;

    if (i <= midIndex) {
      // Blue to YellowFdo
      t = i / midIndex;
      color = colorStart.clone().lerp(colorMiddle, t);
    } else {
      // Yellow to Red
      t = (i - midIndex) / (points.length - 1 - midIndex);
      color = colorMiddle.clone().lerp(colorEnd, t);
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({ vertexColors: true });

  const flightline = new THREE.Line(geometry, material);
  flightline.name = 'current_flight_line';
  return flightline
}

function ThrowFrisbee() {

  scene.children
  .filter(child => child.name === 'current_flight_line')
  .forEach(child => { child.name = 'previous_flight_line';
    child.geometry.drawRange.count = data.position.length;
  })
  if (keepDraw == "no") {
  scene.children
  .filter(child => child.name === 'previous_flight_line')
  .forEach(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
    scene.remove(child);
  });


  }
  const frisbee_disc = new Disc("Frisbee")
  frisbee_disc.diam = 0.275
  frisbee_disc.jxy = 7.69e-3
  frisbee_disc.jz = 1.01e-2
  frisbee_disc.mass = 0.175
  frisbee_disc.aoarange = [-1.745329252,-1.658062789,-1.570796327,-1.483529864,-1.396263402,-1.308996939,-1.221730476,-1.134464014,-1.047197551,-0.959931089,-0.174532925,-0.157079633,-0.13962634,-0.122173048,-0.104719755,-0.087266463,-0.06981317,-0.052359878,-0.034906585,-0.017453293,0,0.017453293,0.034906585,0.052359878,0.06981317,0.087266463,0.104719755,0.122173048,0.13962634,0.157079633,0.174532925,0.191986218,0.20943951,0.226892803,0.244346095,0.261799388,0.27925268,0.296705973,0.314159265,0.331612558,0.34906585,0.366519143,0.383972435,0.401425728,0.41887902,0.436332313,0.453785606,0.471238898,0.488692191,0.506145483,0.523598776,0.541052068,0.558505361,0.575958653,0.593411946,0.610865238,0.628318531,0.645771823,0.663225116,0.680678408,0.698131701,0.715584993,0.733038286,0.750491578,0.767944871,0.785398163,0.802851456,0.820304748,0.837758041,0.855211333,0.872664626,0.959931089,1.047197551,1.134464014,1.221730476,1.308996939,1.396263402,1.483529864,1.570796327,1.658062789,1.745329252];
  frisbee_disc.cl = [0.15942029,0.096618357,0.009661836,-0.077294686,-0.144927536,-0.217391304,-0.299516908,-0.357487923,-0.434782609,-0.492753623,-0.234509466,-0.204388985,-0.148450947,-0.126936317,-0.096815835,-0.083907057,-0.058089501,-0.027969019,0.023666093,0.075301205,0.118330465,0.182874355,0.238812392,0.303356282,0.376506024,0.432444062,0.496987952,0.55292599,0.613166954,0.673407917,0.729345955,0.776678141,0.836919105,0.875645439,0.922977625,0.983218589,1.021944923,1.07788296,1.129518072,1.172547332,1.219879518,1.275817556,1.318846816,1.396299484,1.44363167,1.486660929,1.512478485,1.589931153,1.620051635,1.667383821,1.688898451,1.710413081,1.740533563,1.762048193,1.813683305,1.850258176,1.886833046,1.929862306,1.972891566,2.007314974,2.063253012,2.093373494,2.106282272,2.136402754,2.151462995,2.149311532,1.146729776,1.133820998,1.133820998,1.09939759,1.082185886,1.019323671,0.8647343,0.724637681,0.589371981,0.45410628,0.299516908,0.140096618,0.004830918,-0.140096618,-0.280193237];
  frisbee_disc.cd = [0.81906226,0.843658724,0.848578017,0.828900846,0.811683321,0.806764028,0.789546503,0.760030746,0.748962337,0.710837817,0.162962963,0.145679012,0.12345679,0.10617284,0.10617284,0.096296296,0.088888889,0.088888889,0.086419753,0.088888889,0.09382716,0.101234568,0.113580247,0.125925926,0.133333333,0.151851852,0.166666667,0.190123457,0.216049383,0.239506173,0.264197531,0.286419753,0.309876543,0.341975309,0.367901235,0.397530864,0.427160494,0.459259259,0.498765432,0.530864198,0.572839506,0.602469136,0.641975309,0.681481481,0.72345679,0.754320988,0.787654321,0.832098765,0.864197531,0.90617284,0.920987654,0.95308642,0.975308642,1.002469136,1.032098765,1.071604938,1.103703704,1.135802469,1.182716049,1.232098765,1.295061728,1.340740741,1.380246914,1.437037037,1.491358025,1.530864198,1.009876543,1.017283951,1.039506173,1.04691358,1.064197531,1.097002306,1.146195234,1.185549577,1.212605688,1.247040738,1.269177556,1.269177556,1.29377402,1.286395081,1.276556495];
  frisbee_disc.cm = [0.031216649,0.013607257,0.000266809,-0.01547492,-0.031216649,-0.046691569,-0.060565635,-0.073372465,-0.085645678,-0.095517609,-0.038247863,-0.036538462,-0.030982906,-0.027564103,-0.023504274,-0.021581197,-0.017307692,-0.014102564,-0.010042735,-0.008333333,-0.006837607,-0.008119658,-0.00982906,-0.006837607,-0.006623932,-0.004059829,-0.002350427,-0.001068376,-0.001068376,0.000641026,0.003205128,0.007478632,0.010683761,0.013461538,0.016452991,0.021153846,0.025854701,0.031410256,0.034401709,0.04017094,0.043376068,0.048931624,0.053632479,0.061111111,0.068589744,0.07542735,0.083119658,0.088888889,0.096367521,0.103846154,0.111324786,0.115811966,0.125854701,0.137820513,0.144017094,0.152564103,0.160042735,0.171794872,0.180769231,0.18974359,0.2,0.208760684,0.216239316,0.223931624,0.227991453,0.22542735,0.019871795,0.018376068,0.018162393,0.018162393,0.016452991,0.016275347,0.017609392,0.021611526,0.021611526,0.020010672,0.015741729,0.008271078,0.002401281,-0.007203842,-0.011472785];
  const throwObj = new Throw('throw 1')
  throwObj.speed = parseInt(document.getElementById("speed").value)
  throwObj.spin = parseInt(document.getElementById("spin").value)*2*Math.PI
  throwObj.spindir = parseInt(document.getElementById("spin_dir").value)
  throwObj.launch_angle = parseInt(document.getElementById("launch_angle").value)
  throwObj.nose_angle = parseInt(document.getElementById("nose_angle").value)
  throwObj.roll_angle = parseInt(document.getElementById("roll_angle").value)

  const new_throw = huckit(frisbee_disc, throwObj)
  // Set flight path
  data.position = new_throw.pos_g
  data.orientation = new_throw.ori_g

  // Rotate flight path based on the throwing angle
  const matrix = rotationMatrixXY((parseInt(throwAngle)/180)*Math.PI);
  data.position = data.position.map(p => applyMatrixToPoint(matrix, p));

  data.orientation = data.orientation.map(p => applyMatrixToPoint(matrix, p));

  if (draw == 'yes'){
    const flightline = CreateLine(data.position.map((v,i) => new THREE.Vector3(v[0],v[2],v[1])))
    scene.add(flightline)
  }
}


// Lighting

const sunLight = new THREE.DirectionalLight(0xffffff, 1); // bright white light
const elevation = 60; // degrees above horizon
const azimuth = 180;  // degrees around horizon

const phi = THREE.MathUtils.degToRad(90 - elevation);
const theta = THREE.MathUtils.degToRad(azimuth);

sunLight.position.setFromSphericalCoords(1, phi, theta);

scene.add(sunLight);


// Add some fog to the scene
scene.fog = new THREE.Fog(0xbbdcf0, 0, 1000); // (color, near, far)
renderer.setClearColor(scene.fog.color); // match background to fog

// Ambient lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Ground plane
const ground = createGroundPlane()
scene.add(ground);

//  Ultimate field
const backlineDistance = 14
const field = createUltimateField(backlineDistance)
scene.add(field);



// CREATING THE FRISBEE OBJECT
const { frisbeeGroup, frisbee,updateLogoTexture } = createFrisbee('./textures/disc design led 2024 purple 2.jpg');
scene.add(frisbeeGroup);

// Handle file input
const input = document.getElementById('textureInput');
input.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const loader = new THREE.TextureLoader();
    loader.load(e.target.result, function (texture) {
      updateLogoTexture(texture);
    });
  };
  reader.readAsDataURL(file);
});


// renderer.shadowMap.enabled = true;
frisbeeGroup.traverse(obj => {
  if (obj.isMesh) {
    // obj.castShadow = true;
    obj.receiveShadow = true;
  }
});



// Animate 
ThrowFrisbee()

// Start positions
frisbeeGroup.position.x = data.position[0][0] 
frisbeeGroup.position.y = data.position[0][2]
frisbeeGroup.position.z = data.position[0][1]

frisbeeGroup.rotation.x = data.orientation[0][0]
frisbeeGroup.rotation.y = data.orientation[0][2]
frisbeeGroup.rotation.z = data.orientation[0][1]

var camera_position = 'thrower'
document.getElementById('view').addEventListener('change', () => {
  camera_position = document.getElementById('view').value
})

const dummyTarget = new THREE.Object3D();
scene.add(dummyTarget);
let start;

document.body.addEventListener('change',() => {start = performance.now()})
document.body.addEventListener('mouseup',(e) => {
  if (document.getElementById('view').value !== 'thrower') return;
  const tag = e.target.tagName.toLowerCase();
  if (['input', 'select', 'button', 'textarea', 'label'].includes(tag)) return; // Ignore UI
  start = performance.now();
}
)

// Starting camera position
camera.position.z = 0;
camera.rotation.set(0, -Math.PI/2,0)
camera.position.x = -1.5
camera.position.y = 1.7
let lastCameraPosition = 'thrower'

// Interp the position to flat from last step
let targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));


function animate(timestamp) {
  requestAnimationFrame(animate);
  // frameCount++;
  // const now = performance.now();

  // if (now - lastFpsUpdate >= 1000) { // 1 second has passed
  //   const fps = frameCount;
  //   fpsDisplay.textContent = `FPS: ${fps}`;
  //   frameCount = 0;
  //   lastFpsUpdate = now;
  // }

  if ((start === undefined) || (timestamp === undefined)) {
    start = timestamp;
    return
  }
  const elapsed = (timestamp - start)/10;
  const step = Math.round(elapsed);
  
  if (isMouseHeld) {
    frisbeeGroup.position.x = data.position[0][0]
    frisbeeGroup.position.y = data.position[0][2]
    frisbeeGroup.position.z = data.position[0][1]
    let rotation = [(arrowRotation/360)*(2*Math.PI), ((launchAngle)/180)*Math.PI+(parseInt(noseAngle)/180)*Math.PI,0]
    const matrix = rotationMatrixXY((parseInt(throwAngle)/180)*Math.PI);
    rotation = applyMatrixToPoint(matrix, rotation);

    frisbeeGroup.rotation.x = rotation[0]
    frisbeeGroup.rotation.y = rotation[2]
    frisbeeGroup.rotation.z = rotation[1]
    for (let child of scene.children) {
    if (child.name == 'current_flight_line') {
      if (keepDraw == "no") {
        child.geometry.drawRange.count = 0
      } else{
        child.geometry.drawRange.count = data.position.length
      }
    }
  }
  } else {
  // Wait for 150 steps until rethrow

  if (step> data.orientation.length+150){
    start = timestamp
  } else {
    if (step> data.orientation.length) {
      // Smoothly slerp the current quaternion toward the target
      frisbeeGroup.quaternion.slerp(targetQuaternion, 0.5); // 0.05 = smoothing factor
      frisbeeGroup.position.y = 0

    } else{
        if (step < 0 || step >= data.orientation.length) return;        
        frisbeeGroup.rotation.x = data.orientation[step][0]
        frisbeeGroup.rotation.y = data.orientation[step][2]
        frisbeeGroup.rotation.z = data.orientation[step][1]

        frisbeeGroup.position.x = data.position[step][0] 
        frisbeeGroup.position.y = data.position[step][2] 
        frisbeeGroup.position.z = data.position[step][1]
        if (spinDir == "1") {
          // Rotate counter-clockwise
          frisbee.rotation.y -= Math.PI/16
        } else {
          // Rotate clockwise
          frisbee.rotation.y += Math.PI/16

        }

    }
  }
  for (let child of scene.children) {
    if (child.name == 'current_flight_line') {
      child.geometry.drawRange.count = step
    
    }
  }
  } 
  // Set draw range of line until the position of the frisbee

  // MOVING CAMERA
  if (camera_position == "disc") {
      lastCameraPosition = 'disc'

      if (step> data.orientation.length) {
        camera.position.y = 0.5
        camera.position.x = data.position[data.position.length-1][0] -1

        camera.rotation.x = frisbeeGroup.rotation.x
        // Make the camera look at the dummy target
        camera.lookAt(frisbeeGroup.position);


      } else{
        camera.position.x = data.position[step][0] -5
        camera.position.y = data.position[step][2] +0.2
        camera.position.z = data.position[step][1]  

        camera.rotation.y = -Math.PI/2
        camera.rotation.z = 0
        camera.rotation.x = data.orientation[step][0]
      
      }
  }
  // STATIC CAMERA POSTIONS
  if (camera_position !== lastCameraPosition) {
    console.log("CAMERA CHANGE!")

  

    // CAMERA POSITIONS BASED ON VIEW
    if (camera_position == "thrower") {
      camera.position.z = 0;
      camera.rotation.set(0, -Math.PI/2,0)
      camera.position.x = -1.5
      camera.position.y = 1.7
      lastCameraPosition = 'thrower'

    }
    
    if (camera_position == "across") {
      camera.position.z = 0;
      camera.rotation.set(0, Math.PI/2,0)
      camera.position.x = 90
      camera.position.y = 1.7
      lastCameraPosition = 'across'

    }
    
    if (camera_position == "above") {
      camera.position.set(55-backlineDistance,80, 0); // 
      camera.lookAt(55 -backlineDistance, 0, 0);
      lastCameraPosition = 'above'

      }
    if (camera_position == "side_left"){
      camera.position.set(55-backlineDistance,10, -50); // 
      camera.lookAt(55-backlineDistance, 0, 0);
      lastCameraPosition = 'side_left'

    }
    
    if (camera_position == "side_right"){
      camera.position.set(55-backlineDistance,10, 50); // 
      camera.lookAt(55-backlineDistance, 0, 0);
      lastCameraPosition = 'side_right'
    }

    
    // if (camera_position == "side_left"){
    //   camera.position.set(-10,2, -15); // 
    //   camera.lookAt(80, 0, 0);
    //   lastCameraPosition = 'side_left'

    // }
    
    // if (camera_position == "side_right"){
    //   camera.position.set(-10,2, 15); // 
    //   camera.lookAt(80, 0, 0);
    //   lastCameraPosition = 'side_right'
    // }
    
  }
  renderer.render(scene, camera);
}
animate()

 window.addEventListener('resize', () => {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(window.innerWidth, window.innerHeight);
 });




 function rotationMatrixXY(angleRadians) {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return [
    [ cos, -sin, 0, 0 ],
    [ sin,  cos, 0, 0 ],
    [   0,    0, 1, 0 ],
    [   0,    0, 0, 1 ]
  ];
}



function applyMatrixToPoint(matrix, point) {
  const [x, y, z] = point;
  const vec = [x, y, z, 1]; // Homogeneous coordinates
  const result = [];

  for (let row = 0; row < 4; row++) {
    let value = 0;
    for (let col = 0; col < 4; col++) {
      value += matrix[row][col] * vec[col];
    }
    result.push(value);
  }

  return result.slice(0, 3); // Return x, y, z
}

