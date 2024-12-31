// testMongoConnection.ts
import { getMongoClientWithIAMRole } from 'mongodb'

export const handler = async () => {
  const client = await getMongoClientWithIAMRole();
  const testDB = client.db('test');
  const randomCollection = testDB.collection('random');
  const randomNumber = Math.random();
  await randomCollection.insertOne({ title: randomNumber });
  const result = await randomCollection.findOne({ title: randomNumber });
  return result;
};