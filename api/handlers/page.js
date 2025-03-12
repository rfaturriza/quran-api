class PageHandler {
  static async getPage(req, res) {
    const { page } = req.params;
    if (page < 1 || page > 604) {
      return res.status(400).send({
        code: 400,
        status: 'Bad Request.',
        message: 'Invalid page number.',
        data: {}
      });
    }
    var fields = 'id';
    fields += ',chapter_id';
    fields += ',verse_number';
    fields += ',verse_key';
    fields += ',verse_index';
    fields += ',text_uthmani';
    fields += ',text_uthmani_simple';
    fields += ',text_imlaei';
    fields += ',text_imlaei_simple';
    fields += ',text_indopak';
    fields += ',text_uthmani_tajweed';
    fields += ',juz_number';
    fields += ',hizb_number';
    fields += ',rub_number';
    fields += ',sajdah_type';
    fields += ',sajdah_number';
    fields += ',page_number';
    fields += ',image_url';
    fields += ',image_width';
    fields += ',words';

    const params = new URLSearchParams({
      fields: fields
    });

    params.append('language', 'id');
    if (req.query.language) {
      params.append('language', req.query.language);
    }

    if (req.query.translations) {
      params.append('translations', req.query.translations);
    }
    params.append('page', 1);
    if (req.query.page) {
      params.append('page', req.query.page);
    }
    params.append('per_page', 50);
    if (req.query.per_page) {
      params.append('per_page', req.query.per_page);
    }
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${page}?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    const data = await response.json();

    if (!data) {
      return res.status(404).send({
        code: 404,
        status: 'Not Found.',
        message: `Page ${page} is not found.`,
        data: {}
      });
    }

    return res.status(200).send({
      code: 200,
      status: 'OK.',
      message: 'Success fetching quran page.',
      data
    });
  }
}

module.exports = PageHandler;
