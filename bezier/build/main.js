import Input from "./utils/Input.js";
export const canvas = document.createElement("canvas");
const WIDTH = canvas.width = 1500;
const HEIGHT = canvas.height = 800;
const ctx = canvas ? canvas.getContext("2d") : null;
// Input-Fields
const tUserInput = document.getElementById("tUserInput");
let t = parseFloat(tUserInput.value);
const showConstructionInput = document.getElementById("showConstruction");
let showConstruction = showConstructionInput.checked;
const animateConstructionButton = document.getElementById("animateConstruction");
window.onload = () => {
    console.log("Loaded");
    document.getElementById("content").appendChild(canvas);
    Input.set_up_EventListeners();
    Input.add_action("mouse-left", ["mouseLeft"]);
    Input.add_action("mouse-right", ["mouseRight"]);
    tUserInput.addEventListener("input", () => {
        let newT = parseFloat(tUserInput.value);
        if (newT < 0) {
            newT = 0;
            tUserInput.value = "0";
        }
        else if (newT > 1) {
            newT = 1;
            tUserInput.value = "1";
        }
        t = newT;
    });
    showConstructionInput.addEventListener("change", () => {
        showConstruction = showConstructionInput.checked;
        tUserInput.parentElement.style.display = showConstruction ? "block" : "none";
        animateConstructionButton.style.display = showConstruction ? "block" : "none";
    });
    animateConstructionButton.addEventListener("click", () => {
        animateConstructionButton.disabled = true;
        tUserInput.disabled = true;
        showConstructionInput.disabled = true;
        t = 0;
        let interval = setInterval(() => {
            if (t < 1) {
                t += 0.01;
                if (t > 1)
                    t = 1;
                tUserInput.value = t.toString().substring(0, 4);
                return;
            }
            clearInterval(interval);
            animateConstructionButton.disabled = false;
            tUserInput.disabled = false;
            showConstructionInput.disabled = false;
        }, 50);
    });
};
const points = [];
function handleInput() {
    let mousePos = Input.getMousePositionOnCanvas(canvas);
    let isMouseOnCanvas = (mousePos.x >= 0 && mousePos.x <= WIDTH && mousePos.y >= 0 && mousePos.y <= HEIGHT);
    const TOLERANCE = 30;
    // compareFn for sorting points based on distance to mouse-cursor
    const compareDistanceToMouse = (a, b) => {
        return a.distance_to(mousePos) - b.distance_to(mousePos);
    };
    if (!isMouseOnCanvas)
        return;
    // find points within tolerance
    const pointsUnderMouse = points.filter(point => mousePos.distance_to(point) <= TOLERANCE);
    if (pointsUnderMouse.length > 0) {
        pointsUnderMouse.sort(compareDistanceToMouse);
        const nearestPoint = pointsUnderMouse[0];
        let indexNearestPoint = points.findIndex(point => point.equals(nearestPoint));
        if (Input.is_action_pressed("mouse-left")) {
            points[indexNearestPoint] = mousePos;
        }
        else if (Input.is_action_pressed("mouse-right")) {
            points.splice(indexNearestPoint, 1);
        }
    }
    else if (Input.is_action_pressed("mouse-left")) {
        points[points.length] = mousePos;
        console.log(points);
    }
}
function update() {
    if (!ctx)
        return;
    handleInput();
    if (points.length < 1)
        return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBezierCurve(points, 100);
    if (showConstruction)
        drawConstruction(points, t);
    for (let key in points) {
        drawCircle(points[key]);
    }
}
function drawBezierCurve(points, resolution) {
    let prev;
    for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        const pointOnCurve = deCasteljau(points, t);
        if (prev)
            drawLine(prev, pointOnCurve, "#DA4F3F");
        prev = pointOnCurve;
    }
}
function deCasteljau(points, t) {
    if (t < 0 || t > 1)
        throw new RangeError("t must be between 0 and 1.");
    if (points.length === 1)
        return points[0];
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        newPoints.push(points[i].lerp(points[i + 1], t));
    }
    return deCasteljau(newPoints, t);
}
// basically deCasteljau() + drawing of all points and connections
function drawConstruction(points, t) {
    if (t < 0 || t > 1)
        throw new RangeError("t must be between 0 and 1.");
    if (points.length === 1) {
        const pointOnCurve = points[0];
        drawCircle(pointOnCurve, 5, "#3FCADA");
        ctx.font = "12px Nunito";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.fillText("b(t)", pointOnCurve.x, pointOnCurve.y - 10);
        return;
    }
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        // connect control points
        drawLine(points[i], points[i + 1], "#4C4C4A", points.length * 2 < 2 ? points.length * 2 : 2);
        newPoints.push(points[i].lerp(points[i + 1], t));
    }
    // draw points after, so they don't get painted over by the lines
    for (const point of points) {
        drawCircle(point, points.length * 2 < 10 ? points.length * 2 : 10);
    }
    drawConstruction(newPoints, t);
}
function drawCircle(point, radius = 10, color = "#7F8E9D") {
    ctx.fillStyle = color;
    ctx.strokeStyle = "none";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
}
function drawRectangle(point, width = 10, height = 10, color = "green") {
    ctx.fillStyle = color;
    ctx.fillRect(point.x - width / 2, point.y - height / 2, width, height);
}
function drawLine(from, to, color = "#4C4C4A", width = 10) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
}
setInterval(() => { update(); }, 1000 / 60);
//----------------------------------------------------------------------------------------------------------------------
