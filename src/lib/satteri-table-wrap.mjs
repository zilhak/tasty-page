/**
 * Wraps each Markdown table in `.table-wrap`, which draws its edge and lets a
 * wide table scroll inside the column on a narrow screen. The wrapper takes
 * keyboard focus so the arrow keys can scroll it in every browser.
 */
export function createTableWrapPlugin() {
  return {
    name: "guide-table-wrap",
    element: {
      filter: ["table"],
      visit(node, ctx) {
        ctx.wrapNode(node, { type: "element", tagName: "div", properties: { className: ["table-wrap"], tabIndex: "0" }, children: [] });
      },
    },
  };
}
