import { RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { CompositePrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { BuildSpec, Cache, LinuxBuildImage, LocalCacheMode, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { CodeBuildAction, GitHubSourceAction, S3DeployAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface PipelineStackProps extends StackProps {
  envName: string;
  infrastructureRepoName: string;
  infrastructureBranchName: string;
  repositoryOwner: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    console.log(props)
    const { 
      envName,
      infrastructureRepoName,
      infrastructureBranchName,
      repositoryOwner,
    } = props;

    const gitHubToken = SecretValue.secretsManager('gitToken');

    // :::::::::: AWS::IAM::Roles & Policies ::::::::::
    // CodeBuild stage must be able to assume the cdk deploy roles created when bootstrapping the account
    // The role itself must also be assumable by the pipeline in which the stage resides
    const infrastructureDeployRole = new Role(
      this,
      'InfrastructureDeployRole',
      {
        assumedBy: new CompositePrincipal(
          new ServicePrincipal('codebuild.amazonaws.com'),
          new ServicePrincipal('codepipeline.amazonaws.com')
        ),
        inlinePolicies: {
          CdkDeployPermissions: new PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: ['sts:AssumeRole'],
                resources: ['arn:aws:iam::*:role/cdk-*'],
              }),
            ],
          })    
        }
      }
    )

    // :::::::::: AWS::S3::Bucket ::::::::::
    // This is the bucket that will house the web application and will serve as the origin for CloudFront
    const artifactBucket = new Bucket(
      this,
      'ArtifactBucket',
      {
        bucketName:`your-${envName}-codepipeline-artifact-bucket`,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    const infrastructureSourceOutput = new Artifact('InfrastructureSourceOutput');

    // Build project for infrastructure (CDK)
    const infrastructureBuildProject = new PipelineProject(
      this,
      'InfrastructureBuildProject',
      {
        role: infrastructureDeployRole,
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_5
        },
        environmentVariables: {
          DEPLOY_ENVIRONMENT: {
            value: envName
          }
        },
        buildSpec: BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '20.x'
              },
              commands: [
                'npm install -g aws-cdk',
                'cd infrastructure',
                'npm install'
              ]
            },
            build: {
              commands: [
                `cdk deploy --context env=${envName}`
              ]
            }
          }
        }),
      }
    );    

    // Define the CodePipeline
    const pipeline = new Pipeline(
      this,
      'CIPipeline', 
      {
        pipelineName: `${envName}-CI-Pipeline`,
        role: infrastructureDeployRole,
        artifactBucket
      }
    );

    // Source FE + Infrastructure stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: repositoryOwner,
          repo: infrastructureRepoName,
          actionName: 'InfrastructureSource',
          branch: infrastructureBranchName,
          output: infrastructureSourceOutput,
          oauthToken: gitHubToken
        }),
      ],
    });

    // Deploy frontend to S3 and deploy the CDK infrastructure
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new CodeBuildAction({
          actionName: 'DeployCdkInfrastructure',
          project: infrastructureBuildProject,
          input: infrastructureSourceOutput,
          role: infrastructureDeployRole
        }),
      ],
    });
  }
}
