import { basePath } from "../Axiom";
import { Button } from "../Button";
import { FixedSizeArray } from "../math/fixedSizeArray";
import { Vector } from "../math/vector";
import { degsToRads, radsToDegs } from "../Mathematics";
import { Menu } from "../Menu";
import { CreatePosition } from "../SGWorld";

export class MenuPaging extends Menu {
  // for paging
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private btnPL!: Button;
  private btnPR!: Button;

  constructor(public lineCountLimit: number, ...args: ConstructorParameters<typeof Menu>) {
    super(...args);

    this.addPagingButtons();
  }

  override getButtonPosition(line: number, step: number): Vector<3> {
    return super.getButtonPosition(line % this.lineCountLimit, step);
  }

  private addPagingButtons() {
    // add the paging buttons to the left and the right
    const ypr = this.orientation.Copy().PostApplyXAxis(degsToRads(90)).GetYPR().map(radsToDegs) as FixedSizeArray<number, 3>;

    let posL;
    let posR;

    if (this.horizontalLines) {
      // horizontal. show them on the left and right
      const LVec = super.getButtonPosition((this.lineCountLimit - 1) / 2, -1);
      posL = CreatePosition(...LVec.data, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE, ...ypr);
      const RVec = super.getButtonPosition((this.lineCountLimit - 1) / 2, this.lineLengthLimit);
      posR = CreatePosition(...RVec.data, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE, ...ypr);
    } else {
      // vertical. show them at the bottom
      const LVec = super.getButtonPosition(this.lineCountLimit / 2 - 1, -1);
      posL = CreatePosition(...LVec.data, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE, ...ypr);
      const RVec = super.getButtonPosition(this.lineCountLimit / 2, -1);
      posR = CreatePosition(...RVec.data, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE, ...ypr);
    }

    const btnPL = new Button("ButtonPageLeft", posL, basePath + "ui/Buttons/page_left.xpl2", this.groupID, () => {
      this.pageLeft()
    }, true, "Previous");

    const btnPR = new Button("ButtonPageRight1", posR, basePath + "ui/Buttons/page_right.xpl2", this.groupID, () => {
      this.pageRight();
    }, true, "Next");

    btnPL.setScale(this.pageButtonSize());
    btnPR.setScale(this.pageButtonSize());
    this.btnPL = btnPL;
    this.btnPR = btnPR;
  }

  pageButtonSize() {
    return super.buttonScale();
  }

  /**
   * Adds all the buttons as an array at once
   */
  override addButton(button: Button) {
    super.addButton(button);
    this.totalPages = Math.ceil(this.buttonLines.length / this.lineCountLimit);
    const showPaging = this.totalPages > 1 && this.isVisible;
    this.btnPL.show(showPaging);
    this.btnPR.show(showPaging);
  }

  visibleLines() {
    if (!this.isVisible)
      return [];
    return this.buttonLines.filter((_l, i) =>
      i >= this.pageNumber * this.lineCountLimit && i < (this.pageNumber + 1) * this.lineCountLimit
    );
  }

  override show(visibility: boolean) {
    this.isVisible = visibility;
    this.buttonLines.forEach(l => l.forEach(btn => btn.show(false)));
    this.visibleLines().forEach(l => l.forEach(btn => btn.show(true)));
    if (!visibility)
      this.pageNumber = 0; // when hidden reset to page 1

    const showPaging = this.totalPages > 1 && this.isVisible;

    this.btnPL.show(showPaging);
    this.btnPR.show(showPaging);
  }

  // paging controls
  public pageRight() {
    ++this.pageNumber;
    if (this.pageNumber >= this.totalPages) {
      this.pageNumber = 0;
    }
    this.show(true);
    this.recomputeButtons = true;
    this.Draw();
  }

  public pageLeft() {
    --this.pageNumber;
    if (this.pageNumber < 0) {
      this.pageNumber = this.totalPages - 1;
    }
    this.show(true);
    this.recomputeButtons = true;
    this.Draw();
  }

  Draw() {
    for (let line of this.visibleLines())
      for (let button of line)
        button.Draw();
    if (this.isVisible) {
      this.btnPL.Draw();
      this.btnPR.Draw();
    }
  }

  public Update(): void {
    super.Update();
    this.btnPL.Update();
    this.btnPR.Update();
  }
}
