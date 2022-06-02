import { sgWorld } from "../Axiom";
import { bookmarksConfig, IBookmarkPosition, IBookmark } from "../config/bookmarks";
import { deleteItemSafe, ProgramManager } from "../ProgramManager";
import { UserMode } from "../UserManager";

export class BookmarkManager {


  private bookmarks = bookmarksConfig.bookmarks;
  private currentIndex = 0;

  public ZoomNext() {
    this.updateIndex(+1)
    console.log("Zooming to " + this.bookmarks[this.currentIndex].name);
    BookmarkManager.doZoom(this.bookmarks[this.currentIndex]);
  }

  public ZoomPrevious() {
    this.updateIndex(-1);
    console.log("Zooming to " + this.bookmarks[this.currentIndex].name);
    BookmarkManager.doZoom(this.bookmarks[this.currentIndex]);
  }

  private updateIndex(val: number) {
    if (this.currentIndex + val > this.bookmarks.length - 1) {
      this.currentIndex = 0;
    }
    else if (this.currentIndex + val < 0) {
      this.currentIndex = this.bookmarks.length - 1;
    } else {
      this.currentIndex += val;
    }
  }


  ZoomTo(name: string) {
    const b = this.bookmarks.filter(b => b.name === name)[0];
    BookmarkManager.doZoom(b);
  }

  private static doZoom(b: IBookmark) {
    const p = b.position;
    const pos = sgWorld.Creator.CreatePosition(p.X, p.Y, 0, p.AltitudeType, p.Yaw, p.Pitch, p.Roll, p.Distance);
    sgWorld.Navigate.JumpTo(pos);
    ProgramManager.getInstance().userModeManager!.userMode = UserMode.Standard;
    BookmarkManager.createTextLabel(b.name, p);
  }

  private static createTextLabel(text: string, p: IBookmarkPosition) {
    const labelStyle = sgWorld.Creator.CreateLabelStyle(0);
    labelStyle.FontSize = 48;
    const pos = sgWorld.Creator.CreatePosition(p.X, p.Y, 10, AltitudeTypeCode.ATC_TERRAIN_RELATIVE);
    var cTextLabel = sgWorld.Creator.CreateTextLabel(pos, text, labelStyle, "", "TextLabel");
    // clear the item after 4.5 seconds
    setTimeout(() => {
      deleteItemSafe(cTextLabel.ID)
    }, (4500));

  }

}
