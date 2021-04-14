Setting up infrastructure
=========================

Ideally it whole setup should be automated as much as possible
(we want an easy way to remove costly resources).

Take advantage of IAM users per student and CloutTrail for tracking progress.

## Generating template

```bash
cat students.yaml > students.local.yaml
docker build . -t template-generator
docker run -it --rm -v "$PWD":/c -w /c template-generator php generate.php > cfn-stack.local.yaml
```

## Creating first time

```bash
aws cloudformation create-stack \
    --stack-name aws-workshop \
    --template-body file://cfn-stack.local.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --tags file://cfn-tags.json
```

## Updating stack

```bash
aws cloudformation update-stack \
    --stack-name aws-workshop \
    --template-body file://cfn-stack.local.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --tags file://cfn-tags.json
```

## Known issues and limitations

 * Delay of CloudTrail is [~15 min](https://aws.amazon.com/cloudtrail/faqs/),
   so not suitable for real time game/monitoring

## Refrences

* https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-aws-service-specific-topics.html

_TO BE CONTINUED..._