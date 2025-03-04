import { heikinAshi } from "../calculator";
import baseIndicator from "./baseIndicator";

import { merge, rebind } from "../utils";

const ALGORITHM_TYPE = "HeikinAshi";

export default function () {

    const base = baseIndicator()
        .type(ALGORITHM_TYPE)
        .accessor((d) => d.ha);

    const underlyingAlgorithm = heikinAshi();

    const mergedAlgorithm = merge()
        .algorithm(underlyingAlgorithm)
        // @ts-ignore
        .merge((datum, i) => {
            return { ...datum, ...i };
        });

    const indicator = function (data, options = { merge: true }) {
        if (options.merge) {
            if (!base.accessor()) { throw new Error(`Set an accessor to ${ALGORITHM_TYPE} before calculating`); }
            return mergedAlgorithm(data);
        }
        return underlyingAlgorithm(data);
    };

    rebind(indicator, base, "accessor", "stroke", "fill", "echo", "type");
    rebind(indicator, mergedAlgorithm, "merge");

    return indicator;
}
