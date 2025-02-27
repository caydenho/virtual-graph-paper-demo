import { CANVAS_SIZE, RANGE, STEP_SIZE } from "./constants";
import { ConnectPointsType, GraphPaperPoint, LineStyle, TwoPointFunctionType, ThreePointFunctionType, GraphPaperAction, ShadeType } from "./types/graphPaper";
import { gridToCanvas, hexToRgba } from "./utils";

 // old function needs the actual canvas coordinates
  // while this one will try and draw it based on the grid
export const drawPoint = (ctx: CanvasRenderingContext2D, point: GraphPaperPoint) => {
      if (ctx) {
        ctx.beginPath();
        const updated = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point.x, point.y)
        ctx.arc(updated.x, updated.y, 5, 0, Math.PI * 2);
        
        switch(point.pointStyle){
          case 'filled':
            ctx.fillStyle = point.color || 'red'; 
            ctx.fill();
          break;

          case 'unfilled':
            ctx.strokeStyle = point.color || 'red'; 
            ctx.lineWidth = 2;
            ctx.stroke();
          break;

          default:
          break;
        }
      
      }
  };


  // Draws a selected point
  // Really just draws two points, the bottom one is just black and a smaller one on top of it
  // Might need to fix this later. If the color is black
    // and it its filled then to show its selected it will be orange
    // and if its unfilled it will be orange
export const drawSelectedPoint = (ctx: CanvasRenderingContext2D, point: GraphPaperPoint) => {
      
    let colorToUse = point.color || "red"
    if (point.color === '#000000'){
      colorToUse = 'orange'
    }
    const updated = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point.x, point.y);
  
    const outerRadius = 5;
    const innerRadius = 4; 

    // if it is filled
    switch(point.pointStyle){
      case 'filled':
        // 1) Draw the "outline" in black
        ctx.beginPath();
        ctx.arc(updated.x, updated.y, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();

        // 2) Draw the normal circle in the point’s color on top
        ctx.beginPath();
        ctx.arc(updated.x, updated.y, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = colorToUse; 
        ctx.fill();
      break;

      case 'unfilled':
        ctx.beginPath();
        ctx.arc(updated.x, updated.y, outerRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "orange"; 
        ctx.lineWidth = 2;
        ctx.stroke();
      break;

      default:
      break;
    }

  
   
    
  };


export const drawTwoPointConnection = (ctx: CanvasRenderingContext2D, point1: GraphPaperPoint, point2: GraphPaperPoint, connectionType: ConnectPointsType, lineStyle: LineStyle, selectedTwoPointFunction: TwoPointFunctionType, selectedColor: string) => {
    if (!ctx) return;
  
    ctx.beginPath();
    const point1Norm = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point1.x, point1.y)
    const point2Norm = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point2.x, point2.y)
    ctx.moveTo(point1Norm.x, point1Norm.y);

    // Set line styles
    switch (lineStyle) {
      case "dashed":
        ctx.setLineDash([10, 5]); // Dash pattern
        break;
      case "dotted":
        // todo: fix this
        // this throws off the grid pattern
        ctx.setLineDash([2, 4]); // Dotted pattern
        break;
      default:
        ctx.setLineDash([]); 
        break;
    }

    // handle linear vs exponential
    switch (selectedTwoPointFunction) {

      case "linear":
        console.log("linear")
        switch (connectionType) {
          case "finite":
            ctx.lineTo(point2Norm.x, point2Norm.y);
            break;
          case "semi_infinite":
            extendRay(ctx, point1, point2);
            break;
          case "continuous":
            extendLine(ctx, point1, point2);
            break;
          default:
            break;
        }
      break;
      // todo: make this work with the connection type
      case "exponential":
        const x1 = point1.x;
        const y1 = point1.y;
        const x2 = point2.x;
        const y2 = point2.y;
      
        if (y1 === 0 || y2 === 0) {
          alert("Exponential requires non-zero y-values.");
          return; // stop drawing
        }
        // If signs differ (one positive, one negative) => fail
        if ((y1 < 0 && y2 > 0) || (y1 > 0 && y2 < 0)) {
          alert("Exponential requires both points' y-values to have the same sign.");
          return; 
        }
        // Also ensure x1 !== x2 so we don't divide by zero
        if (x1 === x2) {
          alert("Exponential requires two distinct x-values.");
          return;
        }
    

        // 2. Solve for a and b
        const b = (y2 / y1) ** (1 / (x2 - x1));
        const a = y1 / (b ** x1);
      
        let startX = Math.min(x1, x2);
        let endX   = Math.max(x1, x2);

        if (connectionType === "semi_infinite") {
          startX = Math.min(x1, x2);
          endX = RANGE;
        }
        if (connectionType === "finite") {
          // Draw only between the two points
          startX = Math.min(x1, x2);
          endX = Math.max(x1, x2);
        }
        if (connectionType === "continuous") {
          // Draw between the two points
          startX = -RANGE;
          endX = RANGE;
        }


      
        // How many steps? More steps => smoother curve
        const steps = 500; 
        const stepSize = (endX - startX) / steps;
      
        const currentX = startX;
        const currentY = a * (b ** currentX);
      
        // Convert that to canvas coords
        const startCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, currentX, currentY);
        ctx.moveTo(startCanvas.x, startCanvas.y);
      
        for (let i = 1; i <= steps; i++) {
          const nextX = startX + i * stepSize;
          const nextY = a * (b ** nextX);
      
          const nextCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, nextX, nextY);
          console.log(nextCanvas)
      
          ctx.lineTo(nextCanvas.x, nextCanvas.y);
        }
      
        break;


      default:
        break;

    }


  
    ctx.strokeStyle = selectedColor; 

    ctx.lineWidth = 2;
    ctx.stroke();
  };
  
  




  // Todo... add arrowheads for lines and rays
  export const extendRay = (ctx: CanvasRenderingContext2D, p1: GraphPaperPoint, p2: GraphPaperPoint) => {
    const p1Norm = gridToCanvas(CANVAS_SIZE, STEP_SIZE, p1.x, p1.y)
    const p2Norm = gridToCanvas(CANVAS_SIZE, STEP_SIZE, p2.x, p2.y)

    const dx = p2Norm.x - p1Norm.x;
    const dy = p2Norm.y - p1Norm.y;
    const scale = 1000; 
    const endX = p2Norm.x + dx * scale;
    const endY = p2Norm.y + dy * scale;
  
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  
  // Extend a full line both directions and add arrows on both ends
  const extendLine = (ctx: CanvasRenderingContext2D, p1: GraphPaperPoint, p2: GraphPaperPoint) => {
    const p1Norm = gridToCanvas(CANVAS_SIZE, STEP_SIZE, p1.x, p1.y)
    const p2Norm = gridToCanvas(CANVAS_SIZE, STEP_SIZE, p2.x, p2.y)

    const dx = p2Norm.x - p1Norm.x;
    const dy = p2Norm.y - p1Norm.y;
    const scale = 1000; 
  
    const startX = p1Norm.x - dx * scale;
    const startY = p1Norm.y - dy * scale;
    const endX = p2Norm.x + dx * scale;
    const endY = p2Norm.y + dy * scale;
  
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  export const drawThreePointConnection = (ctx: CanvasRenderingContext2D, point1: GraphPaperPoint, point2: GraphPaperPoint, point3: GraphPaperPoint, connectionType: ConnectPointsType, lineStyle: LineStyle, selectedThreePointFunction: ThreePointFunctionType, selectedColor: string) => {
    if (!ctx) return;
  
   // const p1 = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point1.x, point1.y);
    //const p2 = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point2.x, point2.y);
    //const p3 = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point3.x, point3.y);
  
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
  
    if (selectedThreePointFunction === "quadratic" || "square_root") {
      drawExponential(ctx, point1, point2, point3);
    } else if (selectedThreePointFunction === "absolute_value") {
      drawAbsolute(ctx, point1, point2, point3);
    }
    //cubic","quadratic","square_root","absolute_value
  
    ctx.stroke();
  };
  
  // Exponential function fitting y = a * b^x
  const drawExponential = (
    ctx: CanvasRenderingContext2D,
    p1: GraphPaperPoint,
    p2: GraphPaperPoint,
    p3: GraphPaperPoint
  ) => {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
  
    // Ensure y-values are nonzero and same sign
    if (y1 * y2 <= 0 || y1 * y3 <= 0) {
      alert("Exponential function requires all y-values to have the same sign.");
      return;
    }
  
    // Solve for `b` using logarithms
    const b = Math.exp(
      (Math.log(y3 / y1) - Math.log(y2 / y1) * (x3 - x1) / (x2 - x1)) /
        ((x3 - x1) - (x2 - x1))
    );
    const a = y1 / Math.pow(b, x1);
  
    const steps = 500;
    const startX = Math.min(x1, x2, x3) - 2;
    const endX = Math.max(x1, x2, x3) + 2;
    const stepSize = (endX - startX) / steps;
  
    const startCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, startX, a * Math.abs(startX - x2) + y2);
ctx.moveTo(startCanvas.x, startCanvas.y);

  
    for (let i = 1; i <= steps; i++) {
      const x = startX + i * stepSize;
      const y = a * Math.pow(b, x);
      const canvasPoint = gridToCanvas(CANVAS_SIZE, STEP_SIZE, x, y);
      ctx.lineTo(canvasPoint.x, canvasPoint.y);
    }
  };
  
  // Absolute value function fitting y = a |x - h| + k
  const drawAbsolute = (
    ctx: CanvasRenderingContext2D,
    p1: GraphPaperPoint,
    p2: GraphPaperPoint,
    p3: GraphPaperPoint
  ) => {
    // Find the vertex (h, k)
    const [sortedP1, sortedP2, sortedP3] = [p1, p2, p3].sort((a, b) => a.x - b.x);
    const h = sortedP2.x;
    const k = sortedP2.y;
  
    // Solve for `a` using one of the other points
    const a = (sortedP1.y - k) / Math.abs(sortedP1.x - h);
  
    const steps = 500;
    const startX = sortedP1.x - 2;
    const endX = sortedP3.x + 2;
    const stepSize = (endX - startX) / steps;
  
    const startCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, startX, a * Math.abs(startX - h) + k);
ctx.moveTo(startCanvas.x, startCanvas.y);

  
for (let i = 1; i <= steps; i++) {
  const x = startX + i * stepSize;
  const y = a * Math.abs(x - h) + k;
  const canvasPoint = gridToCanvas(CANVAS_SIZE, STEP_SIZE, x, y);
  ctx.lineTo(canvasPoint.x, canvasPoint.y);
}
  };
  
  export const drawGrid = (canvas:HTMLCanvasElement) => {

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

  
    // Ensure the grid lines are not dashed/dotted
    ctx.setLineDash([]); 
    // Clear whatever was on the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;   
    const height = canvas.height; 
    const centerX = width / 2;    
    const centerY = height / 2;   

    for (let i = -RANGE; i <= RANGE; i++) {
      ctx.beginPath();
      const x = centerX + i * STEP_SIZE;

      // If i = 0, draw the Y-axis thicker
      if (i === 0) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
      }

      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let j = -RANGE; j <= RANGE; j++) {
      ctx.beginPath();
      const y = centerY + j * STEP_SIZE;

      // If j = 0, draw the X-axis thicker
      if (j === 0) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
      }

      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

  };


export const drawShadedRegion = (ctx: CanvasRenderingContext2D, action: GraphPaperAction, shadeType: ShadeType) => {
    if (!ctx) return;
  
    console.log(action)
    ctx.beginPath();

 
  
    console.log(action)
    if (!action.points || action.points.length !== 2) {
        console.warn('drawShadedRegion: Only handles two-point linear shading.');
        return;
      }
    const { points } = action;
    const [point1, point2] = points;
   
    //const p1Canvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point1.x, point1.y);
    //const p2Canvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, point2.x, point2.y);
  
    ctx.setLineDash([]);

    // ctx save should save this and then multiply to make blue +red = purple
    // but it messes everything up
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; // lighter or screen or multiply
    ctx.strokeStyle =  point1.color || 'red';
    ctx.fillStyle =  point1.color
      ? hexToRgba(point1.color, 0.35) 
      : 'rgba(255, 0, 0, 0.5)';
  
    const connectionType = action.connectionType || 'finite'; 
    const functionType = action.functionType;
  
    if (functionType === 'linear') {
  
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      if (dx === 0) {
        console.warn('Vertical line shading not handled here.');
        return;
      }
      const m = dy / dx;
      const b = point1.y - m * point1.x;
  
      // 2. Decide the x-range to shade
      let xMin = Math.min(point1.x, point2.x);
      let xMax = Math.max(point1.x, point2.x);
  
      switch (connectionType) {
        case 'continuous':
          xMin = -RANGE;
          xMax = RANGE;
          break;
        case 'semi_infinite':
          // If p1 < p2 in x, we shade from xMin to RANGE. If p1 > p2, we shade from -RANGE to xMax.
          if (point1.x < point2.x) {
            xMin = point1.x;
            xMax = RANGE;
          } else {
            xMin = -RANGE;
            xMax = point1.x;
          }
          break;
        case 'finite':
        default:
          // Already set to the min / max of the two points
          break;
      }

      const steps = 200;
      const stepSize = (xMax - xMin) / steps;
  
      ctx.beginPath();
  
      let currentX = xMin;
      let currentY = m * currentX + b;
  
      const { x: startCanvasX, y: startCanvasY } = gridToCanvas(
        CANVAS_SIZE,
        STEP_SIZE,
        currentX,
        currentY
      );
      ctx.moveTo(startCanvasX, startCanvasY);
  
      for (let i = 1; i <= steps; i++) {
        currentX = xMin + i * stepSize;
        currentY = m * currentX + b;
        const canvasCoords = gridToCanvas(
          CANVAS_SIZE,
          STEP_SIZE,
          currentX,
          currentY
        );
        ctx.lineTo(canvasCoords.x, canvasCoords.y);
      }
  
      if (shadeType === 'above') {
        // For 'above', we connect from (xMax, lineY) up to (xMax, +RANGE),
        // then across to (xMin, +RANGE), then back down
       // const xMaxCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMax, m*xMax + b);
        const topRight = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMax, RANGE);
        const topLeft = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMin, RANGE);
  
        ctx.lineTo(topRight.x, topRight.y);
        ctx.lineTo(topLeft.x, topLeft.y);
        const xMinCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMin, m*xMin + b);
        ctx.lineTo(xMinCanvas.x, xMinCanvas.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // shadeType === 'below'
        // For 'below', we connect from (xMax, lineY) down to (xMax, -RANGE),
        // then across to (xMin, -RANGE), then back up
       // const xMaxCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMax, m*xMax + b);
        const bottomRight = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMax, -RANGE);
        const bottomLeft = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMin, -RANGE);
  
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.lineTo(bottomLeft.x, bottomLeft.y);
        // up to line at xMin
        const xMinCanvas = gridToCanvas(CANVAS_SIZE, STEP_SIZE, xMin, m*xMin + b);
        ctx.lineTo(xMinCanvas.x, xMinCanvas.y);
        ctx.closePath();
        ctx.fill();
      }
    } 
    ctx.restore();
  };
  


  export function redrawAll(ctx: CanvasRenderingContext2D, actions: GraphPaperAction[], points: GraphPaperPoint[], selectedPoints: GraphPaperPoint[]) {
   // Clear canvas or drawGrid
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx.canvas);
  
    // 2) Draw all connections (lines, curves, etc.)
    actions.forEach((action) => {
      if (action.actionType.startsWith("connect")) {
        if (!action.points || action.points.length < 2) return;
        if (!action.connectionType) return;
        if (!action.functionType) return;
        if (!action.style?.lineStyle) return;
        if (!action.functionType) return;
        switch (action.actionType) {
            case "connect_2_points":
                drawTwoPointConnection(ctx, action.points[0], action.points[1], action.connectionType, action.style.lineStyle, action.functionType as TwoPointFunctionType, action.style?.color || 'red');
                break;
            case "connect_3_points":
                drawThreePointConnection(ctx, action.points[0], action.points[1], action.points[2], action.connectionType, action.style.lineStyle, action.functionType as ThreePointFunctionType, action.style?.color || 'red');
                break;
            case "connect_4_points":
                // drawFourPointConnection(...);
                break;
       
      }
    }
    });
  
    // 3) Draw shading (if any "shade_region" actions exist)
    actions
      .filter(a => a.actionType === "shade_region")
      .forEach(a => {
        // Inside drawShadedRegion, do ctx.save(); globalCompositeOp = 'screen'; fill(); ctx.restore();
        drawShadedRegion(ctx, a, a.ShadeType || 'above');
      });
  
    // 4) Draw all points
    points.forEach(p => drawPoint(ctx, p));
  
    // 5) Draw selected points
    selectedPoints.forEach(p => drawSelectedPoint(ctx, p));
  }