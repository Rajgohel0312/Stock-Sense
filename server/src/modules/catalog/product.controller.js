const service =
  require("./product.service");

const {
  validateCreateProduct,
  validateUpdateProduct
} = require("./product.validation");

async function listProducts(
  req,
  res,
  next
) {
  try {
    const {
      search,
      categoryId,
      active
    } = req.query;

    let activeFilter;

    if (active !== undefined) {
      activeFilter =
        active === "true";
    }

    const products =
      await service.listProducts({
        search,
        categoryId,
        active: activeFilter
      });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
}

async function getProduct(
  req,
  res,
  next
) {
  try {
    const product =
      await service.getProduct(
        req.params.id
      );

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function createProduct(
  req,
  res,
  next
) {
  try {
    const data =
      validateCreateProduct(
        req.body
      );

    const product =
      await service.createProduct(
        data
      );

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(
  req,
  res,
  next
) {
  try {
    const data =
      validateUpdateProduct(
        req.body
      );

    const product =
      await service.updateProduct(
        req.params.id,
        data
      );

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateProduct(
  req,
  res,
  next
) {
  try {
    const product =
      await service.deactivateProduct(
        req.params.id
      );

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function listUnits(
  req,
  res,
  next
) {
  try {
    const units =
      await service.listUnits();

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  listUnits
};