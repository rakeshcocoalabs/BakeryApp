var commonStorePath = 'http://172.105.33.226/bakery-ecommerce-images';
var commonImageStorePath = '/var/www/html/bakery-ecommerce-images/'
module.exports = {
  gateway: {
    url: "http://localhost:5000"
  },
  otp: {
    expirySeconds: 2 * 60
  },
  user: {
    // imageUploadPath: 'uploads',
    imageUploadPath: commonImageStorePath + 'users/',
    imageBase: commonStorePath + '/users/',
    resultsPerPage: 30
  },
  cart: {
    resultsPerPage: 30
  },
  order: {
    resultsPerPage: 30
  },
  banners: {
    // imageUploadPath: 'uploads',
    imageUploadPath: commonImageStorePath + 'banners/',
    imageBase: commonStorePath + '/banners/'
  },
  categories: {
    // imageUploadPath: 'uploads',
    imageUploadPath: commonImageStorePath + 'categories/',
    imageBase: commonStorePath + '/categories/'
  },
  products: {
    // imageUploadPath: 'uploads',
    imageUploadPath: commonImageStorePath + 'products/',
    imageBase: commonStorePath + '/products/',
    resultsPerPage: 30

  },
  variants: {
    resultsPerPage: 30
  }


}