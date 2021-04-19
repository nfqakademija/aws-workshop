'use strict';

const PluginName = 'workshopUsers'
const PluginMetaKey = 'Serverless::Plugin::WorkshopUsers'

class ServerlessPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.hooks = {
            'before:package:finalize': this.beforePackage.bind(this),
            'after:deploy:deploy': this.afterDeploy.bind(this)
        };
    }

    log(message) {
        this.serverless.cli.log(message, PluginName);
    }

    warn(message) {
        this.serverless.cli.log(message, PluginName, {color: 'orange'});
    }

    async randomString(crypto, length, from, to) {
        let promises = [];
        for (let i = 0; i < length; i++) {
            promises.push(crypto.randomInt(from, to)); // A-Z
        }
        let chars = await Promise.all(promises);
        return String.fromCharCode(...chars);
    }

    // Not to be used for critical systems!!!
    // Good enough random to meet AWS login requirements
    async randomPassword(crypto) {
        let specialCars = await this.randomString(crypto, 5, 43, 46); // A-Z
        let uppercase = await this.randomString(crypto, 20, 69, 90); // A-Z
        let longString = await crypto.randomUUID();
        return longString + specialCars + uppercase;
    }

    async passwords(count) {
        if (this.passwordsCache !== undefined) {
            return this.passwordsCache;
        }

        const passwordCache = "config/students.passwords.cache.json"
        if (this.serverless.utils.fileExistsSync(passwordCache)) {
            this.log(`Reusing old passwords ${passwordCache}...`);
            this.passwordsCache = await this.serverless.utils.readFile(passwordCache);
            if (count === this.passwordsCache.length) {
                return this.passwordsCache
            }
            this.warn(`Passwords count in cache differ. Invalidating cache`);
        }

        this.log(`Generating passwords...`);
        const crypto = await import('crypto');
        let passwordPromises = [];
        for (let i = 0; i < count; i++) {
            passwordPromises.push(this.randomPassword(crypto));
        }
        this.passwordsCache = await Promise.all(passwordPromises);
        this.log(`Storing passwords to cache ${passwordCache}...`);
        const fileContent = JSON.stringify(this.passwordsCache, null, 2);
        await this.serverless.utils.writeFile(passwordCache, fileContent);
        return this.passwordsCache;
    }

    async studentsFile() {
        const studentsFile = 'config/students.local.yml';
        if (!this.serverless.utils.fileExistsSync(studentsFile)) {
            this.warn(`Please use "config/students.local.yml" instead of "${studentsFile}" to have local list`);
            return 'config/students.yml';
        }
        return 'config/students.local.yml';
    }

    async students(studentsFile) {
        if (this.studentsCache !== undefined) {
            return this.studentsCache;
        }

        this.log(`Reading ${studentsFile}...`);
        this.studentsCache = await this.serverless.yamlParser.parse(studentsFile)
        return this.studentsCache;
    }

    // Main hook logic
    async beforePackage() {
        // Read students list
        let studentsFile = await this.studentsFile();
        let students = await this.students(studentsFile);

        // Generating passwords
        let passwords = await this.passwords(students.length);

        // Replacing template content
        let newResources = {};
        let newOutputs = {};
        let templateResources = [];
        const resources = this.serverless.service.resources.Resources;
        for (const name in resources) {
            if (!resources.hasOwnProperty(name)) {
                continue;
            }
            let resource = resources[name];
            if (resource.Type !== 'AWS::IAM::User' || resource.Metadata['Serverless::Plugin::WorkshopUsers'] !== 'duplicate-with-user-and-password') {
                continue;
            }
            this.log(`Duplicating resource "${name}" for each student and it's login...`);
            templateResources.push(name);

            // Transforming resource from template (old value)
            for (const [i, userName] of Object.entries(students)) {
                // User resource
                let newUserResource = JSON.parse(JSON.stringify(resource));
                newUserResource.Properties.UserName = userName;
                newUserResource.Properties.LoginProfile.Password = passwords[i];
                const index = Number(i) + 1;
                const userResourceName = `${name}${index}`;
                const meta = `generated from ${name} and ${studentsFile}`
                newUserResource.Metadata[PluginMetaKey] = meta
                newResources[userResourceName] = newUserResource;

                // AccessKey resource
                const accessResourceName = `${name}${index}AccessKey`;
                newResources[accessResourceName] = {
                    Type: "AWS::IAM::AccessKey",
                    Metadata: {
                        [PluginMetaKey]: meta
                    },
                    Properties: {
                        UserName: {
                            Ref: userResourceName
                        }
                    }
                }

                // Access key output
                const accessOutputResourceName = `${name}${index}AccessKeyId`;
                const secretOutputResourceName = `${name}${index}SecretKey`;
                newOutputs[accessOutputResourceName] = {
                    Description: `accessKeyId for ${accessResourceName}`,
                    Value: {
                        "Ref": accessResourceName
                    }
                }
                newOutputs[secretOutputResourceName] = {
                    Description: `secretAccessKey for ${accessResourceName}`,
                    Value: {
                        "Fn::GetAtt": [
                            accessResourceName,
                            'SecretAccessKey'
                        ]
                    }
                }
            }
        }

        // Actual addition of new Resources
        for (const [name, resource] of Object.entries(newResources)) {
            this.serverless.service.resources.Resources[name] = resource;
        }

        // Actual removal of template resources
        for (const name of templateResources) {
            delete this.serverless.service.resources.Resources[name];
        }

        // Actual addition of new Outputs
        if (!this.serverless.service.resources.hasOwnProperty('Outputs')) {
            this.serverless.service.resources.Outputs = {};
        }
        for (const [name, output] of Object.entries(newOutputs)) {
            this.serverless.service.resources.Outputs[name] = output;
        }
        this.log("Template has been transformed");
    }

    get stackName() {
        return `${this.serverless.service.getServiceName()}-${this.serverless.getProvider('aws').getStage()}`
    }

    describeStack(name) {
        return this.serverless.getProvider('aws').request(
            'CloudFormation',
            'describeStacks',
            {StackName: name},
            this.serverless.getProvider('aws').getStage(),
            this.serverless.getProvider('aws').getRegion()
        )
    }

    async afterDeploy() {
        // Retrieve context for Student Frontend
        this.log('Reading output of the stack...');
        const info = await this.describeStack(this.stackName);
        const studentsFile = await this.studentsFile();
        const students = await this.students(studentsFile);
        const passwords = await this.passwords(students.length);
        let outputByKey = {};
        for (const output of info.Stacks[0].Outputs) {
            outputByKey[output.OutputKey] = output.OutputValue;
        }

        // Generating Frontend compatible configuration file
        const config = {
            "aws": {
                "region": this.serverless.getProvider('aws').getRegion(),
                "accessKey": outputByKey.Colleague1AccessKeyId,
                "secretKey": outputByKey.Colleague1SecretKey,
                "accountId": outputByKey.AccountId,
                "userName": students[0],
                "password": passwords[0],
            },
            "lambda": {
                "checkTask": outputByKey.CheckTaskLambdaFunctionName
            },
            "storage": {
                "scoresBucket": outputByKey.ScoresBucketName
            },
            "students": students
        }
        const fileContent = 'var Config = ' + JSON.stringify(config, null, 2);

        // Storing configuration to the file system
        const studentConfigFile = "../student/a-a.js"
        this.log(`Storing Frontend config to ${studentConfigFile}...`);
        await this.serverless.utils.writeFile(studentConfigFile, fileContent)
    }
}

module.exports = ServerlessPlugin;
