AWS Workshop: `Dive into the Cloud`
===================================

An interactive introduction to [Amazon Web Services](https://aws.amazon.com/)
with gamification elements.

Created by developers to developers.

## For lecturer (AWS guru)

See [docs for setting up infrastructure](teacher/README.md)

## For student (colleague)

See [docs for getting personalized credentials](student/README.md)

## Why

 * You, as a colleague:
    * Will get **practical** experience with AWS (logging in to the real AWS)
    * Will learn in a **fun** (internal jokes, scoreboard) and **efficient** (hear, see, try) way
    * Learn **at your pace** and depth (basic and extra tasks, links for official documentation, open-source)
    * Technical topics (and jokes) **tailored to your** usual work

 * I, as a creator/contributor:
    * Believe in **[DevOps transformation](https://www.oreilly.com/library/view/effective-devops/9781491926291/)**, and it should start from the culture.
      Like `git` become a _de facto_ tool for the software developer (remember days of `svn`?),
      I believe _Cloud solutions_ should also become this _de facto_ tool for modern software developers.
    * AWS based learning material about AWS is an alternative **way to learn**
      in becoming AWS Certified professional.
    * It is **fun to hack what is possible**,
      and to maintain/share up-to-date skills in the technical field requires unique approach.

## How to contribute

 * **Tell your pain points** or how you are using AWS daily –
   so learning material could be tailored for you
 * Improve **visual feel** (JavaScript magic) of the game
   (preferably via Pull requests)
 * Use your **creativity for AWS/game tasks**,
   that would be interresting to do and possible to automate (because it supposes to be a game)
 * Improve links to **documentation**, the wording of the tasks, etc
   (preferably via Pull requests)
 * Fork and do your own (and better) version
   (future of learning should  be interactive and open-source)

## TODO

- [x] Call lambda
- [x] Check score on frontend
- [x] Store score by Lambda on S3
- [x] Frontend: Read scores of all (teacher would use user's flow)

- [ ] Improve actual tasks
- [ ] Store Frontend on S3
- [ ] Credentials from e-mail
- [ ] End-to-end tests

- [ ] Limit IAM access
- [ ] Improve UI/UX
- [ ] Append CloudTrail data
- [ ] Replace this.$parent to Vue $emit
- [ ] Adding new student without regenerating password
- [ ] Log invalid ChheckTask inputs in CloudWatch
- [ ] Lambda: List score S3 to Summary file

# LICENCE

Code and documentation is under MIT.

Browser will access other libraries/ilustrations via external links
with their respective licenses.

Some themes illustrations are under Creative Commons,
so they are included as an optional dependency.