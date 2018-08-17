const assert = require('assert');
const net = require('net');
const {
    parse: parseUrl,
} = require('url');

assert(process.argv[2], 'remote address("hostname:port") required.');

const {
    hostname: REMOTE_HOSTNAME,
    port: REMOTE_PORT,
} = parseUrl(`http://${process.argv[2]}`);

assert(REMOTE_PORT, 'remote port number required.');

const parseLocalBindInfo = (arg) => {
    if (arg === 'log') {
        return {
            port: 0,
        };
    }
    if (/^\d+$/.test(arg)) {
        const port = Number(arg) || 0;
        return {
            port,
        };
    }
    const {
        hostname,
        port,
    } = parseUrl(`http://${arg}`);
    return {
        hostname,
        port: port || 0,
    };
};

const {
    hostname: LOCAL_HOSTNAME,
    port: LOCAL_PORT,
 } = parseLocalBindInfo(process.argv[3]);

const logEnabled = process.argv[3] === 'log' || process.argv[4] === 'log';

const tcpProxyServer = net.createServer();

tcpProxyServer.on('connection', (clientSocket) => {
    const serverSocket = net.createConnection(REMOTE_PORT, REMOTE_HOSTNAME);
    serverSocket.once('connect', () => {
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
        if (logEnabled) {
            serverSocket.on('data', () => {
                console.info('\n------------- server -> client -------------');
            });
            serverSocket.pipe(process.stdout);
            clientSocket.on('data', () => {
                console.info('\n------------- client -> server -------------');
            });
            clientSocket.pipe(process.stdout);
        }
    });
    serverSocket.on('error', err => {
        clientSocket.end(err.message);
    });
    clientSocket.on('error', () => {
        serverSocket.destroy();
    });
});

tcpProxyServer.on('listening', () => {
    const {
        address,
        port,
    } = tcpProxyServer.address();
    console.info(`TCP server started. (IP:port = ${address}:${port})`);
    console.info(`transport to ${REMOTE_HOSTNAME}:${REMOTE_PORT}`);
});

tcpProxyServer.listen(LOCAL_PORT, LOCAL_HOSTNAME);
