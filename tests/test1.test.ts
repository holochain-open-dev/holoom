import { assert, expect, test } from "vitest";
import { AppAgentWebsocket, encodeHashToBase64 } from "@holochain/client";
import { HoloomClient } from "@holoom/client";
import { GenericContainer, Network } from "testcontainers";
import { decode } from '@msgpack/msgpack';
import { startAuthorityContainer, startLocalServicesContainer } from "./common";

//import {   } from "./types.js";c

test('TEST CASE 1, Authority agent', async () => {

  console.debug("Begin test container setup");
  const startedNetwork = await new Network().start();
  console.debug("Network created");
  const localServicesContainer = await startLocalServicesContainer(startedNetwork)
  const localServiceIp = localServicesContainer.getIpAddress(startedNetwork.getName());
  console.debug("Started local-services at:",localServiceIp);
  const authorityContainer = await startAuthorityContainer(startedNetwork,localServiceIp);
  const authorityIp = authorityContainer.getIpAddress(startedNetwork.getName());
  console.debug("Started authority at:",authorityIp);
  
  // run tests:
  console.log("Connecting to holochain")
  const appWS =  await AppAgentWebsocket.connect(new URL("ws://"+authorityIp+":3336"),"holoom")
  const holoom = new HoloomClient(appWS)
  console.log("connected")
  const me = holoom.getUsername()
  console.log("my username",me)
  // finish

  console.debug("Begin test container teardown");
  await localServicesContainer.stop()
  const stoppedContainer = await authorityContainer.stop()
  console.log(stoppedContainer)
  await startedNetwork.stop()
  console.debug("Finished test container teardown");
  
  expect("","")

});

