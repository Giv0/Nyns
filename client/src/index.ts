import "./index.css";

import * as BABYLON from "babylonjs";
import Keycode from "keycode.js";

import { client } from "./game/network";

// Re-using server-side types for networking
// This is optional, but highly recommended
import { StateHandler } from "../../server/src/rooms/StateHandler";
import { PressedKeys } from "../../server/src/entities/Player";
import { CamPos } from "../../server/src/entities/Player";


const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);


// This creates a basic Babylon Scene object (non-mesh)
var scene = new BABYLON.Scene(engine);



// This creates and positions a free camera (non-mesh)
var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
camera.keysUp = [87];
camera.keysDown = [83];
camera.keysLeft = [65];
camera.keysRight = [68];

// This targets the camera to scene origin
camera.setTarget(BABYLON.Vector3.Zero());

// This attaches the camera to the canvas
camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
light.intensity = 0.7;

// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

// Attach default camera mouse navigation
// camera.attachControl(canvas);

// Colyseus / Join Room
const room = client.join<StateHandler>("game");
room.onJoin.add(() => {
    const playerViews: {[id: string]: BABYLON.Mesh} = {};

    room.state.players.onAdd = function(player, key) {
		if (key !== room.sessionId) {
            playerViews[key] = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
			playerViews[key].position.set(player.position.x, player.position.y, player.position.z);
        }
    };

    room.state.players.onChange = function(player, key) {
		if (key !== room.sessionId) {
        playerViews[key].position.set(player.position.x, player.position.y, player.position.z);
		}
    };

    room.state.players.onRemove = function(player, key) {
		if (key !== room.sessionId) {
        scene.removeMesh(playerViews[key]);
        delete playerViews[key];
		}
    };
	
	

})

room.onStateChange.add((state) => {
    console.log("New room state:", state.toJSON());
})

var run = false;

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

canvas.onclick = function() {
  canvas.requestPointerLock();
  run = true;
}

const camposition: CamPos = { x: 0, y: 1, z:0 };
scene.registerAfterRender(function() {
	if (run == true) {
		camposition.x = camera.position.x;
		camposition.y = camera.position.y;
		camposition.z = camera.position.z;
		room.send(['pos', camposition]);
	}
});

// Scene render loop
engine.runRenderLoop(function() {
    scene.render();
});

// Keyboard listeners
const keyboard: PressedKeys = { x: 0, y: 0 };
window.addEventListener("keydown", function(e) {
    if (e.which === Keycode.LEFT) {
        keyboard.x = -1;
    } else if (e.which === Keycode.RIGHT) {
        keyboard.x = 1;
    } else if (e.which === Keycode.UP) {
        keyboard.y = -1;
    } else if (e.which === Keycode.DOWN) {
        keyboard.y = 1;
    }
    //room.send(['key', keyboard]);
});

window.addEventListener("keyup", function(e) {
    if (e.which === Keycode.LEFT) {
        keyboard.x = 0;
    } else if (e.which === Keycode.RIGHT) {
        keyboard.x = 0;
    } else if (e.which === Keycode.UP) {
        keyboard.y = 0;
    } else if (e.which === Keycode.DOWN) {
        keyboard.y = 0;
    }
    //room.send(['key', keyboard]);
});

// Resize the engine on window resize
window.addEventListener('resize', function() {
    engine.resize();
});
