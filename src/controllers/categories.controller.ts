import * as Categories from '../models/Categories.model';

export const getCategories = async (req, res, next) => {
  const { id } = req.user;
  const { rawCategories } = req.query;

  try {
    let data = await Categories.getCategories({ id });

    if (rawCategories !== undefined) {
      return res.status(200).json({ response: data });
    }

    // TODO: fix this ASAP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = data.map((item: any) => item.dataValues);

    const objectGraph = (items) => {
      const itemsById = {};
      const roots = [];

      // build an id->object mapping, so we don't have to go hunting for parents
      items.forEach((item) => {
        itemsById[item.id] = item;
        // eslint-disable-next-line no-param-reassign
        item.subCategories = [];
      });

      items.forEach((item) => {
        const { parentId } = item;
        // if parentId is null, this is a root; otherwise, it's parentId's kid
        const nodes = !parentId ? roots : itemsById[parentId].subCategories;
        nodes.push(item);
      });

      return roots;
    };

    return res.status(200).json({ response: objectGraph(data) });
  } catch (err) {
    return next(new Error(err));
  }
};

export const createCategory = async (req, res, next) => {
  const { id } = req.user;
  const {
    name,
    imageUrl,
    color,
    type,
    parentId,
  } = req.body;

  try {
    const data = await Categories.createCategory({
      name,
      imageUrl,
      color,
      type,
      parentId,
      userId: id,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};