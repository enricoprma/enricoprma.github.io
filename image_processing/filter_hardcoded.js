function gaussHard(size) {
    let w = canvas.width;
    let h = canvas.height;

    let pixel = context.getImageData(0, 0, w, h);

    let newImage = context.createImageData(w, h);

    let kernel;

    switch (size) {
        case 3: // for 3x3 filter

            kernel = [
                1 / 16, 2 / 16, 1 / 16,
                2 / 16, 4 / 16, 2 / 16,
                1 / 16, 2 / 16, 1 / 16];

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    for (let color = 0; color < 4; color++) {

                        const pixelDataAt = (x, y) => pixel.data[color + 4 * (w * y + x)];

                        newImage.data[(w * y + x) * 4 + color] =

                            kernel[0] * pixelDataAt(x - 1, y - 1)
                            + kernel[1] * pixelDataAt(x, y - 1)
                            + kernel[2] * pixelDataAt(x + 1, y - 1)

                            + kernel[3] * pixelDataAt(x - 1, y)
                            + kernel[4] * pixelDataAt(x, y)
                            + kernel[5] * pixelDataAt(x + 1, y)

                            + kernel[6] * pixelDataAt(x - 1, y + 1)
                            + kernel[7] * pixelDataAt(x, y + 1)
                            + kernel[8] * pixelDataAt(x + 1, y + 1)
                    }
                }
            }
            break;

        case 5: // for 5x5 filter

            kernel = [
                1 / 273, 4 / 273, 7 / 273, 4 / 273, 1 / 273,
                4 / 273, 16 / 273, 26 / 273, 16 / 273, 4 / 273,
                7 / 273, 26 / 273, 41 / 273, 26 / 273, 7 / 273,
                4 / 273, 16 / 273, 26 / 273, 16 / 273, 4 / 273,
                1 / 273, 4 / 273, 7 / 273, 4 / 273, 1 / 273];

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    for (let color = 0; color < 4; color++) {

                        const pixelDataAt = (x, y) => pixel.data[color + 4 * (w * y + x)];

                        newImage.data[(w * y + x) * 4 + color] =

                            kernel[0] * pixelDataAt(x - 2, y - 2)
                            + kernel[1] * pixelDataAt(x - 1, y - 2)
                            + kernel[2] * pixelDataAt(x, y - 2)
                            + kernel[3] * pixelDataAt(x + 1, y - 2)
                            + kernel[4] * pixelDataAt(x + 2, y - 2)

                            + kernel[5] * pixelDataAt(x - 2, y - 1)
                            + kernel[6] * pixelDataAt(x - 1, y - 1)
                            + kernel[7] * pixelDataAt(x, y - 1)
                            + kernel[8] * pixelDataAt(x + 1, y - 1)
                            + kernel[9] * pixelDataAt(x + 2, y - 1)

                            + kernel[10] * pixelDataAt(x - 2, y)
                            + kernel[11] * pixelDataAt(x - 1, y)
                            + kernel[12] * pixelDataAt(x, y)
                            + kernel[13] * pixelDataAt(x + 1, y)
                            + kernel[14] * pixelDataAt(x + 2, y)

                            + kernel[15] * pixelDataAt(x - 2, y + 1)
                            + kernel[16] * pixelDataAt(x - 1, y + 1)
                            + kernel[17] * pixelDataAt(x, y + 1)
                            + kernel[18] * pixelDataAt(x + 1, y + 1)
                            + kernel[19] * pixelDataAt(x + 2, y + 1)

                            + kernel[20] * pixelDataAt(x - 2, y + 2)
                            + kernel[21] * pixelDataAt(x - 1, y + 2)
                            + kernel[22] * pixelDataAt(x, y + 2)
                            + kernel[23] * pixelDataAt(x + 1, y + 2)
                            + kernel[24] * pixelDataAt(x + 2, y + 2)


                    }
                }
            }
            break;
    }

    context.putImageData(newImage, 0, 0, 0, 0, w, h);
}

function sobelHard() {
    let filter1 = [1, 0, -1, 2, 0, -2, 1, 0, -1];

    let filter2 = [1, 2, 1, 0, 0, 0, -1, -2, -1];

    let w = canvas.width;
    let h = canvas.height;

    toGreyScale();

    let pixel = context.getImageData(0, 0, w, h);

    const pixelDataAt = (x, y) => pixel.data[4 * (w * y + x)];

    let filteredImg = context.createImageData(w, h);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {

            // get value of pixel after applying Gx filter
            let Gx =
                filter1[0] * pixelDataAt(x - 1, y - 1) +
                filter1[1] * pixelDataAt(x, y - 1) +
                filter1[2] * pixelDataAt(x + 1, y - 1) +

                filter1[3] * pixelDataAt(x - 1, y) +
                filter1[4] * pixelDataAt(x, y) +
                filter1[5] * pixelDataAt(x + 1, y) +

                filter1[6] * pixelDataAt(x - 1, y + 1) +
                filter1[7] * pixelDataAt(x, y + 1) +
                filter1[8] * pixelDataAt(x + 1, y + 1);

            // get value of pixel after applying Gy filter
            let Gy =
                filter2[0] * pixelDataAt(x - 1, y - 1) +
                filter2[1] * pixelDataAt(x, y - 1) +
                filter2[2] * pixelDataAt(x + 1, y - 1) +

                filter2[3] * pixelDataAt(x - 1, y) +
                filter2[4] * pixelDataAt(x, y) +
                filter2[5] * pixelDataAt(x + 1, y) +

                filter2[6] * pixelDataAt(x - 1, y + 1) +
                filter2[7] * pixelDataAt(x, y + 1) +
                filter2[8] * pixelDataAt(x + 1, y + 1);

            let G = Math.sqrt(Gx * Gx + Gy * Gy); // compute total magnitude

            G /= 4; // normalize value;

            filteredImg.data[(w * y + x) * 4] = G;
            filteredImg.data[(w * y + x) * 4 + 1] = G;
            filteredImg.data[(w * y + x) * 4 + 2] = G;
            filteredImg.data[(w * y + x) * 4 + 3] = 255;
        }
    }
    context.putImageData(filteredImg, 0, 0, 0, 0, w, h);
}