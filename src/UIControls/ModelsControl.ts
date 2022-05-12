import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { modelsConfig } from '../config/models';
import { DeviceType, GetDeviceType, ProgramManager } from "../ProgramManager";
import { EventEmitter } from "./EventEmitter";
import { Menu } from "../Menu";
import { Vector } from "../math/vector";
import { Quaternion } from "../math/quaternion";
import { degsToRads } from "../Mathematics";
import { MenuPaging } from "./MenuPaging";

/**
 * This control shows pages of models with four filter buttons at the bottom
 *
 * @export
 * @class ModelsControl
 */
export class ModelsControl extends EventEmitter {

  public isShown: boolean = false;

  //  private pager: ButtonPagingControl;
  private filterButtons: Button[] = [];

  private pagingMenu!: MenuPaging;

  private menusWall: Menu[] = [];
  private menusTable: Menu[] = [];

  constructor() {

    super();

    console.log("ModelsControl::Constructor");

    ProgramManager.getInstance().deleteGroup("pager");
    let groupIdPager = ProgramManager.getInstance().getGroupID("pager");

    // we need 4 filter buttons below to filter by Orbat, control measure, symbol, model
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const btnOrbat = new Button("Orbat", pos, basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "orbat" })
    });
    this.filterButtons.push(btnOrbat);
    const btnControlMeasure = new Button("Control Measure", pos, basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "controlMeasure" })
    })
    this.filterButtons.push(btnControlMeasure);
    const btnSymbol = new Button("Symbol", pos, basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "symbol" })
    })
    this.filterButtons.push(btnSymbol);
    const btnModel = new Button("Model", pos, basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "model" })
    })
    this.filterButtons.push(btnModel);

    // filter menu
    const menu = new Menu(0.8, 0.2, new Vector<3>([-0.4, -1.0, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);

    this.filterButtons.forEach(b => menu.addButton(b));
    menu.Draw();
    menu.show(false)
    this.menusTable.push(menu)

    // fix button size  
    // temp? set the size of the filter menu buttons
    for (let button of this.filterButtons)
      button.setScale(0.1);

    // models paging menu
    this.pagingMenu = new MenuPaging(0, 0, new Vector<3>([0, -0.5, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], true, true, true);
    this.menusTable.push(this.pagingMenu);

  }

  onShowModelClick(model: { modelName: string; modelType: string; missionType: string; buttonPath: string; modelPath: string; }) {
    this.show(false);
    console.log(`todo adding model ${model.modelPath} to view`);
    const um = ProgramManager.getInstance().userModeManager;
    if (!um) return;
    um.toggleModelMode("Support by Fire");
  }

  filter(filterVal: { modelType: string; }) {

    let groupIdPager = ProgramManager.getInstance().getGroupID("pager");

    // these buttons are all of the models based on the config file
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    let modelButtons: Button[] = [];
    modelsConfig.models.forEach(model => {
      if (model.modelType === filterVal.modelType || filterVal.modelType === "") {
        // filter this model?
        const b = new Button("new" + model.modelName, pos, basePath + "ui/blank.xpl2", groupIdPager, () => { this.onShowModelClick(model) });
        modelButtons.push(b);

      }
    });
    this.pagingMenu.addButtons(modelButtons);
    this.pagingMenu.show(true)

  }


  show(value: boolean) {
    this.filter({ modelType: "" });
    // this.pager.show(value);
    this.isShown = value;
    this.menusTable.forEach(t => t?.show(value))
    this.menusWall.forEach(t => t?.show(value))
    this.emit("onShow", value)
  }

  Draw() {
    switch (GetDeviceType()) {
      case DeviceType.Desktop: // Desktop renders the table button layout
      case DeviceType.Table:
        this.menusTable.forEach(t => t?.Draw())
        break;
      case DeviceType.Wall:
        this.menusWall.forEach(t => t?.Draw())
        break;
    }
  }

  Update() {
    switch (GetDeviceType()) {
      case DeviceType.Desktop: // Desktop updates the table buttons
      case DeviceType.Table:
        this.menusTable.forEach(t => t.Update())
        break;
      case DeviceType.Wall:
        this.menusWall.forEach(t => t.Update())
        break;
    }
  }


}
