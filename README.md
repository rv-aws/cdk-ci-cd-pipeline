# cdk-ci-cd-pipeline
Contains two cdk projects, one for deploying a ci/cd pipeline and another housing the infrastructure the pipeline will deploy.

#instructions
- set account
    aws configure --proflie canada
- cdk bootstrap
    cdk bootstrap aws://123431923271/ca-central-1 --profile canada
    cdk bootstrap aws://123431923271/ca-central-1 --profile us
- set env
    export DEPLOY_ENVIRONMENT=test
- set region    
    aws configure set region ca-central-1
    aws configure set region us-east-1
- set profile
    export AWS_PROFILE=us
- verify your default 
$aws configure list
NAME       : VALUE                    : TYPE             : LOCATION
profile    : us                       : env              : ['AWS_PROFILE', 'AWS_DEFAULT_PROFILE']
access_key : ****************O7VO     : shared-credentials-file : 
secret_key : ****************jTK+     : shared-credentials-file : 
region     : us-east-1                : config-file      : ~/.aws/config