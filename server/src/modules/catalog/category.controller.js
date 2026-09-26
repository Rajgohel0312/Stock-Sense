const service = require("./category.service");

const {
  validateCreateCategory,
  validateUpdateCategory
} = require("./category.validation");

async function listCategories(
  req,
  res,
  next
) {
  try {
    const {
      search,
      active
    } = req.query;

    let activeFilter;

    if (active !== undefined) {
      activeFilter =
        active === "true";
    }

    const categories =
      await service.listCategories({
        search,
        active: activeFilter
      });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

async function getCategory(
  req,
  res,
  next
) {
  try {
    const category =
      await service.getCategory(
        req.params.id
      );

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(
  req,
  res,
  next
) {
  try {
    const data =
      validateCreateCategory(
        req.body
      );

    const category =
      await service.createCategory(
        data
      );

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(
  req,
  res,
  next
) {
  try {
    const data =
      validateUpdateCategory(
        req.body
      );

    const category =
      await service.updateCategory(
        req.params.id,
        data
      );

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateCategory(
  req,
  res,
  next
) {
  try {
    const category =
      await service.deactivateCategory(
        req.params.id
      );

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deactivateCategory
};