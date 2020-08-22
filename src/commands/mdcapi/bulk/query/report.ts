import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import BulkApi from '../../../../helpers/bulk2Query';
// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfmetadatadependency', 'org');

export default class Get extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = [
        '$ sfdx mdcapi:bulk:query:report --jobId=750R0000000$H8AAU --json'
    ];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        jobid: flags.string({
            char: 'i',
            description: messages.getMessage('jobId'),
            required: true
        })
    };

    // Comment this out if your command does not require an org username
    protected static requiresUsername = true;

    // Comment this out if your command does not support a hub org username
    protected static supportsDevhubUsername = false;

    // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
    protected static requiresProject = false;

    public async run(): Promise<AnyJson> {
        const bulkQuery = new BulkApi(this.org.getConnection());
        // Query the org
        const result = await bulkQuery.getBulkJobStatus(this.flags.jobid);
        // Return an object to be displayed with --json
        return result;
    }
}
