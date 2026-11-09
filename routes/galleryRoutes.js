const express = require('express');
const router = express.Router();

//kasutatavad kontrollerid
const {
	galleryPage
	} = require('../controllers/galleryControllers');

router.route('/').get(galleryPage);

module.exports = router;