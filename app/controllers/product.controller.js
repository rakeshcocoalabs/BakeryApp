const Product = require('../models/product.model');
const Category = require('../models/categories.model');
const Reviews = require('../models/review.model');
const Banner = require('../models/banner.model');
const User = require('../models/user.model');
const Variant = require('../models/variant.model');
const config = require('../../config/app.config');
const productConfig = config.products;
const ObjectId = require('mongoose').Types.ObjectId;
const Constants = require('../helpers/constants');
const bannerConfig = config.banners;
const productsConfig = config.products;
const categoriesConfig = config.categories;

// *** Product listing with pagination ***
exports.list = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
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
        }).skip(offset).limit(perPage).sort(sort).lean();
        let itemsCount = await Product.countDocuments(filter);
        let productList = await favouriteOrNot(products, userId);
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
            imageBase: productConfig.imageBase,
            items: productList
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}

async function favouriteOrNot(products, userId) {
    let userData = await User.findById({
        _id: userId,
        status: 1
    });
    let wishList = userData.wishlist;
    for (let i = 0; i < products.length; i++) {
        if (wishList.includes(products[i]._id)) {
            products[i].isFavourite = true;
        } else {
            products[i].isFavourite = false;
        }
    }
    return products
}

// *** Product detail ***
exports.detail = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
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
        category: 1,
        quantity: 1,
        subImages: 1,
        description: 1,
        costPrice: 1,
        sellingPrice: 1,
        averageRating: 1
    };
    try {
        let productDetail = await Product.findById(filter, projection).populate({
            path: 'variants',
            select: 'size costPrice unit sellingPrice currency'
        }).lean();
        let userData = await User.findById({
            _id: userId,
            status: 1
        });
        let wishList = userData.wishlist;
        if (wishList.includes(productDetail._id)) {
            productDetail.isFavourite = true;
        } else {
            productDetail.isFavourite = false;
        }
        let totalReviews = await Reviews.countDocuments({
            product: id,
            status: 1
        });
        productDetail['totalReviews'] = totalReviews;
        let relatedProducts = await Product.find({
            category: productDetail.category,
            _id: {
                $ne: productDetail._id
            },
            status: 1
        }, {
            name: 1,
            sellingPrice: 1,
            image: 1,
            averageRating: 1
        }).populate({
            path: 'category',
            select: 'name'
        }).lean();
        relatedProducts = await favouriteOrNot(relatedProducts, userId);
        res.status(200).send({
            success: 1,
            imageBase: productsConfig.imageBase,
            item: productDetail,
            relatedProducts: relatedProducts
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}

// *** Home summary api ***
exports.home = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    try {
        let bannerFilter = {
            status: 1
        };
        let bannerProjection = {
            image: 1
        };
        let banners = await Banner.find(bannerFilter, bannerProjection);
        let categoryFilter = {
            status: 1
        };
        let categoryProjection = {
            name: 1,
            image: 1
        };
        let categoryList = await Category.find(categoryFilter, categoryProjection).limit(5);
        let productFilter = {
            status: 1
        };
        let productProjection = {
            name: 1,
            image: 1,
            category: 1,
            sellingPrice: 1,
            averageRating: 1
        };
        let products = await Product.find(productFilter, productProjection).populate({
            path: 'category',
            select: 'name'
        }).limit(5).lean();
        let productList = await favouriteOrNot(products, userId);
        res.status(200).send({
            success: 1,
            bannerImageBase: bannerConfig.imageBase,
            categoriesImageBase: categoriesConfig.imageBase,
            productImageBase: productsConfig.imageBase,
            banners: banners,
            categoryList: categoryList,
            productList: productList
        });;
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}