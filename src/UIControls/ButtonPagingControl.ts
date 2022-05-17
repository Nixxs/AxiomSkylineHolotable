import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ProgramManager } from "../ProgramManager";

export class ButtonPagingControl {

  private layout: number = 9; //square layout 3x3 at moment
  private buttons: Button[];
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private spacePerButton: number = 0.2;
  public pagers: Button[] = [];
  public isShown: boolean = false;
  private currentFilter: { modelType: string } = { modelType: "" };

  constructor(buttons: Button[]) {
    console.log("ButtonPagingControl:: constructor");
    // takes an array of buttons and lays them out
    this.buttons = buttons;
    this.initUI();
    this.show(false);
  }

  private initUI() {

    let groupIdPager = ProgramManager.getInstance().getGroupID("pager");

    let pos = sgWorld.Creator.CreatePosition(-0.4, -0.6, 0.7, 3);
    const pageLeft = new Button("pageLeft", pos, basePath + "ui/Button_Prev.xpl2", groupIdPager, () => { this.pageLeft(); });
    pageLeft.show(false);
    pos = sgWorld.Creator.CreatePosition(0.4, -0.6, 0.7, 3);
    const pageRight = new Button("pageRight", pos, basePath + "ui/Button_Next.xpl2", groupIdPager, () => { this.pageRight(); });
    pageRight.show(false);
    this.pagers = [pageLeft, pageRight];

    this.layoutUI();
  }

  /**
   * update the buttons on the UI
   *
   * @param {Button} buttons
   * @memberof ButtonPagingControl
   */
  public setButtons(buttons: Button[]) {
    // hide the buttons. Todo add a hide on the button class
    this.buttons.forEach(btn => btn.show(false));
    this.buttons = buttons;
    // hide the pagers?
    const showPagers = this.buttons.length > this.layout - 1;
    this.pagers.forEach(p => p.show(showPagers));
    this.pageNumber = 0;
    this.totalPages = Math.ceil(this.buttons.length / this.layout);
    this.layoutUI();
  }

  private layoutUI() {

    // the table is 1.2 x 1.2
    console.log("ButtonPagingControl::layoutUI");

    this.totalPages = Math.ceil(this.buttons.length / this.layout);

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
          const pos = sgWorld.Creator.CreatePosition(xPos, yPos, 0.7, 3);
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
    console.log(`page right. page number = ${this.pageNumber} of ${this.totalPages}`)
    this.layoutUI();
  }

  public pageLeft() {

    this.pageNumber += -1;
    if (this.pageNumber < 0) {
      this.pageNumber = this.totalPages - 1;
    }
    console.log(`page left. page number = ${this.pageNumber} of ${this.totalPages}`)
    this.layoutUI();
  }

  public filter(filterVal: { modelType: string; }) {
    throw new Error("Method not implemented.");
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
