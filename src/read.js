import Redis from 'ioredis';
import { PdfReader } from 'pdfreader';

const id = process.argv[2];
const filePath = process.argv[3];
const redisPort = Number(process.argv[4]);
const redisHost = process.argv[5];
const redisPassword = process.argv[6];
const redisDb = Number(process.argv[7]);
let exit = false;

if (!id
	|| typeof id !== 'string') {
	console.error(`Error: Property "id (${id})" property is invalid format.`);
	exit = true;
}
if (!filePath
	|| typeof filePath !== 'string') {
	console.error(`Error: Property "file (${filePath.toString()})" property is invalid format.`);
	exit = true;
}
if (!(redisPort >= 1)) {
	console.error(`Error: Property "redis port (${redisPort.toString()})" property is invalid format.`);
	exit = true;
}
if (!redisHost
	|| typeof redisHost !== 'string') {
	console.error(`Error: Property "redis host (${redisHost.toString()})" property is invalid format.`);
	exit = true;
}
if (!redisPassword
	|| typeof redisPassword !== 'string') {
	console.error(`Error: Property "redis password (${redisPassword.toString()})" property is invalid format.`);
	exit = true;
}
if (!(redisDb >= 1)) {
	console.error(`Error: Property "redis db (${redisDb.toString()})" property is invalid format.`);
	exit = true;
}
if (!exit) {
	const redis = new Redis({
		port: redisPort,
		host: redisHost,
		password: redisPassword,
		db: redisDb,
	});

	redis.on('connect', () => {
		let index = 0,
			asyncIndex = 0;

		new PdfReader().parseFileItems(filePath, async (err, item) => {
			if (err) {
				console.error(`Error: ${err.message}`);
				exit = true;
			}
			else if (!item) {
				console.log(`Document "${filePath.toString()}" parsing completed successfully!`, index);
			}
			else if (item
				&& typeof item === 'object') {
				index++;

				await redis.rpush(id, JSON.stringify(item));

				if (asyncIndex === (index - 1)) {
					process.exit();
				}
				asyncIndex++;
			}
		});
	});
	redis.on('error', (err) => {
		exit = 1;
		console.error(`Error: ${err.toString()}`);
	});
}
