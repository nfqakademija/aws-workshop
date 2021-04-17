'use strict';

const PluginName = 'workshopUsers'

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:package:finalize': this.beforePackage.bind(this),
    };
  }

  log(message) {
    this.serverless.cli.log(message, PluginName);
  }
  warn(message) {
    this.serverless.cli.log(message, PluginName, { color: 'orange' });
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
    const passwordCache = "config/students.passwords.cache.json"
    if (this.serverless.utils.fileExistsSync(passwordCache)) {
      this.log(`Reusing old passwords ${passwordCache}...`);
      let passwords = await this.serverless.utils.readFile(passwordCache);
      if (count === passwords.length) {
        return passwords
      }
      this.warn(`Passwords count in cache differ. Invalidating cache`);
    }

    this.log(`Generating passwords...`);
    const crypto = await import('crypto');
    let passwordPromises = [];
    for (let i = 0; i < count; i++) {
      passwordPromises.push(this.randomPassword(crypto));
    }
    let passwords = await Promise.all(passwordPromises);
    this.log(`Storing passwords to cache ${passwordCache}...`);
    await this.serverless.utils.writeFile(passwordCache, JSON.stringify(passwords, null, 2))
    return passwords
  }

  // Main hook logic
  async beforePackage() {
    // Read students list
    let studentsFile = "config/students.local.yml"
    if (!this.serverless.utils.fileExistsSync(studentsFile)) {
      studentsFile = "config/students.yml"
      this.warn(`Please use "config/students.local.yml" instead of "${studentsFile}" to have local list`);
    }
    this.log(`Reading ${studentsFile}...`);
    let students = await this.serverless.yamlParser.parse(studentsFile)

    // Generating passwords
    let passwords = await this.passwords(students.length);

    // Replacing template content
    let newResources = {};
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
      this.log(`Duplicating resource "${name}" for each student...`);
      templateResources.push(name);

      // Transforming resource from template (old value)
      for (const [i, userName] of Object.entries(students)) {
        let newResource = JSON.parse(JSON.stringify(resource));
        newResource.Properties.UserName = userName;
        newResource.Properties.LoginProfile.Password = passwords[i];
        let index = Number(i) + 1;
        let resourceName = `${name}${index}`;
        newResource.Metadata["Serverless::Plugin::WorkshopUsers"] = `generated from ${name} and ${studentsFile}`
        newResources[resourceName] = newResource;
      }
    }

    // Actual addition of new resources
    for (const [name, resource] of Object.entries(newResources)) {
      this.serverless.service.resources.Resources[name] = resource;
    }

    // Actual removal of template resources
    for (const name of templateResources) {
      delete this.serverless.service.resources.Resources[name];
    }
    this.log("Template has been transformed");
  }
}

module.exports = ServerlessPlugin;
