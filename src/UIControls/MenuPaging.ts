import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { Quaternion } from "../math/quaternion";
import { Vector } from "../math/vector";
import { radsToDegs } from "../Mathematics";
import { Menu } from "../Menu";
import { GetDeviceType, DeviceType, ProgramManager } from "../ProgramManager";


export class MenuPaging extends Menu {

  // override so we have a fixed size
  cols: number = 3;
  rows: number = 3;
  buttonSize: number = 0.1;

  // for paging
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private btnPL!: Button;
  private btnPR!: Button;

  constructor(public width: number, public height: number, public anchor: Vector<3>, public orientation: Quaternion, public anchorPosition: [number, number], public topAligned: boolean, public leftAligned: boolean, public horizontal: boolean) {
    super(width, height, anchor, orientation, anchorPosition, topAligned, leftAligned, horizontal);

    // recalculate the anchor so that it is centred. @Ruben better way to do this in the base class as an option
    const newX = anchor.data[0] - ((this.cols * this.buttonSize) / 2);
    anchor.data[0] = newX

    this.corner = anchor.Copy().Sub(orientation.Apply(new Vector([width * (anchorPosition[0] - (leftAligned ? 0 : 1)), 0, height * (anchorPosition[1] - (topAligned ? 1 : 0))])));
    console.log(`corner ${this.corner.data}`);
    console.log(`xDirection ${this.xDirection.data}`);
    console.log(`yDirection ${this.yDirection.data}`);

    this.addPagingButtons();
  }

  /**
   * Adds all the buttons as an array at once
   *
   * @param {Button[]} buttons
   * @memberof MenuPaging
   */
  addButtons(buttons: Button[]) {
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
    this.buttons.push(...buttons);
    this.totalPages = Math.ceil(this.buttons.length / (this.cols * this.rows));
    this.recomputeButtons = true;
    this.Draw();
  }
  

  private addPagingButtons() {
    // add the paging buttons to the left and the right
    const ypr = this.orientation.GetYPR();
    const newPos = this.getNthButtonPosition(3); // @ruben I fudged this using your code for the 5th button. I'm sure you can do this a better way
    let groupIdPager = ProgramManager.getInstance().getGroupID("pager");
    const posL = sgWorld.Creator.CreatePosition(newPos.data[0] - 0.1, newPos.data[1], newPos.data[2], 3, radsToDegs(ypr[0]), (GetDeviceType() === DeviceType.Wall ? 0 : 90) + radsToDegs(ypr[1]), radsToDegs(ypr[2]));
    const btnPL = new Button("ButtonPageLeft1", posL, basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.pageLeft()
    }, true)

    const newPos2 = this.getNthButtonPosition(5);
    const posR = sgWorld.Creator.CreatePosition(newPos2.data[0] + 0.1, newPos2.data[1], newPos2.data[2], 3, radsToDegs(ypr[0]), (GetDeviceType() === DeviceType.Wall ? 0 : 90) + radsToDegs(ypr[1]), radsToDegs(ypr[2]));

    const btnPR = new Button("ButtonPageRight1", posR, basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.pageRight();
    }, true);

    btnPL.setScale(this.buttonSize * 0.9); // 10% used for borders
    btnPR.setScale(this.buttonSize * 0.9); // 10% used for borders
    this.btnPL = btnPL;
    this.btnPR = btnPR;
  }

  show(visibility: boolean) {
    // override show and only show buttons for this page
    const startAt = (this.cols * this.rows) * this.pageNumber; // button to start at
    this.buttons.forEach((btn, i) => {
      btn.show(false);
      if (i >= startAt && i < startAt + (this.cols * this.rows)) {
        btn.show(visibility);
      }
    });
    this.btnPL.show(visibility);
    this.btnPR.show(visibility);
  }

  // paging controls
  public pageRight() {
    this.pageNumber += 1;
    if (this.pageNumber >= this.totalPages) {
      this.pageNumber = 0;
    }
    console.log(`page right. page number = ${this.pageNumber} of ${this.totalPages}`);
    this.show(true);
    this.recomputeButtons = true;
    this.Draw();
  }

  public pageLeft() {
    this.pageNumber += -1;
    if (this.pageNumber < 0) {
      this.pageNumber = this.totalPages - 1;
    }
    console.log(`page left. page number = ${this.pageNumber} of ${this.totalPages}`);
    this.recomputeButtons = true;
    this.Draw();
  }

  Draw() {
    if (this.recomputeButtons) {
      // we only draw the buttons we need for this page
      const startAt = (this.cols * this.rows) * this.pageNumber; // button to start at
      const endAt = startAt + (this.cols * this.rows); // button to end with.
      for (let i = startAt; i < endAt; ++i) {
        if(i > this.buttons.length -1) break;
        const button = this.buttons[i];
        console.log(i - startAt);
        const newPosition = this.getNthButtonPosition(i -startAt);
        const ypr = this.orientation.GetYPR();
        // There is a 90 degree difference between wall and table
        button.setPosition(sgWorld.Creator.CreatePosition(newPosition.data[0], newPosition.data[1], newPosition.data[2], 3, radsToDegs(ypr[0]), (GetDeviceType() === DeviceType.Wall ? 0 : 90) + radsToDegs(ypr[1]), radsToDegs(ypr[2])));
        button.setScale(this.buttonSize * 0.9); // 10% used for borders
      }
      this.recomputeButtons = false;
    }
    for (let button of this.buttons) {
      button.Draw();
    }
    this.btnPL.Draw();
    this.btnPR.Draw();
  }

  public Update(): void {
    super.Update()
    this.btnPL.Update();
    this.btnPR.Update();
  }

}