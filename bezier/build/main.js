import Vector2D from "./utils/Vector2D.js";
import Input from "./utils/Input.js";
import { changeHue } from "./utils/ChangeRGBHue.js";
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
const createCurveButton = document.getElementById("createCurveButton");
const curveSelection = document.getElementById("curveSelection");
const fuseBezierButton = document.getElementById("fuseBezier");
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
    createCurveButton.addEventListener("click", () => {
        let id = curves.length;
        const newCurve = [];
        function appendNextRadio(id) {
            const radio = createRadioButton(id, "curves", "Curve " + id, () => {
                curvesIndex = parseInt(id);
                console.log(curvesIndex);
            });
            const radioButton = document.createElement("div");
            radioButton.className = "radioButton";
            radioButton.appendChild(radio.input);
            radioButton.appendChild(radio.label);
            curveSelection.appendChild(radioButton);
            return radio.input;
        }
        if (curveSelection.childElementCount == 0) {
            //add first radio
            id = 0;
            appendNextRadio((id++).toString());
            curveSelection.style.display = "flex";
            //add second radio
            curves.push(newCurve);
            const secondRadio = appendNextRadio(id.toString());
            secondRadio.click();
            return;
        }
        curves.push(newCurve);
        const radio = appendNextRadio(id.toString());
        radio.click();
    });
    fuseBezierButton.addEventListener("click", () => {
        fuseBezierCurve(curves[0], curves[1]);
    });
};
function createRadioButton(id, group, name, onchange) {
    const input = document.createElement("input");
    input.type = "radio";
    input.id = id;
    input.name = group;
    input.onchange = () => onchange();
    const label = document.createElement("label");
    label.htmlFor = id;
    label.innerHTML = name;
    return { input, label };
}
const points = [];
const curves = [points];
let curvesIndex = 0;
function update() {
    if (!ctx)
        return;
    const currentCurve = curves[curvesIndex];
    handleInput(currentCurve);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (curves.every(curve => curve.length < 1))
        return;
    // filter out curves that are empty,
    curves.filter(curve => curve.length > 0).forEach((curve, index) => {
        let color = changeHue("#33B14C", 30 * index);
        if (curve.length > 0) {
            drawBezierCurve(curve, color);
        }
    });
    if (currentCurve.length) {
        if (showConstruction)
            drawConstruction(currentCurve, t, "white");
        currentCurve.forEach(point => drawCircle(point));
    }
}
/** Aufgabe 1 **/
function deCasteljau(points, t) {
    if (t < 0 || t > 1)
        throw new RangeError("t must be between 0 and 1.");
    if (points.length === 1) {
        return {
            b: points[0],
            splitCurve: {
                left: [points[0]],
                right: [points[0]]
            }
        };
    }
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        newPoints.push(points[i].lerp(points[i + 1], t));
    }
    const result = deCasteljau(newPoints, t);
    const leftPoints = [points[0], ...result.splitCurve.left];
    const rightPoints = [...result.splitCurve.right, points[points.length - 1]];
    return {
        b: result.b,
        splitCurve: {
            left: leftPoints,
            right: rightPoints
        }
    };
}
function pointToLineDistance(point, a, b) {
    const ab = b.subtract(a);
    const ap = point.subtract(a);
    const abLength = ab.length();
    // if start and end point are the same, distance is the distance to the point
    if (abLength === 0) {
        return ap.length();
    }
    // project ap onto ab to find the parameter t for the closest point (foot of the perpendicular)
    const t = (ap.x * ab.x + ap.y * ab.y) / (abLength * abLength);
    // foot point on the line
    const foot = new Vector2D(a.x + t * ab.x, a.y + t * ab.y);
    return point.distance_to(foot);
}
function howFlatIsCurve(points) {
    let furthestDistance = 0;
    points.forEach(point => {
        let distance = pointToLineDistance(point, points[0], points[points.length - 1]);
        if (distance > furthestDistance)
            furthestDistance = distance;
    });
    return furthestDistance;
}
function drawBezierCurve(points, color) {
    if (howFlatIsCurve(points) > 0.01) {
        const splitCurve = deCasteljau(points, 0.5).splitCurve;
        drawBezierCurve(splitCurve.left, color);
        drawBezierCurve(splitCurve.right, color);
    }
    else
        drawLine(points[0], points[points.length - 1], color);
}
/** Aufgabe 2
/** In window.onload finden Sie die Logik für das Eingeben von t **/
// basically deCasteljau() without splitting + drawing of all points and connections
function drawConstruction(points, t, bColor) {
    if (t < 0 || t > 1)
        throw new RangeError("t must be between 0 and 1.");
    if (points.length === 1) {
        const pointOnCurve = points[0];
        drawCircle(pointOnCurve, 5, bColor);
        ctx.font = "12px Nunito";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.fillText("b(t)", pointOnCurve.x, pointOnCurve.y - 10);
        return;
    }
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        // connect control points
        drawLine(points[i], points[i + 1], "#4C4C4A", points.length * 2 < 3 ? points.length * 2 : 3);
        newPoints.push(points[i].lerp(points[i + 1], t));
    }
    // draw points after, so they don't get painted over by the lines
    for (const point of points) {
        drawCircle(point, points.length * 2 < 10 ? points.length * 2 : 10);
    }
    drawConstruction(newPoints, t, bColor);
}
/** Aufgabe 3 **/
let currentDraggedPointIndex = -1;
let isDragging = false;
function handleInput(points) {
    let mousePos = Input.getMousePositionOnCanvas(canvas);
    let isMouseOnCanvas = (mousePos.x >= 0 && mousePos.x <= WIDTH && mousePos.y >= 0 && mousePos.y <= HEIGHT);
    const TOLERANCE = 20;
    // compareFn for sorting points based on distance to mouse-cursor
    const compareDistanceToMouse = (a, b) => {
        return a.distance_to(mousePos) - b.distance_to(mousePos);
    };
    if (!isMouseOnCanvas)
        return;
    /** Hinzufügen und Verschieben von Punkten **/
    if (Input.is_action_pressed("mouse-left")) {
        // If currently dragging, go on
        if (isDragging && currentDraggedPointIndex > -1) {
            points[currentDraggedPointIndex] = mousePos;
            return;
        }
        else {
            // No drag is going on, find points within tolerance
            const pointsUnderMouse = points.filter(point => mousePos.distance_to(point) <= TOLERANCE);
            // if there are points within tolerance, pick the closest and start dragging
            if (pointsUnderMouse.length > 0) {
                pointsUnderMouse.sort(compareDistanceToMouse);
                const nearestPoint = pointsUnderMouse[0];
                let indexNearestPoint = points.findIndex(point => point.equals(nearestPoint));
                isDragging = true;
                currentDraggedPointIndex = indexNearestPoint;
            }
            // No point in tolerance, create new point
            else
                points.push(mousePos);
        }
    }
    // left mouse is not pressed, stop drag if one was active
    else if (isDragging) {
        isDragging = false;
        currentDraggedPointIndex = -1;
    }
    /** Entfernen von Punkten **/
    if (Input.is_action_pressed("mouse-right")) {
        const pointsUnderMouse = points.filter(point => mousePos.distance_to(point) <= TOLERANCE);
        // if there are points within tolerance, pick the closest and delete it
        if (pointsUnderMouse.length > 0) {
            pointsUnderMouse.sort(compareDistanceToMouse);
            const nearestPoint = pointsUnderMouse[0];
            let indexNearestPoint = points.findIndex(point => point.equals(nearestPoint));
            points.splice(indexNearestPoint, 1);
        }
    }
}
function fuseBezierCurve(curve1, curve2) {
    if (curve1.length == 0 || curve2.length == 0)
        return;
    //c0 make end point of 1st curve the same as start point of 2nd curve
    curve2[0] = curve1[curve1.length - 1];
    if (curve1.length < 2 || curve2.length < 2)
        return;
    //c1 make first derivative the same in start point of 2nd curve as in end point of 1st curve
    const tangentVector = curve1[curve1.length - 1].subtract(curve1[curve1.length - 2]);
    curve2[1] = curve2[0].add(tangentVector);
}
function drawCircle(point, radius = 10, color = "#7F8E9D") {
    ctx.fillStyle = color;
    ctx.strokeStyle = "none";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
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
setInterval(() => update(), 1000 / 60);
//----------------------------------------------------------------------------------------------------------------------
