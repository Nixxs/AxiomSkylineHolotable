
/* cSpell:disable */

interface IPosition {
  Altitude: number;
  /**
   * Gets and sets an enum determining how the altitude is interpreted. 
   * @type {AltitudeTypeCode}
   * @memberof IPosition
   */
  AltitudeType: AltitudeTypeCode;
  Cartesian: boolean;
  Distance: number;
  Pitch: number;
  Roll: number;
  X: number;
  Y: number;
  Yaw: number;

  AimTo(Position: IPosition): IPosition;
  ChangeAltitudeType: unknown;
  Copy(): IPosition;
  DistanceTo(Position: IPosition): number;
  Init: unknown;
  InitFrom: unknown;
  IsEqual: unknown;
  Lerp: unknown;
  Move(Distance: number, Yaw: number, Pitch: number): IPosition;
  MoveToward(Position: IPosition, Distance: number): IPosition;
  ToAbsolute: unknown;
  ToRelative: unknown;
  ToString(): string;
}

/**
 * ATC_PIVOT_RELATIVE and ATC_ON_TERRAIN values apply only for 2D shapes and polygons. ATC_3DML_RELATIVE only applies to image and text labels.
 * @enum {number}
 */
declare const enum AltitudeTypeCode {
  /**
   * Places the position’s pivot point at a specified altitude above the ground.
   */
  ATC_TERRAIN_RELATIVE = 0,
  /**
   * Places each point of the object at a specified altitude above the pivot point altitude, defined by its Point Altitude. The pivot is located at the center of the object.
   */
  ATC_PIVOT_RELATIVE = 1,
  /**
   * The altitude is ignored and the coordinate is on the terrain itself
   */
  ATC_ON_TERRAIN = 2,
  /**
   * Places the position’s pivot point at a specified altitude above the terrain database vertical datum base ellipsoid.
   */
  ATC_TERRAIN_ABSOLUTE = 3,
  /**
   * Places the object’s pivot point at a specified altitude above the 3DML layer.
   */
  ATC_3DML_RELATIVE = 4
}


declare const enum IActionCode {
  AC_FLYTO = 0, // Fly to the object operation.
  AC_CIRCLEPATTERN = 1, //Circle pattern around the object operation.
  AC_OVALPATTERN = 2, //Oval pattern around the object operation.
  AC_LINEPATTERN = 3, //Line pattern around the object operation.
  AC_ARCPATTERN = 4, //Arc pattern around the object operation.
  AC_FOLLOWBEHIND = 5, //Follow behind the object operation.
  AC_FOLLOWABOVE = 6, //Follow above the object operation.
  AC_FOLLOWBELOW = 7, //Follow below the object operation.
  AC_FOLLOWRIGHT = 8, //Follow from the right of the object operation.
  AC_FOLLOWLEFT = 9, //Follow from the left of the object operation.
  AC_FOLLOWBEHINDANDABOVE = 10, //Follow from behind and above the object operation.
  AC_FOLLOWCOCKPIT = 11, //Follow from cockpit operation.
  AC_FOLLOWFROMGROUND = 12, //Follow the object from the ground point operation.
  AC_STOP = 13, //The object was stopped being played (i.e., after a fly to operation).
  AC_JUMP = 14, //Jump to the object operation.
  AC_DELETE = 15, //The object was deleted.
  AC_EDIT_FINISHED = 16, //The object was finished being edited.
  AC_OBJECT_ADDED = 17, //An object was added to TerraExplorer.
  AC_PLAY = 18, //Play operation for the object was started.
  AC_SHOW = 19, //A show or hide action was performed by clicking on the item show / hide icon.
  AC_EDIT_STARTED = 20, //Edit operation for the object was started.
  AC_SELCHANGED = 21, //The current selected item(s) has changed.
  AC_WAYPOINT_REACHED = 22, //A dynamic object reached a way point, or the camera reached a route waypoint.
  AC_GROUP_ADDED = 23, //A group was added.
  AC_LAYER_ADDED = 24, //A layer was added.
  AC_LAYER_REFRESHED = 25, //A layer was refreshed.
  AC_ITEM_MOVED = 26, //An item was moved to a different location.
  AC_LAYER_REMOVED = 27, //A layer was removed.
  AC_3DML_ADDED = 28, //A 3DML was added.
  AC_3DML_REMOVED = 29, //A 3DML was removed.
}

interface IAction {
  Code: IActionCode;
  Param: boolean | number;
}

interface IAttachment {
  AttachedToID: string;
  AutoDetach: boolean;
  DeltaAltitude: number;
  DeltaPitch: number;
  DeltaRoll: number;
  DeltaX: number;
  DeltaY: number;
  DeltaYaw: number;
  IsAttached: boolean;
  AttachTo(ObjectID: string, DeltaX: number, DeltaY: number, DeltaAltitude: number, DeltaYaw: number, DeltaPitch: number, DeltaRoll: number): void;
}

type FClientData = (s: string) => String;

interface ITerraExplorerMessage {
  BringToFront: boolean;
  TargetPosition: 0 | 2 | 3 | 4 | 5;
  ClientData: FClientData;
  ID: string;
  ObjectType: number;
  Text: string;
  Type: number;
  URL: string;
}

interface IPopupMessage {
  Align: string;
  AllowDrag: boolean;
  AllowResize: boolean;
  AnchorToView: boolean;
  Caption: string;
  ClientData: FClientData;
  Flags: number;
  FocusToRender: boolean;
  Height: number;
  ID: string;
  InnerHTML: string;
  InnerText: string;
  Left: number;
  ObjectType: number;
  SaveInFlyFile: boolean;
  Src: string;
  Timeout: number;
  Top: number;
  ShowCaption: boolean;
  Width: number;
}

interface IMessageObject {
  MessageID: string;
  Activate(): void;
  GetMessageObject(): ITerraExplorerMessage | IPopupMessage;
}

interface IBBox3D {
  MaxX: number;
  MaxY: number;
  MaxHeight: number;
  MinHeight: number;
  MinX: number;
  MinY: number;
}

interface IColor {
  abgrColor: number;
  FromABGRColor(abgrColor: number): void;
  FromARGBColor(argbColor: number): void;
  FromBGRColor(bgrColor: number): void;
  FromHTMLColor(htmlColor: string): void;
  FromRGBColor(rgbColor: number): void;
  GetAlpha(): number;
  SetAlpha(alpha: number): void;
  ToABGRColor(): number;
  ToARGBColor(): number;
  ToBGRColor(): number;
  ToHTMLColor(): string;
  ToRGBColor(): number;
}

type Color = IColor | number;

interface ITerrainObject {
  BBox: IBBox3D;
  DrawOrder: number;
  GroundObject: boolean;
  Highlight: boolean;
  Tint: IColor;
  GetRecommendedDistance(): number;
}

interface ITimeSpan {
  End: Date;
  Start: Date;
}

interface ITooltip {
  Text: string;
}

interface ITreeItem {
  Name: string;
  ParentGroupName: string;
  ShowInViewerTree: boolean;
}

interface IVisibility {
  MaxVisibilityDistance: number;
  MinVisibilityDistance: number;
  Show: boolean;
  ShowThroughDistance: number;
}

interface ITerrainModel extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  BestLOD: number;
  FlipTexture: boolean;
  Message: IMessageObject;
  ModelFileName: string;
  ModelType: number;
  Position: IPosition;
  ScaleFactor: number;
  ScaleX: number;
  ScaleY: number;
  ScaleZ: number;
  Terrain: ITerrainObject;
  Timespan: ITimeSpan;
  Tooltip: ITooltip;
  TreeItem: ITreeItem;
  Visibility: IVisibility;
}

interface I3DViewshed {
  Action: IAction;
  Attachment: IAttachment;
  ClientData: FClientData;
  Distance: number;
  FieldOfViewX: number;
  FieldOfViewY: number;
  HiddenAreaColor: Color;
  ID: string;
  Message: IMessageObject;
  ObjectType: ObjectTypeCode;
  Position: IPosition;
  Quality: number;
  RayColor: Color;
  RefreshRate: number;
  SaveInFlyFile: boolean;
  Terrain: ITerrainObject;
  TimeSpan: ITimeSpan;
  Tooltip: ITooltip;
  TreeItem: ITreeItem;
  Visibility: IVisibility;
  VisibleAreaColor: Color;
}

interface IAnalysis {
  Create3DViewshed(ViewerPosition: IPosition, FieldOfViewX: number, FieldOfViewY: number, Distance: number, ParentGroupID: string, Description: string): I3DViewshed;
}

interface ITerraExplorerObject {
  ClientData: any;
  ID: string;
  ObjectType: ObjectTypeCode;
  SaveInFlyFile: boolean;
  GetParam: any;
  SetParam: any;
}

declare const enum ObjectTypeCode {
  OT_UNDEFINED = 0,
  OT_POLYLINE = 1,
  OT_POLYGON = 2,
  OT_RECTANGLE = 3,
  OT_REGULAR_POLYGON = 4,
  OT_CIRCLE = 5,
  OT_3D_POLYGON = 6,
  OT_BUILDING = 7,
  OT_BOX = 8,
  OT_PYRAMID = 9,
  OT_CYLINDER = 10,
  OT_CONE = 11,
  OT_ELLIPSE = 12,
  OT_ARC = 13,
  OT_ARROW = 14,
  OT_3D_ARROW = 15,
  OT_SPHERE = 16,
  OT_MODEL = 17,
  OT_LABEL = 18,
  OT_LOCATION = 19,
  OT_TREE_HOTLINK = 20,
  OT_ROUTE = 21,
  OT_MESSAGE = 22,
  OT_DYNAMIC = 23,
  OT_IMAGE_LABEL = 24,
  OT_THREAT_DOME = 25,
  OT_IMAGERY_LAYER = 26,
  OT_TERRAIN_VIDEO = 27,
  OT_POINT_CLOUD = 28,
  OT_ELEVATION_LAYER = 29,
  OT_TERRAIN_MODIFIER = 30,
  OT_TERRAIN_HOLE = 31,
  OT_POPUP_MESSAGE = 32,
  OT_FEATURE = 33,
  OT_PRESENTATION = 34,
  OT_ANALYSIS_LOS = 35,
  OT_FEATURE_LAYER = 36,
  OT_FEATURE_GROUP = 37,
  OT_3D_MESH_LAYER = 38,
  OT_3D_MESH_FEATURE_LAYER = 39,
  OT_KML_LAYER = 40,
  OT_3D_VIEWSHED = 41,
  OT_CONTOUR_MAP = 42,
  OT_SLOPE_MAP = 43,
  OT_EFFECT = 44,
  OT_NETWORK_LINK = 45,
  OT_SCREEN_OVERLAY = 46,
}

interface IClipboard {
  Count: number;
  Item: ITerraExplorerObject;
  AddObject(ObjectID: string): void;
  RemoveAll(): void;
}

interface IContainerItem {
  ItemID: string;
  Name: string;
  StartupSite: number;
  Text: string;
  URL: string;
  UseURL: boolean;
}

interface IContainers {
  Count: number;
  Item: IContainerItem;
  AddContainer(Name: string, URL: string, StartupSite: number): number;
  GetContainer(Index: number): IContainerItem;
  RemoveContainer(Index: number): void;
}

interface IMultiple3DWindows {
  // I'm making a lot of assumptions here. Not sure if I'm correct rn
  readonly IsLeader: boolean;
  LinkPosition(target: ISGWorld, OffsetX: number, OffsetY: number, OffsetAltitude: number, OffsetYaw: number, OffsetPitch: number, LinkFlags: number): void;
  set SetAsLeader(b: boolean);
  readonly UnlinkPosition: void;
}

interface ISelection {
  Count: number;
  Item: ITerraExplorerObject;
  Add(ObjectID: string): void;
  CanAdd(ObjectID: string): boolean;
  Remove(ObjectID: string): void;
  RemoveAll(): void;
}

interface IApplication {
  Caption: string;
  Clipboard: IClipboard;
  Containers: IContainers;
  CPUSaveMode: boolean;
  DataPath: string;
  EnableJoystick: boolean;
  ExecutablePath: string;
  FullScreen: number;
  Multiple3DWindows: IMultiple3DWindows;
  Selection: ISelection;
  SuppressUIErrors: boolean;
  TargetFrameRate: number;
  Search(stringToSearch: string): void;
}

interface ICommand {
  CanExecute(CommandID: number, parameter: any): boolean;
  Execute(CommandID: number, parameter?: any): void;
  GetValue(CommandID: number): any;
  IsChecked(CommandID: number, parameter: any): boolean;
}

interface ICoordinateSystem {
  FactorToMeter: number;
  PrettyWkt: string;
  WellKnownText: string;
  WktDescription: string;
  GetFactorToMeterEx(Y: number): number;
  InitFromBMG(Group: string, Sys: string, Datum: string, Unit: string): void;
  InitFromEPSG(EPSG: number): void;
  readonly InitLatLong: void;
  IsCompound(): boolean;
  IsGeocentric(): boolean;
  IsPlanar(): boolean;
  IsSame(pCoordinateSystem: ICoordinateSystem): boolean;
  IsWktValid(): boolean;
}

interface ICoord2D {
  X: number;
  Y: number;
}

interface ICoordServices {
  SourceCoordinateSystem: ICoordinateSystem;
  ChooseCSDialog(Title: string, WellKnownText: string): string;
  ConvertCoordinateToMGRS(X: number, Y: number): string;
  ConvertMGRSToCoordinate(bstrMGRS: string): ICoord2D;
  CreateCoordinateSystem(WellKnownText: string): ICoordinateSystem;
  GetAimingAngles(From: IPosition, To: IPosition): IPosition;
  GetDistance(X1: number, Y1: number, X2: number, Y2: number): number;
  GetDistance3D(From: IPosition, To: IPosition): number;
  GetParam: any;
  MoveCoord(X: number, Y: number, moveWestEast: number, moveSouthNorth: number): ICoord2D;
  MoveCoordEx(Position: IPosition, moveForward: number, moveRight: number, moveUp: number): void;
  Reproject(From: ICoordinateSystem, To: ICoordinateSystem, X: number, Y: number): ICoord2D;
  SetParam: any;
}

interface IObjectTexture {
  FileName: string;
  RotateAngle: number;
  ScaleX: number;
  ScaleY: number;
  TilingMethod: number;
  XScrollRate: number;
  YScrollRate: number;
}

interface IFillStyle {
  Color: IColor;
  Texture: IObjectTexture;
}

interface ILineStyle {
  BackColor: IColor;
  Color: IColor;
  Pattern: number;
  Width: number;
}

interface ITerrain3DRectBase extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  Bottom: number;
  Depth: number;
  FillStyle: IFillStyle;
  Height: number;
  Left: number;
  LineStyle: ILineStyle;
  Message: IMessageObject;
  Position: IPosition;
  Right: number;
  Terrain: ITerrainObject;
  Timespan: ITimeSpan;
  Tooltip: ITooltip;
  Top: number;
  TreeITem: ITreeItem;
  Visibility: IVisibility;
  Width: number;
}

type ISpatialOperator = unknown;

interface ISpatialRelation {
  Contains: unknown;
  Crosses: unknown;
  Disjoint: unknown;
  Equals: unknown;
  Intersects: unknown;
  Overlaps: unknown;
  Touches(otherGeometry: IGeometry): boolean;
  Within: unknown;
}

type IWks = unknown;

interface IGeometry {
  Dimension: number;
  Envelope: IGeometry;
  GeometryType: number;
  GeometryTypeStr: string;
  SpatialOperator: ISpatialOperator;
  SpatialRelation: ISpatialRelation;
  Wks: IWks;
  Clone: unknown;
  EndEdit(): IGeometry;
  IsEmpty: unknown;
  IsSimple: unknown;
  SetEmpty: unknown;
  StartEdit(): void;
}

interface IPoint extends IGeometry {
  X: number;
  Y: number;
  Z: number;
}

interface IPoints {
  Count: number;
  Item(Index: number): IPoint;
  AddPoint(X: number, Y: number, Z: number): void;
  DeletePoint(Index: Number): void;
}

interface ILineString extends IGeometry {
  EndPoint: IPoint;
  Length: number;
  NumPoints: number;
  Points: IPoints;
  StartPoint: IPoint;
  Value: IPoint;
  IsClosed(): boolean;
}

interface IGeometryCreator {
  CreateGeometryFromWKB: unknown;
  CreateGeometryFromWKT: unknown;
  CreateLinearRingGeometry: any;
  CreateLineStringGeometry(vertices: [number, number, number][] | string): ILineString;
  CreateMultiLineStringGeometry: unknown;
  CreateMultiPointGeometry: unknown;
  CreateMultiPolygonGeometry: unknown;
  CreatePointGeometry: unknown;
  CreatePolygonGeometry: any;
}

type ITerrain3DArrow = unknown;
type ITerrain3DPolygon = unknown;
type ITerrainArc = unknown;
type ITerrainArrow = unknown;
type ITerrainBuilding = unknown;

interface ITerrainRegPolygon extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  FillStyle: IFillStyle;
  LineStyle: ILineStyle;
  Message: IMessageObject;
  NumberOfSegments: number;
  Position: IPosition;
  Radius: number;
  Terrain: ITerrainObject;
  TimeSpan: ITimeSpan;
  Tooltip: ITooltip;
  TreeItem: ITreeItem;
  Visibility: IVisibility;
}

type ITerrain3DRegBase = unknown;

interface ITerrainPolyline extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  ExtendToGround: boolean;
  FillStyle: IFillStyle;
  Geometry: ILineString;
  LineStyle: ILineStyle;
  Message: IMessageObject;
  Position: IPosition;
  Spline: boolean;
  Terrain: ITerrainObject;
  Timespan: ITimeSpan;
  Tooltop: ITooltip;
  TreeItem: ITreeItem;
  Visibility: IVisibility;
}

interface ITerrainSphere extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  FillStyle: IFillStyle;
  LineStyle: ILineStyle;
  Message: IMessageObject;
  Position: IPosition;
  Radius: number;
  SegmentDensity: number;
  Style: number;
  Terrain: ITerrainObject;
  Timespan: ITimeSpan;
  Tooltop: ITooltip;
  TreeItem: ITreeItem;
  Visibility: IVisibility;
}

interface ILabelStyle {
  BackgroundColor: Color;
  Bold: boolean;
  FontName: string;
  FontSize: number;
  FrameFileName: string;
  IconColor: Color;
  Italic: boolean;
  LimitScreenSize: boolean;
  LineColor: Color;
  LineToGroundLength: number;
  LineToGroundType: number;
  LockMode: LabelLockMode;
  MaxImageSize: number;
  MaxViewingHeight: number;
  MinViewingHeight: number;
  MultilineJustification: string;
  PivotAlignment: string;
  Scale: number;
  ShowTextBehaviour: number;
  SmallestVisibleSize: number;
  TextAlignment: "Left" | "TopLeft" | "TopRight" | "Top" | "Right" | "RightBottom" | "Bottom" | "BottomLeft";
  TextColor: Color;
  TextOnImage: boolean;
  Underline: boolean;
}

declare const enum LabelLockMode {
  LM_DECAL = 0,
  LM_AXIS = 1,
  LM_AXIS_TEXTUP = 2,
  LM_AXIS_AUTOPITCH = 3,
  LM_AXIS_AUTOPITCH_TEXTUP = 4,
  LM_AXIS_AUTOYAW = 5
}

type CanvasPixelArray = unknown;

interface ITerrainImageLabel extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  BlendMode: 0 | 1;
  ImageFileName: string;
  Message: IMessageObject;
  Position: IPosition;
  Style: ILabelStyle;
  Terrain: ITerrainObject;
  TimeSpan: ITimeSpan;
  Tooltip: ITooltip;
  TreeItem: ITreeItem;
  Visibility: IVisibility;
  SetImageFromBuffer(Buffer: CanvasPixelArray, Width: number, Height: number): void;
}

interface ITerrainLabel extends ITerrainImageLabel {
  Text: string;
}

interface ICreator {
  GeometryCreator: IGeometryCreator;
  Create3DArrow(Position: IPosition, Length: number, Style: 0 | 1, ObjectHeight: number, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrain3DArrow;
  Create3DPolygon(pIGeometry: IGeometry, ObjectHeight: number, LineColor: Color, FillColor: Color, AltitudeType: number, GroupID: string, Description: string): ITerrain3DPolygon;
  CreateArc(Position: IPosition, RadiusX: number, RadiusY: number, StartAngle: number, EndAngle: number, LineColor: Color, FillColor: Color, NumofSegments: number, GroupID: string, Description: string): ITerrainArc;
  CreateArrow(Position: IPosition, Length: number, Style: 0 | 1 | 2 | 3 | 4, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrainArrow;
  CreateBox(Position: IPosition, ObjectWidth: number, ObjectDepth: number, ObjectHeight: number, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrain3DRectBase; // Creates an ITerrain3DRectBase73, representing a box in the 3D Window.
  CreateBuilding(pIGeometry: IGeometry, RoofHeight: number, AltitudeType: 0 | 3, GroupID: string, Description: string): ITerrainBuilding; //Creates an ITerrainBuilding73, representing a building in the 3D Window.
  CreateCircle(Position: IPosition, Radius: number, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrainRegPolygon; //Creates an ITerrainRegularPolygon73, representing a circle in the 3D Window.
  CreateColor(Red: number, Green: number, Blue: number, Alpha: number): IColor; //Creates an IColor73, representing the custom color by defining the red, green, blue and alpha values.
  CreateCone(Position: IPosition, Radius: number, ObjectHeight: number, LineColor: Color, FillColor: Color, NumofSegments: number, GroupID: string, Description: string): ITerrain3DRegBase; //Creates an ITerrain3DRegBase73, representing the cone in the 3D Window.
  CreateCylinder(Position: IPosition, Radius: number, ObjectHEight: number, NumofSegments: number, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrain3DRegBase; //Creates an ITerrain3DRegBase73, representing the cylinder in the 3D Window.
  CreateDynamicObject: unknown; //Creates an ITerrainDynamicObject73, representing the dynamic object in the 3D Window.
  CreateEffect: unknown; //Creates an ITerrainEffect73 animated effect object.
  CreateElevationLayer: unknown; //Creates an ITerrainRasterLayer73, representing the elevation layer in the 3D Window.
  CreateEllipse: unknown; //Creates an ITerrainEllipse73, representing the ellipse in the 3D Window.
  CreateFeatureLayer: unknown; //Creates an IFeatureLayer73, representing the feature layer in the 3D Window.
  CreateFromStream: unknown; //Reserved. Currently not used.
  CreateHoleOnTerrain: unknown; //Creates an ITerrainHole73, representing the Hole On Terrain object in the 3D Window.
  CreateImageLabel(Position: IPosition, ImageFileName: string, LabelStyle: ILabelStyle, GroupID: string, Description: string): ITerrainImageLabel; //Creates an ITerrainImageLabel73 representing the image label in the 3D Window.
  CreateImageLabelFromBuffer: unknown; //Creates an ITerrainImageLabel73 representing the image label in the 3D Window. The pixel data of the label's image file is retrieved from a memory buffer.
  CreateImageryLayer: unknown; //Creates an ITerrainRasterLayer73, representing the imagery layer in the 3D Window.
  CreateKMLLayer: unknown; //Creates an IKMLLayer73, representing the KML layer in the 3D Window.
  CreateLabel: unknown; //Creates an ITerrainLabel73, representing the label in the 3D Window.
  /**
   * Creates an ILabelStyle73 that defines label style properties for text and image labels.
   * An enum that determines the label style type. The following are the possible values:
   * LS_DEFAULT = 0
   * LS_STREET = 1
   * LS_STATE = 2
   * @param {(0 | 1 | 2)} ls
   * @return {*}  {ILabelStyle}
   * @memberof ICreator
   */
  CreateLabelStyle(ls: 0 | 1 | 2): ILabelStyle;
  CreateLocation: unknown; //Creates an ITerrainLocation73, representing the point of interest in the 3D Window.
  CreateLocationHere: unknown; //Creates an ITerrainLocation73 representing the location in the current camera position.
  CreateMeshLayerFromFile: unknown; //Loads from a file an IMeshLayer73 representing a unified, stream optimized 3D Mesh Layer (3DML) database.
  CreateMeshLayerFromSGS: unknown; //Loads from SkylineGlobe Server and older TerraGate SFS an IMeshLayer73 representing a unified, stream optimized 3D Mesh Layer (3DML) database.
  CreateMessage: unknown; //Creates an ITerraExplorerMessage73, representing the message object which is displayed in a container. 
  CreateModel(Position: IPosition, FileName: string, Scale: number, ModelType: 0 | 1 | 2, GroupID: string, Description: string): ITerrainModel; //Imports from a file an ITerrainModel73, representing a model object.
  CreateNewFeatureLayer: unknown; //Creates directly from TerraExplorer an IFeatureLayer73, representing a new feature layer.
  CreatePointCloudModel: unknown; //Imports an ITerrainPointCloudModel73 object from a file.
  CreatePolygon(geometry: IGeometry, LineColor?: Color, FillColor?: Color, AltitudeTypeCode?: AltitudeTypeCode, GroupID?: string, Description?: string): ITerrainPolygon; //Creates an ITerrainPolygon73 in the 3D Window.
  CreatePolygonFromArray: unknown; //Creates an ITerrainPolygon73 representing the polygon by connecting the points in an array of points.
  CreatePolyline(Geometry: IGeometry, LineColor: Color, AltitudeType: number, GroupID: string, Description: string): ITerrainPolyline; //Creates an ITerrainPolyline73, representing the polyline, in the 3D Window.
  CreatePolylineFromArray(verticesArray: [number, number, number][], LineColor: Color, AltitudeType: number, GroupID: string, Description: string): ITerrainPolyline; //Creates an ITerrainPolyline73, representing the polyline, by connecting the points in an array of points.
  CreatePopupMessage(Caption: string, Src: string | undefined, Left: number, Top: number, Width: number, Height: number, Timeout: number): IPopupMessage; //Creates an IPopupMessage73, representing a message that displays in a floating browser or floating popup.
  CreatePosition(X: number, Y: number, Altitude: number, AltitudeType: number, Yaw?: number, Pitch?: number, Roll?: number, Distance?: number): IPosition; //Creates an IPosition73, representing the coordinate position.
  CreatePresentation: unknown; //Creates an IPresentation73, representing the presentation.
  CreatePyramid: unknown; //Creates an ITerrain3DRectBase73, representing the pyramid, in the 3D Window.
  CreateRectangle(Position: IPosition, ObjectWidth: number, ObjectDepth: number, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrainRectangle; //Creates an ITerrainRectangle73, representing the rectangle, in the 3D Window.
  CreateRegularPolygon: unknown; //Creates an ITerrainRegularPolygon73 representing the polygon, in the 3D Window.
  CreateRouteWaypoint: unknown; //Creates IRouteWaypoint73 representing the created waypoint.
  CreateScreenOverlay: unknown; //Creates IScreenOverlay73 representing the newly created screen overlay.
  CreateSphere(Position: IPosition, Radius: number, Style: number, SegmentDensity: number, LineColor: Color, FillColor: Color, GroupID: string, Description: string): ITerrainSphere; //Creates an ITerrainSphere73 representing the newly created sphere.
  CreateTerrainModifier: unknown; //Creates an ITerrainModifier73 representing the terrain modifier polygon.
  /**
   * Creates an ITerrainLabel73 representing the newly created label.
   *
   * @param {IPosition} Position
   * @param {string} Text
   * @param {ILabelStyle} labelStyle
   * @param {string} GroupID
   * @param {string} Description
   * @return {*}  {ITerrainLabel}
   * @memberof ICreator
   */
  CreateTextLabel(Position: IPosition, Text: string, labelStyle: ILabelStyle, GroupID: string, Description: string): ITerrainLabel;
  CreateTreeHotlink: unknown; //Creates an ITreeHotlink73 representing the newly created hotlink.
  CreateVideoOnTerrain: unknown; //Creates an ITerrainVideo73 representing the newly created video on terrain object.  
  /**
   *  Deletes an object from the terrain by ID
   * @param {string} ObjectID
   * @memberof ICreator
   */
  DeleteObject(ObjectID: string): void;
  GetObject(ObjectID: string): ITerraExplorerObject; //
}

interface INavigate {
  FieldOfView: number;
  Speed: number;
  UndergroundMode: boolean;
  DetectCollisionToTarget: unknown;
  FlyThrough: unknown;
  FlyTo(target: string | ITerraExplorerObject | IPosition, Pattern?: number): void;
  GetPosition(AltitudeType: 0 | 3 | 4): IPosition;
  JumpTo(target: string | ITerraExplorerObject | IPosition, Pattern?: number): void;
  SetGPSMode: unknown;
  SetGPSPosition: unknown;
  SetPosition(Position: IPosition): void;
  Stop: unknown;
  ZoomIn: unknown;
  ZoomOut: unknown;
  ZoomTo: unknown;
}

interface IProjectTree {
  HiddenGroupID: string;
  HiddenGroupName: string;
  NotInTreeID: string;
  RootID: string;
  ShowSearchTool: boolean;
  CreateGroup(GroupName: string, ParentGroupID?: string): string; // Creates a group in the Project Tree.
  CreateLockedGroup: unknown; // Creates a group in a “locked” (collapsed) mode.When locked, TerraExplorer Viewer users cannot expand the group to view its contents.
  DeleteItem(ID: string): void; // Deletes an item from the Project Tree(and from the terrain, if that item was a terrain object).
  EditItem: unknown; //Reserved.Currently not used.Use EditItemEx instead.
  EditItemEx: unknown; // This method replaces EditItem(now reserved) and should be used instead.Places a specified item in edit mode and positions the property sheet if opened in the specified position on the 3D Window.The flags parameter provides control over the display of the property sheet(e.g., whether to display the property sheet with or without the top toolbar) and over the initial edit and move modes.
  EditItems: unknown; // Opens the Multi Edit property sheet to edit multiple specified items.
  EnableRedraw: unknown; // Enables changes to be redrawn or prevents them from being redrawn in the Project Tree.
  EndEdit: unknown; // Terminates the EditItemEx mode.
  ExpandGroup: unknown; // Expands the specified group so that it displays all of its children, or collapses it.
  FindItem(PathName: string): string; // Finds an item using a path to that item.
  GetActivationCode: unknown; // Returns the activation code assigned for the specified group.
  GetClientData: unknown; // Returns the text string describing the group’s attribute data.This information is available for general use in your application.
  GetGroupEndTime: unknown; // Returns the specified group’s end date and time.
  GetGroupLocation: unknown; // Returns the location of the specified group.
  GetGroupMessageID: unknown; // Returns the message set for a specific group or layer in the Project Tree using its ID.
  GetGroupStartTime: unknown; // Returns the specified group’s start date and time.
  /**
   * Returns the name of a specific item using its ID.
   *
   * @param {string} id
   * @return {*}  {string}
   * @memberof IProjectTree
   */
  GetItemName(id: string): string;
  GetLayer: unknown; // Returns an interface to the IFeatureLayer73 object based on the specified group ID.
  /**
   * Retrieves the Project Tree item that has the specified relationship, indicated by the Code parameter, to another item whose ID is specified.
   * returns the ID of the item
   * @param {string} id
   * @param {ItemCode} code
   * @return {*}  {string}
   * @memberof IProjectTree
   */
  GetNextItem(id: string, code: ItemCode): string;
  // Returns an ITerraExplorerObject interface to an object based on its ID.
  GetObject(id: string): ITerraExplorerObject
  GetVisibility(id: string): 0 | 1 | 2; // Returns the visibility status of a Project Tree item on the terrain.
  /**
   * Determines whether or not a ProjectTree item is a group.
   *
   * @type {boolean}
   * @memberof IProjectTree
   */
  IsGroup(id: string): boolean;
  IsLayer: unknown; //Obsolete.To determine whether a Project Tree element is a feature layer, use IProjectTree73.GetObject to return an interface to the element and then ITerraExplorerObject73.ObjectType to get the element type.
  IsLocked: unknown; // Determines whether or not a group is locked.
  IsRadioGroup: unknown; // Determines whether or not a group is a radio group.
  LoadFlyLayer: unknown; // Loads a Fly file into the current project.All the objects from the Fly file, including locations, routes and hyperlinks, are added.
  LoadKmlLayer: unknown; // Loads a KML file into the current project.All the objects from the KML file, including locations, presentations, and hyperlinks, are added.
  LockGroup: unknown; // Sets a group to a “lock” (collapsed) status mode.When a group is locked, users of TerraExplorer Viewer cannot expand the group and view its contents.
  RenameGroup: unknown; // Renames a group in the Project Tree.
  SaveAsFly: unknown; // Saves the specified group to a Fly file.
  SaveAsKml: unknown; // Saves the specified group to a KML file.
  SelectItem(ID: string, flags: number, reserved: number): string; // Selects an item in the Project Tree.
  SetActivationCode: unknown; // Determines the default activation action executed when clicking on the locked group symbol.
  SetClientData: unknown; // Stores a text string in the group global namespace.
  SetGroupEndTime: unknown; // Determines the date and time when the group should stop being visible
  SetGroupLocation: unknown; // Determines the location parameters for a specified group.
  SetGroupMessageID: unknown; // Sets the message for a specific group or layer in the Project Tree using its ID.
  SetGroupStartTime: unknown; // Determines the date and time when the group should start being visible
  SetParent: unknown; // Moves an item to a different group.
  SetRadioGroup: unknown; // Sets a Boolean that determines whether the Project Tree group is a radio group, whose items are mutually exclusive or a standard group.
  SetVisibility(ID: string, visiblility: boolean): unknown; // Sets a ProjectTree item to be visible, or not visible, on the terrain.
  ShowSubTree: unknown; //Reserved
  SortGroup: unknown; // Sorts the items in the group according to specified
}

type IDateTime = unknown;
type ISGServer = unknown;
type ITerrain = unknown;
type IVersion = unknown;

interface IProject {
  Settings: any
  Open(ProjectURL: string, Asynchronous?: boolean, User?: string, Password?: string): void;
  Close(bSuppressConfirmation?: boolean): boolean;
  Save(): void;
  SaveAs(ProjectFileName: string): string;
  LoadFiles(FileNamesArray: Object, GroupID?: string): void;
  Name: string;
  FileVersion: unknown;
}

declare const enum ItemCode {
  SELECTED = 10,
  CHILD = 11,
  FIRSTVISIBLE = 12,
  NEXT = 13,
  NEXTVISIBLE = 14,
  PARENT = 15,
  PREVIOUS = 16,
  PREVIOUSVISIBLE = 17,
  ROOT = 18
}

interface IDrawing {
  DrawPolyline(DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
  DrawPolygon(DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
  DrawTextLabel(Text: string, DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
  DrawImageLabel(ImagePath: string, DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
  DrawDynamicObject(Path: string, DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
  DrawModel(Path: string, DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
  DrawRectangle(DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): ITerrainRectangle;
  DrawCircle(DrawingMode: DrawingMode, GroupID?: string, Left?: number, Top?: number): unknown;
}

/**
 * An enum that determines an object's initial move mode, i.e., how it is moved in the 3D Window,
 * and how the property sheet is displayed when the object is created. The DrawingMode enum is 
 * divided into two subgroups. This parameter can use a combination of values from the two subgroups, 
 * but no more than one value from each subgroup can be used.
 *
 * @enum {number}
 */
declare const enum DrawingMode {
  /**
   * Property Sheet Display Group – Use only one of the following values:
   * Open the property sheet including the top toolbar to edit the object.
   */
  DRAW_MODE_SHOW_PROPERTY = 1,
  /**
   * Property Sheet Display Group – Use only one of the following values:
   * Open only the property sheet toolbar to edit the item.
   */
  DRAW_MODE_SHOW_PROPERTY_TOOLBAR = 2,

  /**
   * Move Mode Group – Use only one of the following values
   * Sets the edit mode to move the object based on where the mouse is pointing in the 3D Window. 
   * This makes it easier to move an object or node on a vertical plane or above a 3DML layer or other terrain object.
   */
  DRAW_MODE_MAGNET = 4,
  /**
   * Move Mode Group – Use only one of the following values
   * Set the edit mode to move the object in the XY plane
   */
  DRAW_MODE_XY = 8
}

interface ITerrainRectangle extends ITerraExplorerObject {
  ID: string;
  ObjectType: ObjectTypeCode;
  SaveInFlyFile: boolean;
  TreeItem: ITreeItem;
  Message: IMessageObject;
  Action: IAction;
  Position: IPosition;
  Terrain: ITerrainObject;
  Tooltip: ITooltip;
  Attachment: IAttachment;
  Visibility: IVisibility;
  TimeSpan: ITimeSpan;
  LineStyle: ILineStyle;
  FillStyle: IFillStyle;
  Top: number;
  Left: number;
  Right: number;
  Bottom: number;
  Width: number;
  Depth: number;
}

interface IWorldPointInfo {
  ObjectID: string;
  Position: IPosition;
  Type: number;
}

interface IMouseInfo {
  Delta: never;
  Flags: number;
  X: number;
  Y: number;
}

interface IWindow {
  Cursor: unknown;
  DisablePresentationControl: unknown;
  Rect: unknown;
  CenterPixelToWorld(TypeFilterFlags: number): IWorldPointInfo;
  GetControls: unknown;
  GetInputMode: unknown;
  GetMouseInfo(): IMouseInfo;
  GetPopupByCaption: unknown;
  GetPopups: unknown;
  GetSnapShot: unknown;
  HideMessageBarText: unknown;
  PixelFromWorld(position: IPosition, mode: number): IScreenPointInfo;
  PixelToObjects: unknown;
  PixelToWorld(PixelX: number, PixelY: number, TypeFilterFlags: number): IWorldPointInfo;
  RemovePopup: unknown;
  RemovePopupByCaption: unknown;
  SetInputMode: unknown;
  ShowControls: unknown;
  ShowMessageBarText: unknown;
  ShowPopup: unknown;
}

interface ISGWorld {
  Analysis: IAnalysis;
  Application: IApplication;
  Command: ICommand;
  CoordServices: ICoordServices;
  Creator: ICreator;
  DateTime: IDateTime;
  Drawing: IDrawing;
  IgnoreAccelerators: boolean;
  Navigate: INavigate;
  Project: IProject;
  ProjectTree: IProjectTree;
  SGServer: ISGServer;
  Terrain: ITerrain;
  Version: IVersion;
  Window: IWindow;
  AttachEvent(bstrEventName: string, dispFunc: (...args: any[]) => any): void;
  DetachEvent(bstrEventName: string, dispFunc: (...args: any[]) => any): void;
  GetOptionParam(): unknown;
  GetParam(...a: any[]): unknown;
  Open(): unknown;
  SetOptionParam(): unknown;
  SetParam(...a: any[]): unknown;
  SetParamEx(...a: any[]): unknown;
}

interface ISessionManager {
  GetPropertyValue(property: string): string;
}

interface ITerrainPolygon extends ITerrainPolyline {
  ID: string;
  objectType: ObjectTypeCode;
  saveInFlyFile: boolean;
  treeItem: unknown;
  message: IMessageObject;
  action: IAction;
  position: IPosition;
  terrain: ITerrainObject;
  tooltip: ITooltip;
  attachment: IAttachment;
  visibility: IVisibility;
  timeSpan: ITimeSpan;
  lineStyle: ILineStyle;
  fillStyle: IFillStyle;
  geometry: IGeometry;
  spline: boolean;
  extendToGround: boolean;
  volumeClassification: unknown;
}

interface IScreenPointInfo {
  // Gets the Boolean that determines whether the terrain coordinate falls in the 3D Window.
  InsideScreenRect: boolean
  // Gets the Boolean that determines whether the point is located behind the surface of the camera.
  PointBehindCamera: boolean
  // Gets the x-screen coordinate of the terrain coordinate.
  X: number
  // Gets the y-screen coordinate of the terrain coordinate.
  Y: number

}

interface IBBox2D {
  MaxX: number;
  MaxY: number;
  MinX: number;
  MinY: number;
}

interface ITerrainRasterLayer extends ITerraExplorerObject {
  Action: IAction;
  Attachment: IAttachment;
  CoordinateSystem: ICoordinateSystem;
  DataSourceBBox: IBBox2D;
  DataSourceWKT: string;
  DisplayName: string;
  Elevation: boolean;
  ElevationOffset: number;
  ElevationScale: number;
  FileName: string;
  FillStyle: IFillStyle;
  Geometry: IGeometry;
  Imagery: boolean;
  InitParam: string[];
  LineStyle: ILineStyle;
  Message: IMessageObject;
  NullTolerance: number;
  NullValue: number;
  PlugName: string;
  Position: IPosition;
  Reproject: boolean;
  ReprojectionElevation: boolean;
  Terrain: ITerrainObject;
  Timespan: ITimeSpan;
  Tooltip: ITooltip;
  TreeItem: ITreeItem;
  UseNull: boolean;
  Visibility: IVisibility;
  Refresh: unknown;
  RefreshRect: unknown;
}
