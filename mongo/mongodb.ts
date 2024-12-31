
// mongodb.ts
import { MongoClient } from 'mongodb';
import { STS } from 'aws-sdk';

let client: null | MongoClient = null;
const sts = new STS();
// IAM Role ARN that we created earlier and added to MongoDB Atlas
const ACCESS_ROLE_ARN = process.env.MONGODB_ACCESS_ROLE_ARN
const CLUSTER_NAME = process.env.MONGODB_CLUSTER_NAME // e.g. cluster-name.asdf

/**
 * Instantiates a {@link MongoClient} if one doesn't already exist.
 * We cache it to limit the number of open connections.
 *
 * Requires environment variable `MONGODB_ACCESS_ROLE_ARN` which references an IAM role ARN.
 * The Resource will need permissions to assume this role.
 */
export const getMongoClientWithIAMRole = async () => {
  console.log('Getting mongo client');
  if (client) {
    console.log('Returning mongo client in cache');
    return client;
  }
  const { Credentials } = await sts
    .assumeRole({
      RoleArn: ACCESS_ROLE_ARN,
      RoleSessionName: 'AccessMongoDB',
    })
    .promise();

if (!Credentials) {
throw new Error('Failed to assume mongo db IAM role');
}

// Create connection string
const { AccessKeyId, SessionToken, SecretAccessKey } = Credentials;
const encodedSecretKey = encodeURIComponent(SecretAccessKey);
const combo = `${AccessKeyId}:${encodedSecretKey}`;
const url = new URL(`mongodb+srv://${combo}@${CLUSTER_NAME}.mongodb.net`);
url.searchParams.set('authSource', '$external');
url.searchParams.set(
  'authMechanismProperties',
  `AWS_SESSION_TOKEN:${SessionToken}`,
);
url.searchParams.set('w', 'majority');
url.searchParams.set('retryWrites', 'true');
url.searchParams.set('authMechanism', 'MONGODB-AWS');

const mongoClient = new MongoClient(url.toString());
client = await mongoClient.connect();

console.log('Successfully connected to mongo db, returning mongo client');
return client;
};