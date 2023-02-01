const canvas = document.querySelector("#game");
let context = canvas.getContext("2d");
const WIDTH = canvas.width = 1700;
const HEIGHT = canvas.height = 900;

let joyMove;
let joyShoot;

if(isMobile()){
    joyMove = new JoyStick('joyMove', {width: 120, height: 120});
    joyShoot = new JoyStick('joyShoot', {width: 120, height: 120});
}


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
        x: WIDTH / 2,
        y: 150
    },
    direction: {
        x: 0,
        y: 0,
    },
    speed: 10,
    framesCount: 4
});

scene.addObject(player);

const fireSpirit = new Enemy({
    imageSrc: "sprites/fireSpirit.png",
    position: {
        x: WIDTH / 2,
        y: HEIGHT / 2 + 200
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
        x: WIDTH / 2 - 300,
        y: HEIGHT / 2 + 100
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

let animate

if (isMobile()) {

    animate = function () {
        switch (joyMove.GetDir()){
            case "N":
                keys.w.pressed = true;

                keys.s.pressed = false;
                keys.a.pressed = false;
                keys.d.pressed = false;
                break;
            case "NE":
                keys.w.pressed = true;
                keys.d.pressed = true;

                keys.s.pressed = false;
                keys.a.pressed = false;
                break;
            case "NW":
                keys.w.pressed = true;
                keys.a.pressed = true;

                keys.s.pressed = false;
                keys.d.pressed = false;
                break;
            case "S":
                keys.s.pressed = true;

                keys.w.pressed = false;
                keys.a.pressed = false;
                keys.d.pressed = false;
                break;
            case "SE":
                keys.s.pressed = true;
                keys.d.pressed = true;

                keys.w.pressed = false;
                keys.a.pressed = false;
                break;
            case "SW":
                keys.s.pressed = true;
                keys.a.pressed = true;

                keys.w.pressed = false;
                keys.d.pressed = false;
                break;
            case "W":
                keys.a.pressed = true;

                keys.w.pressed = false;
                keys.s.pressed = false;
                keys.d.pressed = false;
                break;
            case "E":
                keys.d.pressed = true;

                keys.w.pressed = false;
                keys.s.pressed = false;
                keys.a.pressed = false;
                break;
            case "C":
                keys.w.pressed = false;
                keys.s.pressed = false;
                keys.a.pressed = false;
                keys.d.pressed = false;
                break;
        }
        context.clearRect(0, 0, WIDTH, HEIGHT);
        scene.drawScene();
        requestAnimationFrame(animate);
    }


} else {
    window.addEventListener("mousemove", (event) => {
        mouseCoordinates.x = event.clientX;
        mouseCoordinates.y = event.clientY;
    });

    window.addEventListener("mousedown", (event) => {
        keys.mouse.pressed = true;
    });

    window.addEventListener("mouseup", (event) => {
        keys.mouse.pressed = false;
        keys.mouse.clickEnded = true;
    });

    window.addEventListener("keydown", (event) => {
        switch (event.key) {
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
        switch (event.key) {
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


    animate = function() {
        context.clearRect(0, 0, WIDTH, HEIGHT);
        scene.drawScene();
        requestAnimationFrame(animate);
    }
}

animate();

function isMobile(){
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}


