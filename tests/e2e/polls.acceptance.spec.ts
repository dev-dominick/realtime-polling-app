import { expect, test, type Page } from "@playwright/test";

async function createPollViaUi(page: Page, suffix: string) {
  await page.goto("/projects/polls");
  await page.getByPlaceholder("What do you want to ask?").fill(`Acceptance poll ${suffix}`);
  await page.getByPlaceholder("Option 1").fill("Approve");
  await page.getByPlaceholder("Option 2").fill("Reject");
  await page.getByRole("button", { name: "Create poll" }).click();
  await expect(page).toHaveURL(/\/projects\/polls\/[0-9a-f-]+$/);
  return page.url();
}

test("creates a poll and submits a vote using ordinary clicks", async ({ page }) => {
  const pollUrl = await createPollViaUi(page, `${Date.now()}-click`);

  await page.goto(pollUrl);
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Vote" }).click();

  await expect(page.getByText("Vote recorded. Results continue updating live.")).toBeVisible();
  await expect(page.getByText(/1 total vote/)).toBeVisible();
});

test("streams vote updates across two clients without refresh", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    const pollUrl = await createPollViaUi(pageA, `${Date.now()}-sse`);

    await pageA.goto(pollUrl);
    await pageB.goto(pollUrl);
    await expect(pageB.getByText(/0 total votes/)).toBeVisible();

    const navCountBefore = await pageB.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );

    await pageA.getByRole("button", { name: "Reject" }).click();
    await pageA.getByRole("button", { name: "Vote" }).click();
    await expect(pageA.getByText("Vote recorded. Results continue updating live.")).toBeVisible();

    await expect(pageB.getByText(/1 total vote/)).toBeVisible();
    const navCountAfter = await pageB.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );
    expect(navCountAfter).toBe(navCountBefore);

    await pageB.reload();
    await expect(pageB.getByText(/1 total vote/)).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
