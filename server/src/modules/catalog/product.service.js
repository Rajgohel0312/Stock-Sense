const productRepository =
  require("./product.repository");

const categoryRepository =
  require("./category.repository");

const uomRepository =
  require("./uom.repository");

async function listProducts(filters) {
  return productRepository.findAll(
    filters
  );
}

async function getProduct(id) {
  const product =
    await productRepository.findById(id);

  if (!product) {
    const error = new Error(
      "Product not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return product;
}

async function createProduct(data) {
  const existing =
    await productRepository.findBySku(
      data.sku
    );

  if (existing) {
    const error = new Error(
      "SKU already exists."
    );

    error.statusCode = 409;

    throw error;
  }

  const category =
    await categoryRepository.findById(
      data.categoryId
    );

  if (!category) {
    const error = new Error(
      "Category not found."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!category.is_active) {
    const error = new Error(
      "Cannot assign an inactive category."
    );

    error.statusCode = 400;

    throw error;
  }

  const uom =
    await uomRepository.findById(
      data.uomId
    );

  if (!uom) {
    const error = new Error(
      "Unit of measure not found."
    );

    error.statusCode = 400;

    throw error;
  }

  return productRepository.create(data);
}

async function updateProduct(id, data) {
  const product =
    await productRepository.findById(id);

  if (!product) {
    const error = new Error(
      "Product not found."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    data.sku &&
    data.sku.toLowerCase() !==
      product.sku.toLowerCase()
  ) {
    const existing =
      await productRepository.findBySku(
        data.sku
      );

    if (existing) {
      const error = new Error(
        "SKU already exists."
      );

      error.statusCode = 409;

      throw error;
    }
  }

  if (data.categoryId) {
    const category =
      await categoryRepository.findById(
        data.categoryId
      );

    if (!category) {
      const error = new Error(
        "Category not found."
      );

      error.statusCode = 400;

      throw error;
    }

    if (!category.is_active) {
      const error = new Error(
        "Cannot assign an inactive category."
      );

      error.statusCode = 400;

      throw error;
    }
  }

  if (data.uomId) {
    const uom =
      await uomRepository.findById(
        data.uomId
      );

    if (!uom) {
      const error = new Error(
        "Unit of measure not found."
      );

      error.statusCode = 400;

      throw error;
    }
  }

  return productRepository.update(
    id,
    data
  );
}

async function deactivateProduct(id) {
  const product =
    await productRepository.findById(id);

  if (!product) {
    const error = new Error(
      "Product not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return productRepository.remove(id);
}

async function listUnits() {
  return uomRepository.findAll();
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  listUnits
};