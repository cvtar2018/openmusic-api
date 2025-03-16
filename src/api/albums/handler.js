const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator, usersService) {
    this._service = service;
    this._validator = validator;
    this._usersService = usersService;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;

    const album = await this._service.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album has been updated',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;

    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album has been deleted',
    };
  }

  // likes
  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;
    console.log(albumId);

    await this._service.checkAlbumExist(albumId);

    await this._service.checkAlbumLikeExist(albumId, userId);

    await this._service.addAlbumLike(albumId, userId);

    const response = h.response({
      status: 'success',
      message: 'berhasil like',
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;

    const number = await this._service.getAlbumLikes(albumId);

    if (number.source === 'cache') {
      const result = {
        status: 'success',
        data: {
          likes: number.likes,
        },
      };

      return h.response(result).header('X-Data-Source', number.source);
    }

    return {
      status: 'success',
      data: {
        likes: number,
      },
    };
  }

  async deleteAlbumLikeHandler(request) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.deleteAlbumLike(albumId, userId);

    return {
      status: 'success',
      message: 'berhasil dislike',
    };
  }
}

module.exports = AlbumsHandler;
