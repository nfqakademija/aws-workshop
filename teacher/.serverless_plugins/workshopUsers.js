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

  async beforePackage() {
    // Read students list
    let studentsFile = "config/students.local.yml"
    if (!this.serverless.utils.fileExistsSync(studentsFile)) {
      studentsFile = "config/students.yml"
      this.warn(`Please use "config/students.local.yml" instead of "${studentsFile}" to have local list`);
    }
    this.log(`Reading ${studentsFile}...`, "testas");
    let students = await this.serverless.yamlParser.parse(studentsFile)

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
