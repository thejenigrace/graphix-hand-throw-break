// Constants
// =============================================================================
var BALL_RADIUS = 4;
var GRAVITY = 160;
var ITEM_MASS = 100;
var ITEM_VELOCITY = 200;
var SKY_COLOR = 0x77ccff;
var SHOOT_DELAY = 1000;
var TARGET_DISTANCE = 170;
var WALL_SIZE = 10;
var WALL_WIDTH = 200;
var WALL_HEIGHT = 80;
var WALL_MASS = 0;
var WRIST_LENGTH = 6;
var COLORS = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF, 0x000000, 0x9900FF, 0xFF6600];

// Globals
// =============================================================================
var camera, scene, renderer;
var mousePosition = {x: 0.5, y: 0.5};
var hand, handDirection = new THREE.Vector3(), lastShotTime;
var gameStarted;
var numberItemsFired = totalItemsFired = totalTargets = 0;

var woodTexture, grassTexture, brickTexture;
var targetWallGeometry, targetWallMaterial;
var ballGeometry, ballMaterial, capsuleGeometry, capsuleMaterial, torusGeometry, torusMaterial;
var boomSound, blagSound;

var itemIsBall, itemIsCapsule, itemIsTorus, itemColorIndex;

//////////////settings/////////
var movementSpeed = 80;
var totalObjects = 500;
var objectSize = 10;
var sizeRandomness = 4000;

/////////////////////////////////
var dirs = [];
var parts = [];

// Helper functions
// =============================================================================
function interpolate(low, high, interpolationFactor) {
    return low + (high - low) * interpolationFactor;
}

// Returns the number of seconds that have passed since the given time.
function secondsSince(time) {
    return (window.performance.now() - time) / 1000;
}

// Remove objects that satisfy the given condition from the scene.
function removeObjects(condition) {
    var objectsToRemove = scene.children.filter(condition);
    objectsToRemove.forEach(function (object) {
        scene.remove(object);
    });
}

// Creates multiple copies of the given audio and plays the copies in a round
// robin loop, so that the same audio can be played multiple times simultaneously.
function AudioPool(url, volume, numCopies) {
    this.pool = [];
    this.poolIndex = 0;
    this.poolSize = numCopies;

    for (var i = 0; i < numCopies; i++) {
        var audio = new Audio(url);
        audio.volume = volume;
        audio.preload = 'auto';

        this.pool.push(audio);
    }
}

AudioPool.prototype.play = function () {
    // Play next audio element in pool.
    this.pool[this.poolIndex].play();
    this.poolIndex = (this.poolIndex + 1) % this.poolSize;
}

// Game functions
// =============================================================================
function addGround() {
    var groundGeometry = new THREE.BoxGeometry(400, 400, 50);
    groundGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    var groundMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({map: grassTexture}),
        .4, // high friction
        .3 // low restitution
    );
    groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
    groundMaterial.map.repeat.set(25, 25);

    var ground = new Physijs.BoxMesh(
        groundGeometry,
        groundMaterial,
        0 // mass
    );
    ground.receiveShadow = true;
    ground.name = 'ground';

    scene.add(ground);
}

function addDesign() {
    var max = 150;
    var min = -150;
    for(var i = 0; i < 20; i++) {
        var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
        var boxMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({map: woodTexture}), .95, .95);
        var box = new Physijs.BoxMesh(boxGeometry, boxMaterial, 0);
        box.name = 'box';
        box.position.x = Math.round(Math.random() * (max - min + 1)) + min;
        box.position.y = 30;
        box.position.z = Math.round(Math.random() * 100);
        box.removeBeforeLevel = true;
        box.receiveShadow = true;
        box.castShadow = true;
        scene.add(box);
    }
}

function addHand() {
    // Add hand
    hand = new THREE.Object3D();

    // Add cylinder wrist
    var cylinderGeometry = new THREE.CylinderGeometry(2, 3, WRIST_LENGTH, 16);
    var cylinderMaterial = new THREE.MeshPhongMaterial({color: 0xffcc99});
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.castShadow = true;

    hand.add(cylinder);

    // Add box hand
    var box = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshPhongMaterial({color: 0xffcc99}));
    box.position.y = WRIST_LENGTH;
    box.castShadow = true;

    hand.add(box);

    //var loader = new THREE.ColladaLoader();
    //loader.options.convertUpAxis = true;
    //loader.load( '/model/collada/hand.dae', function ( collada ) {
    //    var hand = collada.scene;
    //    hand.scale.x = hand.scale.y = hand.scale.z = 10;
    //    hand.rotateZ(5);
    //    hand.position.z = 0;
    //    hand.updateMatrix();
    //
    //    hand.add(hand);
    //});

    // Position hand
    hand.rotation.x = Math.PI / 4;
    hand.position.y = 2;
    hand.position.z = -5;
    hand.castShadow = true;

    scene.add(hand);
}

// Target configuration is an array containing strings that specify how the
// target blocks should be stacked. Each hexadecimal Rdigit in the string
// specifies the number of blocks that should be stacked at that location.
function addTarget() {
    // Give the wall a mass of 0 so that it is immovable and won't fall due to gravity.
    var wall = new Physijs.BoxMesh(targetWallGeometry, targetWallMaterial, WALL_MASS);
    wall.name = 'wall';
    wall.position.z = TARGET_DISTANCE;
    wall.position.y = WALL_HEIGHT / 2;
    wall.removeBeforeLevel = true;
    wall.receiveShadow = true;

    scene.add(wall);
}

function unfreezeTargets() {
    var one = new THREE.Vector3(1, 1, 1);

    scene.children.forEach(function (object) {
        if (object.isTarget === true) {
            object.setAngularFactor(one);
            object.setLinearFactor(one);
        }
    });
}

var handleCollision = function (collided_with, linearVelocity, angularVelocity) {
    console.log('COLLISION DETECTED!');
    console.log('X = ' + this.position.x);
    console.log('Y = ' + this.position.y);
    console.log('Z = ' + this.position.z);

    console.log('COLLIDED WITH: ' + collided_with.name);

    var ground = 'ground';
    var wall = 'wall';
    var box = 'box';

    if(0 === ground.localeCompare(collided_with.name) || 0 === box.localeCompare(collided_with.name)) {
        blagSound.play();
        console.log('BLAG!');
    } else if(0 === wall.localeCompare(collided_with.name)) {
        boomSound.play();
        console.log('BOOM!');
        scene.remove(this);
        parts.push(new explodeAnimation(this.position.x, this.position.y));
    }
};

function createItem() {
    itemColorIndex = Math.round(Math.random() * COLORS.length);
    if(itemIsBall === true) {
        ballMaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial( {color: COLORS[itemColorIndex]} ));
        var ball = new Physijs.SphereMesh(ballGeometry, ballMaterial, ITEM_MASS);
        ball.castShadow = true;
        ball.removeIfFallen = true;
        ball.addEventListener('collision', handleCollision);
        return ball;
    } else if(itemIsCapsule === true) {
        capsuleMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial( {color: COLORS[itemColorIndex]} ));
        var capsule = new Physijs.CapsuleMesh(capsuleGeometry, capsuleMaterial, ITEM_MASS);
        capsule.castShadow = true;
        capsule.removeIfFallen = true;
        capsule.addEventListener('collision', handleCollision);
        return capsule;
    } else if(itemIsTorus === true) {
        torusMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial( {color: COLORS[itemColorIndex]} ));
        var torus = new Physijs.ConvexMesh(torusGeometry, torusMaterial, ITEM_MASS);
        torus.castShadow = true;
        torus.removeIfFallen = true;
        torus.addEventListener('collision', handleCollision);
        return torus;
    }
}

function throwItem() {
    unfreezeTargets();

    var item = createItem();
    item.position.copy(hand.position);

    scene.add(item);

    // Apply the rotation of the cannon to the velocity vector of the
    // cannonball so that cannonball shoots in same direction that cannon is facing.
    item.setLinearVelocity(handDirection.clone().multiplyScalar(ITEM_VELOCITY));

    numberItemsFired += 1;
}


function loadResources() {
    // Load textures
    var loader = new THREE.TextureLoader();

    woodTexture = loader.load('/resources/image/plywood.jpg');
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(3, 3);

    grassTexture = loader.load('/resources/image/grass-light.jpg');
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(25, 25);

    brickTexture = loader.load('/resources/image/brick.jpg');
    brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
    brickTexture.repeat.set(2, 2);

    // Item Ball
    ballGeometry = new THREE.SphereGeometry( BALL_RADIUS );

    // Item Capsule
    capsuleGeometry = new THREE.Geometry();
    var body = new THREE.CylinderGeometry( 2, 2, 6 );
    var top = new THREE.SphereGeometry( 2 );
    var bottom = new THREE.SphereGeometry( 2 );

    var matrix = new THREE.Matrix4();
    matrix.makeTranslation(0, 3, 0);
    top.applyMatrix(matrix);

    var matrix = new THREE.Matrix4();
    matrix.makeTranslation(0, -3, 0);
    bottom.applyMatrix(matrix);

    capsuleGeometry.merge(top);
    capsuleGeometry.merge(bottom);
    capsuleGeometry.merge(body);

    // Item Torus
    torusGeometry = new THREE.TorusGeometry( 5, 3, 16, 100 );

    // Wall
    targetWallGeometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_SIZE);
    targetWallMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({map: brickTexture}), .95, .95);

    // Load sounds
    boomSound = new AudioPool('/resources/audio/boom.mp3', 0.5, 3);
    blagSound = new AudioPool('/resources/audio/blag.mp3', 0.5, 3);
}

function initScene() {
    // Initialize scene
    scene = new Physijs.Scene();
    scene.fog = new THREE.Fog(SKY_COLOR, 1, 1000);
    scene.setGravity(new THREE.Vector3(0, -GRAVITY, 0));
    // Set up infinite physics simulation loop.
    scene.addEventListener('update', function () {
        scene.simulate();
    });

    // Initialize lighting
    var light = new THREE.DirectionalLight('white', 1.3);
    light.position.set(50, 100, -50);
    light.castShadow = true;
    light.shadowCameraLeft = light.shadowCameraBottom = -200;
    light.shadowCameraRight = light.shadowCameraTop = 200;
    light.shadowMapWidth = light.shadowMapHeight = 1024;
    scene.add(light);

    // Initialize camera
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Initialize added of scene
    addGround();
    addHand();
    addDesign();
}

function initEvents() {
    // Add event listeners
    document.addEventListener('mousemove', function (event) {
        mousePosition.x = event.pageX / window.innerWidth;
        mousePosition.y = event.pageY / window.innerHeight;
    });

    // Allow user to shoot one cannonball per second by clicking mouse.
    lastShotTime = -SHOOT_DELAY;
    renderer.domElement.addEventListener('mousedown', function (event) {
        if (window.performance.now() - lastShotTime > SHOOT_DELAY) {
            throwItem();
            lastShotTime = window.performance.now();
        }
    });

    // Close dialogs when confirm button clicked.
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('dialog-confirm-button')) {
            event.target.parentNode.style.display = 'none';
        }
    });

    // Start when user presses start game button
    gameStarted = false;
    document.getElementById('start-game-button').addEventListener('click', function () {
        gameStarted = true;
        //levelIndex = -1;
        startGame();
    });

    itemIsBall = true;
    itemIsCapsule = itemIsTorus = false;
    document.getElementById('item-ball-button').addEventListener('click', function () {
        itemIsBall = true;
        itemIsCapsule = itemIsTorus = false;
    });
    document.getElementById('item-capsule-button').addEventListener('click', function () {
        itemIsCapsule = true;
        itemIsBall = itemIsTorus = false;
    });
    document.getElementById('item-torus-button').addEventListener('click', function () {
        itemIsTorus = true;
        itemIsBall = itemIsCapsule = false;
    });

    document.getElementById('help-button').addEventListener('click', function () {
        document.getElementById('game-help-dialog').style.display = 'block';
    });
}

function init(containerElement) {
    loadResources();

    // Initialize renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(SKY_COLOR, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerElement.appendChild(renderer.domElement);

    initScene();

    initEvents();

    // Show instructions dialog when game starts.
    document.getElementById('game-start-dialog').style.display = 'block';

    // Start physics loop and render loop.
    scene.simulate();
    render();
}

function startGame() {
    addTarget();
}

function updateHand() {
    // Rotate hand with mouse movement.
    hand.rotation.z = interpolate( -Math.PI / 4, Math.PI / 4, mousePosition.x );
    //cannon.rotation.x = interpolate(Math.PI / 8, Math.PI / 2 - 0.1, mousePosition.y);
    hand.rotation.x = interpolate( Math.PI / 8, Math.PI / 2, mousePosition.y );
    handDirection.set( 0, 1, 0 );
    handDirection.applyQuaternion( hand.quaternion );

    // Apply recoil to hand.
    var recoilLength = SHOOT_DELAY;
    var t = ( window.performance.now() - lastShotTime ) / recoilLength;
    // At the beginning of the recoil, quickly increase the hand's distance from it's initial position.
    var recoilAmount;
    if (t <= 0.1)
        recoilAmount = interpolate( 0, 5, t / 0.1 );
    // Then, slowly move the hand back to its initial position.
    else
        recoilAmount = interpolate( 5, 0, (t - 0.1) / 0.9 );
    recoilAmount = Math.max( recoilAmount, 0 );
    var recoil = handDirection.clone().multiplyScalar( -recoilAmount );
    recoil.y = 0;
    hand.position.set(0, WALL_HEIGHT + 2, -5).add( recoil );

    // Position camera so that it is always behind hand
    var offset = handDirection.clone().multiplyScalar(-20);
    camera.position.copy( hand.position.clone().add(offset) );
    camera.position.y = hand.position.y + 10;

    // Make camera look at where hand is aiming.
    camera.lookAt( hand.position.clone().add(handDirection.clone().multiplyScalar( 30 )) );
}

function removeFallenObjects() {
    // Remove objects that fall below ocean plane.
    removeObjects(function ( object ) {
        // Could calculate bounding box, but simpler to just make sure the object has fallen far below sea.
        return object.removeIfFallen === true && object.position.y < -100;
    });
}

function explodeAnimation(x, y) {
    var geometry = new THREE.Geometry();

    for (var i = 0; i < totalObjects; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = x;
        vertex.y = y;
        vertex.z = 0;

        geometry.vertices.push(vertex);
        dirs.push({
            x: (Math.random() * movementSpeed) - (movementSpeed / 2),
            y: (Math.random() * movementSpeed) - (movementSpeed / 2),
            z: (Math.random() * movementSpeed) - (movementSpeed / 2)
        });
    }
    var material = new THREE.PointsMaterial({
        size: objectSize,
        color: COLORS[itemColorIndex]
    });
    var particles = new THREE.Points(geometry, material);

    this.object = particles;
    this.status = true;

    this.xDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
    this.yDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
    this.zDir = (Math.random() * movementSpeed) - (movementSpeed / 2);

    scene.add(this.object);

    this.update = function () {
        if (this.status == true) {
            var pCount = totalObjects;
            while (pCount--) {
                var particle = this.object.geometry.vertices[pCount]
                particle.y += dirs[pCount].y;
                particle.x += dirs[pCount].x;
                particle.z += dirs[pCount].z;
            }
            this.object.geometry.verticesNeedUpdate = true;
        }
    }
}

function render() {
    updateHand();

    removeFallenObjects();

    var pCount = parts.length;
    while (pCount--) {
        parts[pCount].update();
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
