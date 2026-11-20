// New branch dialog, with the Parent Branch menu one click away.
const URL = "https://pr-7591.preview.theeng.co/demo/example-electric-bike/master/table";
module.exports = {
  name: "new-branch-dialog",
  title: "New branch dialog",
  url: URL,
  pad: 24,
  states: [
    {
      id: "default",
      async setup(page) {
        await page.getByRole("button", { name: "Branch options" }).waitFor({ timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.getByRole("button", { name: "Branch options" }).click();
        await page.getByRole("menuitem", { name: /New branch/ }).first().click();
        const dlg = page.getByRole("dialog").filter({ hasText: "Parent Branch" });
        const name = dlg.locator("input").first();
        await name.fill("");
        await name.pressSequentially("Battery capacity trade study", { delay: 20 });
        await name.blur();
      },
      targets: ["[role=dialog]"],
      hotspots: [{ selector: '[aria-label^="Change parent branch"]', to: "parent-open" }],
    },
    {
      id: "parent-open",
      async setup(page) {
        await page.locator('[aria-label^="Change parent branch"]').first().click();
        await page.waitForFunction(() => document.querySelectorAll("[role=dialog]").length > 1);
        await page.waitForTimeout(800);
      },
      targets: ["[role=dialog]"],
      hotspots: [{ selector: "[role=option], [cmdk-item]", to: "default" }],
    },
  ],
};
