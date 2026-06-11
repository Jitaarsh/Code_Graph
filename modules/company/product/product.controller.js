import Product from "./product.model.js";
import { deleteFile } from "../../../middleware/product-upload.js";
import path from "path";
import fs from "fs";

/**
 * @desc    Bulk create products with smart image/pdf matching by SKU
 * @route   POST /api/company/products/bulk
 * @access  Private (Company User)
 */
export const bulkCreateProducts = async (req, res, next) => {
  try {
    // Parse products data (usually sent as a JSON string in FormData)
    let productsData = [];
    if (typeof req.body.products === 'string') {
        productsData = JSON.parse(req.body.products);
    } else {
        productsData = req.body.products || [];
    }

    const files = req.files || [];

    // Create a map of files by their base name (SKU)
    // Map format: { [sku]: { image: path, pdf: path } }
    const fileMap = {};
    
    files.forEach(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext).trim(); // This should be the SKU
      
      if (!fileMap[baseName]) fileMap[baseName] = {};
      
      const normalizedPath = file.path.replace(/\\/g, "/");
      
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        fileMap[baseName].image = normalizedPath;
      } else if (ext === '.pdf') {
        fileMap[baseName].pdf = normalizedPath;
      }
    });

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    const finalProducts = [];

    for (const p of productsData) {
      try {
        // Basic validation
        if (!p.name || !p.sku || !p.category) {
          results.skipped++;
          results.errors.push(`Row with SKU "${p.sku || 'N/A'}" missing required fields.`);
          continue;
        }

        // Check duplicates for this user
        const existing = await Product.findOne({
          $or: [{ sku: p.sku }, { name: p.name }],
          createdBy: req.user._id
        });

        if (existing) {
          results.skipped++;
          results.errors.push(`Product with name or SKU "${p.sku}" already exists.`);
          continue;
        }

        // Match files by SKU (ignoring case)
        const skuKey = p.sku.trim();
        // Look for case-insensitive match in fileMap
        const matchedSku = Object.keys(fileMap).find(k => k.toLowerCase() === skuKey.toLowerCase());
        
        if (matchedSku) {
          if (fileMap[matchedSku].image) p.productImage = fileMap[matchedSku].image;
          if (fileMap[matchedSku].pdf) p.cataloguePdf = fileMap[matchedSku].pdf;
        }

        // Ensure numbers are numbers
        p.basePrice = p.basePrice ? Number(p.basePrice) : 0;
        p.createdBy = req.user._id;

        finalProducts.push(p);
      } catch (err) {
        results.skipped++;
        results.errors.push(`Error processing SKU "${p.sku}": ${err.message}`);
      }
    }

    if (finalProducts.length > 0) {
      const createdItems = await Product.insertMany(finalProducts);
      results.created = createdItems.length;
    }

    res.status(200).json({
      success: true,
      message: "Bulk upload completed",
      data: results
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/company/products
 * @access  Private (Company User)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      description,
      basePrice,
      unit,
      status,
      currency,
      pricingTiers,
      portOfImport,
      addressDetail
    } = req.body;

    // Check if a product with this name already exists for this company user
    const existingName = await Product.findOne({
      name,
      createdBy: req.user._id,
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "A product with this name already exists",
      });
    }

    // Check if a product with this SKU already exists for this company user
    const existingSku = await Product.findOne({
      sku,
      createdBy: req.user._id,
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `A product with SKU "${sku}" already exists`,
      });
    }

    // Handle File Uploads
    let productImage = "";
    let cataloguePdf = "";

    if (req.files) {
      if (req.files.productImage) {
        productImage = req.files.productImage[0].path.replace(/\\/g, "/");
      }
      if (req.files.cataloguePdf) {
        cataloguePdf = req.files.cataloguePdf[0].path.replace(/\\/g, "/");
      }
    }

    // Parse pricing tiers if sent as string (from FormData)
    let parsedTiers = pricingTiers;
    if (typeof pricingTiers === 'string') {
      try {
        parsedTiers = JSON.parse(pricingTiers);
      } catch (e) {
        parsedTiers = [];
      }
    }

    const product = await Product.create({
      name,
      sku,
      category,
      description,
      basePrice: basePrice !== undefined ? Number(basePrice) : 0,
      unit,
      status,
      currency,
      pricingTiers: parsedTiers,
      portOfImport,
      addressDetail,
      productImage,
      cataloguePdf,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products for the logged-in company user
 * @route   GET /api/company/products
 * @access  Private (Company User)
 */
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ createdBy: req.user._id })
      .populate("createdBy", "ownerName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single product by ID
 * @route   GET /api/company/products/:id
 * @access  Private (Company User)
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("createdBy", "ownerName email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/company/products/:id
 * @access  Private (Company User)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name: uName, sku: uSku, category: uCategory, description: uDescription, 
      basePrice: uBasePrice, unit: uUnit, status: uStatus, currency: uCurrency, 
      pricingTiers: uPricingTiers, portOfImport: uPortOfImport, addressDetail: uAddressDetail
    } = req.body;

    const updateData = {
      name: uName, sku: uSku, category: uCategory, description: uDescription, 
      basePrice: uBasePrice !== undefined ? Number(uBasePrice) : undefined,
      unit: uUnit, status: uStatus, currency: uCurrency,
      portOfImport: uPortOfImport, addressDetail: uAddressDetail
    };

    // Handle File Updates
    if (req.files) {
      if (req.files.productImage) {
        if (product.productImage) deleteFile(product.productImage);
        updateData.productImage = req.files.productImage[0].path.replace(/\\/g, "/");
      }
      if (req.files.cataloguePdf) {
        if (product.cataloguePdf) deleteFile(product.cataloguePdf);
        updateData.cataloguePdf = req.files.cataloguePdf[0].path.replace(/\\/g, "/");
      }
    }

    // Handle explicit file removal from frontend
    if (req.body.productImage === "") {
        if (product.productImage) deleteFile(product.productImage);
        updateData.productImage = "";
    }
    if (req.body.cataloguePdf === "") {
        if (product.cataloguePdf) deleteFile(product.cataloguePdf);
        updateData.cataloguePdf = "";
    }

    // Parse pricing tiers if sent as string (from FormData)
    if (uPricingTiers) {
      if (typeof uPricingTiers === 'string') {
        try {
          updateData.pricingTiers = JSON.parse(uPricingTiers);
        } catch (e) {
          // fallback
        }
      } else {
        updateData.pricingTiers = uPricingTiers;
      }
    }

    // Clean up undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/company/products/:id
 * @access  Private (Company User)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete associated files
    if (product.productImage) deleteFile(product.productImage);
    if (product.cataloguePdf) deleteFile(product.cataloguePdf);

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
