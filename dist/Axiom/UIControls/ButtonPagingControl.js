var ButtonPagingControl = /** @class */ (function () {
    function ButtonPagingControl(buttons) {
        this.layout = 9; //square layout 9x9 at moment
        this.pageNumber = 0;
        this.totalPages = 0;
        this.spacePerButton = 0.2;
        this.pagers = [];
        this.isShown = false;
        console.log("ButtonPagingControl:: constructor");
        // takes an array of buttons and lays them out
        this.buttons = buttons;
        this.totalPages = Math.ceil(this.buttons.length / this.layout);
        this.initUI();
        this.show(false);
    }
    ButtonPagingControl.prototype.initUI = function () {
        this.layoutUI();
    };
    ButtonPagingControl.prototype.layoutUI = function () {
        // to do
        // the table is 1.2 x 1.2
        console.log("ButtonPagingControl::layoutUI");
        var counter = 0;
        if (this.pageNumber > 0) {
            counter += this.layout * this.pageNumber;
        }
        // hide the buttons. Todo add a hide on the button class
        this.buttons.forEach(function (btn) { return btn.show(false); });
        var rowColCount = Math.sqrt(this.layout);
        var spacePerButton = this.spacePerButton;
        for (var indexY = rowColCount - 1; indexY >= 0; indexY--) {
            // shift the whole thing to the centre of the table
            var yPos = (spacePerButton * indexY);
            yPos = -0.6 + yPos - spacePerButton;
            for (var indexX = 0; indexX < rowColCount; indexX++) {
                var xPos = (spacePerButton * indexX);
                // shift the whole thing to the centre of the table
                xPos = xPos - spacePerButton;
                if (this.buttons.length > counter) {
                    // console.log(`${this.buttons[counter].name} xPos ${xPos} yPos ${yPos}`);
                    var pos = SGWorld.Creator.CreatePosition(xPos, yPos, 0.7, 3);
                    this.buttons[counter].roomPosition = pos;
                    this.buttons[counter].show(true);
                    counter += 1;
                }
            }
        }
    };
    ButtonPagingControl.prototype.pageRight = function () {
        this.pageNumber += 1;
        if (this.pageNumber >= this.totalPages) {
            this.pageNumber = 0;
        }
        this.layoutUI();
    };
    ButtonPagingControl.prototype.pageLeft = function () {
        this.pageNumber += -1;
        if (this.pageNumber < 0) {
            this.pageNumber = this.totalPages - 1;
        }
        this.layoutUI();
    };
    ButtonPagingControl.prototype.show = function (value) {
        this.buttons.forEach(function (btn) { return btn.show(value); });
        this.pagers.forEach(function (btn) { return btn.show(value); });
        this.isShown = value;
    };
    ButtonPagingControl.prototype.destroy = function () {
        // break it down when a user clicks a button
    };
    return ButtonPagingControl;
}());
