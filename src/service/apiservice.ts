import fetch, { RequestInit } from 'node-fetch';

export async function makeAPICall(
    endpoint: string,
    requestOptions: RequestInit
) {
    const response = await fetch(endpoint, requestOptions);
    return response;
}
