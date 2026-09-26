const repository = require("./category.repository");

async function listCategories(filters) {
  return repository.findAll(filters);
}

async function getCategory(id) {
  const category =
    await repository.findById(id);

  if (!category) {
    const error = new Error(
      "Category not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return category;
}

async function createCategory(data) {
  const existing =
    await repository.findByName(data.name);

  if (existing) {
    const error = new Error(
      "Category already exists."
    );

    error.statusCode = 409;

    throw error;
  }

  return repository.create(data);
}

async function updateCategory(id, data) {
  const category =
    await repository.findById(id);

  if (!category) {
    const error = new Error(
      "Category not found."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    data.name &&
    data.name.toLowerCase() !==
      category.name.toLowerCase()
  ) {
    const existing =
      await repository.findByName(data.name);

    if (existing) {
      const error = new Error(
        "Category already exists."
      );

      error.statusCode = 409;

      throw error;
    }
  }

  return repository.update(id, data);
}

async function deactivateCategory(id) {
  const category =
    await repository.findById(id);

  if (!category) {
    const error = new Error(
      "Category not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return repository.remove(id);
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deactivateCategory
};