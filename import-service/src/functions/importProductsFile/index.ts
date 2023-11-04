import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "get",
        cors: true,
        path: "import",
        request: {
          parameters: {
            querystrings: {
              name: true,
            },
          },
        },
        authorizer: {
          arn: 'arn:aws:lambda:${self:provider.region}:${aws:accountId}:function:authorization-service-dev-basicAuthorizer',
          type: 'request',
          resultTtlInSeconds: 0,
        }
      },
    },
  ],
};