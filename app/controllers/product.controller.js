const Product = require('../models/product.model');
const Category = require('../models/categories.model');
const Reviews = require('../models/review.model');
const config = require('../../config/app.config');
const productConfig = config.products;
const ObjectId = require('mongoose').Types.ObjectId;
const Constants = require('../helpers/constants');

// *** Product listing with pagination ***
exports.list = async (req, res) => {
    let params = req.query;
    var search = params.search || '.*';
    search = search + '.*';
    let sortValue = params.sort;
    let filterValue = params.filter;
    let page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    let perPage = Number(params.perPage) || productConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : productConfig.resultsPerPage;
    let offset = (page - 1) * perPage;
    if (sortValue) {
        if ((sortValue != Constants.popular) && (sortValue != Constants.lowToHigh) && (sortValue != Constants.highToLow) && (sortValue != Constants.rating)) {
            return res.status(400).send({
                success: 0,
                message: 'incorrect sort value'
            })
        }
    }
    if (filterValue) {
        if ((filterValue != Constants.veg) && (filterValue != Constants.nonVeg) && (filterValue != Constants.combo) && (filterValue != Constants.fastFood)) {
            return res.status(400).send({
                success: 0,
                message: 'incorrect filter value'
            })
        }
    }
    // sort
    let sort = {};
    if (sortValue == Constants.lowToHigh) {
        sort['sellingPrice'] = 1
    } else if (sortValue == Constants.highToLow) {
        sort['sellingPrice'] = -1
    } else if (sortValue == Constants.rating) {
        sort['averageRating'] = -1
    } else {
        sort['tsCreatedAt'] = -1
    }

    // filter
    let filter = {
        $or: [{
            name: {
                $regex: search,
                $options: 'i',
            }
        }]
    };
    if (filterValue == Constants.veg) {
        filter['isVegOnly'] = true;
        filter['status'] = 1;
    } else if (filterValue == Constants.nonVeg) {
        filter['isVegOnly'] = false;
        filter['status'] = 1;
    } else if (filterValue == Constants.combo) {
        filter['isCombo'] = true;
        filter['status'] = 1;
    }
    let projection = {
        name: 1,
        image: 1,
        category: 1,
        sellingPrice: 1,
        averageRating: 1
    };
    try {
        let products = await Product.find(filter, projection).populate({
            path: 'category',
            select: 'name'
        }).skip(offset).limit(perPage).sort(sort);
        let itemsCount = await Product.countDocuments(filter);
        totalPages = itemsCount / perPage;
        totalPages = Math.ceil(totalPages);
        let hasNextPage = page < totalPages;
        let pagination = {
            page: page,
            perPage: perPage,
            hasNextPage: hasNextPage,
            totalItems: itemsCount,
            totalPages: totalPages
        }
        res.status(200).send({
            success: 1,
            pagination: pagination,
            items: products
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}

// *** Product detail ***
exports.detail = async (req, res) => {
    let id = req.params.id;
    var isValidId = ObjectId.isValid(id);
    if (!isValidId) {
        var responseObj = {
            success: 0,
            status: 401,
            errors: {
                field: "id",
                message: "id is invalid"
            }
        }
        res.send(responseObj);
        return;
    };
    let filter = {
        _id: id,
        status: 1
    };
    let projection = {
        name: 1,
        image: 1,
        subImages: 1,
        description: 1,
        sellingPrice: 1,
        averageRating: 1,
        addOns: 1
    };
    try {
        let productDetail = await Product.findById(filter, projection).populate({
            path: 'addOns',
            select: 'name sellingPrice'
        }).lean();
        let totalReviews = await Reviews.countDocuments({
            product: id,
            status: 1
        });
        productDetail['totalReviews'] = totalReviews;
        res.status(200).send({
            success: 1,
            item: productDetail
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}