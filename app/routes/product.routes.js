const auth = require('../middleware/auth.js');

module.exports = (app) => { 
    const product = require('../controllers/product.controller');
    app.get('/product', product.list);
    app.get('/product/:id/detail', product.detail);
    app.get('/product/home', product.home);
}