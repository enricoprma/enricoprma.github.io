class Scene {
    constructor() {
        this.objects = [];
    }

    addObject = (object) => {
        this.objects.push(object)
    }

    drawScene = () => {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update();
        }
    }
}

class Sprite {
    constructor({imageSrc, position, framesCount = 1, framesHold = 5}) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.position = position;
        this.framesCount = framesCount;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = framesHold;
    }

    draw = () => {

        context.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesCount),
            0,
            this.image.width / this.framesCount,
            this.image.height,
            this.position.x,
            this.position.y,
            this.image.width / this.framesCount,
            this.image.height
        );

        this.framesElapsed++;

        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesCount - 1) {
                this.framesCurrent++;
            } else this.framesCurrent = 0;
        }
    }

    update = () => this.draw();

}

class LivingEntity extends Sprite {
    constructor({imageSrc, position, direction, speed, framesCount, framesHold = 5}) {
        super({imageSrc, position, framesCount, framesHold});
        this.direction = direction;
        this.speed = speed;
    }
}

class Enemy extends LivingEntity {
    constructor({imageSrc, position, direction, speed, framesCount, framesHold = 5}) {
        super({imageSrc, position, direction, speed, framesCount, framesHold});
        this.direction = direction;
        this.timeElapsed = 0;
        this.maxTime = 400
    }

    update = () => {

        if (this.timeElapsed < this.maxTime / 4) {
            this.position.x += this.direction.x * this.speed;
            this.timeElapsed++;
        }
        if (this.timeElapsed < this.maxTime / 2 && this.timeElapsed >= this.maxTime / 4) {
            this.position.y += -this.direction.y * this.speed;
            this.timeElapsed++;
        }

        if (this.timeElapsed < this.maxTime / 4 * 3 && this.timeElapsed >= this.maxTime / 2) {
            this.position.x += -this.direction.x * this.speed;
            this.timeElapsed++;
        }

        if (this.timeElapsed < this.maxTime && this.timeElapsed >= this.maxTime / 4 * 3) {
            this.position.y += this.direction.y * this.speed;
            this.timeElapsed++;
        }

        if (this.timeElapsed === this.maxTime) this.timeElapsed = 0;

        this.draw();
    }
}

class Player extends LivingEntity {
    constructor({imageSrc, position, direction, speed, shoot_cooldown = 0, framesCount}) {
        super({imageSrc, position, framesCount});
        this.direction = direction;
        this.speed = speed;
        this.shoot_cooldown = shoot_cooldown;
    }

    moveLeft = () => this.direction.x += -1;
    moveRight = () => this.direction.x += 1;
    moveUp = () => this.direction.y += -1;
    moveDown = () => this.direction.y += 1;

    move = () => {
        this.direction.x = 0;
        this.direction.y = 0;

        if (keys.w.pressed) this.moveUp();
        if (keys.s.pressed) this.moveDown();
        if (keys.a.pressed) this.moveLeft();
        if (keys.d.pressed) this.moveRight();

        if (keys.w.pressed && keys.s.pressed) this.direction.y = 0;
        if (keys.a.pressed && keys.d.pressed) this.direction.x = 0;

        this.position.x += this.direction.x * this.speed;
        this.position.y += this.direction.y * this.speed;

        // gradually decrease velocity if no key is pressed: smooth stop
        if (!keys.w.pressed && !keys.s.pressed && !keys.a.pressed && !keys.d.pressed) {
            if (this.direction.x > 0) {
                this.direction.x -= 0.01;
                if (this.direction.x < 0) this.direction.x = 0;
            }

            if (this.direction.x < 0) {
                this.direction.x += 0.01;
                if (this.direction.x > 0) this.direction.x = 0;
            }

            if (this.direction.y > 0) {
                this.direction.y -= 0.01;
                if (this.direction.y < 0) this.direction.y = 0;
            }
            if (this.direction.y < 0) {
                this.direction.y += 0.01;
                if (this.direction.y > 0) this.direction.y = 0;
            }
        }

        this.draw();
    }

    useWeapon = () => {

        /* ---------------- Change Sprite ----------------*/

        if (keys.mouse.pressed) {
            this.image.src = "sprites/playerBowShoot.png"
            this.framesCount = 5;
        }
        else{
            this.image.src = "sprites/playerIdle.png"
            this.framesCount = 4;

        }


        if (this.shoot_cooldown === 0) {
            if (keys.mouse.pressed) {
                this.shoot_cooldown = 30;

                /*------------------- Calculate direction to shoot to ----------------------------------------------*/
                                                                                                                    //
                // direction vector towards cursor                                                                  //
                let x = (getMousePos(canvas).x) - (this.position.x + ((this.image.width / 2) / this.framesCount));  //
                let y = (getMousePos(canvas).y) - (this.position.y + this.image.height / 2);                        //
                                                                                                                    //
                //length of vector                                                                                  //
                let d = Math.sqrt(x * x + y * y);                                                                //
                                                                                                                    //
                //normalize vector                                                                                  //
                x = (1 / d) * x;                                                                                    //
                y = (1 / d) * y;                                                                                    //
                                                                                                                    //
                /* -------------------------------------------------------------------------------------------------*/

                const projectile = new Projectile({
                    imageSrc: "sprites/arrow.png",
                    position: {
                        x: this.position.x + ((this.image.width / 2) / this.framesCount),
                        y: this.position.y + this.image.height / 2
                    },
                    direction: {
                        x: x,
                        y: y
                    },
                    speed: 15,
                    rotation: Math.atan2(y, x),
                    framesCount: 2
                })

                scene.addObject(projectile);

            }
        } else {
            this.shoot_cooldown--;
        }
    }

    update = () => {
        this.move();
        this.useWeapon();
    }
}

class Projectile extends LivingEntity {
    constructor({imageSrc, position, direction, speed, rotation, framesCount}) {
        super({imageSrc, position, direction, speed, framesCount});
        this.rotation = rotation;
    }

    update = () => {
        this.position.x += this.direction.x * this.speed;
        this.position.y += this.direction.y * this.speed;

        context.save();

        context.translate(this.position.x, this.position.y);
        context.rotate(this.rotation);
        context.translate(-this.position.x, -this.position.y);
        this.draw();

        context.restore();

    }
}

function getMousePos(canvas) {
    return {
        x: mouseCoordinates.x - canvas.offsetLeft + WIDTH/2,
        y: mouseCoordinates.y - canvas.offsetTop + HEIGHT/2
    };
}




