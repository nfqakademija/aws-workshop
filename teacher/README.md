Setting up infrastructure for teaching
======================================

Ideally it whole setup should be automated as much as possible
(we want an easy way to remove costly resources).

## Getting started

* Get theme files
```shell
cd ../student
git clone git@gist.github.com:2b53a0765d71af492e73e9533ac6fef7.git spacex-theme
cd ../teacher
```
* Have [NodeJS](https://nodejs.org/en/download/) `16.0.0+` installed
* Have `npm` `7.10.0+` installed

* Install dependencies: [Serverless](https://www.serverless.com/framework/docs/getting-started/)
```shell
sudo npm install -g serverless@^2.37.2
```
> `sls --version` should print `Framework Core: 2.35.0` 

* Install dependencies: For Serverless plugins
```shell
npm install
```

* Please update students lists in `students.local.yml`:
```shell
cp config/students.yml config/students.local.yml
cp config/companies.yml config/companies.local.yml
```

* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured and
  a user with sufficient permissions (e.g. for simplicity with `arn:aws:iam::aws:policy/AdministratorAccess`)
```shell
aws configure
```
> `aws sts get-caller-identity` should print `{"UserId":...`

* Deploy infrastructure
```shell
sls deploy
```
> Will create `aws-workshop-dev` CloudFormation stack

* Use generated `a-a.js` as an example:
Open [Web page](../student/index.html) via browser as a Student


## Other useful functions

* Testing the Lambda on AWS:
```shell
serverless invoke --function checkTask --data '{"some":"input"}' --context '{"clientContext":"student"}'
```
> Will print JSON output from Lambda

* Testing plugins/template:
```shell
sls package
```
> Without deploying, will generate in `.serverless` files for CloudFormation and Lambda upload zip 


## Removing

* Remove files from _AwsWorkshop_ and _ScoresBucket_ S3 buckets
* Remove CloudFormation stack:
```shell
sls remove
```

## Known issues and limitations

 * Delay of CloudTrail is [~15 min](https://aws.amazon.com/cloudtrail/faqs/),
   so not suitable for real time game/monitoring


## References

* https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-aws-service-specific-topics.html
* https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/
* https://serverlesscode.com/post/customizing-serverless-with-plugins/
* https://github.com/DonBrinn/serverless-plugin-upload-s3
