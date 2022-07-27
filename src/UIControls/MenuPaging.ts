import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { Quaternion } from "../math/quaternion";
import { Vector } from "../math/vector";
import { radsToDegs } from "../Mathematics";
import { Menu } from "../Menu";
import { GetDeviceType, DeviceType, ProgramManager } from "../ProgramManager";


export class MenuPaging extends Menu {

  // for paging
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private btnPL!: Button;
  private btnPR!: Button;
  private offset: number = 0;

  constructor(public width: number, public height: number, public anchor: Vector<3>, public orientation: Quaternion, public anchorPosition: [number, number], public topAligned: boolean, public leftAligned: boolean, public horizontal: boolean, public buttonSize: number = Infinity, public rows: number, public cols: number, menuId: string) {
    super(width, height, anchor, orientation, anchorPosition, topAligned, leftAligned, horizontal, Infinity, 0, 0, menuId);


    // if it is vertical we need a bit of space at the bottom for the buttons
    // if (this.rows > this.cols) {
    //   this.offset = this.buttonSize / 2;
    //   // anchor.Add(new Vector([0, this.offset, 0]))
    // }
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
    this.recomputeButtons = false; // stop recompute while we destroy the old ones
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
    this.buttons.push(...buttons);
    this.totalPages = Math.ceil(this.buttons.length / (this.cols * this.rows));
    console.log("totalPages" + this.totalPages)
    this.recomputeButtons = true;
    this.show(true);
  }

  createButton(name: string, icon: string, callback?: (id?: string) => void) {
    // override and return the button as we need to add them all at once
    const groupId = ProgramManager.getInstance().getGroupID("buttons");
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const btn = new Button(name, pos, basePath + "ui/" + icon, groupId, callback, false, name);
    return btn;
  }


  private addPagingButtons() {
    // add the paging buttons to the left and the right
    const ypr = this.orientation.GetYPR();
    let newPos = this.getButtonPosition(0 - 0.5, ((this.rows - 1) / 2) + 0.5);
    let groupIdPager = ProgramManager.getInstance().getGroupID("buttons");
    var posL = sgWorld.Creator.CreatePosition(newPos.data[0], newPos.data[1], newPos.data[2], 3, radsToDegs(ypr[0]), 90 + radsToDegs(ypr[1]), radsToDegs(ypr[2]));

    const newPos2 = this.getButtonPosition(this.cols + 0.5, this.rows / 2);
    let posR = sgWorld.Creator.CreatePosition(newPos2.data[0], newPos2.data[1], newPos2.data[2], 3, radsToDegs(ypr[0]), 90 + radsToDegs(ypr[1]), radsToDegs(ypr[2]));

    if (this.rows > this.cols) {
      // vertical. show them at the bottom
      newPos = this.getButtonPosition(0, 0);
      posL = sgWorld.Creator.CreatePosition(newPos.data[0] - this.buttonSize, newPos.data[1] + (this.buttonSize / 2), newPos.data[2], 3, radsToDegs(ypr[0]), 90 + radsToDegs(ypr[1]), radsToDegs(ypr[2]));
      newPos = this.getButtonPosition(1, 0);
      posR = sgWorld.Creator.CreatePosition(newPos.data[0] + this.buttonSize, newPos.data[1] + (this.buttonSize / 2), newPos.data[2], 3, radsToDegs(ypr[0]), 90 + radsToDegs(ypr[1]), radsToDegs(ypr[2]));
    }

    const btnPL = new Button("ButtonPageLeft", posL, basePath + "ui/Button_Prev.xpl2", groupIdPager, () => {
      this.pageLeft()
    }, true, "Previous")


    const btnPR = new Button("ButtonPageRight1", posR, basePath + "ui/Button_Next.xpl2", groupIdPager, () => {
      this.pageRight();
    }, true, "Next");

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
    const showPaging = this.totalPages > 1 && visibility
    this.btnPL.show(showPaging);
    this.btnPR.show(showPaging);
    this.isVisible = visibility;
    if (!visibility) {
      this.pageNumber = 0; // when hidden reset to page 1
    }
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
    this.show(true);
    this.recomputeButtons = true;
    this.Draw();
  }

  Draw() {
    if (this.recomputeButtons) {
      // we only draw the buttons we need for this page
      const startAt = (this.cols * this.rows) * this.pageNumber; // button to start at
      const endAt = startAt + (this.cols * this.rows); // button to end with.
      for (let i = startAt; i < endAt; ++i) {
        if (i > this.buttons.length - 1) break;
        const button = this.buttons[i];
        console.log(i - startAt);
        const newPosition = this.getNthButtonPosition(i - startAt);
        const ypr = this.orientation.GetYPR();
        // There is a 90 degree difference between wall and table
        button.setPosition(sgWorld.Creator.CreatePosition(newPosition.data[0], newPosition.data[1], newPosition.data[2], 3, radsToDegs(ypr[0]), 90 + radsToDegs(ypr[1]), radsToDegs(ypr[2])));
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
