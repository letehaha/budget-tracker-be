import * as helpers from '@tests/helpers';

describe('editExcludedCategories', () => {
  it('should add new categories to excluded list', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });
    const category2 = await helpers.addCustomCategory({ name: 'Category 2', raw: true });

    const result = await helpers.editExcludedCategories({
      addIds: [category1.id, category2.id],
      raw: true,
    });

    expect(result).toContain(category1.id);
    expect(result).toContain(category2.id);
  });

  it('should remove categories from excluded list', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });
    const category2 = await helpers.addCustomCategory({ name: 'Category 2', raw: true });

    await helpers.editExcludedCategories({
      addIds: [category1.id, category2.id],
      raw: true,
    });

    const result = await helpers.editExcludedCategories({
      removeIds: [category1.id],
      raw: true,
    });

    expect(result).not.toContain(category1.id);
    expect(result).toContain(category2.id);
  });

  it('should handle adding and removing categories simultaneously', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });
    const category2 = await helpers.addCustomCategory({ name: 'Category 2', raw: true });

    await helpers.editExcludedCategories({
      addIds: [category1.id],
      raw: true,
    });

    const result = await helpers.editExcludedCategories({
      addIds: [category2.id],
      removeIds: [category1.id],
      raw: true,
    });

    expect(result).not.toContain(category1.id);
    expect(result).toContain(category2.id);
  });

  it('should ignore non-existent categories when adding', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });

    const result = await helpers.editExcludedCategories({
      addIds: [category1.id, 9999],
      raw: true,
    });

    expect(result).toContain(category1.id);
    expect(result).not.toContain(9999);
  });

  it('should ignore non-existent categories when removing', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });

    await helpers.editExcludedCategories({
      addIds: [category1.id],
      raw: true,
    });

    const result = await helpers.editExcludedCategories({
      removeIds: [9999],
      raw: true,
    });

    expect(result).toContain(category1.id);
  });

  it('should handle duplicate categories when adding', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });

    const result = await helpers.editExcludedCategories({
      addIds: [category1.id, category1.id],
      raw: true,
    });

    expect(result).toContain(category1.id);
    expect(result.length).toBe(1);
  });

  it('should handle empty addIds and removeIds', async () => {
    const category1 = await helpers.addCustomCategory({ name: 'Category 1', raw: true });

    await helpers.editExcludedCategories({
      addIds: [category1.id],
      raw: true,
    });

    const result = await helpers.editExcludedCategories({
      addIds: [],
      removeIds: [],
      raw: true,
    });

    expect(result).toContain(category1.id);
  });
});