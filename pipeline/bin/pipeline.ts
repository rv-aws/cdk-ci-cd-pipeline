import { App } from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new App();

// for new environments, like sandboxes etc., simply copy the cdk.json context format for test and change the values accordingly.
const environments = ['test', 'prod']
const deployEnvironment = app.node.tryGetContext('env');
if (!deployEnvironment || !environments.includes(deployEnvironment)) throw new Error('Please supply the env context variable: cdk deploy --context env=test/prod')
let env = app.node.tryGetContext(deployEnvironment);
const infrastructureRepoName = app.node.tryGetContext('infrastructureRepoName');
const repositoryOwner = app.node.tryGetContext('repositoryOwner');
env = {
  ...env,
  infrastructureRepoName,
  repositoryOwner,
  description: `Stack for the ${deployEnvironment} CI pipeline deployed using the CDK. If you need to delete this stack, delete the ${deployEnvironment} CDK infrastructure stack first.`
}

new PipelineStack(
  app,
  `${deployEnvironment}-CI-Pipeline-Stack`,
  env
)