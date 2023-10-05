'use strict';
const products = require('./mocks/products');

module.exports.getProductsList = async (event) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(products),
  };
};

module.exports.getProductsById = async (event) => {
  const productId = event.pathParameters.productId;
  console.log(productId);
  const product = products.find((product) => product.id === productId);
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(product),
  };
};