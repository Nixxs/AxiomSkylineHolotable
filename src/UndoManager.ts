import { deleteItemSafe, ProgramManager } from "./ProgramManager";

export class UndoManager {

  private static instance?: UndoManager;

  private itemIds: string[][] = [];

  public static getInstance(): UndoManager {
    if (this.instance === undefined) {
      this.instance = new UndoManager();
    }
    return this.instance;
  }

  private constructor() {
    console.log("UndoManager:: constructor");
  }

  public AddItem(id: string): void {
    this.itemIds.push([id])
  }
  public AddItems(ids: string[]): void {
    this.itemIds.push(ids)
  }

  public Undo(): string[] {
    const objectToDelete = this.itemIds.pop();
    if (objectToDelete != undefined) {
      console.log("deleting: " + objectToDelete);
      const clonedArr = [...objectToDelete]; // clone cause as we delete the items will be removed
      clonedArr.forEach(id => {
        deleteItemSafe(id)
      });
      if (clonedArr.indexOf(ProgramManager.getInstance().currentlySelected) > -1) {
        ProgramManager.getInstance().currentlySelected = "none";
      }
      return objectToDelete;
    }
    console.log(this.itemIds);
    return []
  }

  public Remove(id: any) {
    this.itemIds.forEach(ids => {
      if (ids.indexOf(id) > -1) {
        ids.splice(ids.indexOf(id), 1);
      }
    })
    // remove any empty arrays
    this.itemIds = this.itemIds.filter(i => i.length > 0);
  }
}
