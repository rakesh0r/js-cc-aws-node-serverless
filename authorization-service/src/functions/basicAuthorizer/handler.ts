import { middyfy } from '@libs/lambda';
import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent, APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerResult, PolicyDocument } from 'aws-lambda';

const generatePolicy = (principalId: string, effect: 'Allow' | 'Deny', resource: string) => {
  var authResponse = { principalId, policyDocument: null };
  if (effect && resource) {
      const policyDocument: PolicyDocument = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource,
          }
        ]
      };
      authResponse.policyDocument = policyDocument;
  }
  
  return authResponse;
}

const generateAllow =  (principalId: string, resource: string) => {
  return generatePolicy(principalId, 'Allow', resource);
}
   
const generateDeny = (principalId: string, resource: string) => {
  return generatePolicy(principalId, 'Deny', resource);
}

const requestAuthorizer = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const { headers, methodArn } = event;
  
  console.log(JSON.stringify(headers));
  const principalId = 'me';
  const AUTH_TOKEN = Buffer.from(`rakesh0r:${process.env.rakesh0r}`).toString('base64')
  
  const response = headers.Authorization.replace('Basic ', '') === AUTH_TOKEN ? generateAllow(principalId, methodArn) : generateDeny(principalId, methodArn);

  console.log('Response', JSON.stringify(response));
  return response;
};

export const main = middyfy(requestAuthorizer);
