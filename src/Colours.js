const CHANNEL_COLOURS = [
    new Colour(129, 129, 129),
    new Colour(124, 75, 141),
    new Colour(54, 87, 158),
    new Colour(49, 113, 89),
    new Colour(221, 178, 13),
    new Colour(253, 94, 52),
    new Colour(224, 56, 45),
    new Colour(162, 82, 49)
];

class Colour {
    constructor(red, green, blue) {
        this.r = red;
        this.g = green;
        this.b = blue;
    }
}

module.exports = {Colour, CHANNEL_COLOURS};
