const assert = require('assert');
const net = require('net');
const {
    parse: parseUrl,
 } = require('url');
 
assert(process.argv[2], 'remote address("hostname:port") required.');

const {
    hostname: REMOTE_HOSTNAME,
    port: REMOTE_PORT,
} = parseUrl(`http://${process.argv[2] || 'localhost'}`);

assert(REMOTE_PORT, 'remote port number required.');

const LOCAL_PORT = Number(process.argv[3]) || 0;

const tcpProxyServer = net.createServer();

tcpProxyServer.on('connection', (clientSocket) => {
    const serverSocket = net.createConnection(REMOTE_PORT, REMOTE_HOSTNAME);
    serverSocket.once('connect', () => {
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
        serverSocket.on('data', () => {
            console.info('------------- server -> client -------------');
        });
        serverSocket.pipe(process.stdout);
        clientSocket.on('data', () => {
            console.info('------------- client -> server -------------');
        });
        clientSocket.pipe(process.stdout);
    });
    serverSocket.on('error', err => {
        clientSocket.end(err.message);
    });
    clientSocket.on('error', () => {
        serverSocket.destroy();
    });
});

tcpProxyServer.on('listening', () => {
    console.info(`TCP server started. (IP:port = 0.0.0.0:${tcpProxyServer.address().port})`);
    console.info(`transport to ${REMOTE_HOSTNAME}:${REMOTE_PORT}`);
});

tcpProxyServer.listen(LOCAL_PORT);
