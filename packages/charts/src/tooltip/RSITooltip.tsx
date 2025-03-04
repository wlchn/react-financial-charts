import { format } from "d3-format";
import * as React from "react";
import GenericChartComponent from "../GenericChartComponent";
import { default as defaultDisplayValuesFor } from "./displayValuesFor";

import { functor, isDefined } from "../utils";
import { ToolTipText } from "./ToolTipText";
import { ToolTipTSpanLabel } from "./ToolTipTSpanLabel";

interface RSITooltipProps {
    readonly origin: number[] | any; // func
    readonly options: {
        windowSize: number;
    };
    readonly className?: string;
    readonly fontFamily?: string;
    readonly fontSize?: number;
    readonly onClick?: ((event: React.MouseEvent<SVGGElement, MouseEvent>) => void);
    readonly yAccessor: any; // func
    readonly displayFormat: any; // func
    readonly displayValuesFor?: any; // func
    readonly textFill?: string;
    readonly labelFill?: string;
}

export class RSITooltip extends React.Component<RSITooltipProps> {

    public static defaultProps = {
        displayFormat: format(".2f"),
        displayValuesFor: defaultDisplayValuesFor,
        origin: [0, 0],
        className: "react-financial-charts-tooltip",
    };

    public render() {
        return (
            <GenericChartComponent
                clip={false}
                svgDraw={this.renderSVG}
                drawOn={["mousemove"]}
            />
        );
    }

    private readonly renderSVG = (moreProps) => {
        const { onClick, fontFamily, fontSize, yAccessor, displayFormat, className } = this.props;
        const { options, labelFill, textFill } = this.props;
        const { displayValuesFor } = this.props;

        const { chartConfig: { width, height } } = moreProps;

        const currentItem = displayValuesFor(this.props, moreProps);
        const rsi = isDefined(currentItem) && yAccessor(currentItem);
        const value = (rsi && displayFormat(rsi)) || "n/a";

        const { origin: originProp } = this.props;
        const origin = functor(originProp);
        const [x, y] = origin(width, height);

        const tooltipLabel = `RSI (${options.windowSize}): `;
        return (
            <g className={className} transform={`translate(${x}, ${y})`} onClick={onClick}>
                <ToolTipText
                    x={0}
                    y={0}
                    fontFamily={fontFamily}
                    fontSize={fontSize}>
                    <ToolTipTSpanLabel fill={labelFill}>{tooltipLabel}</ToolTipTSpanLabel>
                    <tspan fill={textFill}>{value}</tspan>
                </ToolTipText>
            </g>
        );
    }
}
