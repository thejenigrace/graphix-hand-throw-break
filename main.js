var initScene, render, _boxes = [], spawnBox, loader,
    renderer, render_stats, physics_stats, scene, ground_material, ground, light, camera;
var balls = [], wall_material;


initScene = function() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    document.getElementById( 'viewport' ).appendChild( renderer.domElement );

    render_stats = new Stats();
    render_stats.domElement.style.position = 'absolute';
    render_stats.domElement.style.top = '0px';
    render_stats.domElement.style.zIndex = 100;
    document.getElementById( 'viewport' ).appendChild( render_stats.domElement );

    physics_stats = new Stats();
    physics_stats.domElement.style.position = 'absolute';
    physics_stats.domElement.style.top = '50px';
    physics_stats.domElement.style.zIndex = 100;
    document.getElementById( 'viewport' ).appendChild( physics_stats.domElement );

    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 1 );
            physics_stats.update();
        }
    );

    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.set( 60, 50, 60 );
    camera.lookAt( scene.position );
    scene.add( camera );

    // Light
    light = new THREE.DirectionalLight( 0xFFFFFF );
    light.position.set( 20, 40, -15 );
    light.target.position.copy( scene.position );
    light.castShadow = true;
    light.shadowCameraLeft = -60;
    light.shadowCameraTop = -60;
    light.shadowCameraRight = 60;
    light.shadowCameraBottom = 60;
    light.shadowCameraNear = 20;
    light.shadowCameraFar = 200;
    light.shadowBias = -.0001
    light.shadowMapWidth = light.shadowMapHeight = 2048;
    light.shadowDarkness = .7;
    scene.add( light );

    // Loader
    loader = new THREE.TextureLoader();

    // Ground Material
    ground_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'image/rocks.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    ground_material.map.repeat.set( 3, 3 );

    // Ground Mesh
    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(100, 1, 100),
        ground_material,
        0 // mass
    );
    ground.receiveShadow = true;
    scene.add( ground );

    // Wall Material
    wall_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'image/plywood.jpg' )}),
        .4, // medium friction
        0 // medium restitution
    );
    wall_material.map.wrapS = wall_material.map.wrapT = THREE.RepeatWrapping;
    wall_material.map.repeat.set( 3, 3 );

    createTower();

    //spawnBox();

    //loadBall();

    requestAnimationFrame( render );
    scene.simulate();
};

createTower = (function() {
    var wall_length = 40, wall_height = 15, wall_width = 10, wall_offset = 2;
    var wall_geometry = new THREE.BoxGeometry( wall_length, wall_height, wall_width );

    return function() {
        var i, j, rows = 16,
            wall;

        //for ( i = 0; i < rows; i++ ) {
        //    for ( j = 0; j < 3; j++ ) {
        //        wall = new Physijs.BoxMesh( wall_geometry, wall_material );
        //        wall.position.y = (wall_height / 2) + wall_height * i;
        //        if ( i % 2 === 0 ) {
        //            wall.rotation.y = Math.PI / 2.01; // #TODO: There's a bug somewhere when this is to close to 2
        //            wall.position.x = wall_offset * j - ( wall_offset * 3 / 2 - wall_offset / 2 );
        //        } else {
        //            wall.position.z = wall_offset * j - ( wall_offset * 3 / 2 - wall_offset / 2 );
        //        }
        //        wall.receiveShadow = true;
        //        wall.castShadow = true;
        //        scene.add( wall );
        //        walls.push( wall );
        //    }
        //}

        wall = new Physijs.BoxMesh( wall_geometry, wall_material );
        //wall.receiveShadow = true;
        //wall.castShadow = true;
        scene.add( wall )
    }
})();

window.addEventListener("click", function(e) {
    loadBall();
});

loadBall = (function () {
    var _vector = new THREE.Vector3();
    var ray, intersection, handleMouseMove;

    //handleMouseMove = function( evt ) {
    //    var ray, intersection,
    //        i, scalar;
    //
    //    if ( selected_block !== null ) {
    //
    //        _vector.set(
    //            ( evt.clientX / window.innerWidth ) * 2 - 1,
    //            -( evt.clientY / window.innerHeight ) * 2 + 1,
    //            1
    //        );
    //        _vector.unproject( camera );
    //
    //        ray = new THREE.Raycaster( camera.position, _vector.sub( camera.position ).normalize() );
    //        intersection = ray.intersectObject( intersect_plane );
    //        mouse_position.copy( intersection[0].point );
    //    }
    //
    //};

    var handleCollision = function( collided_with, linearVelocity, angularVelocity ) {
        switch (++this.collisions) {

            case 1:
                this.material.color.setHex(0xcc8855);

                console.log('X = ' + this.position.x);
                console.log('Y = ' + this.position.y);
                console.log('Z = ' + this.position.z);
                break;

            //case 2:
            //    this.material.color.setHex(0xbb9955);
            //    break;
            //
            //case 3:
            //    this.material.color.setHex(0xaaaa55);
            //    break;
            //
            //case 4:
            //    this.material.color.setHex(0x99bb55);
            //    break;
            //
            //case 5:
            //    this.material.color.setHex(0x88cc55);
            //    break;
            //
            //case 6:
            //    this.material.color.setHex(0x77dd55);
            //    break;
        }
    };
    var createBall = function() {
        var ball, ball_geometry, ball_material;
        // Ball Geometry
        ball_geometry = new THREE.SphereGeometry(1, 32, 32);

        // Ball Material
        ball_material = Physijs.createMaterial(
            new THREE.MeshLambertMaterial({map: loader.load('image/rocks.jpg')}),
            .4, // medium friction
            .4 // medium restitution
        );
        ball_material.map.wrapS = ball_material.map.wrapT = THREE.RepeatWrapping;
        ball_material.map.repeat.set(3, 3);

        // Ball Mesh
        ball = new Physijs.SphereMesh(
            ball_geometry,
            ball_material
        );
        ball.collisions = 0;

        ball.position.set(Math.random() * 15 - 5, 20, Math.random() * 15 - 4);
        //ball.setLinearVelocity({x: 15, y: 10, z: 5});

        ball.castShadow= true;
        ball.addEventListener( 'collision', handleCollision );
        //ball.addEventListener( 'ready', loadBall );
        scene.add(ball);

        balls.push(ball);
    };

    return function() {
        //renderer.domElement.addEventListener( 'mousemove', handleMouseMove );
        createBall();
        //setTimeout( createBall(), 1000 );
    };
})();



//spawnBox = (function() {
//    var box_geometry = new THREE.BoxGeometry( 4, 4, 4 ),
//        handleCollision = function( collided_with, linearVelocity, angularVelocity ) {
//            switch ( ++this.collisions ) {
//
//                case 1:
//                    this.material.color.setHex(0xcc8855);
//                    break;
//
//                case 2:
//                    this.material.color.setHex(0xbb9955);
//                    break;
//
//                case 3:
//                    this.material.color.setHex(0xaaaa55);
//                    break;
//
//                case 4:
//                    this.material.color.setHex(0x99bb55);
//                    break;
//
//                case 5:
//                    this.material.color.setHex(0x88cc55);
//                    break;
//
//                case 6:
//                    this.material.color.setHex(0x77dd55);
//                    break;
//            }
//        },
//        createBox = function() {
//            var box, material;
//
//            material = Physijs.createMaterial(
//                new THREE.MeshLambertMaterial({ map: loader.load( 'image/plywood.jpg' ) }),
//                .6, // medium friction
//                .3 // low restitution
//            );
//            material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
//            material.map.repeat.set( .5, .5 );
//
//            //material = new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'image/rocks.jpg' ) });
//
//            box = new Physijs.BoxMesh(
//                box_geometry,
//                material
//            );
//            box.collisions = 0;
//
//            box.position.set(
//                Math.random() * 15 - 7.5,
//                25,
//                Math.random() * 15 - 7.5
//            );
//
//            box.rotation.set(
//                Math.random() * Math.PI,
//                Math.random() * Math.PI,
//                Math.random() * Math.PI
//            );
//
//            box.castShadow = true;
//            box.addEventListener( 'collision', handleCollision );
//            box.addEventListener( 'ready', spawnBox );
//            scene.add( box );
//        };
//
//    return function() {
//        setTimeout( createBox, 1000 );
//    };
//})();

render = function() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    render_stats.update();
};

window.onload = initScene;