'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as net from 'net';
import {ServerOptions, StreamInfo} from "vscode-languageclient";

/**
 * Construct ServerOptions that connect to a rascal lsp bride, in release mode it also takes care of starting the jar that is running the language server.
 * @param serverPort Port to connect to
 * @param maxTries Retry in case of failure to open a connection to that port
 * @param retryDelay Delay between retries
 * @param releaseMode If we are running in release mode or are developing a new LSP bridge, with rascal runnning next to it.
 */
export function buildServerConnection(serverPort: number, maxTries: number, retryDelay: number, releaseMode: boolean = true): ServerOptions {
    if (releaseMode) {
        console.log("Release mode is not working yet, needs to run a jar");
    }
    return () => tryOpenConnection(serverPort, "localhost", maxTries, retryDelay).then(s => <StreamInfo>{
        reader: s,
        writer: s
    });
}

function tryOpenConnection(port: number, host: string, maxTries: number, retryDelay: number): Thenable<net.Socket> {
    return new Promise((connected, failed) => {
        const client = new net.Socket();
        let tries = 0;
        function retry(err?: Error) {
            if (tries <= maxTries) {
                tries++;
                client.connect(port, host);
            }
            else {
                failed("Connection retries exceeded" + (err ? (": " + err.message) : ""));
            }
        }
        // normal error case, timeout of the connection setup
        client.setTimeout(retryDelay);
        client.on('timeout', retry);
        // random errors, also retry
        client.on('error', retry);
        // success, so let's report back
        client.once('connect', () => {
            client.setTimeout(0); // undo the timeout
            client.removeAllListeners(); // remove the error listener
            connected(client);
        });
        // kick-off the retry loop
        retry();
    });
}