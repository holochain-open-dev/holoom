// vitest.setup.js
import { Network, StartedNetwork, StartedTestContainer } from 'testcontainers';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { startAuthorityContainer, startLocalServicesContainer } from './common';

let startedNetwork: StartedNetwork
let localServicesContainer: StartedTestContainer
let authorityContainer : StartedTestContainer

beforeAll(async () => {
  // This runs once before all tests
  console.debug("Begin test container setup");
  startedNetwork = await new Network().start();
  console.debug("Network created");
  localServicesContainer = await startLocalServicesContainer(startedNetwork)
  const localServiceIp = localServicesContainer.getIpAddress(startedNetwork.getName());
  console.debug("Started local-services at:",localServiceIp);
  authorityContainer = await startAuthorityContainer(startedNetwork,localServiceIp);
  const authorityIp = authorityContainer.getIpAddress(startedNetwork.getName());
  console.debug("Started authority at: ",authorityIp);
});

afterAll(async () => {
  // This runs once after all tests
  console.log('termination teardown after all tests');
  await localServicesContainer.stop()
  await authorityContainer.stop()
  await startedNetwork.stop()
  console.debug("Finished");
});

afterEach(() => {
  // This runs after each individual test
  //console.log('Teardown after each test');
});