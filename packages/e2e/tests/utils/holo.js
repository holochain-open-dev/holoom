logInfo = require("debug")("e2e:browser:info");
logErr = require("debug")("e2e:browser:err");
page.on("console", (msg) => {
  const log = msg.type === "error" ? logErr : logInfo;
  log(msg.text());
});

module.exports.loadPageAndRegister = async (email, password) => {
  await page.goto("http://localhost:5173");
  let frame;
  while (true) {
    const frames = await page.frames();
    frame = frames[1];
    try {
      await frame.waitForSelector("#email", { timeout: 1000 });
      break;
    } catch {
      // Loaded iframe before "holoport" was ready
      await page.reload();
    }
  }
  await frame.type("#email", email);
  await frame.type("#password", password);
  await frame.type("#confirm-password", password);
  await frame.click("#submit-button");

  // Wait until form processes and clients ready
  await page.evaluate(() => clientsProm);
};
