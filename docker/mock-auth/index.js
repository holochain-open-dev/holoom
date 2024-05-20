const app = require("express")();

app.get("/accounts", (req, res) => {
  const { redirect_uri } = req.query;
  res.redirect(`${redirect_uri}?code=123ABC`);
});

app.post("/token", (_req, res) => {
  res.send(JSON.stringify({ access_token: "mock-token" }));
});

app.get("/userinfo", (_req, res) => {
  res.send(JSON.stringify({ guid: "mock-guid", nickname: "molly" }));
});

app.listen(process.env.PORT);
