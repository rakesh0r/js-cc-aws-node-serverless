import { S3Event } from "aws-lambda";
import * as AWS from "aws-sdk";
const csv = require("csv-parser");

const importFileParser = async (event: S3Event): Promise<void> => {
  const s3 = new AWS.S3({ region: "us-east-1" });

  for (const record of event.Records) {
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    };

    const s3Stream = s3.getObject(params).createReadStream();
    const results = [];
    const data = s3Stream.pipe(csv());

    for await (const result of data) {
      results.push(result);
      console.log("CSV record: ", JSON.stringify(result));
    }

    console.log("ALL records: ", JSON.stringify(results));
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
};

export const main = importFileParser;