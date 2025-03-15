/* eslint-disable no-undef */

// const ClientError = require('../../exceptions/ClientError');
const autoBind = require('auto-bind');

class UploadsHandler {
  constructor(service, validator, albumsService) {
    this._service = service;
    this._validator = validator;
    this._albumsService = albumsService;

    autoBind(this);
  }

  async postUploadImageHandler(request, h) {
    console.log('masuk disini');
    const { cover } = request.payload;
    const { id: albumId } = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._service.writeFile(cover, cover.hapi);

    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/${albumId}/covers/${filename}`;

    console.log(coverUrl);

    await this._albumsService.editAlbumCover(albumId, coverUrl);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;
