const { GenericContainer, Wait } = require("testcontainers");

function portRange(start, end) {
  return Array.from({ length: end - start }, (_, idx) => ({
    host: start + idx,
    container: start + idx,
  }));
}

function startAuthorityContainer() {
  return new GenericContainer("authority-agent-sandbox")
    .withExposedPorts(
      { host: 3333, container: 3334 },
      ...portRange(41000, 41255)
    )
    .withHealthCheck({
      test: ["CMD-SHELL", " netstat -an | grep -q 3333"],
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .withCommand("/run.sh")
    .start();
}

function startHoloContainer() {
  return new GenericContainer("holo-game-identity-local")
    .withExposedPorts(
      { host: 24274, container: 24274 },
      { host: 9999, container: 9999 },
      ...portRange(40000, 40255)
    )
    .withHealthCheck({
      test: ["CMD-SHELL", " netstat -an | grep -q 24274"],
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .withCommand("/run.sh")
    .start();
}

async function submitHoloRegisterForm(email, password) {
  const frames = await page.frames();
  const frame = frames[1];
  await frame.waitForSelector("#email");
  await frame.type("#email", email);
  await frame.type("#password", password);
  await frame.type("#confirm-password", password);
  await frame.click("#submit-button");

  // Wait until form processes and client ready
  await page.evaluate(async () => {
    await window.gameIdentityClientProm;
  });
}

describe("HolochainGameIdentityClient", () => {
  let authorityContainer;
  let holoContainer;
  beforeEach(async () => {
    const authorityContainerProm = startAuthorityContainer();
    const holoContainerProm = startHoloContainer();
    authorityContainer = await authorityContainerProm;
    holoContainer = await holoContainerProm;
    await page.goto("http://localhost:5173");
  }, 60_000);

  afterEach(async () => {
    await Promise.all([
      authorityContainer.stop(),
      holoContainer.stop(),
      jestPuppeteer.resetPage(),
    ]);
  });

  it("should register only one username", async () => {
    await submitHoloRegisterForm("test@test.com", "test1234");

    await page.evaluate(async () => {
      await window.gameIdentityClient.registerUsername("test1234");
    });

    const result = page.evaluate(async () => {
      await window.gameIdentityClient.registerUsername("test12345");
    });
    await expect(result).rejects.toSatisfy((error) =>
      error.message.includes("has already set a Username")
    );
  }, 60_000);
});
