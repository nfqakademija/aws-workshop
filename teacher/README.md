Setting up infrastructure for teaching
======================================

Ideally it whole setup should be automated as much as possible
(we want an easy way to remove costly resources).

## Getting started

* Install dependencies: [Serverless](https://www.serverless.com/framework/docs/getting-started/)
```shell
sudo npm install -g serverless@v2.35.0
```
> `sls --version` should print `Framework Core: 2.35.0` 

* Please update students lists in `students.local.yml`:
```shell
cp config/students.yml config/students.local.yml
```

* Deploy infrastructure
```shell
sls deploy
```
> Will create `aws-workshop-dev` CloudFormation stack

* Use generated `config.local.js` as an example:
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


## Known issues and limitations

 * Delay of CloudTrail is [~15 min](https://aws.amazon.com/cloudtrail/faqs/),
   so not suitable for real time game/monitoring


## References

* https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-aws-service-specific-topics.html
* https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/
* https://serverlesscode.com/post/customizing-serverless-with-plugins/
