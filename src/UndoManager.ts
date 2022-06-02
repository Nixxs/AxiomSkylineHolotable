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
      objectToDelete.forEach(id => {
        deleteItemSafe(id)
      })
      return objectToDelete
    }
    return []
  }

  public Remove(id: any) {
    this.itemIds.forEach(ids => {
      if (ids.indexOf(id) > -1) {
        ids.splice(ids.indexOf(id), 1);
      }
    })
  }
}
