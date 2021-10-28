class AppFearture {
  constructor(query, queryObj) {
    this.query = query;
    this.queryObj = queryObj;
  }

  filter() {
    const queryObjFilter = { ...this.queryObj };
    const excludeQuery = ['fields', 'sort', 'page', 'limit'];
    excludeQuery.forEach(el => {
      delete queryObjFilter[el];
    });
    this.query = this.query.find(queryObjFilter);
    return this;
  }

  sort() {
    if (this.queryObj.sort) {
      const sortStr = this.queryObj.sort.split(',').join(' ');
      this.query = this.query.sort(sortStr);
    }
    return this;
  }

  limitFields() {
    if (this.queryObj.fields) {
      const fieldsStr = this.queryObj.fields.split(',').join(' ');
      this.query = this.query.select(fieldsStr);
    }
    return this;
  }

  pagination() {
    const limit = this.queryObj.limit * 1 || 100;
    const page = this.queryObj.page * 1 || 1;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = AppFearture;
