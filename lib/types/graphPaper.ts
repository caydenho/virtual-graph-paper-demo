// lib/types/graphPaper.ts

export type ActionType =
  | "plot_point"
  | "select_points"
  | "connect_2_points"
  | "connect_3_points"
  | "connect_4_points"
  | "shade_region"



export type PointStyle = "filled" | "unfilled";

export type ConnectPointsType = 
| "continuous"     
| "semi_infinite"  
| "finite";  

export type LineStyle = "solid" | "dashed" | "dotted";

// todo: add sqrt here
export type TwoPointFunctionType= "linear" | "exponential";
export type ThreePointFunctionType = "quadratic" |  "absolute_value";
export type FourPointFunctionType = "cubic"

export type ShadeType = "above" | "below";

export interface Coordinate {
  x: number;
  y: number;
}

// This interface represents a plotted point with an ID so that it can be referenced by the connect action
export interface GraphPaperPoint extends Coordinate {
  id: string;
  pointStyle: PointStyle;
  color?: string;
}

export interface ActionStyle {
  pointStyle?: PointStyle
  lineStyle?: LineStyle
  color?: string;
  thickness?: number;
  opacity?: number;
}

export interface GraphPaperAction {
  actionType: ActionType;
  coordinates?: Coordinate[];
  // For actions like connect_points, we want references to already-plotted points
  points?: GraphPaperPoint[];
  style?: ActionStyle;
  connectionType?: ConnectPointsType;
  functionType?: TwoPointFunctionType | ThreePointFunctionType;
  ShadeType?: ShadeType;
  timestamp: string;
 
}

export interface GraphPaperSession {
  actions: GraphPaperAction[];
  sessionId?: string;
}