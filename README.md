# cdk-ci-cd-pipeline
Contains two cdk projects, one for deploying a ci/cd pipeline and another housing the infrastructure the pipeline will deploy.

#instructions
- set account
    aws configure --proflie canada
- cdk bootstrap
    cdk bootstrap aws://123431923271/ca-central-1 --profile canada
- set env
    export DEPLOY_ENVIRONMENT=dev
- set region    
    aws configure set region ca-central-1