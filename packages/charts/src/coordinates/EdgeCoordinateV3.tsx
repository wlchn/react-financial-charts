import * as React from "react";

import { colorToRGBA, getStrokeDasharray, isDefined } from "../utils";

export function renderSVG(props) {
    const { className } = props;

    const edge = helper(props);
    if (edge === null) { return null; }
    let line;
    let coordinateBase;
    let coordinate;

    if (edge.line !== undefined && isDefined(edge.line)) {
        line = (
            <line
                className="react-financial-charts-cross-hair"
                strokeOpacity={edge.line.opacity}
                stroke={edge.line.stroke}
                strokeDasharray={getStrokeDasharray(edge.line.strokeDasharray)}
                x1={edge.line.x1}
                y1={edge.line.y1}
                x2={edge.line.x2}
                y2={edge.line.y2}
            />
        );
    }
    if (isDefined(edge.coordinateBase)) {
        const { rectWidth, rectHeight, arrowWidth } = edge.coordinateBase;

        const path =
            edge.orient === "left"
                ? `M0,0L0,${rectHeight}L${rectWidth},${rectHeight}L${rectWidth +
                arrowWidth},10L${rectWidth},0L0,0L0,0`
                : `M0,${arrowWidth}L${arrowWidth},${rectHeight}L${rectWidth +
                arrowWidth},${rectHeight}L${rectWidth +
                arrowWidth},0L${arrowWidth},0L0,${arrowWidth}`;

        coordinateBase =
            edge.orient === "left" || edge.orient === "right" ? (
                <g
                    key={1}
                    transform={`translate(${edge.coordinateBase.edgeXRect},${
                        edge.coordinateBase.edgeYRect
                        })`}
                >
                    <path
                        d={path}
                        className="react-financial-charts-text-background"
                        height={rectHeight}
                        width={rectWidth}
                        stroke={edge.coordinateBase.stroke}
                        strokeLinejoin="miter"
                        strokeOpacity={edge.coordinateBase.strokeOpacity}
                        strokeWidth={edge.coordinateBase.strokeWidth}
                        fill={edge.coordinateBase.fill}
                        fillOpacity={edge.coordinateBase.opacity}
                    />
                </g>
            ) : (
                    <rect
                        key={1}
                        className="react-financial-charts-text-background"
                        x={edge.coordinateBase.edgeXRect}
                        y={edge.coordinateBase.edgeYRect}
                        height={rectHeight}
                        width={rectWidth}
                        fill={edge.coordinateBase.fill}
                        opacity={edge.coordinateBase.opacity}
                    />
                );

        coordinate = (
            <text
                key={2}
                x={edge.coordinate.edgeXText}
                y={edge.coordinate.edgeYText}
                textAnchor={edge.coordinate.textAnchor}
                fontFamily={edge.coordinate.fontFamily}
                fontSize={edge.coordinate.fontSize}
                dy=".32em"
                fill={edge.coordinate.textFill}
            >
                {edge.coordinate.displayCoordinate}
            </text>
        );
    }
    return (
        <g className={className}>
            {line}
            {coordinateBase}
            {coordinate}
        </g>
    );
}
/* eslint-enable react/prop-types */

function helper(props) {
    const {
        coordinate: displayCoordinate,
        show,
        type,
        orient,
        edgeAt,
        hideLine,
        lineStrokeDasharray,
    } = props;
    const {
        fill,
        opacity,
        fontFamily,
        fontSize,
        textFill,
        lineStroke,
        lineOpacity,
    } = props;
    const { stroke, strokeOpacity, strokeWidth } = props;
    const { arrowWidth, rectWidth, rectHeight, rectRadius } = props;
    const { x1, y1, x2, y2, dx } = props;

    if (!show) { return null; }

    let coordinateBase;
    let coordinate;
    if (isDefined(displayCoordinate)) {
        const textAnchor = "middle";
        // TODO: Below it is necessary to implement logic for the possibility of alignment from the right or from the left.

        let edgeXRect;
        let edgeYRect;
        let edgeXText;
        let edgeYText;

        if (type === "horizontal") {
            edgeXRect =
                dx + (orient === "right" ? edgeAt + 1 : edgeAt - rectWidth - 1);
            edgeYRect = y1 - rectHeight / 2 - strokeWidth;
            edgeXText =
                dx +
                (orient === "right"
                    ? edgeAt + rectWidth / 2
                    : edgeAt - rectWidth / 2);
            edgeYText = y1;
        } else {
            const dy = orient === "bottom" ? strokeWidth - 1 : -strokeWidth + 1;
            edgeXRect = x1 - rectWidth / 2;
            edgeYRect =
                (orient === "bottom" ? edgeAt : edgeAt - rectHeight) + dy;
            edgeXText = x1;
            edgeYText =
                (orient === "bottom"
                    ? edgeAt + rectHeight / 2
                    : edgeAt - rectHeight / 2) + dy;
        }

        coordinateBase = {
            edgeXRect,
            edgeYRect,
            rectHeight: rectHeight + strokeWidth,
            rectWidth,
            rectRadius,
            fill,
            opacity,
            arrowWidth,
            stroke,
            strokeOpacity,
            strokeWidth,
        };
        coordinate = {
            edgeXText,
            edgeYText,
            textAnchor,
            fontFamily,
            fontSize,
            textFill,
            displayCoordinate,
        };
    }

    const line = hideLine
        ? undefined
        : {
            opacity: lineOpacity,
            stroke: lineStroke,
            strokeDasharray: lineStrokeDasharray,
            x1,
            y1,
            x2,
            y2,
        };

    return {
        coordinateBase,
        coordinate,
        line,
        orient,
    };
}

export function drawOnCanvas(ctx: CanvasRenderingContext2D, props) {
    const { fontSize, fontFamily } = props;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "middle";
    const width = Math.round(ctx.measureText(props.coordinate).width + 10);

    const edge = helper({ ...props, rectWidth: width });

    if (edge === null) { return; }

    if (edge.line !== undefined && isDefined(edge.line)) {
        const dashArray = getStrokeDasharray(edge.line.strokeDasharray)
            .split(",")
            .map((d) => +d);
        ctx.setLineDash(dashArray);
        ctx.strokeStyle = colorToRGBA(edge.line.stroke, edge.line.opacity);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(edge.line.x1, edge.line.y1);
        ctx.lineTo(edge.line.x2, edge.line.y2);
        ctx.stroke();
    }

    ctx.setLineDash([]);
    if (isDefined(edge.coordinateBase)) {
        const {
            rectWidth,
            rectHeight,
            rectRadius,
        } = edge.coordinateBase;

        ctx.fillStyle = colorToRGBA(
            edge.coordinateBase.fill,
            edge.coordinateBase.opacity,
        );
        if (isDefined(edge.coordinateBase.stroke)) {
            ctx.strokeStyle = colorToRGBA(
                edge.coordinateBase.stroke,
                edge.coordinateBase.strokeOpacity,
            );
            ctx.lineWidth = edge.coordinateBase.strokeWidth;
        }

        const x = edge.coordinateBase.edgeXRect;
        const y = edge.coordinateBase.edgeYRect;

        ctx.beginPath();

        if (rectRadius) {
            roundRect(ctx, x, y, rectWidth, rectHeight, 3);
        } else {
            ctx.rect(x + 0.5, y + 0.5, rectWidth, rectHeight);
        }

        ctx.fill();

        if (isDefined(edge.coordinateBase.stroke)) {
            ctx.stroke();
        }

        ctx.fillStyle = edge.coordinate.textFill;
        ctx.textAlign =
            edge.coordinate.textAnchor === "middle"
                ? "center"
                : edge.coordinate.textAnchor;
        ctx.fillText(
            edge.coordinate.displayCoordinate,
            edge.coordinate.edgeXText,
            edge.coordinate.edgeYText,
        );
    }
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// export default EdgeCoordinate;
