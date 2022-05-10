import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { modelsConfig } from '../config/models';
import { ProgramManager } from "../ProgramManager";
import { EventEmitter } from "./EventEmitter";
import { ButtonPagingControl } from "./ButtonPagingControl"

/**
 * This control shows pages of models with four filter buttons at the bottom
 *
 * @export
 * @class ModelsControl
 */
export class ModelsControl extends EventEmitter {
  public isShown: boolean = false;
  public buttons: Button[] = [];
  private pager: ButtonPagingControl;
  private filterButtons: Button[] = [];

  private buttonProperties: { button: Button; model: { modelType: string; missionType: string; }; }[] = [];


  constructor() {

    super();

    console.log("ModelsControl::Constructor");

    ProgramManager.getInstance().deleteGroup("pager");
    let groupIdPager = ProgramManager.getInstance().getGroupID("pager");

    // these buttons are all of the models based on the config file
    const pos = sgWorld.Creator.CreatePosition(0, 0, -1000, 3);
    let modelButtons: Button[] = []
    modelsConfig.models.forEach(model => {
      // filter this model?
      const b = new Button("new" + model.modelName, pos, basePath + "ui/blank.xpl2", groupIdPager, () => { this.onShowModelClick(model) });
      b.show(false);
      modelButtons.push(b);
      this.buttonProperties.push({ button: b, model: { modelType: model.modelType, missionType: model.missionType } });
    });
    this.pager = new ButtonPagingControl(modelButtons);

    // we need 4 filter buttons below to filter by Orbat, control measure, symbol, model
    const yLine = -0.95
    const btnOrbat = new Button("Orbat", sgWorld.Creator.CreatePosition(-0.24, yLine, 0.7, 3), basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "orbat" })
    }, true);
    this.filterButtons.push(btnOrbat);
    const btnControlMeasure = new Button("Control Measure", sgWorld.Creator.CreatePosition(-0.08, yLine, 0.7, 3), basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "controlMeasure" })
    }, true)
    this.filterButtons.push(btnControlMeasure);
    const btnSymbol = new Button("Symbol", sgWorld.Creator.CreatePosition(0.08, yLine, 0.7, 3), basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "symbol" })
    }, true)
    this.filterButtons.push(btnSymbol);
    const btnModel = new Button("Model", sgWorld.Creator.CreatePosition(0.24, yLine, 0.7, 3), basePath + "ui/blank.xpl2", groupIdPager, () => {
      this.filter({ modelType: "model" })
    }, true)
    this.filterButtons.push(btnModel);

    // these have to get stored on the UI manager s
    this.buttons.push(...modelButtons);
    this.buttons.push(...this.pager.pagers);
    this.buttons.push(...this.filterButtons);
    for (let button of this.buttons)
      button.setScale(1 / 12);
  }


  onShowModelClick(model: { modelName: string; modelType: string; missionType: string; buttonPath: string; modelPath: string; }) {
    this.show(false);
    console.log(`todo adding model ${model.modelPath} to view`);
    const um = ProgramManager.getInstance().userModeManager;
    if (!um) return;
    um.toggleModelMode("Support by Fire");
  }

  filter(filterVal: { modelType: string; }) {
    // get the buttons we want to show
    const newButtons: Button[] = [];
    this.buttonProperties.forEach((item) => {
      if (item.model.modelType === filterVal.modelType || filterVal.modelType === "") {
        newButtons.push(item.button);
      }
    });
    this.pager.setButtons(newButtons);
  }


  show(value: boolean) {
    this.filter({ modelType: "" });
    this.pager.show(value);
    this.isShown = value;
    this.filterButtons.forEach(b => b.show(value));
    this.emit("onShow", value)
  }



}
