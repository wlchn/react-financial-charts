import { functor, isNotDefined, merge, path } from "../utils";
import atr from "./atr";

import { Kagi as defaultOptions } from "./defaultOptionsForComputation";

export default function () {

    let options = defaultOptions;
    let dateAccessor = (d) => d.date;
    let dateMutator = (d, date) => { d.date = date; };

    function calculator(data) {
        const { reversalType, windowSize, reversal, sourcePath } = options;

        // @ts-ignore
        const source = path(sourcePath);
        let reversalThreshold;

        if (reversalType === "ATR") {
            // calculateATR(rawData, period);
            const atrAlgorithm = atr().options({ windowSize });

            const atrCalculator = merge()
                .algorithm(atrAlgorithm)
                // @ts-ignore
                .merge((d, c) => { d["atr" + windowSize] = c; });

            atrCalculator(data);
            reversalThreshold = (d) => d["atr" + windowSize];
        } else {
            reversalThreshold = functor(reversal);
        }

        const kagiData: any[] = [];

        let prevPeak;
        let prevTrough;
        let direction;

        let line: {
            added?: any;
            date?: any;
            from?: any;
            to?: any;
            open?: number;
            high?: number;
            low?: number;
            close?: number;
            current?: any;
            changePoint?: any;
            changeTo?: any;
            volume?: number;
            reverseAt?: any;
            startAs?: any;
            startOfYear?: any;
            startOfQuarter?: any;
            startOfMonth?: any;
            startOfWeek?: any;
        } = {};

        data.forEach(function (d) {
            if (isNotDefined(line.from)) {
                dateMutator(line, dateAccessor(d));
                line.from = dateAccessor(d);

                if (!line.open) { line.open = d.open; }
                line.high = d.high;
                line.low = d.low;
                if (!line.close) { line.close = source(d); }
                line.startOfYear = d.startOfYear;
                line.startOfQuarter = d.startOfQuarter;
                line.startOfMonth = d.startOfMonth;
                line.startOfWeek = d.startOfWeek;
            }

            if (!line.startOfYear) {
                line.startOfYear = d.startOfYear;
                if (line.startOfYear) {
                    line.date = d.date;
                    // line.displayDate = d.displayDate;
                }
            }

            if (!line.startOfQuarter) {
                line.startOfQuarter = d.startOfQuarter;
                if (line.startOfQuarter && !line.startOfYear) {
                    line.date = d.date;
                    // line.displayDate = d.displayDate;
                }
            }

            if (!line.startOfMonth) {
                line.startOfMonth = d.startOfMonth;
                if (line.startOfMonth && !line.startOfQuarter) {
                    line.date = d.date;
                    // line.displayDate = d.displayDate;
                }
            }
            if (!line.startOfWeek) {
                line.startOfWeek = d.startOfWeek;
                if (line.startOfWeek && !line.startOfMonth) {
                    line.date = d.date;
                    // line.displayDate = d.displayDate;
                }
            }
            line.volume = (line.volume || 0) + d.volume;
            // @ts-ignore
            line.high = Math.max(line.high, d.high);
            // @ts-ignore
            line.low = Math.min(line.low, d.low);
            line.to = dateAccessor(d);

            // @ts-ignore
            const priceMovement = (source(d) - line.close);

            // console.log(source(d), priceMovement)
            // @ts-ignore
            if ((line.close >= line.open /* going up */ && priceMovement > 0 /* and moving in same direction */)
                // @ts-ignore
                || (line.close < line.open /* going down */ && priceMovement < 0 /* and moving in same direction */)) {
                line.close = source(d);
                // @ts-ignore
                if (prevTrough && line.close < prevTrough) {
                    // going below the prevTrough, so change from yang to yin
                    // A yin line forms when a Kagi line breaks below the prior trough.
                    line.changePoint = prevTrough;
                    if (line.startAs !== "yin") {
                        line.changeTo = "yin";
                        // line.startAs = "yang";
                    }
                }

                // @ts-ignore
                if (prevPeak && line.close > prevPeak) {
                    // going above the prevPeak, so change from yin to yang
                    // A yang line forms when a Kagi line breaks above the prior peak
                    line.changePoint = prevPeak;
                    if (line.startAs !== "yang") {
                        line.changeTo = "yang";
                        // line.startAs = "yin";
                    }
                }
                // @ts-ignore
            } else if ((line.close >= line.open /* going up */
                && priceMovement < 0 /* and moving in other direction */
                && Math.abs(priceMovement) > reversalThreshold(d) /* and the movement is big enough for reversal */)
                // @ts-ignore
                || (line.close < line.open /* going down */
                    && priceMovement > 0 /* and moving in other direction */
                    /* and the movement is big enough for reversal */
                    && Math.abs(priceMovement) > reversalThreshold(d))) {
                // reverse direction
                const nextLineOpen = line.close;

                // @ts-ignore
                direction = (line.close - line.open) / Math.abs(line.close - line.open);

                let nextChangePoint;
                let nextChangeTo;
                if (direction < 0 /* if direction so far has been -ve*/) {
                    // compare with line.close becomes prevTrough
                    if (isNotDefined(prevPeak)) { prevPeak = line.open; }
                    prevTrough = line.close;
                    if (source(d) > prevPeak) {
                        nextChangePoint = prevPeak;
                        nextChangeTo = "yang";
                    }
                } else {
                    if (isNotDefined(prevTrough)) { prevTrough = line.open; }
                    prevPeak = line.close;
                    if (source(d) < prevTrough) {
                        nextChangePoint = prevTrough;
                        nextChangeTo = "yin";
                    }
                }
                if (isNotDefined(line.startAs)) {
                    line.startAs = direction > 0 ? "yang" : "yin";
                }

                const startAs = line.changeTo || line.startAs;
                line.added = true;
                kagiData.push(line);
                direction = -1 * direction; // direction is reversed

                line = { ...line };
                line.open = nextLineOpen;
                line.close = source(d);
                line.startAs = startAs;
                line.changePoint = nextChangePoint;
                line.changeTo = nextChangeTo;
                line.added = false;
                line.from = undefined;
                line.volume = 0;
            } else {
                // console.log("MOVING IN REV DIR BUT..", line.open, line.close, source(d));
            }
            line.current = source(d);
            // @ts-ignore
            let dir = line.close - line.open;
            dir = dir === 0 ? 1 : dir / Math.abs(dir);
            // @ts-ignore
            line.reverseAt = dir > 0 ? line.close - reversalThreshold(d) : line.open - reversalThreshold(d);
        });
        if (!line.added) { kagiData.push(line); }

        return kagiData;
    }
    calculator.options = function (x) {
        if (!arguments.length) {
            return options;
        }
        options = { ...defaultOptions, ...x };
        return calculator;
    };
    calculator.dateMutator = function (x) {
        if (!arguments.length) { return dateMutator; }
        dateMutator = x;
        return calculator;
    };
    calculator.dateAccessor = function (x) {
        if (!arguments.length) { return dateAccessor; }
        dateAccessor = x;
        return calculator;
    };
    return calculator;
}
