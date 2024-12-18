class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }
    subtract(vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    }
    scale(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    distance_to(to) {
        return this.subtract(to).length();
    }
    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
    normalized() {
        const length = this.length();
        if (length < 1)
            return this;
        return new Vector2D(this.x / length, this.y / length);
    }
    direction_to(to) {
        const directionVector = to.subtract(this);
        if (directionVector.equals(Vector2D.ZERO())) {
            return this.normalized();
        }
        else
            return directionVector.normalized();
    }
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }
    move_toward(to, by) {
        let distanceToVector = to.subtract(this).length();
        if (distanceToVector <= by)
            return to;
        return this.direction_to(to).scale(by).add(this);
    }
    copy() {
        return new Vector2D(this.x, this.y);
    }
    lerp(to, t) {
        if (t < 0 || t > 1)
            throw new RangeError("t must be between 0 and 1.");
        // (1-t)p1 + t*p2
        return this.scale(1 - t).add(to.scale(t));
    }
}
Vector2D.ZERO = () => { return new Vector2D(0, 0); };
Vector2D.UP = () => { return new Vector2D(0, -1); };
Vector2D.DOWN = () => { return new Vector2D(0, 1); };
Vector2D.LEFT = () => { return new Vector2D(-1, 0); };
Vector2D.RIGHT = () => { return new Vector2D(1, 0); };
export default Vector2D;
