class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const { title, year, genre, performer, duration } = request.payload;

    const songId = await this._service.addSong({ title, year, genre, performer, duration });

    const response = h.response({
      status: 'success',
      data: {
        songId: songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler() {
    const songs = await this._service.getSongs();
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongByIdHandler(id);

    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const { id } = request.params;
    await this._service.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Song has been updated',
    };
  }

  async deleteSongbyIdHandler(request) {
    const { id } = request.params;

    await this._service.deleteSongbyIdHandler(id);

    return {
      status: 'message',
      message: 'Song has been successfully deleted',
    };
  }
}

module.exports = SongsHandler;
