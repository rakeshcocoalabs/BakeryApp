const mongoose = require('mongoose');

function transform(ret) {
	ret.id = ret._id;
	delete ret._id;
	delete ret.status;
	delete ret.tSCreatedAt;
	delete ret.tSModifiedAt;
}
var options = {
	toObject: {
		virtuals: true,
		transform: function (doc, ret) {
			transform(ret);
		}
	},
	toJSON: {
		virtuals: true,
		transform: function (doc, ret) {
			transform(ret);
		}
	}
};

const product = mongoose.Schema({
	name: String,
	description: String,
	quantity: Number,
	category: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category'
	},
	image: String,
	subImages: Array,
	brand:String,
	costPrice: Number,
	sellingPrice:Number,
	variantsExists: Boolean,
	variants:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Variant'
	}],
	discount: Number,
	sku: String,
	weight: Number,
	height: Number,
	width: Number,
	length: Number,
	currency: String,
	isActive: Boolean,
	isBuyable: Boolean,
	isShippable: Boolean,
	stockAvailable: Number,
	outOfStock: Boolean,
	status: Number,
	tSCreatedAt: Number,
	tSModifiedAt: Number,
}, options);

module.exports = mongoose.model('Product', product, "Products");