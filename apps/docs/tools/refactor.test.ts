import assert from "node:assert/strict";
import test from "node:test";

import {
    buildDimensionRows,
    cumulativeSparkline,
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
