function Pot(position, amount) {
    this.position = position;
    this.amount = amount || 200; // Default to 200 (100 from each player)
}

Pot.prototype.draw = function() {
    Canvas2D.drawText(
        "Pot: " + this.amount + " coins", 
        this.position,
        Vector2.zero,
        "gold",
        "center",
        "Bookman",
        "30px"
    );
}; 