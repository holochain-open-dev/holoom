const { toSatisfy } = require("jest-extended");
expect.extend({ toSatisfy });
global.debug = require("debug")("e2e");
debug("Ran testSetup.js");
