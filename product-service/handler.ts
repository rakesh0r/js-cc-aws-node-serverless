import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from 'aws-sdk';
import * as uuid from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient()

const getProductsWithCount = (products, stocks) => {
  return products.map((product) => {
    const stock = stocks.find((stock) => stock.product_id === product.id);
    product.count = stock?.count || 0;
    return product
  });
}

export const getProductsList = async (): Promise<APIGatewayProxyResult> => {
  try {

    console.log('products');
    
    const products_params = {
      TableName: process.env.PRODUCTS_TABLE,
    };

    const stocks_params = {
      TableName: process.env.STOCKS_TABLE,
    };

    const products = (await dynamoDb.scan(products_params).promise()).Items;
    const stocks = (await dynamoDb.scan(stocks_params).promise()).Items;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(getProductsWithCount(products, stocks)),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error }),
    };
  }
};

export const getProductsById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {

    const { productId } = event.pathParameters as any;

    console.log('product by id :: ', productId);

    const products_params = {
      TableName: process.env.PRODUCTS_TABLE,
      Key: {
        'id': productId,
      }
    };

    const stocks_params = {
      TableName: process.env.STOCKS_TABLE,
      Key: {
        'product_id': productId
      }
    };

    const product = (await dynamoDb.get(products_params).promise()).Item;
    const stock = (await dynamoDb.get(stocks_params).promise()).Item;

    const count = stock?.count || 0;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({...product, count }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error }),
    };
  }
};

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {

    const data = JSON.parse(event.body)

    if(!data.title || !data.description) {
      new Error('Required field missing');
    }

    console.log('create product :: ', data);
    const id =  uuid.v4();
    const products_params = {
      TableName: process.env.PRODUCTS_TABLE,
      Item: {
        id,
        title: data.title,
        description: data.description,
        price: data.price
      }
    };

    const stocks_params = {
      TableName: process.env.STOCKS_TABLE,
      Item: {
        'product_id': id,
        count: data.count || 0
      }
    };

    
    // await dynamoDb.put(products_params).promise();
    // await dynamoDb.put(stocks_params).promise();

    // With transaction API
    await dynamoDb.transactWrite({
      ReturnConsumedCapacity: "INDEXES",
      ReturnItemCollectionMetrics: "SIZE",
      TransactItems: [
        {
          Put: products_params,
        },
        {
          Put: stocks_params,
        }
      ]
    }).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({...data, id }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error }),
    };
  }
};