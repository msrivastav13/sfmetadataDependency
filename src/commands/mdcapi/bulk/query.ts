import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import BulkApi from '../../../helpers/bulk2Query';
// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfmetadatadependency', 'org');

export default class Get extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = [
        `$ sfdx mdcapi:bulk:query --query="SELECT MetadataComponentId,MetadataComponentNamespace,MetadataComponentName,MetadataComponentType,RefMetadataComponentName,RefMetadataComponentType,RefMetadataComponentNamespace FROM MetadataComponentDependency WHERE MetadataComponentType='ExperienceBundle'" --json`
    ];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        query: flags.string({
            char: 'q',
            description: messages.getMessage('bulkQuery')
        })
    };

    // Comment this out if your command does not require an org username
    protected static requiresUsername = true;

    // Comment this out if your command does not support a hub org username
    protected static supportsDevhubUsername = false;

    // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
    protected static requiresProject = false;

    public async run(): Promise<AnyJson> {
        const query = this.flags.query;
        const bulkQuery = new BulkApi(this.org.getConnection());
        // Query the org
        const result = await bulkQuery.createBulkQueryJob(query);
        // Return an object to be displayed with --json
        return result;
    }
}
