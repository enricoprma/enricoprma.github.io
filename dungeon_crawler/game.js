const canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
const WIDTH = canvas.width = 1700;
const HEIGHT = canvas.height = 900;

const scene = new Scene();

const background = new Sprite({
    imageSrc: "sprites/background.png",
    position: {
        x: 0,
        y: 0
    },
});

scene.addObject(background);

const player = new Player({
    imageSrc: "sprites/playerIdle.png",
    position: {
        x: WIDTH/2,
        y: 150
    },
    direction: {
        x: 0,
        y: 0,
    },
    speed: 5,
    framesCount: 4
});

scene.addObject(player);

const fireSpirit = new Enemy({
    imageSrc: "sprites/fireSpirit.png",
    position: {
        x: WIDTH/2,
        y: HEIGHT/2 + 200
    },
    direction: {
        x: 1,
        y: 1,
    },
    speed: 4,
    framesCount: 5
});

scene.addObject(fireSpirit)

const ghost = new Enemy({
    imageSrc: "sprites/ghost.png",
    position: {
        x: WIDTH/2-300,
        y: HEIGHT/2 + 100
    },
    direction: {
        x: 1,
        y: 1,
    },
    speed: 2,
    framesCount: 4,
    framesHold: 8
});

ghost.update = () => ghost.draw();

scene.addObject(ghost)

const keys = {
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    mouse: {
        pressed: false,
        x: 0,
        y: 0,
    },
}

const mouseCoordinates = {
    x: 0,
    y: 0
}



window.addEventListener("mousemove", (event) =>{
    mouseCoordinates.x = event.clientX;
    mouseCoordinates.y = event.clientY;
});

window.addEventListener("mousedown", (event) => {
    keys.mouse.pressed = true;
});

window.addEventListener("mouseup", (event) => {
    keys.mouse.pressed = false;
});

window.addEventListener("keydown", (event) => {
switch (event.key){
    case "w":
        keys.w.pressed = true;
        break;
    case "s":
        keys.s.pressed = true;
        break;
    case "a":
        keys.a.pressed = true;
        break;
    case "d":
        keys.d.pressed = true;
        break;
}
});

window.addEventListener("keyup", (event) => {
    switch (event.key){
        case "w":
            keys.w.pressed = false;
            break;
        case "s":
            keys.s.pressed = false;
            break;
        case "a":
            keys.a.pressed = false;
            break;
        case "d":
            keys.d.pressed = false;
            break;
    }
});





function animate() {
    context.clearRect(0,0, WIDTH, HEIGHT);
    scene.drawScene();
    requestAnimationFrame(animate);
}

animate();


