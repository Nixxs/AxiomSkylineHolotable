/**
 * Menus are a collection of buttons that are to arranged into a grid in a specified menu area.
 * Buttons are laid out starting from one corner to the opposite.
 * Once buttons no longer fit into their growing direction they shrink until they're small enough to fit another strip or another into a strip
 */

import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { radsToDegs } from "./Mathematics";
import { DeviceType, GetDeviceType, ProgramManager } from "./ProgramManager";

export class Menu {
  // buttonSize is the roomspace width of one button
  
  public rows: number = 0;
  public cols: number = 0;
  public buttons: Button[] = [];
  public corner: Vector<3>;
  public xDirection: Vector<3>;
  public yDirection: Vector<3>;
  public recomputeButtons = true;

  constructor(public width: number, public height: number, public anchor: Vector<3>, public orientation: Quaternion, public anchorPosition: [number, number], public topAligned: boolean, public leftAligned: boolean, public horizontal: boolean, public buttonSize: number = Infinity) {
    // anchorPosition is bottomLeft + [x * width, y * height]

    // let anchor = topLeft  + orientation.apply([width *  anchorPosition[0]     , 0, height * (anchorPosition[1] - 1)]);
    // let anchor = topRight + orientation.apply([width * (anchorPosition[0] - 1), 0, height * (anchorPosition[1] - 1)]);
    // let anchor = botLeft  + orientation.apply([width *  anchorPosition[0]     , 0, height *  anchorPosition[1]     ]);
    // let anchor = botRight + orientation.apply([width * (anchorPosition[0] - 1), 0, height *  anchorPosition[1]     ]);

    // then topLeft = anchor - orientation.apply([width *  anchorPosition[0]     , 0, height * (anchorPosition[1] - 1)]);
    // and topRight = anchor - orientation.apply([width * (anchorPosition[0] - 1), 0, height * (anchorPosition[1] - 1)]);
    // and botLeft  = anchor - orientation.apply([width *  anchorPosition[0]     , 0, height *  anchorPosition[1]     ]);
    // and botRight = anchor - orientation.apply([width * (anchorPosition[0] - 1), 0, height *  anchorPosition[1]     ]);
    this.corner = anchor.Copy().Sub(orientation.Apply(new Vector([width * (anchorPosition[0] - (leftAligned ? 0 : 1)), 0, height * (anchorPosition[1] - (topAligned ? 1 : 0))])));
    this.xDirection = orientation.GetXAxis(leftAligned ? 1 : -1); // positive x to the right
    this.yDirection = orientation.GetZAxis(topAligned ? -1 : 1); // negative z to the bottom
    console.log(`corner ${this.corner.data}`);
    console.log(`xDirection ${this.xDirection.data}`);
    console.log(`yDirection ${this.yDirection.data}`);
  }

  addButton(button: Button) {
    this.buttons.push(button);
    if (this.buttons.length > this.cols * this.rows) {
      this.recomputeButtons = true;
    } else {
      // no more work to do
      return;
    }
    if (this.buttonSize * (this.cols + 1) <= this.width) {
      ++this.cols;
    } else if (this.buttonSize * (this.rows + 1) <= this.height) {
      ++this.rows;
    } else {
      // must shrink
      // Figure out what size we would be if we grew in either direction and pick the one with less shrinkage
      const extraRowSize = this.height / (this.rows + 1);
      const extraColSize = this.width / (this.cols + 1);
      if (extraColSize >= extraRowSize) {
        this.buttonSize = extraColSize;
        ++this.cols;
      } else {
        this.buttonSize = extraRowSize;
        ++this.rows;
      }
    }
  }

  createButton(name: string, icon: string, callback?: (id?: string) => void) {
    const groupId = ProgramManager.getInstance().getGroupID("buttons");
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const btn = new Button(name, pos, basePath + "ui/" + icon, groupId, callback);
    this.addButton(btn);
  }

  Update() {
    for (let button of this.buttons) {
      button.Update();
    }
  }

  getNthButtonPosition(n: number) {
    const strip = Math.floor(n / (this.horizontal ? this.cols : this.rows));
    const along = n - strip * (this.horizontal ? this.cols : this.rows);
    console.log(`${n}th at ${strip}th strip, ${along}th along`);
    const x = (this.horizontal ? along : strip);
    const y = (this.horizontal ? strip : along);
    console.log(`${n}th at ${x}, ${y}`);
    console.log(`${n}th at ${this.corner.Copy().Add(this.xDirection.Copy().Mul(x + 0.5 * this.buttonSize)).Add(this.yDirection.Copy().Mul(y + 0.5 * this.buttonSize)).data}`);
    // Add 0.5 so the origin of the button is at the center of the button area
    return this.getButtonPosition(x + 0.5, y + 0.5);
  }

  /**
   * Get the button position for a button with specific grid indices.
   * returns the position that is x buttonSizes in xDirection and y buttonSizes in yDirection away from corner.
   * The first button will be at [0.5, 0.5], the next may be at [1.5, 0.5] and so on
   */
  getButtonPosition(x: number, y: number) {
    // corner + xDirection * x * size + yDirection * y * size
    return this.corner.Copy().Add(this.xDirection.Copy().Mul(x * this.buttonSize)).Add(this.yDirection.Copy().Mul(y * this.buttonSize));
  }

  Draw() {
    if (this.recomputeButtons) {
      for (let i = 0; i < this.buttons.length; ++i) {
        const button = this.buttons[i];
        const newPosition = this.getNthButtonPosition(i);
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
  }

  show(visibility: boolean) {
    for (let button of this.buttons)
      button.show(visibility);
  }
}
