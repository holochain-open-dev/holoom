import { assert, expect, test } from "vitest";
import { AppAgentWebsocket, encodeHashToBase64 } from "@holochain/client";
import { HoloomClient } from "@holoom/client";
import { GenericContainer, Network } from "testcontainers";
import { decode } from '@msgpack/msgpack';
import { startAuthorityContainer, startLocalServicesContainer } from "./common";

//import {   } from "./types.js";c

test('TEST CASE 1, Authority agent', async () => {
 
  // run tests:
  console.log("Connecting to holochain localhost:3336")
  const appWS =  await AppAgentWebsocket.connect(new URL("http://localhost:3336"),"holoom")
  const holoom = new HoloomClient(appWS)
  console.log("connected")
  const me = holoom.getUsername()
  console.log("my username",me)
  // finish


  
  expect("","")

});

