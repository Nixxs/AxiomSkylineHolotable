define(["require", "exports", "./Axiom", "./Button", "./config/models", "./Debug", "./ProgramManager", "./UIControls/ButtonPagingControl"], function (require, exports, Axiom_1, Button_1, models_1, Debug_1, ProgramManager_1, ButtonPagingControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UIManager = void 0;
    var UIManager = /** @class */ (function () {
        function UIManager() {
            this.buttons = [];
        }
        UIManager.prototype.Init = function () {
            var _this = this;
            var _a;
            (_a = document.getElementById("consoleRun")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", Debug_1.runConsole);
            var groupId = ProgramManager_1.programManager.getButtonsGroup("buttons");
            // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2
            var yLine1 = -1.05;
            this.buttons.push(new Button_1.Button("Sydney", Axiom_1.SGWorld.Creator.CreatePosition(-0.4, yLine1, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.jumpToSydney(); }));
            this.buttons.push(new Button_1.Button("Measurement", Axiom_1.SGWorld.Creator.CreatePosition(-0.24, yLine1, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.toggleMeasurementMode(); }));
            this.buttons.push(new Button_1.Button("RangeRing", Axiom_1.SGWorld.Creator.CreatePosition(-0.08, yLine1, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.toggleRangeRingMode(); }));
            this.buttons.push(new Button_1.Button("Whyalla", Axiom_1.SGWorld.Creator.CreatePosition(0.08, yLine1, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.jumpToWhyalla(); }));
            this.buttons.push(new Button_1.Button("Artillery", Axiom_1.SGWorld.Creator.CreatePosition(0.24, yLine1, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.toggleModelMode("Support by Fire"); }));
            this.buttons.push(new Button_1.Button("ArtilleryRange", Axiom_1.SGWorld.Creator.CreatePosition(0.4, yLine1, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.toggleModelMode("HowitzerWithRangeIndicator"); }));
            // scale models
            var yLine2 = -1.15;
            this.buttons.push(new Button_1.Button("ScaleModelUp", Axiom_1.SGWorld.Creator.CreatePosition(0.4, yLine2, 0.7, 3), Axiom_1.basePath + "ui/plus.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.scaleModel(+1); }));
            this.buttons.push(new Button_1.Button("ScaleModelDown", Axiom_1.SGWorld.Creator.CreatePosition(0.24, yLine2, 0.7, 3), Axiom_1.basePath + "ui/minus.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.scaleModel(-1); }));
            // delete selected model
            this.buttons.push(new Button_1.Button("DeleteSelected", Axiom_1.SGWorld.Creator.CreatePosition(0.08, yLine2, 0.7, 3), Axiom_1.basePath + "ui/delete.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.deleteModel(); }));
            // undo
            this.buttons.push(new Button_1.Button("Undo", Axiom_1.SGWorld.Creator.CreatePosition(-0.08, yLine2, 0.7, 3), Axiom_1.basePath + "ui/undo.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.undo(); }));
            // add line
            this.buttons.push(new Button_1.Button("DrawLine", Axiom_1.SGWorld.Creator.CreatePosition(-0.24, yLine2, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () { return ProgramManager_1.programManager.userModeManager.toggleDrawLine(); }));
            try {
                var groupIdPager_1 = ProgramManager_1.programManager.getButtonsGroup("pager");
                console.log("ProgramManager:: ButtonPagingControl");
                var pos_1 = Axiom_1.SGWorld.Creator.CreatePosition(0, 0, -1000, 3);
                var pagerButtons_1 = [];
                models_1.modelsConfig.models.forEach(function (model) {
                    var b = new Button_1.Button("new" + model.modelName, pos_1, Axiom_1.basePath + "ui/blank.xpl2", groupIdPager_1);
                    b.show(false);
                    _this.buttons.push(b);
                    pagerButtons_1.push(b);
                });
                var pager_1 = new ButtonPagingControl_1.ButtonPagingControl(pagerButtons_1);
                // I know these really should be part of the paging control, but at the moment buttons have to 
                // exist in the buttons array for them to be clicked so creating them here
                // create the page left and right buttons
                pos_1 = Axiom_1.SGWorld.Creator.CreatePosition(-0.4, -0.6, 0.7, 3);
                var pageLeft = new Button_1.Button("pageLeft", pos_1, Axiom_1.basePath + "ui/blank.xpl2", groupIdPager_1, function () { pager_1.pageLeft(); });
                pageLeft.show(false);
                pos_1 = Axiom_1.SGWorld.Creator.CreatePosition(0.4, -0.6, 0.7, 3);
                var pageRight = new Button_1.Button("pageRight", pos_1, Axiom_1.basePath + "ui/blank.xpl2", groupIdPager_1, function () { pager_1.pageRight(); });
                pageRight.show(false);
                this.buttons.push(pageLeft);
                this.buttons.push(pageRight);
                pager_1.pagers = [pageLeft, pageRight];
                // Select model
                this.buttons.push(new Button_1.Button("Model Selector", Axiom_1.SGWorld.Creator.CreatePosition(-0.4, yLine2, 0.7, 3), Axiom_1.basePath + "ui/blank.xpl2", groupId, function () {
                    pager_1.show(!pager_1.isShown);
                }));
            }
            catch (error) {
                console.log("Error creating paging control" + error);
            }
        };
        UIManager.prototype.Draw = function () { };
        UIManager.prototype.Update = function () { };
        return UIManager;
    }());
    exports.UIManager = UIManager;
});
