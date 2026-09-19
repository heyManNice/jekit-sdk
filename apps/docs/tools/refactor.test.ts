import assert from "node:assert/strict";
import test from "node:test";

import {
    buildDimensionRows,
    buildSearchRows,
    cumulativeSparkline,
    previousDayComparison,
} from "../src/pages/stats/model/presenters";
import {
    blogFilenameToRoute,
    docFileToRoute,
    pageFileToRoute,
} from "../src/content/routes";

test("route paths share one normalizer", () => {
    assert.equal(pageFileToRoute("/src/pages/stats/page.tsx"), "/stats/");
    assert.equal(pageFileToRoute("src\\pages\\page.tsx"), "/");
    assert.equal(docFileToRoute("src/pages/docs/content/guide/react.md"), "/docs/guide/react/");
    assert.equal(blogFilenameToRoute("20260802-2006.md"), "/blogs/20260802-2006/");
});

test("cumulative sparkline derives history from one total", () => {
    assert.deepEqual(cumulativeSparkline(20, [2, 3, 5]), [12, 15, 20]);
    assert.deepEqual(cumulativeSparkline(undefined, [1]), []);
});

test("previous-day comparison uses the two completed daily buckets", () => {
    assert.deepEqual(previousDayComparison([5, 10, 12]), {
        value: 10,
        changePercent: 100,
    });
    assert.deepEqual(previousDayComparison([0, 10, 12]), {
        value: 10,
        changePercent: null,
    });
    assert.equal(previousDayComparison([12]), null);
});

test("dimension rows fill missing enum members and keep Other last", () => {
    const browserOptions = {
        1: "Other",
        2: "Chrome",
        Other: 1,
        Chrome: 2,
    };
    const rows = buildDimensionRows([
        {
            dimensionIndex: browserOptions.Chrome,
            totalRequest: 10n,
            todayRequest: 2,
            dailyRequest: [0, 0, 0, 0, 0, 0, 2],
        },
    ], browserOptions);

    assert.equal(rows[0]?.name, "Chrome");
    assert.equal(rows[0]?.ratio, "100.0%");
    assert.equal(rows.at(-1)?.name, "Other");
});

test("search rows render a zero trend for missing sources", () => {
    const searchOptions = {
        1: "Direct",
        Direct: 1,
    };
    const rows = buildSearchRows([], searchOptions);

    assert.deepEqual(rows[0]?.daily, [0, 0, 0, 0, 0, 0, 0]);
});
