module.exports = ratingColor;

/**
* Converts an RGB color value to HSV. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSV_color_space.
* Assumes r, g, and b are contained in the set [0, 255] and
* returns h, s, and v in the set [0, 1].
*
* @param Number r The red color value
* @param Number g The green color value
* @param Number b The blue color value
* @return Array The HSV representation
*/
function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}

/**
* Converts an HSV color value to RGB. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSV_color_space.
* Assumes h, s, and v are contained in the set [0, 1] and
* returns r, g, and b in the set [0, 255].
*
* @param Number h The hue
* @param Number s The saturation
* @param Number v The value
* @return Array The RGB representation
*/
/*function hsvToRgb(h, s, v){
var r, g, b;

var i = Math.floor(h * 6);
var f = h * 6 - i;
var p = v * (1 - s);
var q = v * (1 - f * s);
var t = v * (1 - (1 - f) * s);

switch(i % 6){
case 0: r = v, g = t, b = p; break;
case 1: r = q, g = v, b = p; break;
case 2: r = p, g = v, b = t; break;
case 3: r = p, g = q, b = v; break;
case 4: r = t, g = p, b = v; break;
case 5: r = v, g = p, b = q; break;
}

return [r * 255, g * 255, b * 255];
}*/


function hsvToRgb(hsv)
{
    var r, g, b;

    var h = hsv[0];
    var s = hsv[1];
    var v = hsv[2];

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i)
    {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
};

function transition(value, maximum, start_point, end_point) {
    return start_point + (end_point - start_point)*value/maximum;
}

function transition3(value, maximum,start, end) {
    r1= transition(value, maximum, start[0], end[0]);
    r2= transition(value, maximum, start[1], end[1]);
    r3= transition(value, maximum, start[2], end[2]);
    return [r1, r2, r3];
}

function roundRgb(val) {
  return Math.round(val*10000000)/10000000;
}

function ratingColor(el, rating) {
  green_hsv = rgbToHsv(0, 255, 0);
  red_hsv = rgbToHsv(255, 0, 0);

  var replace = function(i) {
    return parseInt(i, 10);
  }

  var hsv = transition3(rating, 10, red_hsv, green_hsv);

  // background
  /*
  hsv[1] = .28;
  */
  //el.style.backgroundColor = 'rgb(' + hsvToRgb(hsv).map(replace).join(',') + ')';

  // foreground
  /*
  hsv[1] = 1;
  hsv[2] = .63;
  */
  hsv[1] = .55;
  el.style.color = el.style.borderColor = 'rgb(' + hsvToRgb(hsv).map(replace).join(',') + ')';
  el.style.color = el.style.backgroundColor = 'rgb(' + hsvToRgb(hsv).map(replace).join(',') + ')';

}
