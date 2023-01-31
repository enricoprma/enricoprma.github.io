let canvas = document.getElementById('image')
let context = canvas.getContext('2d');


let image = new Image();
image.src = "placeholder.jpeg"; // placeholder image source

let original;

// draw image when window is loaded
window.onload = function () {
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    original = {  // get original imageData and dimensions for undo-function
        context: context.getImageData(0, 0, image.width, image.height),
        width: image.width,
        height: image.height
    };
    drawHistogram();
}

/* ****** SLIDERS ****** */

// put initial value of slider on associated label
let sliderLabels = document.getElementsByClassName('sliderLabel');
for(let i = 0; i<sliderLabels.length; i++){
    sliderLabels[i].innerText = document.getElementsByClassName('sliders')[i].value;
}

/* *** update value on label to associated slider value *** */

//black and white
document.getElementById('blackAndWhiteThreshold').oninput = function (){
    sliderLabels[0].innerText = this.value;
}

//contrast
document.getElementById('amountOfContrast').oninput = function (){
    sliderLabels[1].innerText = this.value;
}

//rgb initial
let sliderLabelsRGB = document.getElementsByClassName('sliderLabelRGB');
for(let i = 0; i<sliderLabelsRGB.length; i++){
    sliderLabelsRGB[i].innerText = document.getElementsByClassName('rgbScale')[i].value + "x";
}
//rgb- update values
document.getElementById('redSlider').oninput = function (){ // red
    sliderLabelsRGB[0].innerText = this.value + "x";
}
document.getElementById('greenSlider').oninput = function (){ // green
    sliderLabelsRGB[1].innerText = this.value + "x";
}
document.getElementById('blueSlider').oninput = function (){ //
    sliderLabelsRGB[2].innerText = this.value + "x";
}


/* ***** Functions ***** */

function undo() {
    // set dimensions to original
    canvas.width = original.width;
    canvas.height = original.height;

    // set image to original
    context.putImageData(original.context, 0, 0, 0, 0, canvas.width, canvas.height);
}

//Upload
document.getElementById('upload').onchange = function(upload) {
    // input image
    image.src = URL.createObjectURL(upload.target.files[0]);

    image.onload = function (){

        // replace image
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0,0);

        // replace values for potential undo later on
        original.width = canvas.width;
        original.height = canvas.height;
        original.context = context.getImageData(0,0, canvas.width, canvas.height);
    }
};

// Download
document.getElementById('download').onclick = function(){
    let link = document.getElementById('link');

    // link to image & file format
    link.href = canvas.toDataURL('image/png');

    // image name
    link.download = 'photo_editor_image.png';

    // "click" the link to download image
    link.click();
}

// used to restrict pixel-values from exceeding 255 or falling below 0
function restrict(value) {
    if (value < 0) value = 0;
    else if (value > 255) value = 255;
    return value
}


function toGreyScale() {

    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < pixel.data.length; i += 4) {

        let greyFactor = 0.299 * pixel.data[i] + 0.587 * pixel.data[i + 1] + 0.114 * pixel.data[i + 2];

        pixel.data[i] = greyFactor;
        pixel.data[i + 1] = greyFactor;
        pixel.data[i + 2] = greyFactor;
    }
    context.putImageData(pixel, 0, 0, 0, 0, canvas.width, canvas.height);
}

function blackAndWhite() {
    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    let threshold = parseInt(sliderLabels[0].innerText);

    for (let i = 0; i < pixel.data.length; i += 4) {

        let averageLuminosity = 0.299 * pixel.data[i] + 0.587 * pixel.data[i + 1] + 0.114 * pixel.data[i + 2];

        if (averageLuminosity >= threshold) {
            pixel.data[i] = 255;
            pixel.data[i + 1] = 255;
            pixel.data[i + 2] = 255;
        } else {
            pixel.data[i] = 0;
            pixel.data[i + 1] = 0;
            pixel.data[i + 2] = 0;
        }
    }
    context.putImageData(pixel, 0, 0, 0, 0, canvas.width, canvas.height);

}

function changeBrightness(brightnessFactor) {
    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < pixel.data.length; i += 4) {
        pixel.data[i] = restrict(pixel.data[i] + brightnessFactor);
        pixel.data[i + 1] = restrict(pixel.data[i + 1] + brightnessFactor);
        pixel.data[i + 2] = restrict(pixel.data[i + 2] + brightnessFactor);
    }
    context.putImageData(pixel, 0, 0, 0, 0, canvas.width, canvas.height);
}

function changeContrast() {
    let contrast = parseInt(document.getElementById('amountOfContrast').value);

    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    // compute contrast correction factor
    let factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < pixel.data.length; i += 4) {
        pixel.data[i] = restrict(factor * (pixel.data[i] - 128) + 128);
        pixel.data[i + 1] = restrict(factor * (pixel.data[i + 1] - 128) + 128);
        pixel.data[i + 2] = restrict(factor * (pixel.data[i + 2] - 128) + 128);
    }

    context.putImageData(pixel, 0, 0, 0, 0, canvas.width, canvas.height);

}

function scaleRGB() {
    let red = parseFloat(document.getElementById('redSlider').value);
    let green = parseFloat(document.getElementById('greenSlider').value);
    let blue = parseFloat(document.getElementById('blueSlider').value);

    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < pixel.data.length; i += 4) {
        pixel.data[i] *= red;
        pixel.data[i + 1] *= green;
        pixel.data[i + 2] *= blue;
    }
    context.putImageData(pixel, 0, 0, 0, 0, canvas.width, canvas.height);
}

function negative() {
    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < pixel.data.length; i += 4) {
        pixel.data[i] = 255 - pixel.data[i];
        pixel.data[i + 1] = 255 - pixel.data[i + 1];
        pixel.data[i + 2] = 255 - pixel.data[i + 2];
    }
    context.putImageData(pixel, 0, 0, 0, 0, canvas.width, canvas.height);
}


function rotateBy90() {
    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    let w = canvas.width;
    let h = canvas.height;

    // create new image data with switched height and width
    let newImage = context.createImageData(h, w)

    // walk over height
    for (let y = 0; y < w; y++) {
        // walk over width
        for (let x = 0; x < h; x++) {

            for (let color = 0; color < 4; color++) {
                const pixelDataAt = (x, y) => pixel.data[color + 4 * (w * x + y)]

                // formula given in the lecture
                newImage.data[((h * y) + x) * 4 + color] = pixelDataAt(h - x - 1, y);

            }
        }
    }
    // adjust canvas dimensions
    canvas.width = h;
    canvas.height = w;

    context.putImageData(newImage, 0, 0, 0, 0, canvas.width, canvas.height);
}

function flipHorizontally() {
    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    let w = canvas.width;
    let h = canvas.height;

    // create new image data
    let newImage = context.createImageData(w, h);

    // walk over height
    for (let y = 0; y < h; y++) {
        // walk over width
        for (let x = 0; x < w; x++) {

            for (let color = 0; color < 4; color++) {
                const pixelDataAt = (x, y) => pixel.data[color + 4 * (w * y + x)]

                // formula given in the lecture
                newImage.data[((w * y) + x) * 4 + color] = pixelDataAt(w - x - 1, y);

            }
        }
    }
    context.putImageData(newImage, 0, 0, 0, 0, canvas.width, canvas.height);
}

function flipVertically() {
    rotateBy90();
    rotateBy90();
    flipHorizontally();
}

function scaleBy2() {

    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);

    let w = canvas.width;
    let h = canvas.height;

    // create new image data with scaled-up dimensions
    let newImage = context.createImageData(w * 2, h * 2);

    // walk over height
    for (let y = 0; y < h * 2; y++) {
        // walk over width
        for (let x = 0; x < w * 2; x++) {

            for (let color = 0; color < 4; color++) {
                const pixelDataAt = (x, y) => pixel.data[color + 4 * (w * y + x)]

                // formula given in the lecture
                newImage.data[(w * 2 * y + x) * 4 + color] = pixelDataAt(Math.floor(x / 2), Math.floor(y / 2));
            }
        }
    }
    // adjust canvas dimensions
    canvas.width = w * 2;
    canvas.height = h * 2;

    context.putImageData(newImage, 0, 0, 0, 0, canvas.width, canvas.height);
}

function scaleBy05() {

    let w = 0;
    let h = 0;

    // adjust image so that its dimensions are even numbers
    if (canvas.width % 2 !== 0 && canvas.height % 2 !== 0) {
        w++;
        h++;
    } else if (canvas.width % 2 !== 0) {
        w++;
    } else if (canvas.height % 2 !== 0) {
        h++
    }

    let pixel = context.getImageData(0, 0, canvas.width + w, canvas.height + h);

    // scale down dimension by 0.5
    w += Math.floor(0.5 * canvas.width);
    h += Math.floor(0.5 * canvas.height);

    // create new image data with scaled-down dimensions
    let newImage = context.createImageData(w, h);

    // walk over height
    for (let y = 0; y < h; y++) {
        // walk over width
        for (let x = 0; x < w; x++) {

            for (let color = 0; color < 4; color++) {
                const pixelDataAt = (x, y) => pixel.data[color + 4 * (w * y + x)]

                // formula given in the lecture
                newImage.data[(w * y + x) * 4 + color] = pixelDataAt(x * 2, y * 4);
            }
        }
    }

    // adjust canvas dimensions
    canvas.width = w;
    canvas.height = h;

    context.putImageData(newImage, 0, 0, 0, 0, canvas.width, canvas.height);
}


// applies a filter to the image on the canvas using kernel convolution
// returns an array containing the image data after applying the given filter
function applyFilter(filter) {
    let w = canvas.width;
    let h = canvas.height;

    let size = Math.sqrt(filter.length); // e.g. 3 for 3x3 kernel, 5 for 5x5 kernel

    let offset = Math.floor(size / 2); // radius of kernel

    let filterLength = filter.length; // length of kernel e.g. 9 for 3x3 kernel

    let pixel = context.getImageData(0, 0, w, h);

    let newImage = new Array(w*h*4);  // NORMAL Array so that values can get negative (for Sobel)

    // walk over height
    for (let y = 0; y < h; y++) {
        // walk over width
        for (let x = 0; x < w; x++) {

            let sumR = 0;
            let sumG = 0;
            let sumB = 0;

            const pixelRDataAt = (x, y) => pixel.data[ 4 * (w * y + x)];        // red
            const pixelGDataAt = (x, y) => pixel.data[ 1 + 4 * (w * y + x)];    // green
            const pixelBDataAt = (x, y) => pixel.data[ 2 + 4 * (w * y + x)];    // blue

            for (let i = 0, col = -offset, row = -offset; i < filterLength; i++) {

                sumR += filter[i] * pixelRDataAt(x+col, y+row);
                sumG += filter[i] * pixelGDataAt(x+col, y+row);
                sumB += filter[i] * pixelBDataAt(x+col, y+row);

                if (col === offset) { // if one row is done
                    col = -col;  // go to first column
                    row++; // go to next row
                }
                else col++; // else go to next column
            }
            // place values in new Array
            newImage[(w * y + x) * 4] = sumR;
            newImage[(w * y + x) * 4 + 1] = sumG;
            newImage[(w * y + x) * 4 + 2] = sumB;
            newImage[(w * y + x) * 4 + 3] = 255;
        }
    }
    return newImage;
}


function gaussFilter(size) {

    let kernel;

    if (size === 3) kernel = [
        1 / 16, 2 / 16, 1 / 16,
        2 / 16, 4 / 16, 2 / 16,
        1 / 16, 2 / 16, 1 / 16];

    else kernel = [
        1 / 273, 4 / 273, 7 / 273, 4 / 273, 1 / 273,
        4 / 273, 16 / 273, 26 / 273, 16 / 273, 4 / 273,
        7 / 273, 26 / 273, 41 / 273, 26 / 273, 7 / 273,
        4 / 273, 16 / 273, 26 / 273, 16 / 273, 4 / 273,
        1 / 273, 4 / 273, 7 / 273, 4 / 273, 1 / 273];

    let blurredImage = context.createImageData(canvas.width, canvas.height); // imageData array

    blurredImage.data.set(new Uint8ClampedArray(applyFilter(kernel)));

    context.putImageData(blurredImage, 0, 0, 0, 0, canvas.width, canvas.height);
}

 function sobelFilter() {
    let kernel1 = [1, 0, -1, 2, 0, -2, 1, 0, -1];
    let kernel2 = [1, 2, 1, 0, 0, 0, -1, -2, -1];

     toGreyScale();

    let Gx = applyFilter(kernel1); // image filtered with kernel1
    let Gy = applyFilter(kernel2); // image filtered with kernel2

    let w = canvas.width;
    let h = canvas.height;

    let filteredImg = context.createImageData(w, h);

    // walk over height
    for (let y = 0; y < h; y++) {
        // walk over width
        for (let x = 0; x < w; x++) {

            // compute total magnitude G = |Gx| + |Gy|
            let G =  Math.abs(Gx[(w * y + x) * 4]) + Math.abs(Gy[(w * y + x) * 4])

            // normalize value
            G = G/4;

            filteredImg.data[(w * y + x) * 4] = G;
            filteredImg.data[(w * y + x) * 4 + 1] = G;
            filteredImg.data[(w * y + x) * 4 + 2] = G;
            filteredImg.data[(w * y + x) * 4 + 3] = 255;

        }
    }
    context.putImageData(filteredImg, 0, 0, 0, 0, w, h);
}

/* ***** Histogram ***** */

function countRGBValues(){
    let pixel = context.getImageData(0, 0, canvas.width, canvas.height);
    let w = image.width;
    let h = image.height;
    let redPortion = new Array(256);
    let greenPortion = new Array(256);
    let bluePortion = new Array(256);
    let biggestPortion = 0;
    redPortion.fill(0);
    greenPortion.fill(0);
    bluePortion.fill(0);

    for(let y = 0; y < h; y++) {
        for(let x = 0; x < w; x++) {
            for(let i = 0; i < 256;i++) {
                if(pixel.data[((w * y) + x) * 4 ] === i){
                    redPortion[i] +=1;
                }
                if(pixel.data[((w * y) + x) * 4 +1] === i){
                    greenPortion[i] +=1;
                }
                if(pixel.data[((w * y) + x) * 4 +2] === i){
                    bluePortion[i] +=1;
                }

                if(biggestPortion < redPortion[i]){
                    biggestPortion = redPortion[i];
                }
                if(biggestPortion < greenPortion[i]){
                    biggestPortion = greenPortion[i];
                }
                if(biggestPortion < bluePortion[i]){
                    biggestPortion = bluePortion[i];
                }
            }
        }
    }
    return {
        red: redPortion,
        green: greenPortion,
        blue: bluePortion,
        biggest: biggestPortion
    };
}

function drawHistogram(){
    let portions = countRGBValues();
    let histogramCanvas;
    let portionArray;
    let color;
    for(let i = 0; i < 3; i++){
        switch(i){
            case 0: histogramCanvas = document.getElementById('histogramRed');
                portionArray = portions.red.slice();
                color = "#ff4040";
                break;
            case 1: histogramCanvas = document.getElementById('histogramGreen');
                portionArray = portions.green.slice();
                color = "#40ff40";
                break;
            case 2: histogramCanvas = document.getElementById('histogramBlue');
                portionArray = portions.blue.slice();
                color = "#4040ff";
                break;
        }
        histogramCanvas.width = 256;
        histogramCanvas.height = 200;

        let histogramContext = histogramCanvas.getContext('2d');
        let graphHeight = portions.biggest/(histogramCanvas.height-20);
        histogramContext.clearRect(0,0, histogramCanvas.width, histogramCanvas.height);
        histogramContext.strokeStyle = color;

        for(let j = 0; j < 256; j++){
            histogramContext.beginPath();
            histogramContext.moveTo(j,histogramCanvas.height);
            histogramContext.lineTo(j,histogramCanvas.height-(portionArray[j]/graphHeight));
            histogramContext.closePath();
            histogramContext.stroke();
        }
    }
}

