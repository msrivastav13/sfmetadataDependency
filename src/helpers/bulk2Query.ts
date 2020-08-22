import { core, UX } from '@salesforce/command';
import { SfdxError } from '@salesforce/core';
import csvjson = require('csvjson');
import * as fs from 'fs';
import { HeadersInit, RequestInit } from 'node-fetch';
import { makeAPICall } from '../service/apiservice';

export default class BulkApi {
    private connection: core.Connection;
    private endpoint: string;
    private headers: HeadersInit;

    constructor(connection: core.Connection) {
        this.connection = connection;
        this.endpoint =
            connection.instanceUrl +
            '/services/data/v' +
            connection.getApiVersion() +
            '/tooling/jobs/query';
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.connection.accessToken,
            Accept: 'application/json'
        };
    }

    public async createBulkQueryJob(queryStr: string) {
        let finalresponse = {};
        const ux = await UX.create();
        ux.startSpinner('Submitting bulk query job');
        const requestOptions: RequestInit = {
            headers: this.headers,
            body: JSON.stringify({
                operation: 'query',
                query: queryStr
            }),
            method: 'POST'
        };
        try {
            finalresponse = await this.makeApiCall(
                this.endpoint,
                requestOptions,
                finalresponse,
                true
            );
            ux.stopSpinner();
            ux.log(
                `query submitted with JobId ${finalresponse['data.id']}. To monitor execute sfdx `
            );
        } catch (err) {
            finalresponse = {
                sucess: false,
                result: err.cause ? err.cause : err.message
            };
            throw new SfdxError(err.cause ? err.cause : err.message);
        }
        return { finalresponse };
    }

    public async getBulkJobStatus(jobId: string) {
        const ux = await UX.create();
        ux.startSpinner('Querying bulk query job');
        let finalresponse = {};
        const requestOptions: RequestInit = {
            headers: this.headers,
            method: 'GET'
        };
        try {
            const endpoint = this.endpoint + '/' + jobId;
            finalresponse = await this.makeApiCall(
                endpoint,
                requestOptions,
                finalresponse,
                true
            );
            ux.stopSpinner();
            ux.log(
                `JobId ${finalresponse['data.id']} current state is ${finalresponse['data.state']}`
            );
        } catch (err) {
            finalresponse = {
                sucess: false,
                result: err.cause ? err.cause : err.message
            };
            throw new SfdxError(err.cause ? err.cause : err.message);
        }
        return { finalresponse };
    }

    public async getBulkQueryJobResults(
        jobId: string,
        outputdir: string,
        fileformat: string,
        filename: string
    ) {
        const ux = await UX.create();
        ux.startSpinner('Fetching bulk query job results');
        let finalresponse = {};
        const requestOptions: RequestInit = {
            headers: this.headers,
            method: 'GET'
        };
        try {
            const endpoint = this.endpoint + '/' + jobId + '/results';
            finalresponse = await this.makeApiCall(
                endpoint,
                requestOptions,
                finalresponse,
                false
            );
            this.createFile(
                finalresponse['data'],
                outputdir,
                finalresponse,
                filename,
                fileformat
            );
            ux.stopSpinner();
            ux.log('results retrieved successfully');
        } catch (err) {
            finalresponse = {
                sucess: false,
                result: err.cause ? err.cause : err.message
            };
            throw new SfdxError(err.cause ? err.cause : err.message);
        }
        return { finalresponse };
    }

    private async makeApiCall(
        endpoint: string,
        requestOptions: RequestInit,
        finalresponse: {},
        isJSON: boolean
    ) {
        const response = await makeAPICall(endpoint, requestOptions);
        if (response.status === 200) {
            // tslint:disable-next-line: no-any
            let responseData: Promise<any>;
            if (isJSON) {
                responseData = response.json();
            } else {
                responseData = response.text();
            }
            await responseData.then((data) => {
                finalresponse = {
                    sucess: true,
                    data
                };
            });
        } else {
            finalresponse = {
                sucess: false,
                result:
                    response.statusText +
                    '.The status code of response is ' +
                    response.status
            };
            throw new SfdxError(finalresponse['result']);
        }
        return finalresponse;
    }

    private createFile(
        csvData: string,
        outputdir: string,
        finalresponse: {},
        filename: string,
        fileformat: string
    ) {
        if (!fs.existsSync(outputdir)) {
            fs.mkdirSync(outputdir);
        }
        let dataToWrite;
        if (fileformat === 'json') {
            const options = {
                delimiter : ',', // optional
                quote     : '"' // optional
            };
            dataToWrite = JSON.stringify(csvjson.toObject(csvData, options), null, 2);
        } else {
            dataToWrite = csvData;
        }
        const filepath: string = `${outputdir}/${filename}.${fileformat}`;
        fs.writeFile(filepath, dataToWrite, 'UTF-8', (err) => {
            if (err) {
                if (err) {
                    finalresponse = { sucess: false, result: err };
                    throw err;
                }
            }
        });
        finalresponse = {
            sucess: true,
            result: `${filename}.${fileformat} file successfully generated at ${filepath}`
        };
        return finalresponse;
    }
}
