const auth = require('../middleware/auth.js');

module.exports = (app) => { 
    const product = require('../controllers/product.controller');
    app.get('/products', product.list);
    app.get('/products/:id', product.detail);
}