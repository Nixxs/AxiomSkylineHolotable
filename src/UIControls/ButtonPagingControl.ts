import { SGWorld } from "../Axiom";
import { Button } from "../Button";

export class ButtonPagingControl {
  private layout: number = 9; //square layout 9x9 at moment
  private buttons: Button[];
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private spacePerButton: number = 0.2;
  public pagers: Button[] = [];
  public isShown: boolean = false;

  constructor(buttons: Button[]) {
    console.log("ButtonPagingControl:: constructor");
    // takes an array of buttons and lays them out
    this.buttons = buttons;
    this.totalPages = Math.ceil(this.buttons.length / this.layout);
    this.initUI();
    this.show(false);
  }

  private initUI() {
    this.layoutUI();
  }

  private layoutUI() {
    // to do
    // the table is 1.2 x 1.2
    console.log("ButtonPagingControl::layoutUI");

    let counter = 0;
    if (this.pageNumber > 0) {
      counter += this.layout * this.pageNumber;
    }

    // hide the buttons. Todo add a hide on the button class
    this.buttons.forEach(btn => btn.show(false));

    const rowColCount = Math.sqrt(this.layout);
    const spacePerButton = this.spacePerButton;

    for (let indexY = rowColCount - 1; indexY >= 0; indexY--) {
      // shift the whole thing to the centre of the table
      let yPos = (spacePerButton * indexY);
      yPos = -0.6 + yPos - spacePerButton;
      for (let indexX = 0; indexX < rowColCount; indexX++) {
        let xPos = (spacePerButton * indexX);
        // shift the whole thing to the centre of the table
        xPos = xPos - spacePerButton;
        if (this.buttons.length > counter) {
          // console.log(`${this.buttons[counter].name} xPos ${xPos} yPos ${yPos}`);
          const pos = SGWorld.Creator.CreatePosition(xPos, yPos, 0.7, 3);
          this.buttons[counter].roomPosition = pos;
          this.buttons[counter].show(true);
          counter += 1;
        }
      }
    }

  }

  public pageRight() {
    this.pageNumber += 1;
    if (this.pageNumber >= this.totalPages) {
      this.pageNumber = 0;
    }
    this.layoutUI();
  }

  public pageLeft() {
    this.pageNumber += -1;
    if (this.pageNumber < 0) {
      this.pageNumber = this.totalPages - 1;
    }
    this.layoutUI();
  }

  public show(value: boolean) {
    this.buttons.forEach(btn => btn.show(value));
    this.pagers.forEach(btn => btn.show(value));
    this.isShown = value;
  }

  private destroy() {
    // break it down when a user clicks a button
  }
}
