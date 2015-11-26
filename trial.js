//////////////settings/////////
var movementSpeed = 80;
var totalObjects = 500;
var objectSize = 10;
var sizeRandomness = 4000;
var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
/////////////////////////////////
var dirs = [];
var parts = [];

// NOTE: The cannon is located at the center of the scene and faces in the
// positive direction of the z-axis. The x-axis is horizontal and the y-axis is
// vertical relative to the cannon platform.

// Constants
// =============================================================================
var PLATFORM_HEIGHT = 80;
var PLATFORM_WIDTH = 160;
var CANNON_LENGTH = 6;
var TARGET_SIZE = 10;
var TARGET_DISTANCE = 160;
var GRAVITY = 160;
var BALL_RADIUS = 4;
var BALL_VELOCITY = 200;
var BALL_MASS = 100;
var TARGET_MASS = 1;
var SKY_COLOR = 0x77ccff;
var SHOOT_DELAY = 1000;
// Parameters to control splash parabola shape and size.
var SPLASH_POSITION_RANDOMNESS = 4;
var SPLASH_PARABOLA_FACTOR = 2.5, SPLASH_Y_FACTOR = 2, SPLASH_X_FACTOR = 4;
// Number of sprites created per splash.
var SPLASH_NUM_PARTICLES = 20;

// Level definitions are the target configurations passed to addTargets().
var LEVELS = [
    [
        'f'
    ],
    [
        '3   3   3',
        '  3   3',
        '    3'
    ],
    [
        '11111',
        '12221',
        '12321',
        '12221',
        '11111'
    ],
    [
        '1234567654321'
    ]
];


// Globals
// =============================================================================
var camera, scene, renderer;
var mousePosition = {x: 0.5, y: 0.5};
var cannon, cannonDirection = new THREE.Vector3(), lastShotTime;
var levelIndex, levelStartTime, alreadyWon, gameStarted;
var numTargets = numCannonballsFired = totalCannonballsFired = totalTargets = 0;

var woodTexture, textMaterial, targetPlatformMaterial, targetGeometry, targetMaterial, cannonballGeometry, cannonballMaterial;
var boomSound, blagSound;
var capsuleGeometry, capsuleMaterial, torusGeometry, torusMaterial;

var oceanTexture, oceanHeightMapScene, oceanHeightMap, oceanHeightMapCamera;
var uniformsNoise = {
    time: {type: "f", value: 1.0},
    scale: {type: "v2", value: new THREE.Vector2(1.5, 1.5)},
    offset: {type: "v2", value: new THREE.Vector2(0, 0)}
};

var itemBall, itemCapsule, itemTorus;

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

// Creates multiple copies of the given sound and plays the copies in a round
// robin loop, so that the same sound can be played multiple times simultaneously.
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
function addOceanPlane() {
    // Create dynamically generated wave-like plane.

    // Set up wave generating shader material.
    //var waveMaterial = new THREE.ShaderMaterial({
    //    uniforms: uniformsNoise,
    //    vertexShader: document.getElementById('vertexShader').textContent,
    //    fragmentShader: document.getElementById('fragmentShaderNoise').textContent,
    //    lights: false,
    //    fog: true
    //});
    //
    //oceanHeightMapScene = new THREE.Scene();
    //
    //// Create target mesh, that waves will be drawn onto.
    //var plane = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
    //var targetMesh = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    //targetMesh.position.z = -500;
    //targetMesh.material = waveMaterial;
    //oceanHeightMapScene.add(targetMesh);
    //
    //// Create camera to view target mesh.
    //oceanHeightMapCamera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2,
    //    window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000);
    //oceanHeightMapCamera.position.z = 100;
    //oceanHeightMapScene.add(oceanHeightMapCamera);
    //
    //// Render target mesh into height map texture.
    //oceanHeightMap  = new THREE.WebGLRenderTarget(256, 256,
    //    { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat });
    //oceanHeightMap.generateMipmaps = false;
    //renderer.render(oceanHeightMapScene, oceanHeightMapCamera, oceanHeightMap, true);

    // Create final ocean mesh using ocean height map and ocean texture.
    //var oceanGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 256, 256);
    ////var oceanMaterial = new THREE.MeshPhongMaterial({ map: oceanTexture, displacementMap: oceanHeightMap, displacementScale: PLATFORM_HEIGHT });
    //var ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    //ocean.rotation.x = -Math.PI / 2;
    //ocean.position.y = -1;
    //ocean.receiveShadow = true;
    //
    //scene.add(ocean);

    // Loader
    var loader = new THREE.TextureLoader();

    //// Ground Material
    //var ground_material = Physijs.createMaterial(
    //    new THREE.MeshLambertMaterial({ map: loader.load( 'image/rocks.jpg' ) }),
    //    .8, // high friction
    //    .3 // low restitution
    //);
    //ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    //ground_material.map.repeat.set( 3, 3 );
    //
    //// Ground Mesh
    //var ground = new Physijs.BoxMesh(
    //    new THREE.BoxGeometry(2000, 2000, 256, 256),
    //    ground_material,
    //    0 // mass
    //);
    //ground.receiveShadow = true;
    //scene.add( ground );

    var geometry = new THREE.BoxGeometry(400, 400, 50);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    //var material = new THREE.MeshLambertMaterial({ map: loader.load('image/grass.png') });
    //material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
    //material.map.repeat.set( 10, 10 );
    var material = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
    var material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({map: loader.load('image/grasslight-big.jpg')}),
        .4, // high friction
        .3 // low restitution
    );
    material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(25, 25);

    //var mesh = new THREE.Mesh( geometry, material );
    //mesh.receiveShadow = true;

    var mesh = new Physijs.BoxMesh(geometry, material, 0);
    mesh.receiveShadow = true;
    mesh.name = 'ground';

    scene.add(mesh);
}

function addSkyBox() {
    var cubeMap = new THREE.CubeTexture( [] );
    cubeMap.format = THREE.RGBFormat;

    var loader = new THREE.ImageLoader();
    loader.load( 'image/skyboxsun25degtest.png', function ( image ) {

        var getSide = function ( x, y ) {

            var size = 1024;

            var canvas = document.createElement( 'canvas' );
            canvas.width = Window.width;
            canvas.height = Window.height;

            var context = canvas.getContext( '2d' );
            context.drawImage( image, - x * size, - y * size );

            return canvas;

        };

        cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
        cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
        cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
        cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
        cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
        cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
        cubeMap.needsUpdate = true;

    } );

    var cubeShader = THREE.ShaderLib[ 'cube' ];
    cubeShader.uniforms[ 'tCube' ].value = cubeMap;

    var skyBoxMaterial = new THREE.ShaderMaterial( {
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    } );

    var skyBox = new THREE.Mesh(
        new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
        skyBoxMaterial
    );

    scene.add( skyBox );
}

function addDesign() {
    // Create platform for targets to sit on. Platform is slightly larger than target configuration.
    var platformGeometry = new THREE.BoxGeometry(8, 8, 8);

    // Give the platform a mass of 0 so that it is immovable and won't fall due to gravity.
    var targetPlatform = new Physijs.BoxMesh(platformGeometry, targetPlatformMaterial, 0);
    targetPlatform.position.x = 61;
    targetPlatform.position.y = 40;
    targetPlatform.position.z = 70;
    targetPlatform.removeBeforeLevel = true;
    targetPlatform.receiveShadow = true;
    //targetPlatform.addEventListener('collision', handleCollision);

    scene.add(targetPlatform);
}

function addCannon() {
    // Add platform that cannon sits on.
    //var platformGeometry = new THREE.BoxGeometry(20, PLATFORM_HEIGHT, 20);
    //var platformMaterial = new THREE.MeshLambertMaterial({map: woodTexture});
    //var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    //platform.position.y = PLATFORM_HEIGHT / 2;
    //platform.receiveShadow = true;
    //
    //scene.add(platform);

    // Add cannon.
    cannon = new THREE.Object3D();

    // Add cannon base.
    //var sphere = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshPhongMaterial({color: 0xffcc99}));
    //sphere.position.y = CANNON_LENGTH;
    //sphere.castShadow = true;
    //
    //cannon.add(sphere);

    var box = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshPhongMaterial({color: 0xffcc99}));
    box.position.y = CANNON_LENGTH;
    box.castShadow = true;

    cannon.add(box);

    // Add cannon barrel.
    var cylinderGeometry = new THREE.CylinderGeometry(2, 3, CANNON_LENGTH, 16);
    var cylinderMaterial = new THREE.MeshPhongMaterial({color: 0xffcc99});
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    //cylinder.position.y = 0;
    cylinder.castShadow = true;

    cannon.add(cylinder);

    //var loader = new THREE.ColladaLoader();
    //loader.options.convertUpAxis = true;
    //loader.load( '/model/collada/hand.dae', function ( collada ) {
    //    var hand = collada.scene;
    //    hand.scale.x = hand.scale.y = hand.scale.z = 10;
    //    //hand.position.x = hand.position.y = hand.position.z = 0;
    //    //hand.position.x = -20;
    //    //hand.position.y =  -5;
    //    //hand.position.z
    //    //hand.rotateX(10);
    //    hand.rotateZ(5);
    //    //hand.rotateX(Math.PI / 4);
    //    //hand.position.y = 2;
    //    hand.position.z = 0;
    //
    //    hand.updateMatrix();
    //
    //    console.log(hand);
    //
    //    cannon.add(hand);
    //});

    //var loader = new THREE.JSONLoader();
    //loader.load( '/model/json/hand.json', function (geometry, materials) {
    //     var handMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
    //
    //    cannon.add(handMesh);
    //});



    // Position cannon on top of platform.
    cannon.rotation.x = Math.PI / 4;
    cannon.position.y = 2;
    cannon.position.z = -5;
    cannon.castShadow = true;

    scene.add(cannon);
}

function createTarget() {
    var target = new Physijs.BoxMesh(targetGeometry, targetMaterial, TARGET_MASS);
    target.isTarget = true;
    target.removeIfUnderwater = true;
    target.castShadow = true;
    target.splashes = true;

    return target;
}

// Target configuration is an array containing strings that specify how the
// target blocks should be stacked. Each hexadecimal digit in the string
// specifies the number of blocks that should be stacked at that location.
function addTargets(targetConfiguration) {
    var numRows = targetConfiguration.length;
    var rowLengths = targetConfiguration.map(function (row) {
        return row.length;
    });
    var numColumns = Math.max.apply(null, rowLengths);

    var width = numColumns * TARGET_SIZE;
    var depth = numRows * TARGET_SIZE;
    var leftSide = -(width / 2);
    var backSide = TARGET_DISTANCE + depth / 2;

    // Create platform for targets to sit on. Platform is slightly larger than target configuration.
    var platformGeometry = new THREE.BoxGeometry(PLATFORM_WIDTH, PLATFORM_HEIGHT, depth + TARGET_SIZE * 2);

    // Give the platform a mass of 0 so that it is immovable and won't fall due to gravity.
    var targetPlatform = new Physijs.BoxMesh(platformGeometry, targetPlatformMaterial, 0);
    targetPlatform.name = 'wall';
    targetPlatform.position.z = TARGET_DISTANCE;
    targetPlatform.position.y = PLATFORM_HEIGHT / 2;
    targetPlatform.removeBeforeLevel = true;
    targetPlatform.receiveShadow = true;
    //targetPlatform.addEventListener('collision', handleCollision);

    scene.add(targetPlatform);

    //var zero = new THREE.Vector3(0, 0, 0);
    //
    //numTargets = 0;
    //for (var row = 0; row < numRows; row++) {
    //    var z = backSide - row * TARGET_SIZE - TARGET_SIZE / 2;
    //
    //    for (var column = 0; column < numColumns; column++) {
    //        var x = leftSide + column * TARGET_SIZE + TARGET_SIZE / 2;
    //
    //        // The hexadecimal number in the target configuration array
    //        // indicates the number of blocks that should be stacked at that position.
    //        var numBlocks = parseInt(targetConfiguration[row][column], 16) || 0;
    //
    //        for (var i = 0; i < numBlocks; i++) {
    //            var y = TARGET_SIZE / 2 + i * TARGET_SIZE;
    //
    //            var target = createTarget();
    //            target.position.x = x;
    //            target.position.y = y;
    //            target.position.z = z;
    //
    //            scene.add(target);
    //
    //            // Freeze all targets until cannonball is shot so that target
    //            // configuration is stable and doesn't fall under its own weight.
    //            target.setAngularFactor(zero);
    //            target.setAngularVelocity(zero);
    //            target.setLinearFactor(zero);
    //            target.setLinearVelocity(zero);
    //
    //            numTargets += 1;
    //        }
    //    }
    //}
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

    console.log(collided_with.name);

    var ground = 'ground';
    var wall = 'wall';

    if(0 === ground.localeCompare(collided_with.name)) {
        blagSound.play();
        console.log('BLAG!');
    } else if(0 === wall.localeCompare(collided_with.name)) {
        boomSound.play();
        console.log('BOOM!');
        scene.remove(this);
        parts.push(new ExplodeAnimation(this.position.x, this.position.y));
    }

    //event.preventDefault();
};

function createCannonball() {

    if(itemBall === true) {
        var ball = new Physijs.SphereMesh(cannonballGeometry, cannonballMaterial, BALL_MASS);
        ball.castShadow = true;
        ball.removeIfUnderwater = true;
        ball.removeBeforeLevel = true;
        ball.splashes = true;
        ball.addEventListener('collision', handleCollision)

        return ball;
    } else if(itemCapsule === true) {
        var capsule = new Physijs.CapsuleMesh(capsuleGeometry, capsuleMaterial, BALL_MASS);
        capsule.castShadow = true;
        capsule.addEventListener('collision', handleCollision);

        return capsule;
    } else if(itemTorus === true) {
        var torus = new Physijs.ConvexMesh(torusGeometry, targetMaterial, BALL_MASS);
        torus.castShadow = true;
        torus.addEventListener('collision', handleCollision);

         return torus;
    }
}

function shootCannonball() {
    unfreezeTargets();

    var ball = createCannonball();
    ball.position.copy(cannon.position);

    scene.add(ball);

    // Apply the rotation of the cannon to the velocity vector of the
    // cannonball so that cannonball shoots in same direction that cannon is facing.
    ball.setLinearVelocity(cannonDirection.clone().multiplyScalar(BALL_VELOCITY));

    // Play sound.
    //cannonSound.play();

    numCannonballsFired += 1;
}

// Simulate splash by making a bunch of white "spray* dots fly out in random
// directions from a common point. The quickly move in an upside down parabola
// pattern, eventually falling below the water and getting removed.
function addSplash(position, velocity) {
    var random = function () {
        return Math.random() * SPLASH_POSITION_RANDOMNESS - SPLASH_POSITION_RANDOMNESS / 2;
    }

    for (var i = 0; i < SPLASH_NUM_PARTICLES; i++) {
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.isSplashSprite = true;
        sprite.removeIfUnderwater = true;

        sprite.startTime = window.performance.now();
        // Start the sprite at the given position, but just below the water level.
        sprite.initialPosition = position.clone();
        sprite.initialPosition.y = 0;
        // Randomize the start position of each sprite a little bit.
        sprite.initialPosition.add(new THREE.Vector3(random(), random(), random()));
        sprite.position.copy(sprite.initialPosition);
        // Make each sprite fly out in a different direction.
        sprite.angle = Math.random() * Math.PI * 2;
        // Increase size of movement parabola with vertical speed of object.
        sprite.splashIntensity = Math.abs(velocity.y) / 100;
        // Also add randomness to the parabola size.
        sprite.splashIntensity *= Math.random() + 0.1;

        scene.add(sprite);
    }
}

function loadResources() {
    var loader = new THREE.TextureLoader();
    // Load textures.
    woodTexture = loader.load('./resources/wood.jpg');
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;

    oceanTexture = loader.load('image/grasslight-big.jpg');
    oceanTexture.wrapS = oceanTexture.wrapT = THREE.RepeatWrapping;
    oceanTexture.repeat.set(10, 10);

    var brickTexture = loader.load('./resources/brick.jpg');
    brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
    brickTexture.repeat.set(2, 2);

    // Precreate repeatedly used geometries and material.
    cannonballGeometry = new THREE.SphereGeometry( BALL_RADIUS );
    cannonballMaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial( {color: 'black'} ));

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

    capsuleMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial( {color: 0xffffff} ));

    torusGeometry = new THREE.TorusGeometry( 5, 3, 16, 100 );
    torusMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial( {color: 0xffff00} ));

    targetPlatformMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({map: brickTexture}), .95, .95);
    targetGeometry = new THREE.BoxGeometry(TARGET_SIZE, TARGET_SIZE, TARGET_SIZE);

    targetMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({map: brickTexture}));
    textMaterial = new THREE.MeshPhongMaterial({color: 'red'});
    textMaterial.transparent = true;
    spriteMaterial = new THREE.SpriteMaterial({
        map: loader.load('./resources/splash-sprite.png')
    });

    // Load sounds.
    boomSound = new AudioPool('./resources/cannonball.mp3', 0.5, 3);
    blagSound = new AudioPool('./resources/m1-garand-single.mp3', 0.5, 3);
}

function initScene() {
    scene = new Physijs.Scene();
    //scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
    //scene.fog = new THREE.Fog( 0x4584b4, - 100, 3000 );
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

    // Initialize scene
    //addSkyBox();
    addOceanPlane();
    addCannon();
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
            shootCannonball();
            lastShotTime = window.performance.now();
        }
    });

    // Close dialogs when confirm button clicked.
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('dialog-confirm-button')) {
            event.target.parentNode.style.display = 'none';
        }
    });

    // Start first level when user presses start game button.
    gameStarted = false;
    document.getElementById('start-game-button').addEventListener('click', function () {
        gameStarted = true;
        levelIndex = -1;
        startNextLevel();
    });

    itemBall = true;
    itemCapsule = itemTorus = false;
    document.getElementById('item-ball-button').addEventListener('click', function () {
        itemBall = true;
        itemCapsule = itemTorus = false;
    });
    document.getElementById('item-capsule-button').addEventListener('click', function () {
        itemCapsule = true;
        itemBall = itemTorus = false;
    });
    document.getElementById('item-torus-button').addEventListener('click', function () {
        itemTorus = true;
        itemBall = itemCapsule = false;
    });

    // Go to next level when player closes level finished dialog.
    document.getElementById('next-level-button').addEventListener('click', startNextLevel);
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

function startNextLevel() {
    // Clean up objects from previous level.
    removeObjects(function (object) {
        return object.removeBeforeLevel === true;
    });

    levelIndex += 1;
    levelStartTime = window.performance.now();

    if (levelIndex >= LEVELS.length) {
        gameWon();

        alreadyWon = true;
    } else {
        // Initialize next level.
        addTargets(LEVELS[levelIndex]);

        // Show 3D text banner.
        var textGeometry = new THREE.TextGeometry('Level ' + (levelIndex + 1), {
            size: 10,
            height: 2,
            font: 'Woodgod',
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.3
        });
        var text = new THREE.Mesh(textGeometry, textMaterial);

        text.position.set(20, 30, 40);
        text.rotation.y = Math.PI;
        text.removeBeforeLevel = true;

        scene.add(text);

        numCannonballsFired = 0;
        alreadyWon = false;
    }
}

function levelWon() {
    // Update best score.
    var scoreKey = 'best-score-' + levelIndex;
    if (localStorage[scoreKey] === undefined)
        localStorage[scoreKey] = numCannonballsFired;
    else
        localStorage[scoreKey] = Math.min(localStorage[scoreKey], numCannonballsFired);

    // Update total scores.
    totalCannonballsFired += numCannonballsFired;
    totalTargets += numTargets;

    // Display level finished dialog.
    document.getElementById('num-targets').textContent = numTargets.toString();
    document.getElementById('num-cannonballs').textContent = numCannonballsFired.toString();
    document.getElementById('best-num-cannonballs').textContent = localStorage['best-score-' + levelIndex];
    document.getElementById('level-finished-dialog').style.display = 'block';

    // Go to next level when player clicks on the button in the level finished dialog.
}

function gameWon() {
    // Update total best score.
    if (localStorage['best-score-total'] === undefined)
        localStorage['best-score-total'] = totalCannonballsFired;
    else
        localStorage['best-score-total'] = Math.min(localStorage['best-score-total'], totalCannonballsFired);

    // Show win dialog with total scores when game is over.
    document.getElementById('total-targets').textContent = totalTargets;
    document.getElementById('total-cannonballs').textContent = totalCannonballsFired;
    document.getElementById('total-best-num-cannonballs').textContent = localStorage['best-score-total'];
    document.getElementById('win-dialog').style.display = 'block';

    // Drop slowly falling targets infinitely for player to shoot at for as
    // long as they want.
    setInterval(dropRandomTarget, 1000);
    scene.setGravity(new THREE.Vector3(0, -10, 0));
}

// Drop a random target from the sky.
function dropRandomTarget() {
    var target = createTarget();
    target.position.x = -60 + Math.random() * 120;
    target.position.y = 100;
    target.position.z = 30 + Math.random() * 200;

    scene.add(target);
}

function updateCannon() {
    // Rotate cannon with mouse movement.
    cannon.rotation.z = interpolate(-Math.PI / 4, Math.PI / 4, mousePosition.x);
    //cannon.rotation.x = interpolate(Math.PI / 8, Math.PI / 2 - 0.1, mousePosition.y);
    cannon.rotation.x = interpolate(Math.PI / 8, Math.PI / 2, mousePosition.y);
    cannonDirection.set(0, 1, 0);
    cannonDirection.applyQuaternion(cannon.quaternion);

    // Apply recoil to cannon.
    var recoilLength = SHOOT_DELAY;
    var t = (window.performance.now() - lastShotTime) / recoilLength;
    // At the beginning of the recoil, quickly increase the cannon's distance from it's initial position.
    if (t <= 0.1)
        recoilAmount = interpolate(0, 5, t / 0.1);
    // Then, slowly move the cannon back to its initial position.
    else
        recoilAmount = interpolate(5, 0, (t - 0.1) / 0.9);
    recoilAmount = Math.max(recoilAmount, 0);
    var recoil = cannonDirection.clone().multiplyScalar(-recoilAmount);
    recoil.y = 0;
    cannon.position.set(0, PLATFORM_HEIGHT + 2, -5).add(recoil);

    // Position camera so that it is always behind cannon.
    var offset = cannonDirection.clone().multiplyScalar(-20);
    camera.position.copy(cannon.position.clone().add(offset));
    //camera.position.y = cannon.position.y + 20;
    camera.position.y = cannon.position.y + 10;

    // Make camera look at where cannon is aiming.
    //camera.lookAt(cannon.position.clone().add(cannonDirection.clone().multiplyScalar(20)));
    camera.lookAt(cannon.position.clone().add(cannonDirection.clone().multiplyScalar(30)));
}

function updateOcean() {
    // Re-generate wave height map with slightly different parameters to
    // simulate movement of waves.
    var t = window.performance.now() / 1000;
    uniformsNoise.time.value = t * 0.03;
    uniformsNoise.offset.value.x = t * 0.03;
    // Also shift texture position a little bit each frame to simulate water moving.
    oceanTexture.offset.copy(new THREE.Vector2(0.01, 0.02).multiplyScalar(t));
    renderer.render(oceanHeightMapScene, oceanHeightMapCamera, oceanHeightMap, true);
}

function updateSplashes() {
    // Create splashes when objects hit the water.
    scene.children.forEach(function (object) {
        if (object.splashes === true && !object.alreadySplashed) {
            // Calculate bounding box to see if bottom of object has hit the water.
            if (!object.geometry.boundingBox)
                object.geometry.computeBoundingBox();

            if (object.position.y + object.geometry.boundingBox.min.y < 0) {
                object.alreadySplashed = true;
                addSplash(object.position, object.getLinearVelocity());
            }
        }
    });

    // Update splash sprites.
    scene.children.forEach(function (object) {
        if (object.isSplashSprite === true) {
            var sprite = object;

            // Move each splash sprite along its parabolic trajectory.
            var t = secondsSince(sprite.startTime) * 10;
            sprite.position.x = sprite.splashIntensity * SPLASH_X_FACTOR * t;
            // Parabola is written so that at t = 0, y is also 0, so that the splash originates from the water level.
            sprite.position.y = sprite.splashIntensity * SPLASH_Y_FACTOR *
                (-Math.pow(t - SPLASH_PARABOLA_FACTOR, 2) + Math.pow(SPLASH_PARABOLA_FACTOR, 2));
            sprite.position.z = 0;

            // Make sprite move out from the start position in its unique direction.
            sprite.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), sprite.angle);
            sprite.position.add(sprite.initialPosition);
        }
    });
}

function checkForWinCondition() {
    if (alreadyWon)
        return;

    // Check if the user destroyed all targets.
    var someTargetsRemaining = scene.children.some(function (object) {
        return object.isTarget === true;
    });
    if (!someTargetsRemaining) {
        alreadyWon = true;

        levelWon();
    }
}

function removeUnderwaterObjects() {
    // Remove objects that fall below ocean plane.
    removeObjects(function (object) {
        // Could calculate bounding box, but simpler to just make sure the object has fallen far below sea.
        return object.removeIfUnderwater === true && object.position.y < -100;
    });
}

function ExplodeAnimation(x, y) {
    var geometry = new THREE.Geometry();

    for (i = 0; i < totalObjects; i++) {
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
    var material = new THREE.ParticleBasicMaterial({
        size: objectSize,
        color: colors[Math.round(Math.random() * colors.length)]
    });
    var particles = new THREE.ParticleSystem(geometry, material);

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
    updateCannon();

    //updateOcean();

    //updateSplashes();

    removeUnderwaterObjects();

    // Make level banner text fade out after level starts.
    textMaterial.opacity = 2 - secondsSince(levelStartTime);

    //if (gameStarted) {
    //    checkForWinCondition();
    //}

    var pCount = parts.length;
    while (pCount--) {
        parts[pCount].update();
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
