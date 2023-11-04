import { S3Event } from "aws-lambda";
import * as AWS from "aws-sdk";
const csv = require("csv-parser");

const importFileParser = async (event: S3Event): Promise<void> => {
  const s3 = new AWS.S3({ region: "us-east-1" });
  const sqs = new AWS.SQS({ region: "us-east-1" });
  try {
    for (const record of event.Records) {
      const params = {
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
      };

      const s3Stream = s3.getObject(params).createReadStream();
      const data = s3Stream.pipe(csv());

      const queueParams = {
        MessageBody: null,
        QueueUrl: process.env.SQS_URL,
      };

      for await (const result of data) {
        queueParams.MessageBody = JSON.stringify(result)
        await sqs.sendMessage(queueParams).promise();
      }
      
      console.log("ALL records published to queue");
      const sourceFolder = 'uploaded';
      const destFolder = 'parsed';
      const destPath = record.s3.object.key.replace(sourceFolder, destFolder);

      console.log("Moving file to ", record.s3.bucket.name, destPath);
      
      const copyParams = {
        Bucket: record.s3.bucket.name,
        CopySource: `${record.s3.bucket.name}/${record.s3.object.key}`,
        Key: `${destPath}`
      };

      await s3.copyObject(copyParams).promise();
      await s3.deleteObject({ Bucket: copyParams.Bucket, Key: record.s3.object.key }).promise();
      
      console.log("File moved to parsed folder ");
    }
  } catch(err) {
    console.log(err);
    throw err;
  }
};

export const main = importFileParser;