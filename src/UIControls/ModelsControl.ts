import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { modelsConfig } from '../config/models';
import { ProgramManager } from "../ProgramManager";
import { ButtonPagingControl } from "./ButtonPagingControl"

/**
 * This control shows pages of models with four filter buttons at the bottom
 *
 * @export
 * @class ModelsControl
 */
export class ModelsControl  {
    public isShown: boolean = false;
    public buttons: Button[] = [];
    private pager: ButtonPagingControl;


    constructor(ButtonPosition: IPosition, buttonGroupId: string) {

        console.log("ModelsControl::Constructor");
        const pagerButtons: Button[] = [];
        this.pager = new ButtonPagingControl(pagerButtons);

        let groupIdPager = ProgramManager.getInstance().getButtonsGroup("pager");
      //   const  groupIdPager = ""
        let pos = sgWorld.Creator.CreatePosition(0, 0, -1000, 3);
        modelsConfig.models.forEach(model => {
          const b = new Button("new" + model.modelName, pos, basePath + "ui/blank.xpl2", groupIdPager);
          b.show(false);
          this.buttons.push(b);
          pagerButtons.push(b);
        });
  
        const pager = new ButtonPagingControl(pagerButtons);
  
        // I know these really should be part of the paging control, but at the moment buttons have to 
        // exist in the buttons array for them to be clicked so creating them here
        // create the page left and right buttons
        pos = sgWorld.Creator.CreatePosition(-0.4, -0.6, 0.7, 3);
        const pageLeft = new Button("pageLeft", pos, basePath + "ui/blank.xpl2", groupIdPager, () => { pager.pageLeft() });
        pageLeft.show(false);
        pos = sgWorld.Creator.CreatePosition(0.4, -0.6, 0.7, 3);
        const pageRight = new Button("pageRight", pos, basePath + "ui/blank.xpl2", groupIdPager, () => { pager.pageRight(); });
        pageRight.show(false);
        this.buttons.push(pageLeft);
        this.buttons.push(pageRight);
        pager.pagers = [pageLeft, pageRight];
  
        // Select model
        // const groupId = ProgramManager.getInstance().getButtonsGroup("buttons");
        this.buttons.push(new Button("Model Selector", ButtonPosition, basePath + "ui/blank.xpl2", buttonGroupId, () => {
          pager.show(!pager.isShown)
        }));
    }

    private initUI() {
        // create the filter buttonsF
    }

    show(value: boolean) {
        this.pager.show(value);
    }

}